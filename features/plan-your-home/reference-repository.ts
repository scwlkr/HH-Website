import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

import type { Firestore } from "firebase-admin/firestore";
import type { Bucket } from "@google-cloud/storage";

import {
  PLAN_HOME_REFERENCE_LIMITS,
  planHomeReferenceCollectionSchema,
  type PlanHomeFileReference,
  type PlanHomeReferenceMetadata,
} from "./references.ts";
import {
  hasMatchingPlanHomeFileSignature,
  normalizePlanHomeReferenceLink,
  planHomeAbandonUploadSchema,
  planHomeAddLinkSchema,
  planHomeFinalizeUploadSchema,
  planHomeRemoveReferenceSchema,
  planHomeSyncReferenceNotesSchema,
  planHomeUploadRequestSchema,
  PlanHomeReferenceValidationError,
  type PlanHomeReferenceMutationResult,
  type PlanHomeUploadCapability,
} from "./reference-upload-contract.ts";
import {
  PlanHomeDraftAuthorizationError,
  PlanHomeDraftConflictError,
  PlanHomeDraftNotFoundError,
} from "./server-draft-repository.ts";

const inquirySubmissionsCollection = "inquirySubmissions";
export const PLAN_HOME_UPLOAD_CAPABILITY_MS = 10 * 60 * 1000;

type StoredDraft = Readonly<{
  schemaVersion: 2;
  experience: "plan-your-home";
  status: "draft";
  revision: number;
  expiresAt: unknown;
  draftSession: Readonly<{ tokenHash: string }>;
  references: readonly PlanHomeReferenceMetadata[];
}>;

type StoredUploadTicket = Readonly<{
  draftId: string;
  referenceId: string;
  objectPath: string;
  originalName: string;
  extension: PlanHomeFileReference["extension"];
  mimeType: PlanHomeFileReference["mimeType"];
  sizeBytes: number;
  expiresAt: unknown;
  createdAt: unknown;
}>;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hashesMatch(left: string, right: string) {
  if (!/^[a-f0-9]{64}$/.test(left) || !/^[a-f0-9]{64}$/.test(right)) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function toMillis(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  return Number.NaN;
}

function readDraft(value: unknown): StoredDraft {
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 2 ||
    !("experience" in value) ||
    value.experience !== "plan-your-home" ||
    !("status" in value) ||
    value.status !== "draft" ||
    !("revision" in value) ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    !("references" in value)
  ) {
    throw new PlanHomeDraftConflictError(
      "The stored draft cannot accept references.",
    );
  }
  const candidate = value as StoredDraft;
  if (!planHomeReferenceCollectionSchema.safeParse(candidate.references).success) {
    throw new PlanHomeDraftConflictError(
      "The stored draft contains invalid reference metadata.",
      candidate.revision,
    );
  }
  return candidate;
}

function assertAuthorized(
  draft: StoredDraft,
  sessionTokenHash: string,
  checkedAt: Date,
) {
  if (!hashesMatch(draft.draftSession.tokenHash, sessionTokenHash)) {
    throw new PlanHomeDraftAuthorizationError();
  }
  if (toMillis(draft.expiresAt) <= checkedAt.getTime()) {
    throw new PlanHomeDraftAuthorizationError();
  }
}

function assertRevision(draft: StoredDraft, expectedRevision: number) {
  if (draft.revision !== expectedRevision) {
    throw new PlanHomeDraftConflictError(
      "This draft changed before the reference update. Retry from the latest saved revision.",
      draft.revision,
    );
  }
}

function parseOrThrow<T>(result: {
  success: boolean;
  data?: T;
  error?: { issues: readonly { message: string }[] };
}): T {
  if (!result.success || result.data === undefined) {
    throw new PlanHomeReferenceValidationError(
      result.error?.issues.map(({ message }) => message).join(" ") ||
        "The reference request is invalid.",
    );
  }
  return result.data;
}

