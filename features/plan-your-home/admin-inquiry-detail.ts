import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type {
  Bucket,
  File,
  FileMetadata,
  GetFilesOptions,
} from "@google-cloud/storage";

import {
  getPlanHomeQuestion,
  planHomeQuestions,
  planHomeZones,
  summarizePlanHomeAnswer,
  validatePlanHomeAnswer,
} from "./registry.ts";
import {
  planHomeReferenceMetadataSchema,
  type PlanHomeFileReference,
} from "./references.ts";
import { PLAN_HOME_UPLOAD_CAPABILITY_MS } from "./reference-repository.ts";

const inquiriesCollection = "inquirySubmissions";
const resumeTokensCollection = "planHomeResumeTokens";
const referenceUploadsCollection = "referenceUploads";
const deleteBatchSize = 400;

export const ADMIN_INQUIRY_SIGNED_READ_TTL_MS = 5 * 60 * 1000;
export const ADMIN_INQUIRY_UPLOAD_EXPIRY_GRACE_MS = 60 * 1000;

export const adminInquiryMutableStatuses = ["reviewed", "spam"] as const;
export type AdminInquiryMutableStatus =
  (typeof adminInquiryMutableStatuses)[number];
export type AdminInquiryDetailStatus =
  | "draft"
  | "submitted"
  | "reviewed"
  | "spam"
  | "deleting";

export type AdminInquiryActor = Readonly<{
  uid: string;
}>;

export type AdminInquiryDetailReference =
  | Readonly<{
      id: string;
      kind: "file";
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      note: string | null;
      createdAt: string;
    }>
  | Readonly<{
      id: string;
      kind: "link";
      url: string;
      hostname: string;
      note: string | null;
      createdAt: string;
    }>;

export type AdminInquiryDetail = Readonly<{
  id: string;
  source: "legacy" | "plan-your-home";
  status: AdminInquiryDetailStatus;
  name: string;
  email: string | null;
  phone: string | null;
  preferredFollowUp: string | null;
  disclosure: string;
  progress: Readonly<{
    summary: string;
    currentPrompt: string | null;
    completedZones: readonly string[];
    revision: number | null;
  }>;
  timestamps: Readonly<{
    createdAt: string | null;
    updatedAt: string | null;
    submittedAt: string | null;
    expiresAt: string | null;
    consentAcceptedAt: string | null;
  }>;
  consentVersion: string | null;
  answerSections: readonly Readonly<{
    id: string;
    title: string;
    answers: readonly Readonly<{
      number: number | null;
      id: string;
      label: string;
      summary: string;
      state: "saved" | "missing" | "invalid";
    }>[];
  }>[];
  references: readonly AdminInquiryDetailReference[];
  omittedReferenceCount: number;
}>;

type StoredRecord = Record<string, unknown>;

export class AdminInquiryNotFoundError extends Error {
  constructor() {
    super("The inquiry could not be found.");
    this.name = "AdminInquiryNotFoundError";
  }
}

export class AdminInquiryAuthorizationError extends Error {
  constructor() {
    super("An authorized HHQ staff session is required.");
    this.name = "AdminInquiryAuthorizationError";
  }
}

export class AdminInquiryConflictError extends Error {
  constructor(message = "The inquiry changed before this action completed.") {
    super(message);
    this.name = "AdminInquiryConflictError";
  }
}

export class AdminInquiryReferenceUnavailableError extends Error {
  constructor() {
    super("The private reference is unavailable.");
    this.name = "AdminInquiryReferenceUnavailableError";
  }
}

function readRecord(value: unknown): StoredRecord {
  return value && typeof value === "object"
    ? (value as StoredRecord)
    : {};
}

