import { z } from "zod";

import {
  getPlanHomeQuestion,
  planHomeQuestions,
  planHomeZoneIds,
  type PlanHomeAnswerMap,
  type PlanHomeQuestionId,
  type PlanHomeZoneId,
} from "./registry.ts";
import type { PlanHomeReferenceMetadata } from "./references.ts";
import {
  normalizeRestoredPlanHomeAnswers,
  type PlanHomeContactCheckpoint,
} from "./schemas.ts";
import {
  createInitialPlanHomeTourState,
  validatePlanHomeTourState,
  type PlanHomeTourLocation,
  type PlanHomeTourState,
} from "./tour-state.ts";

const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(160));

export const PLAN_HOME_RESUME_GENERIC_MESSAGE =
  "If an eligible saved plan matches that email, a secure link is on its way. The link can be used once and expires in 15 minutes.";

export type PlanHomeServerBoundary = Readonly<{
  draftId: string;
  revision: number;
  welcomeName: string;
  contact: PlanHomeContactCheckpoint;
  answers: PlanHomeAnswerMap;
  progress: Readonly<{
    currentPromptId: PlanHomeQuestionId | "review";
    currentZoneId: PlanHomeZoneId;
    completedZoneIds: readonly PlanHomeZoneId[];
  }>;
  references: readonly PlanHomeReferenceMetadata[];
}>;

export function parsePlanHomeResumeEmail(value: unknown) {
  return normalizedEmailSchema.safeParse(value);
}

function boundaryLocation(
  promptId: PlanHomeServerBoundary["progress"]["currentPromptId"],
): PlanHomeTourLocation {
  return promptId === "review"
    ? { kind: "review" }
    : { kind: "question", questionId: promptId, editingFromReview: false };
}

export function createTourStateFromServerBoundary(
  boundary: PlanHomeServerBoundary,
): PlanHomeTourState {
  return {
    definitionId: "plan-home-v1",
    welcomeName: boundary.welcomeName,
    answers: normalizeRestoredPlanHomeAnswers(boundary.answers),
    location: boundaryLocation(boundary.progress.currentPromptId),
    contactCheckpoint: boundary.contact,
    completedZoneIds: boundary.progress.completedZoneIds,
    checkpointedZoneIds: boundary.progress.completedZoneIds,
    references: boundary.references,
  };
}

function progressRank(location: PlanHomeTourLocation) {
  if (location.kind === "welcome") return -1;
  if (location.kind === "contact-gate") {
    return getPlanHomeQuestion("home.bed-bath-counts")?.number ?? 0;
  }
  if (location.kind === "review") return planHomeQuestions.length;
  if (location.editingFromReview) return planHomeQuestions.length;
  return planHomeQuestions.findIndex(
    (question) => question.id === location.questionId,
  );
}

function isExactServerCheckpointPrefix(
  local: PlanHomeTourState,
  boundary: PlanHomeServerBoundary,
) {
  return (
    local.checkpointedZoneIds.length ===
      boundary.progress.completedZoneIds.length &&
    local.checkpointedZoneIds.every(
      (zoneId, index) => zoneId === boundary.progress.completedZoneIds[index],
    )
  );
}

export function reconcilePlanHomeDraft(params: {
  local: PlanHomeTourState | null;
  localDraftId: string | null;
  localRevision: number | null;
  boundary: PlanHomeServerBoundary;
}) {
  const serverState = createTourStateFromServerBoundary(params.boundary);
  const local = params.local
    ? {
        ...params.local,
        answers: normalizeRestoredPlanHomeAnswers(params.local.answers),
      }
    : null;
  const canKeepExactLocalPrompt = Boolean(
    local &&
      params.localDraftId === params.boundary.draftId &&
      params.localRevision !== null &&
      params.localRevision === params.boundary.revision &&
      isExactServerCheckpointPrefix(local, params.boundary) &&
      progressRank(local.location) >= progressRank(serverState.location),
  );

  if (!local || !canKeepExactLocalPrompt) {
    return { state: serverState, usedExactLocalPrompt: false } as const;
  }

  const reconciled = {
    ...local,
    welcomeName: params.boundary.welcomeName,
    contactCheckpoint: params.boundary.contact,
    checkpointedZoneIds: params.boundary.progress.completedZoneIds,
    references: params.boundary.references,
    answers: {
      ...serverState.answers,
      ...local.answers,
      ...(params.boundary.answers["design.references"]
        ? {
            "design.references": params.boundary.answers["design.references"],
          }
        : {}),
    },
  } satisfies PlanHomeTourState;

  if (validatePlanHomeTourState(reconciled).length > 0) {
    return { state: serverState, usedExactLocalPrompt: false } as const;
  }

  return { state: reconciled, usedExactLocalPrompt: true } as const;
}

export function safeAnonymousLocalState(local: PlanHomeTourState | null) {
  if (local && local.contactCheckpoint === null) return local;
  return createInitialPlanHomeTourState();
}

export function isCanonicalCompletedZonePrefix(value: readonly string[]) {
  return value.every((zoneId, index) => zoneId === planHomeZoneIds[index]);
}
