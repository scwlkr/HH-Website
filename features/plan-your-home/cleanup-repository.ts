import { FieldPath, type Firestore } from "firebase-admin/firestore";
import type {
  Bucket,
  File,
  FileMetadata,
  GetFilesOptions,
} from "@google-cloud/storage";

import {
  ADMIN_INQUIRY_UPLOAD_EXPIRY_GRACE_MS,
  createAdminInquiryDetailRepository,
} from "./admin-inquiry-detail.ts";
import { PLAN_HOME_UPLOAD_CAPABILITY_MS } from "./reference-repository.ts";

const inquiriesCollection = "inquirySubmissions";
const resumeTokensCollection = "planHomeResumeTokens";
const referenceUploadsCollection = "referenceUploads";
const cleanupPageSize = 100;
const tokenBatchSize = 400;
const objectPageSize = 200;
const objectDeleteConcurrency = 50;

export const PLAN_HOME_ORPHAN_MIN_AGE_MS =
  PLAN_HOME_UPLOAD_CAPABILITY_MS + ADMIN_INQUIRY_UPLOAD_EXPIRY_GRACE_MS;

type StoredRecord = Record<string, unknown>;

function readRecord(value: unknown): StoredRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as StoredRecord)
    : {};
}

function timestampMillis(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parsePlanHomeObjectPath(objectPath: string) {
  const match =
    /^inquiryReferences\/(draft-[a-f0-9]{40})\/([^/]+)$/.exec(objectPath);
  if (!match) return null;
  return { draftId: match[1], objectName: match[2] } as const;
}

function objectActivityMillis(metadata: FileMetadata) {
  const updated = timestampMillis(metadata.updated);
  const created = timestampMillis(metadata.timeCreated);
  if (updated === null && created === null) return null;
  return Math.max(updated ?? 0, created ?? 0);
}

async function listObjectPage(
  bucket: Bucket,
  pageToken?: string,
) {
  const [files, nextQuery] = await bucket.getFiles({
    prefix: "inquiryReferences/",
    autoPaginate: false,
    maxResults: objectPageSize,
    ...(pageToken ? { pageToken } : {}),
  });
  return {
    files,
    pageToken: (nextQuery as GetFilesOptions | null | undefined)?.pageToken,
  };
}

async function mapWithConcurrency<T>(
  items: readonly T[],
  worker: (item: T) => Promise<void>,
) {
  for (let index = 0; index < items.length; index += objectDeleteConcurrency) {
    await Promise.all(items.slice(index, index + objectDeleteConcurrency).map(worker));
  }
}

export type PlanHomeCleanupResult = Readonly<{
  recordsDeleted: number;
  recordsPending: number;
  resumeTokensDeleted: number;
  orphanObjectsDeleted: number;
  orphanTicketsDeleted: number;
  protectedObjects: number;
}>;

export function createPlanHomeCleanupRepository(
  database: Firestore,
  bucket: Bucket,
  dependencies: Readonly<{ now?: () => Date }> = {},
) {
  const now = dependencies.now ?? (() => new Date());
  const detailRepository = createAdminInquiryDetailRepository(database, bucket, {
    now,
  });
  const cleanupActor = { uid: "scheduled-plan-home-cleanup" } as const;

  async function expiredRecordIds(cutoff: Date) {
    const ids: string[] = [];
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    while (true) {
      let query: FirebaseFirestore.Query = database
        .collection(inquiriesCollection)
        .where("expiresAt", "<=", cutoff)
        .orderBy("expiresAt")
        .limit(cleanupPageSize);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      for (const document of page.docs) {
        const record = readRecord(document.data());
        if (record.experience === "plan-your-home") ids.push(document.id);
      }
      if (page.size < cleanupPageSize) return ids;
      cursor = page.docs.at(-1);
    }
  }

  async function deletingRecordIds() {
    const ids: string[] = [];
    let cursorId: string | undefined;
    while (true) {
      let query: FirebaseFirestore.Query = database
        .collection(inquiriesCollection)
        .where("status", "==", "deleting")
        .orderBy(FieldPath.documentId())
        .limit(cleanupPageSize);
      if (cursorId) query = query.startAfter(cursorId);
      const page = await query.get();
      ids.push(...page.docs.map((document) => document.id));
      if (page.size < cleanupPageSize) return ids;
      cursorId = page.docs.at(-1)?.id;
    }
  }

  async function deleteExpiredRecords(cutoff: Date) {
    const recordIds = new Set([
      ...(await expiredRecordIds(cutoff)),
      ...(await deletingRecordIds()),
    ]);
    let recordsDeleted = 0;
    let recordsPending = 0;
    for (const inquiryId of recordIds) {
      const result = await detailRepository.deleteExpiredInquiry(
        inquiryId,
        cleanupActor,
        cutoff,
      );
      if (result.applied) recordsDeleted += 1;
      if ("pending" in result && result.pending) recordsPending += 1;
    }
    return { recordsDeleted, recordsPending } as const;
  }

  async function deleteExpiredResumeTokens(cutoff: Date) {
    let deleted = 0;
    while (true) {
      const page = await database
        .collection(resumeTokensCollection)
        .where("expiresAt", "<=", cutoff)
        .limit(tokenBatchSize)
        .get();
      if (page.empty) return deleted;
      const batch = database.batch();
      for (const document of page.docs) batch.delete(document.ref);
      await batch.commit();
      deleted += page.size;
    }
  }

  async function deleteExpiredOrphanTickets(cutoff: Date) {
    let deleted = 0;
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    while (true) {
      let query: FirebaseFirestore.Query = database
        .collectionGroup(referenceUploadsCollection)
        .where("expiresAt", "<=", cutoff)
        .orderBy("expiresAt")
        .limit(cleanupPageSize);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      for (const ticketDocument of page.docs) {
        const removed = await database.runTransaction(async (transaction) => {
          const ticketReference = ticketDocument.ref;
          const parentReference = ticketReference.parent.parent;
          if (!parentReference || parentReference.parent.id !== inquiriesCollection) {
            return false;
          }
          const [parentSnapshot, ticketSnapshot] = await Promise.all([
            transaction.get(parentReference),
            transaction.get(ticketReference),
          ]);
          if (parentSnapshot.exists || !ticketSnapshot.exists) return false;
          const ticket = readRecord(ticketSnapshot.data());
          const expiresAt = timestampMillis(ticket.expiresAt);
          const objectPath = ticket.objectPath;
          if (
            ticket.draftId !== parentReference.id ||
            ticket.referenceId !== ticketReference.id ||
            expiresAt === null ||
            expiresAt > cutoff.getTime() ||
            typeof objectPath !== "string" ||
            parsePlanHomeObjectPath(objectPath)?.draftId !== parentReference.id
          ) {
            return false;
          }
          transaction.delete(ticketReference);
          return true;
        });
        if (removed) deleted += 1;
      }
      if (page.size < cleanupPageSize) return deleted;
      cursor = page.docs.at(-1);
    }
  }

  async function cleanupOrphanObject(file: File, cutoff: Date) {
    const identity = parsePlanHomeObjectPath(file.name);
    if (!identity) return { deleted: false, ticketDeleted: false, protected: true };
    const parentReference = database
      .collection(inquiriesCollection)
      .doc(identity.draftId);
    if ((await parentReference.get()).exists) {
      return { deleted: false, ticketDeleted: false, protected: true };
    }

    let metadata: FileMetadata;
    try {
      [metadata] = await file.getMetadata();
    } catch {
      return { deleted: false, ticketDeleted: false, protected: false };
    }
    const activity = objectActivityMillis(metadata);
    if (
      activity === null ||
      activity > cutoff.getTime() - PLAN_HOME_ORPHAN_MIN_AGE_MS
    ) {
      return { deleted: false, ticketDeleted: false, protected: true };
    }

    const referenceId = metadata.metadata?.["plan-home-reference"];
    const ticketReference =
      typeof referenceId === "string" && /^file-[A-Za-z0-9-]{1,120}$/.test(referenceId)
        ? parentReference.collection(referenceUploadsCollection).doc(referenceId)
        : null;
    const ticketSnapshot = ticketReference ? await ticketReference.get() : null;
    const ticket = readRecord(ticketSnapshot?.data());
    const ticketExpiry = timestampMillis(ticket.expiresAt);
    if (ticketSnapshot?.exists && ticketExpiry !== null && ticketExpiry > cutoff.getTime()) {
      return { deleted: false, ticketDeleted: false, protected: true };
    }

    if ((await parentReference.get()).exists) {
      return { deleted: false, ticketDeleted: false, protected: true };
    }
    const generation = metadata.generation;
    const exactGeneration =
      typeof generation === "string" && /^\d+$/.test(generation)
        ? Number(generation)
        : null;
    if (exactGeneration === null || !Number.isSafeInteger(exactGeneration)) {
      return { deleted: false, ticketDeleted: false, protected: true };
    }
    await bucket
      .file(file.name, { generation: exactGeneration })
      .delete({ ignoreNotFound: true });

    let ticketDeleted = false;
    if (ticketSnapshot?.exists && ticketReference) {
      if (!(await parentReference.get()).exists) {
        await ticketReference.delete();
        ticketDeleted = true;
      }
    }
    return { deleted: true, ticketDeleted, protected: false };
  }

  async function deleteOrphanObjects(cutoff: Date) {
    let orphanObjectsDeleted = 0;
    let orphanTicketsDeleted = 0;
    let protectedObjects = 0;
    let pageToken: string | undefined;
    do {
      const page = await listObjectPage(bucket, pageToken);
      await mapWithConcurrency(page.files, async (file) => {
        const result = await cleanupOrphanObject(file, cutoff);
        if (result.deleted) orphanObjectsDeleted += 1;
        if (result.ticketDeleted) orphanTicketsDeleted += 1;
        if (result.protected) protectedObjects += 1;
      });
      pageToken = page.pageToken;
    } while (pageToken);
    return { orphanObjectsDeleted, orphanTicketsDeleted, protectedObjects };
  }

  return {
    async run(): Promise<PlanHomeCleanupResult> {
      const cutoff = now();
      const records = await deleteExpiredRecords(cutoff);
      const resumeTokensDeleted = await deleteExpiredResumeTokens(cutoff);
      const expiredOrphanTicketsDeleted =
        await deleteExpiredOrphanTickets(cutoff);
      const orphans = await deleteOrphanObjects(cutoff);
      return {
        ...records,
        resumeTokensDeleted,
        ...orphans,
        orphanTicketsDeleted:
          expiredOrphanTicketsDeleted + orphans.orphanTicketsDeleted,
      };
    },
  } as const;
}
