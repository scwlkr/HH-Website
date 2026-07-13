import { createHash, timingSafeEqual } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

import {
  createCompletedZoneProgress,
  createContactGateProgress,
  createPlanHomeDraftContact,
  createPlanHomeDraftDerived,
  parseCheckpointPlanHomeDraftInput,
  parseCreatePlanHomeDraftInput,
  type PlanHomeDraftProgress,
} from "./server-draft-contract.ts";
import type { PlanHomeAnswerMap } from "./registry.ts";

const inquirySubmissionsCollection = "inquirySubmissions";
export const PLAN_HOME_DRAFT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

type StoredIdempotencyResult = Readonly<{
  requestHash: string;
  resultRevision: number;
  progress: PlanHomeDraftProgress;
  appliedAt: Date;
}>;

type StoredPlanHomeDraft = Readonly<{
  schemaVersion: 2;
  experience: "plan-your-home";
  definitionId: "plan-home-v1";
  status: "draft";
  contact: ReturnType<typeof createPlanHomeDraftContact>;
  answers: PlanHomeAnswerMap;
  progress: PlanHomeDraftProgress;
  references: readonly [];
  source: Readonly<{
    path: string;
    attribution: Readonly<Record<string, never>>;
  }>;
  derived: ReturnType<typeof createPlanHomeDraftDerived> & {
    lastActivityAt: Date;
  };
  revision: number;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: null;
  expiresAt: Date;
  draftSession: Readonly<{
    tokenHash: string;
    issuedAt: Date;
  }>;
  createIdempotency: Readonly<{
    keyHash: string;
    requestHash: string;
    resultRevision: number;
  }>;
  checkpointIdempotency: Readonly<Record<string, StoredIdempotencyResult>>;
}>;

export type PlanHomeDraftWriteResult = Readonly<{
  draftId: string;
  revision: number;
  progress: PlanHomeDraftProgress;
  applied: boolean;
}>;

export class PlanHomeDraftAuthorizationError extends Error {
  readonly code = "authorization";

  constructor(message = "The draft session is missing or invalid.") {
    super(message);
    this.name = "PlanHomeDraftAuthorizationError";
  }
}

export class PlanHomeDraftConflictError extends Error {
  readonly code = "conflict";
  readonly currentRevision: number | undefined;

  constructor(
    message: string,
    currentRevision?: number,
  ) {
    super(message);
    this.name = "PlanHomeDraftConflictError";
    this.currentRevision = currentRevision;
  }
}

export class PlanHomeDraftNotFoundError extends Error {
  readonly code = "not-found";

  constructor() {
    super("The draft could not be found.");
    this.name = "PlanHomeDraftNotFoundError";
  }
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(
        ([key, item]) =>
          `${JSON.stringify(key)}:${stableStringify(item)}`,
      )
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function requestHash(value: unknown) {
  return sha256(stableStringify(value));
}

function draftIdForIdempotencyKey(idempotencyKey: string) {
  return `draft-${sha256(`plan-home-create:${idempotencyKey}`).slice(0, 40)}`;
}

function hashesMatch(left: string, right: string) {
  if (!/^[a-f0-9]{64}$/.test(left) || !/^[a-f0-9]{64}$/.test(right)) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function readStoredDraft(value: unknown): StoredPlanHomeDraft {
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
    value.revision < 1
  ) {
    throw new PlanHomeDraftConflictError(
      "The stored draft is incompatible with this checkpoint.",
    );
  }

  return value as StoredPlanHomeDraft;
}

function assertAuthorized(
  document: StoredPlanHomeDraft,
  sessionTokenHash: string,
) {
  if (!hashesMatch(document.draftSession.tokenHash, sessionTokenHash)) {
    throw new PlanHomeDraftAuthorizationError();
  }
}

export function createPlanHomeDraftRepository(
  database: Firestore,
  dependencies: Readonly<{
    now?: () => Date;
  }> = {},
) {
  const now = dependencies.now ?? (() => new Date());

  return {
    async createDraft(
      input: unknown,
      sessionTokenHash: string,
    ): Promise<PlanHomeDraftWriteResult> {
      if (!/^[a-f0-9]{64}$/.test(sessionTokenHash)) {
        throw new PlanHomeDraftAuthorizationError(
          "A valid server-issued draft session is required.",
        );
      }

      const parsed = parseCreatePlanHomeDraftInput(input);
      const draftId = draftIdForIdempotencyKey(parsed.idempotencyKey);
      const idempotencyKeyHash = sha256(parsed.idempotencyKey);
      const createRequestHash = requestHash({
        welcomeName: parsed.welcomeName,
        contact: parsed.contact,
        answers: parsed.answers,
        sourcePath: parsed.sourcePath,
      });
      const documentReference = database
        .collection(inquirySubmissionsCollection)
        .doc(draftId);

      return database.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(documentReference);

        if (snapshot.exists) {
          const existing = readStoredDraft(snapshot.data());
          if (
            existing.createIdempotency.keyHash !== idempotencyKeyHash ||
            existing.createIdempotency.requestHash !== createRequestHash ||
            !hashesMatch(existing.draftSession.tokenHash, sessionTokenHash)
          ) {
            throw new PlanHomeDraftConflictError(
              "This create idempotency key was already used for a different request.",
              existing.revision,
            );
          }

          return {
            draftId,
            revision: existing.createIdempotency.resultRevision,
            progress: createContactGateProgress(),
            applied: false,
          };
        }

        const writtenAt = now();
        const progress = createContactGateProgress();
        const contact = createPlanHomeDraftContact(
          parsed.welcomeName,
          parsed.contact,
        );
        const derived = createPlanHomeDraftDerived(contact, parsed.answers);
        const revision = 1;
        const document: StoredPlanHomeDraft = {
          schemaVersion: 2,
          experience: "plan-your-home",
          definitionId: "plan-home-v1",
          status: "draft",
          contact,
          answers: parsed.answers,
          progress,
          references: [],
          source: {
            path: parsed.sourcePath,
            attribution: {},
          },
          derived: {
            ...derived,
            lastActivityAt: writtenAt,
          },
          revision,
          createdAt: writtenAt,
          updatedAt: writtenAt,
          submittedAt: null,
          expiresAt: new Date(
            writtenAt.getTime() + PLAN_HOME_DRAFT_RETENTION_MS,
          ),
          draftSession: {
            tokenHash: sessionTokenHash,
            issuedAt: writtenAt,
          },
          createIdempotency: {
            keyHash: idempotencyKeyHash,
            requestHash: createRequestHash,
            resultRevision: revision,
          },
          checkpointIdempotency: {},
        };

        transaction.create(documentReference, document);

        return {
          draftId,
          revision,
          progress,
          applied: true,
        };
      });
    },