function assertReferenceCapacity(
  references: readonly PlanHomeReferenceMetadata[],
  pending: readonly StoredUploadTicket[] = [],
  nextFile?: Readonly<{ sizeBytes: number }>,
) {
  const files = references.filter((reference) => reference.kind === "file");
  const links = references.filter((reference) => reference.kind === "link");
  const pendingBytes = pending.reduce((sum, ticket) => sum + ticket.sizeBytes, 0);
  const fileBytes = files.reduce((sum, reference) => sum + reference.sizeBytes, 0);
  const nextFiles = nextFile ? 1 : 0;
  const nextBytes = nextFile?.sizeBytes ?? 0;

  if (references.length + pending.length + nextFiles > PLAN_HOME_REFERENCE_LIMITS.total) {
    throw new PlanHomeReferenceValidationError(
      `Add no more than ${PLAN_HOME_REFERENCE_LIMITS.total} references total.`,
    );
  }
  if (files.length + pending.length + nextFiles > PLAN_HOME_REFERENCE_LIMITS.files) {
    throw new PlanHomeReferenceValidationError(
      `Add no more than ${PLAN_HOME_REFERENCE_LIMITS.files} files.`,
    );
  }
  if (links.length > PLAN_HOME_REFERENCE_LIMITS.links) {
    throw new PlanHomeReferenceValidationError(
      `Add no more than ${PLAN_HOME_REFERENCE_LIMITS.links} links.`,
    );
  }
  if (
    fileBytes + pendingBytes + nextBytes >
    PLAN_HOME_REFERENCE_LIMITS.totalFileBytes
  ) {
    throw new PlanHomeReferenceValidationError(
      "Reference files may total no more than 40 MB.",
    );
  }
}

async function deleteObjectIfPresent(bucket: Bucket, objectPath: string) {
  await bucket.file(objectPath).delete({ ignoreNotFound: true });
}

function mutationResult(
  draftId: string,
  revision: number,
  references: readonly PlanHomeReferenceMetadata[],
  applied: boolean,
): PlanHomeReferenceMutationResult {
  return { draftId, revision, references, applied };
}