function normalizeSingleLine(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeMultiline(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalized.length > 0 ? normalized : null;
}

function readTimestamp(value: unknown): string | null {
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  } else if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    date = value.toDate();
  }
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function humanizeSlug(value: unknown): string | null {
  const normalized = normalizeSingleLine(value);
  if (!normalized) return null;
  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function readSource(record: StoredRecord) {
  return record.schemaVersion === 2 && record.experience === "plan-your-home"
    ? ("plan-your-home" as const)
    : ("legacy" as const);
}

function readStatus(
  record: StoredRecord,
  source: AdminInquiryDetail["source"],
): AdminInquiryDetailStatus | null {
  if (record.status === "deleting") return "deleting";
  if (record.status === "new" && source === "legacy") return "submitted";
  if (
    record.status === "draft" ||
    record.status === "submitted" ||
    record.status === "reviewed" ||
    record.status === "spam"
  ) {
    return record.status;
  }
  return null;
}

function readCanonicalStatus(record: StoredRecord) {
  const source = readSource(record);
  const status = readStatus(record, source);
  if (!status) throw new AdminInquiryConflictError();
  return { source, status };
}

function legacyAnswer(
  id: string,
  label: string,
  value: unknown,
  options: Readonly<{ multiline?: boolean; numeric?: boolean }> = {},
) {
  const text = options.multiline
    ? normalizeMultiline(value)
    : options.numeric && typeof value === "number" && Number.isFinite(value)
      ? new Intl.NumberFormat("en-US").format(value)
      : Array.isArray(value)
        ? value.map(humanizeSlug).filter(Boolean).join(", ")
        : humanizeSlug(value);
  return {
    number: null,
    id,
    label,
    summary: text || "Not provided",
    state: text ? ("saved" as const) : ("missing" as const),
  };
}

function mapLegacyDetail(
  id: string,
  record: StoredRecord,
  status: AdminInquiryDetailStatus,
): AdminInquiryDetail {
  const name = normalizeSingleLine(record.name) ?? "Unnamed inquiry";
  return {
    id,
    source: "legacy",
    status,
    name,
    email: normalizeSingleLine(record.email),
    phone: normalizeSingleLine(record.phone),
    preferredFollowUp: humanizeSlug(record.preferredContactMethod),
    disclosure:
      "The legacy inquiry form did not store the Plan Your Home manual follow-up disclosure field.",
    progress: {
      summary: "Complete · legacy form",
      currentPrompt: null,
      completedZones: [],
      revision: null,
    },
    timestamps: {
      createdAt: readTimestamp(record.createdAt),
      updatedAt: readTimestamp(record.updatedAt),
      submittedAt: null,
      expiresAt: null,
      consentAcceptedAt: null,
    },
    consentVersion: null,
    answerSections: [
      {
        id: "legacy-project-basics",
        title: "Project Basics",
        answers: [
          legacyAnswer("projectType", "Project type", record.projectType),
          legacyAnswer(
            "approxSquareFootage",
            "Approximate square footage",
            record.approxSquareFootage,
            { numeric: true },
          ),
          legacyAnswer("finishLevel", "Finish direction", record.finishLevel),
          legacyAnswer("servicesNeeded", "Services needed", record.servicesNeeded),
        ],
      },
      {
        id: "legacy-site-context",
        title: "Site Context",
        answers: [
          legacyAnswer("projectLocation", "Project location", record.projectLocation),
          legacyAnswer("lotStatus", "Lot status", record.lotStatus),
          legacyAnswer("timeline", "Timeline", record.timeline),
          legacyAnswer("budgetRange", "Budget range", record.budgetRange),
        ],
      },
      {
        id: "legacy-description",
        title: "Project Description",
        answers: [
          legacyAnswer(
            "projectDescription",
            "Project description",
            record.projectDescription,
            { multiline: true },
          ),
        ],
      },
    ],
    references: [],
    omittedReferenceCount: 0,
  };
}

function readCompletedZones(record: StoredRecord) {
  const progress = readRecord(record.progress);
  if (!Array.isArray(progress.completedZoneIds)) return [];
  const completed = new Set(
    progress.completedZoneIds.filter(
      (value): value is string => typeof value === "string",
    ),
  );
  return planHomeZones
    .filter(({ id }) => completed.has(id))
    .map(({ title }) => title);
}

function mapPlanHomeReferences(id: string, value: unknown) {
  const references = Array.isArray(value) ? value : [];
  const mapped: AdminInquiryDetailReference[] = [];
  let omittedReferenceCount = Array.isArray(value) ? 0 : value == null ? 0 : 1;

  for (const candidate of references) {
    const result = planHomeReferenceMetadataSchema.safeParse(candidate);
    if (!result.success) {
      omittedReferenceCount += 1;
      continue;
    }
    const reference = result.data;
    if (reference.kind === "file") {
      if (!hasExactInquiryObjectPrefix(id, reference.objectPath)) {
        omittedReferenceCount += 1;
        continue;
      }
      mapped.push({
        id: reference.id,
        kind: "file",
        originalName: reference.originalName,
        mimeType: reference.mimeType,
        sizeBytes: reference.sizeBytes,
        note: reference.note ?? null,
        createdAt: reference.createdAt,
      });
      continue;
    }
    const parsedUrl = new URL(reference.url);
    if (
      (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
      parsedUrl.hostname !== reference.hostname
    ) {
      omittedReferenceCount += 1;
      continue;
    }
    mapped.push({
      id: reference.id,
      kind: "link",
      url: parsedUrl.toString(),
      hostname: parsedUrl.hostname,
      note: reference.note ?? null,
      createdAt: reference.createdAt,
    });
  }

  return { references: mapped, omittedReferenceCount };
}

function mapPlanHomeDetail(
  id: string,
  record: StoredRecord,
  status: AdminInquiryDetailStatus,
): AdminInquiryDetail {
  const contact = readRecord(record.contact);
  const derived = readRecord(record.derived);
  const progress = readRecord(record.progress);
  const answers = readRecord(record.answers);
  const completedZones = readCompletedZones(record);
  const currentPromptId = normalizeSingleLine(progress.currentPromptId);
  const currentQuestion = currentPromptId
    ? getPlanHomeQuestion(currentPromptId)
    : undefined;
  const mappedReferences = mapPlanHomeReferences(id, record.references);

  const answerSections = planHomeZones.map((zone) => ({
    id: zone.id,
    title: zone.title,
    answers: planHomeQuestions
      .filter((question) => question.zoneId === zone.id)
      .map((question) => {
        if (!(question.id in answers)) {
          return {
            number: question.number,
            id: question.id,
            label: question.prompt,
            summary: "Not saved yet",
            state: "missing" as const,
          };
        }
        const validation = validatePlanHomeAnswer(
          question.id,
          answers[question.id],
        );
        if (!validation.success) {
          return {
            number: question.number,
            id: question.id,
            label: question.prompt,
            summary: "Saved answer could not be read.",
            state: "invalid" as const,
          };
        }
        return {
          number: question.number,
          id: question.id,
          label: question.prompt,
          summary: summarizePlanHomeAnswer(question.id, validation.data),
          state: "saved" as const,
        };
      }),
  }));

  return {
    id,
    source: "plan-your-home",
    status,
    name:
      normalizeSingleLine(derived.name) ??
      normalizeSingleLine(contact.name) ??
      "Unnamed inquiry",
    email:
      normalizeSingleLine(derived.email) ?? normalizeSingleLine(contact.email),
    phone:
      normalizeSingleLine(derived.phone) ?? normalizeSingleLine(contact.phone),
    preferredFollowUp: humanizeSlug(contact.preferredFollowUp),
    disclosure:
      contact.manualFollowUpDisclosureAccepted === true
        ? "Accepted: progress may be saved and h and h may personally follow up about this project. No reminder is sent automatically."
        : "Manual follow-up disclosure acceptance is unavailable.",
    progress: {
      summary:
        status === "draft"
          ? `${completedZones.length} of ${planHomeZones.length} zones saved`
          : status === "deleting"
            ? "Deletion in progress"
            : "Complete",
      currentPrompt:
        currentPromptId === "review"
          ? "Review and submit"
          : currentQuestion
            ? `Question ${currentQuestion.number}: ${currentQuestion.prompt}`
            : null,
      completedZones,
      revision:
        typeof record.revision === "number" &&
        Number.isInteger(record.revision) &&
        record.revision >= 0
          ? record.revision
          : null,
    },
    timestamps: {
      createdAt: readTimestamp(record.createdAt),
      updatedAt:
        readTimestamp(derived.lastActivityAt) ?? readTimestamp(record.updatedAt),
      submittedAt: readTimestamp(record.submittedAt),
      expiresAt: readTimestamp(record.expiresAt),
      consentAcceptedAt: readTimestamp(record.acceptedConsentAt),
    },
    consentVersion: normalizeSingleLine(record.acceptedConsentVersion),
    answerSections,
    references: mappedReferences.references,
    omittedReferenceCount: mappedReferences.omittedReferenceCount,
  };
}

export function mapAdminInquiryDetail(
  id: string,
  value: unknown,
): AdminInquiryDetail | null {
  const record = readRecord(value);
  const source = readSource(record);
  const status = readStatus(record, source);
  if (!status) return null;
  return source === "plan-your-home"
    ? mapPlanHomeDetail(id, record, status)
    : mapLegacyDetail(id, record, status);
}

export function isAdminInquiryId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9_-]{1,200}$/.test(value)
  );
}