    async checkpointDraft(
      input: unknown,
      sessionTokenHash: string,
    ): Promise<PlanHomeDraftWriteResult> {
      const parsed = parseCheckpointPlanHomeDraftInput(input);
      const documentReference = database
        .collection(inquirySubmissionsCollection)
        .doc(parsed.draftId);
      const idempotencyKeyHash = sha256(parsed.idempotencyKey);
      const checkpointRequestHash = requestHash({
        draftId: parsed.draftId,
        expectedRevision: parsed.expectedRevision,
        completedZoneId: parsed.completedZoneId,
        answers: parsed.answers,
      });

      return database.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(documentReference);
        if (!snapshot.exists) {
          throw new PlanHomeDraftNotFoundError();
        }

        const existing = readStoredDraft(snapshot.data());
        assertAuthorized(existing, sessionTokenHash);

        const idempotentResult =
          existing.checkpointIdempotency[idempotencyKeyHash];
        if (idempotentResult) {
          if (idempotentResult.requestHash !== checkpointRequestHash) {
            throw new PlanHomeDraftConflictError(
              "This checkpoint idempotency key was already used for a different request.",
              existing.revision,
            );
          }

          return {
            draftId: parsed.draftId,
            revision: idempotentResult.resultRevision,
            progress: idempotentResult.progress,
            applied: false,
          };
        }

        if (parsed.expectedRevision !== existing.revision) {
          throw new PlanHomeDraftConflictError(
            "This draft changed after the checkpoint was prepared. Retry from the latest saved revision.",
            existing.revision,
          );
        }

        const progress = createCompletedZoneProgress(parsed.completedZoneId);
        if (
          progress.completedZoneIds.length <
          existing.progress.completedZoneIds.length
        ) {
          throw new PlanHomeDraftConflictError(
            "A checkpoint cannot move draft progress backward.",
            existing.revision,
          );
        }

        const answers = {
          ...existing.answers,
          ...parsed.answers,
        } satisfies PlanHomeAnswerMap;
        const writtenAt = now();
        const revision = existing.revision + 1;
        const derived = createPlanHomeDraftDerived(existing.contact, answers);
        const idempotencyResult: StoredIdempotencyResult = {
          requestHash: checkpointRequestHash,
          resultRevision: revision,
          progress,
          appliedAt: writtenAt,
        };

        transaction.update(documentReference, {
          answers,
          progress,
          derived: {
            ...derived,
            lastActivityAt: writtenAt,
          },
          revision,
          updatedAt: writtenAt,
          expiresAt: new Date(
            writtenAt.getTime() + PLAN_HOME_DRAFT_RETENTION_MS,
          ),
          checkpointIdempotency: {
            ...existing.checkpointIdempotency,
            [idempotencyKeyHash]: idempotencyResult,
          },
        });

        return {
          draftId: parsed.draftId,
          revision,
          progress,
          applied: true,
        };
      });
    },
  };
}

export type PlanHomeDraftRepository = ReturnType<
  typeof createPlanHomeDraftRepository
>;