export function createPlanHomeReferenceRepository(
  database: Firestore,
  bucket: Bucket,
  dependencies: Readonly<{
    now?: () => Date;
    uuid?: () => string;
    signUpload?: (
      objectPath: string,
      settings: Readonly<{
        expiresAt: Date;
        mimeType: string;
        headers: Readonly<Record<string, string>>;
      }>,
    ) => Promise<string>;
  }> = {},
) {
  const now = dependencies.now ?? (() => new Date());
  const uuid = dependencies.uuid ?? randomUUID;
  const signUpload =
    dependencies.signUpload ??
    (async (objectPath, settings) => {
      const [uploadUrl] = await bucket.file(objectPath).getSignedUrl({
        version: "v4",
        action: "write",
        expires: settings.expiresAt,
        contentType: settings.mimeType,
        extensionHeaders: settings.headers,
      });
      return uploadUrl;
    });

  async function authorizedDraft(draftId: string, sessionTokenHash: string) {
    const draftReference = database
      .collection(inquirySubmissionsCollection)
      .doc(draftId);
    const snapshot = await draftReference.get();
    if (!snapshot.exists) throw new PlanHomeDraftNotFoundError();
    const draft = readDraft(snapshot.data());
    assertAuthorized(draft, sessionTokenHash, now());
    return { draft, draftReference };
  }

  async function abandonUpload(input: unknown, sessionTokenHash: string) {
    const parsed = parseOrThrow(planHomeAbandonUploadSchema.safeParse(input));
    const { draftReference } = await authorizedDraft(
      parsed.draftId,
      sessionTokenHash,
    );
    const ticketReference = draftReference
      .collection("referenceUploads")
      .doc(parsed.referenceId);
    const ticketSnapshot = await ticketReference.get();
    if (!ticketSnapshot.exists) return { applied: false } as const;
    const ticket = ticketSnapshot.data() as StoredUploadTicket;
    await deleteObjectIfPresent(bucket, ticket.objectPath);
    await ticketReference.delete();
    return { applied: true } as const;
  }

  async function cleanupExpiredUploadsForDraft(
    draftId: string,
    sessionTokenHash: string,
  ) {
    const { draftReference } = await authorizedDraft(draftId, sessionTokenHash);
    const snapshot = await draftReference.collection("referenceUploads").get();
    const expired = snapshot.docs.filter(
      (document) => toMillis(document.data().expiresAt) <= now().getTime(),
    );
    await Promise.all(
      expired.map(async (document) => {
        const ticket = document.data() as StoredUploadTicket;
        await deleteObjectIfPresent(bucket, ticket.objectPath);
        await document.ref.delete();
      }),
    );
    return { deleted: expired.length } as const;
  }

  return {
    async issueUpload(
      input: unknown,
      sessionTokenHash: string,
    ): Promise<PlanHomeUploadCapability> {
      const parsed = parseOrThrow(planHomeUploadRequestSchema.safeParse(input));
      await cleanupExpiredUploadsForDraft(parsed.draftId, sessionTokenHash);
      const referenceId = `file-${uuid()}`;
      const objectPath = `inquiryReferences/${parsed.draftId}/${uuid()}`;
      const issuedAt = now();
      const expiresAt = new Date(
        issuedAt.getTime() + PLAN_HOME_UPLOAD_CAPABILITY_MS,
      );
      const draftReference = database
        .collection(inquirySubmissionsCollection)
        .doc(parsed.draftId);
      const ticketReference = draftReference
        .collection("referenceUploads")
        .doc(referenceId);

      await database.runTransaction(async (transaction) => {
        const draftSnapshot = await transaction.get(draftReference);
        if (!draftSnapshot.exists) throw new PlanHomeDraftNotFoundError();
        const draft = readDraft(draftSnapshot.data());
        assertAuthorized(draft, sessionTokenHash, issuedAt);
        assertRevision(draft, parsed.expectedRevision);
        const ticketsSnapshot = await transaction.get(
          draftReference.collection("referenceUploads"),
        );
        const activeTickets = ticketsSnapshot.docs
          .map((document) => document.data() as StoredUploadTicket)
          .filter((ticket) => toMillis(ticket.expiresAt) > issuedAt.getTime());
        assertReferenceCapacity(draft.references, activeTickets, parsed);
        transaction.create(ticketReference, {
          draftId: parsed.draftId,
          referenceId,
          objectPath,
          originalName: parsed.originalName,
          extension: parsed.extension,
          mimeType: parsed.mimeType,
          sizeBytes: parsed.sizeBytes,
          issuedRevision: parsed.expectedRevision,
          createdAt: issuedAt,
          expiresAt,
        });
      });

      const headers = {
        "content-type": parsed.mimeType,
        "x-goog-meta-plan-home-draft": parsed.draftId,
        "x-goog-meta-plan-home-reference": referenceId,
      };

      try {
        const uploadUrl = await signUpload(objectPath, {
          expiresAt,
          mimeType: parsed.mimeType,
          headers,
        });
        return {
          draftId: parsed.draftId,
          referenceId,
          objectPath,
          uploadUrl,
          method: "PUT",
          headers,
          expiresAt: expiresAt.toISOString(),
        };
      } catch (error) {
        await ticketReference.delete().catch(() => undefined);
        throw error;
      }
    },

    async finalizeUpload(
      input: unknown,
      sessionTokenHash: string,
    ): Promise<PlanHomeReferenceMutationResult> {
      const parsed = parseOrThrow(planHomeFinalizeUploadSchema.safeParse(input));
      const { draft, draftReference } = await authorizedDraft(
        parsed.draftId,
        sessionTokenHash,
      );
      assertRevision(draft, parsed.expectedRevision);
      const ticketReference = draftReference
        .collection("referenceUploads")
        .doc(parsed.referenceId);
      const ticketSnapshot = await ticketReference.get();
      if (!ticketSnapshot.exists) {
        throw new PlanHomeReferenceValidationError(
          "This upload expired. Choose the file again.",
        );
      }
      const ticket = ticketSnapshot.data() as StoredUploadTicket;
      if (toMillis(ticket.expiresAt) <= now().getTime()) {
        await abandonUpload(parsed, sessionTokenHash);
        throw new PlanHomeReferenceValidationError(
          "This upload expired. Choose the file again.",
        );
      }

      const object = bucket.file(ticket.objectPath);
      try {
        const [metadata] = await object.getMetadata();
        const [signature] = await object.download({ start: 0, end: 31 });
        const customMetadata = metadata.metadata ?? {};
        const validMetadata =
          Number(metadata.size) === ticket.sizeBytes &&
          metadata.contentType === ticket.mimeType &&
          customMetadata["plan-home-draft"] === parsed.draftId &&
          customMetadata["plan-home-reference"] === parsed.referenceId &&
          !customMetadata.firebaseStorageDownloadTokens;
        if (
          !validMetadata ||
          !hasMatchingPlanHomeFileSignature(ticket.extension, signature)
        ) {
          throw new PlanHomeReferenceValidationError(
            "The uploaded file did not match its declared type or size.",
          );
        }
      } catch (error) {
        await deleteObjectIfPresent(bucket, ticket.objectPath);
        await ticketReference.delete();
        if (error instanceof PlanHomeReferenceValidationError) throw error;
        throw new PlanHomeReferenceValidationError(
          "The uploaded file could not be verified. Choose it again.",
        );
      }

      try {
        return await database.runTransaction(async (transaction) => {
          const [draftSnapshot, currentTicketSnapshot] = await Promise.all([
            transaction.get(draftReference),
            transaction.get(ticketReference),
          ]);
          if (!draftSnapshot.exists) throw new PlanHomeDraftNotFoundError();
          if (!currentTicketSnapshot.exists) {
            throw new PlanHomeReferenceValidationError(
              "This upload is no longer available.",
            );
          }
          const currentDraft = readDraft(draftSnapshot.data());
          assertAuthorized(currentDraft, sessionTokenHash, now());
          assertRevision(currentDraft, parsed.expectedRevision);
          assertReferenceCapacity(currentDraft.references, [], {
            sizeBytes: ticket.sizeBytes,
          });
          const reference: PlanHomeFileReference = {
            id: parsed.referenceId,
            kind: "file",
            originalName: ticket.originalName,
            objectPath: ticket.objectPath,
            extension: ticket.extension,
            mimeType: ticket.mimeType,
            sizeBytes: ticket.sizeBytes,
            ...(parsed.note ? { note: parsed.note } : {}),
            createdAt: now().toISOString(),
          };
          const references = planHomeReferenceCollectionSchema.parse([
            ...currentDraft.references,
            reference,
          ]);
          const revision = currentDraft.revision + 1;
          transaction.update(draftReference, {
            references,
            revision,
            updatedAt: now(),
          });
          transaction.delete(ticketReference);
          return mutationResult(parsed.draftId, revision, references, true);
        });
      } catch (error) {
        await deleteObjectIfPresent(bucket, ticket.objectPath);
        await ticketReference.delete().catch(() => undefined);
        throw error;
      }
    },

    async addLink(
      input: unknown,
      sessionTokenHash: string,
    ): Promise<PlanHomeReferenceMutationResult> {
      const parsed = parseOrThrow(planHomeAddLinkSchema.safeParse(input));
      const normalized = normalizePlanHomeReferenceLink(parsed.url);
      const referenceId = `link-${uuid()}`;
      const draftReference = database
        .collection(inquirySubmissionsCollection)
        .doc(parsed.draftId);
      return database.runTransaction(async (transaction) => {
        const draftSnapshot = await transaction.get(draftReference);
        if (!draftSnapshot.exists) throw new PlanHomeDraftNotFoundError();
        const draft = readDraft(draftSnapshot.data());
        assertAuthorized(draft, sessionTokenHash, now());
        assertRevision(draft, parsed.expectedRevision);
        if (
          draft.references.length >= PLAN_HOME_REFERENCE_LIMITS.total ||
          draft.references.filter((reference) => reference.kind === "link").length >=
            PLAN_HOME_REFERENCE_LIMITS.links
        ) {
          throw new PlanHomeReferenceValidationError(
            "The reference or link limit has been reached.",
          );
        }
        const references = planHomeReferenceCollectionSchema.parse([
          ...draft.references,
          {
            id: referenceId,
            kind: "link",
            ...normalized,
            ...(parsed.note ? { note: parsed.note } : {}),
            createdAt: now().toISOString(),
          },
        ]);
        const revision = draft.revision + 1;
        transaction.update(draftReference, {
          references,
          revision,
          updatedAt: now(),
        });
        return mutationResult(parsed.draftId, revision, references, true);
      });
    },

    async removeReference(
      input: unknown,
      sessionTokenHash: string,
    ): Promise<PlanHomeReferenceMutationResult> {
      const parsed = parseOrThrow(planHomeRemoveReferenceSchema.safeParse(input));
      const { draft, draftReference } = await authorizedDraft(
        parsed.draftId,
        sessionTokenHash,
      );
      assertRevision(draft, parsed.expectedRevision);
      const reference = draft.references.find(
        ({ id }) => id === parsed.referenceId,
      );
      if (!reference) {
        return mutationResult(
          parsed.draftId,
          draft.revision,
          draft.references,
          false,
        );
      }
      if (reference.kind === "file") {
        await deleteObjectIfPresent(bucket, reference.objectPath);
      }
      return database.runTransaction(async (transaction) => {
        const draftSnapshot = await transaction.get(draftReference);
        if (!draftSnapshot.exists) throw new PlanHomeDraftNotFoundError();
        const currentDraft = readDraft(draftSnapshot.data());
        assertAuthorized(currentDraft, sessionTokenHash, now());
        assertRevision(currentDraft, parsed.expectedRevision);
        const references = currentDraft.references.filter(
          ({ id }) => id !== parsed.referenceId,
        );
        const revision = currentDraft.revision + 1;
        transaction.update(draftReference, {
          references,
          revision,
          updatedAt: now(),
        });
        return mutationResult(parsed.draftId, revision, references, true);
      });
    },

    async syncNotes(
      input: unknown,
      sessionTokenHash: string,
    ): Promise<PlanHomeReferenceMutationResult> {
      const parsed = parseOrThrow(
        planHomeSyncReferenceNotesSchema.safeParse(input),
      );
      const notes = new Map(
        parsed.notes.map(({ referenceId, note }) => [referenceId, note]),
      );
      const draftReference = database
        .collection(inquirySubmissionsCollection)
        .doc(parsed.draftId);
      return database.runTransaction(async (transaction) => {
        const draftSnapshot = await transaction.get(draftReference);
        if (!draftSnapshot.exists) throw new PlanHomeDraftNotFoundError();
        const draft = readDraft(draftSnapshot.data());
        assertAuthorized(draft, sessionTokenHash, now());
        assertRevision(draft, parsed.expectedRevision);
        if (notes.size !== draft.references.length) {
          throw new PlanHomeReferenceValidationError(
            "Reference notes no longer match the saved reference list.",
          );
        }
        const references = planHomeReferenceCollectionSchema.parse(
          draft.references.map((reference) => {
            if (!notes.has(reference.id)) {
              throw new PlanHomeReferenceValidationError(
                "Reference notes no longer match the saved reference list.",
              );
            }
            const note = notes.get(reference.id) ?? "";
            const withoutNote = { ...reference };
            delete withoutNote.note;
            return note ? { ...withoutNote, note } : withoutNote;
          }),
        );
        if (JSON.stringify(references) === JSON.stringify(draft.references)) {
          return mutationResult(
            parsed.draftId,
            draft.revision,
            references,
            false,
          );
        }
        const revision = draft.revision + 1;
        transaction.update(draftReference, {
          references,
          revision,
          updatedAt: now(),
        });
        return mutationResult(parsed.draftId, revision, references, true);
      });
    },

    abandonUpload,
    cleanupExpiredUploadsForDraft,
  } as const;
}

export function planHomeDraftSessionHashForTest(secret: string) {
  return sha256(secret);
}