export function hasExactInquiryObjectPrefix(
  inquiryId: string,
  objectPath: string,
) {
  if (!isAdminInquiryId(inquiryId)) return false;
  const prefix = `inquiryReferences/${inquiryId}/`;
  if (!objectPath.startsWith(prefix)) return false;
  const objectName = objectPath.slice(prefix.length);
  return objectName.length > 0 && !objectName.includes("/");
}

function assertInquiryId(value: unknown): asserts value is string {
  if (!isAdminInquiryId(value)) throw new AdminInquiryNotFoundError();
}

function assertActor(value: unknown): asserts value is AdminInquiryActor {
  if (
    !value ||
    typeof value !== "object" ||
    !("uid" in value) ||
    typeof value.uid !== "string" ||
    !/^[^\s]{1,200}$/.test(value.uid)
  ) {
    throw new AdminInquiryAuthorizationError();
  }
}

function findCanonicalFileReference(
  inquiryId: string,
  record: StoredRecord,
  referenceId: string,
): PlanHomeFileReference {
  const references = Array.isArray(record.references) ? record.references : [];
  for (const candidate of references) {
    const result = planHomeReferenceMetadataSchema.safeParse(candidate);
    if (
      result.success &&
      result.data.kind === "file" &&
      result.data.id === referenceId &&
      hasExactInquiryObjectPrefix(inquiryId, result.data.objectPath)
    ) {
      return result.data;
    }
  }
  throw new AdminInquiryReferenceUnavailableError();
}

function actorAudit(actor: AdminInquiryActor) {
  return {
    actorUid: actor.uid,
  };
}

function timestampMillis(value: unknown) {
  const timestamp = readTimestamp(value);
  return timestamp ? new Date(timestamp).getTime() : null;
}

function pendingUploadCapabilityUntil(
  record: StoredRecord,
  uploadTickets: FirebaseFirestore.QuerySnapshot,
) {
  const existingDeletion = readRecord(record.adminDeletion);
  const existingCutoff = timestampMillis(
    existingDeletion.uploadCapabilitiesExpireAt,
  );
  if (existingCutoff !== null) return new Date(existingCutoff);
  if (readSource(record) !== "plan-your-home") return null;

  const expiries: number[] = [];
  const trackedExpiry = timestampMillis(
    record.referenceUploadCapabilityExpiresAt,
  );
  if (trackedExpiry !== null) expiries.push(trackedExpiry);

  for (const document of uploadTickets.docs) {
    const ticketExpiry = timestampMillis(document.data().expiresAt);
    if (ticketExpiry !== null) expiries.push(ticketExpiry);
  }

  const references = Array.isArray(record.references) ? record.references : [];
  for (const candidate of references) {
    const result = planHomeReferenceMetadataSchema.safeParse(candidate);
    if (!result.success || result.data.kind !== "file") continue;
    const finalizedAt = timestampMillis(result.data.createdAt);
    if (finalizedAt !== null) {
      expiries.push(finalizedAt + PLAN_HOME_UPLOAD_CAPABILITY_MS);
    }
  }

  if (trackedExpiry === null) {
    const lastUntrackedActivity = timestampMillis(record.updatedAt);
    if (lastUntrackedActivity !== null) {
      expiries.push(lastUntrackedActivity + PLAN_HOME_UPLOAD_CAPABILITY_MS);
    }
  }

  if (expiries.length === 0) return null;
  return new Date(
    Math.max(...expiries) + ADMIN_INQUIRY_UPLOAD_EXPIRY_GRACE_MS,
  );
}

async function deleteDocumentsInBatches(
  database: Firestore,
  load: () => Promise<FirebaseFirestore.QuerySnapshot>,
) {
  let deleted = 0;
  while (true) {
    const snapshot = await load();
    if (snapshot.empty) return deleted;
    const batch = database.batch();
    for (const document of snapshot.docs) batch.delete(document.ref);
    await batch.commit();
    deleted += snapshot.size;
  }
}

async function listPrefixFiles(bucket: Bucket, prefix: string) {
  const files: File[] = [];
  let pageToken: string | undefined;
  do {
    const [page, nextQuery] = await bucket.getFiles({
      prefix,
      autoPaginate: false,
      maxResults: 200,
      ...(pageToken ? { pageToken } : {}),
    });
    files.push(...page);
    pageToken = (nextQuery as GetFilesOptions | null | undefined)?.pageToken;
  } while (pageToken);
  return files;
}

async function deleteEveryPrefixObject(bucket: Bucket, prefix: string) {
  let deleted = 0;
  while (true) {
    const files = await listPrefixFiles(bucket, prefix);
    if (files.length === 0) return deleted;
    for (let index = 0; index < files.length; index += 50) {
      await Promise.all(
        files
          .slice(index, index + 50)
          .map((file) => file.delete({ ignoreNotFound: true })),
      );
    }
    deleted += files.length;
  }
}

export function createAdminInquiryDetailRepository(
  database: Firestore,
  bucket: Bucket,
  dependencies: Readonly<{
    now?: () => Date;
    signRead?: (
      file: File,
      expiresAt: Date,
    ) => Promise<string>;
    deletePrefix?: (bucket: Bucket, prefix: string) => Promise<number>;
  }> = {},
) {
  const now = dependencies.now ?? (() => new Date());
  const signRead =
    dependencies.signRead ??
    (async (file, expiresAt) => {
      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: expiresAt,
      });
      return url;
    });
  const deletePrefix = dependencies.deletePrefix ?? deleteEveryPrefixObject;

  return {
    async read(inquiryId: string, actor: AdminInquiryActor) {
      assertActor(actor);
      assertInquiryId(inquiryId);
      const snapshot = await database
        .collection(inquiriesCollection)
        .doc(inquiryId)
        .get();
      if (!snapshot.exists) throw new AdminInquiryNotFoundError();
      return mapAdminInquiryDetail(inquiryId, snapshot.data());
    },

    async issueSignedRead(
      inquiryId: string,
      referenceId: string,
      actor: AdminInquiryActor,
    ) {
      assertActor(actor);
      assertInquiryId(inquiryId);
      if (!/^file-[A-Za-z0-9-]{1,120}$/.test(referenceId)) {
        throw new AdminInquiryReferenceUnavailableError();
      }
      const snapshot = await database
        .collection(inquiriesCollection)
        .doc(inquiryId)
        .get();
      if (!snapshot.exists) throw new AdminInquiryReferenceUnavailableError();
      const record = readRecord(snapshot.data());
      const { source, status } = readCanonicalStatus(record);
      if (source !== "plan-your-home" || status === "deleting") {
        throw new AdminInquiryReferenceUnavailableError();
      }
      const reference = findCanonicalFileReference(
        inquiryId,
        record,
        referenceId,
      );
      const file = bucket.file(reference.objectPath);
      let metadata: FileMetadata;
      try {
        [metadata] = await file.getMetadata();
      } catch {
        throw new AdminInquiryReferenceUnavailableError();
      }
      const customMetadata = metadata.metadata ?? {};
      if (
        metadata.name !== reference.objectPath ||
        Number(metadata.size) !== reference.sizeBytes ||
        metadata.contentType !== reference.mimeType ||
        customMetadata["plan-home-draft"] !== inquiryId ||
        customMetadata["plan-home-reference"] !== reference.id ||
        customMetadata.firebaseStorageDownloadTokens
      ) {
        throw new AdminInquiryReferenceUnavailableError();
      }
      const expiresAt = new Date(
        now().getTime() + ADMIN_INQUIRY_SIGNED_READ_TTL_MS,
      );
      return {
        url: await signRead(file, expiresAt),
        expiresAt: expiresAt.toISOString(),
      } as const;
    },

    async updateStatus(
      inquiryId: string,
      nextStatus: AdminInquiryMutableStatus,
      actor: AdminInquiryActor,
    ) {
      assertActor(actor);
      assertInquiryId(inquiryId);
      if (!adminInquiryMutableStatuses.includes(nextStatus)) {
        throw new AdminInquiryConflictError();
      }
      const reference = database
        .collection(inquiriesCollection)
        .doc(inquiryId);
      return database.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) throw new AdminInquiryNotFoundError();
        const record = readRecord(snapshot.data());
        const { source, status } = readCanonicalStatus(record);
        if (status === "deleting") throw new AdminInquiryConflictError();
        if (status === nextStatus) {
          return { status: nextStatus, applied: false } as const;
        }
        const changedAt = now();
        const update: Record<string, unknown> = {
          status: nextStatus,
          updatedAt: changedAt,
          adminStatusAudit: FieldValue.arrayUnion({
            fromStatus: status,
            toStatus: nextStatus,
            changedAt,
            ...actorAudit(actor),
          }),
        };
        if (source === "plan-your-home") {
          update["derived.lastActivityAt"] = changedAt;
        }
        transaction.update(reference, update);
        return { status: nextStatus, applied: true } as const;
      });
    },

    async deleteInquiry(inquiryId: string, actor: AdminInquiryActor) {
      assertActor(actor);
      assertInquiryId(inquiryId);
      const reference = database
        .collection(inquiriesCollection)
        .doc(inquiryId);
      const prepared = await database.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) return false;
        const record = readRecord(snapshot.data());
        const { status } = readCanonicalStatus(record);
        const uploadTickets = await transaction.get(
          reference.collection(referenceUploadsCollection),
        );
        const uploadCapabilitiesExpireAt = pendingUploadCapabilityUntil(
          record,
          uploadTickets,
        );
        if (status !== "deleting") {
          const requestedAt = now();
          transaction.update(reference, {
            status: "deleting",
            adminDeletion: {
              previousStatus: record.status,
              requestedAt,
              uploadCapabilitiesExpireAt,
              ...actorAudit(actor),
            },
          });
        }
        return { uploadCapabilitiesExpireAt } as const;
      });
      if (!prepared) return { applied: false, deletedObjects: 0 } as const;

      const prefix = `inquiryReferences/${inquiryId}/`;
      const deletedObjects = await deletePrefix(bucket, prefix);
      await deleteDocumentsInBatches(database, () =>
        reference.collection(referenceUploadsCollection).limit(deleteBatchSize).get(),
      );
      await deleteDocumentsInBatches(database, () =>
        database
          .collection(resumeTokensCollection)
          .where("draftId", "==", inquiryId)
          .limit(deleteBatchSize)
          .get(),
      );

      if (
        prepared.uploadCapabilitiesExpireAt &&
        prepared.uploadCapabilitiesExpireAt.getTime() > now().getTime()
      ) {
        return {
          applied: false,
          pending: true,
          pendingUntil: prepared.uploadCapabilitiesExpireAt.toISOString(),
          deletedObjects,
        } as const;
      }

      await database.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) return;
        const record = readRecord(snapshot.data());
        if (record.status !== "deleting") {
          throw new AdminInquiryConflictError();
        }
        transaction.delete(reference);
      });
      return { applied: true, deletedObjects } as const;
    },
  } as const;
}

export type AdminInquiryDetailRepository = ReturnType<
  typeof createAdminInquiryDetailRepository
>;
