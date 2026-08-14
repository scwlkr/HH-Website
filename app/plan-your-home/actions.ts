"use server";

import {
  PLAN_HOME_CUSTOMER_VALIDATION_MESSAGE,
  PlanHomeDraftValidationError,
  parseCheckpointPlanHomeDraftInput,
  parseCreatePlanHomeDraftInput,
  parseSubmitPlanHomeDraftInput,
} from "@/features/plan-your-home/server-draft-contract";
import {
  PlanHomeDraftAuthorizationError,
  PlanHomeDraftConflictError,
  PlanHomeDraftNotFoundError,
  type PlanHomeDraftWriteResult,
  type PlanHomeSubmissionWriteResult,
} from "@/features/plan-your-home/server-draft-repository";
import {
  checkpointPlanHomeDraft,
  createPlanHomeDraft,
  readPlanHomeDraftBoundary,
  submitPlanHomeDraft,
} from "@/lib/db/plan-home-drafts";
import type { PlanHomeServerBoundary } from "@/features/plan-your-home/draft-resume-contract";
import {
  getPlanHomeDraftSession,
  issuePlanHomeDraftSession,
  setPlanHomeDraftSessionCookie,
} from "@/lib/plan-your-home/draft-session";
import { PlanHomeDraftSessionConfigurationError } from "@/lib/plan-your-home/draft-session-token";
import {
  PLAN_HOME_CUSTOMER_REFERENCE_VALIDATION_MESSAGE,
  PlanHomeReferenceValidationError,
  type PlanHomeReferenceMutationResult,
  type PlanHomeUploadCapability,
} from "@/features/plan-your-home/reference-upload-contract";
import {
  abandonPlanHomeReferenceUpload,
  addPlanHomeReferenceLink,
  finalizePlanHomeReferenceUpload,
  issuePlanHomeReferenceUpload,
  removePlanHomeReference,
  syncPlanHomeReferenceNotes,
} from "@/lib/db/plan-home-references";

export type PlanHomeDraftActionState =
  | Readonly<{
      status: "success";
      result: PlanHomeDraftWriteResult;
    }>
  | Readonly<{
      status:
        | "validation-error"
        | "authorization-error"
        | "conflict"
        | "server-error";
      message: string;
      currentRevision?: number;
    }>;

export type PlanHomeSubmitActionState =
  | Readonly<{
      status: "success";
      result: PlanHomeSubmissionWriteResult;
    }>
  | Exclude<PlanHomeDraftActionState, { status: "success" }>;

export type PlanHomeRestoreActionState =
  | Readonly<{ status: "success"; result: PlanHomeServerBoundary }>
  | Readonly<{ status: "no-session" | "unavailable" }>;

export type PlanHomeReferenceActionState<Result> =
  | Readonly<{ status: "success"; result: Result }>
  | Readonly<{
      status:
        | "validation-error"
        | "authorization-error"
        | "conflict"
        | "server-error";
      message: string;
      currentRevision?: number;
    }>;

function knownActionError(error: unknown): PlanHomeDraftActionState | null {
  if (error instanceof PlanHomeDraftValidationError) {
    return {
      status: "validation-error",
      message: PLAN_HOME_CUSTOMER_VALIDATION_MESSAGE,
    };
  }

  if (error instanceof PlanHomeReferenceValidationError) {
    return {
      status: "validation-error",
      message: PLAN_HOME_CUSTOMER_REFERENCE_VALIDATION_MESSAGE,
    };
  }

  if (
    error instanceof PlanHomeDraftAuthorizationError ||
    error instanceof PlanHomeDraftNotFoundError
  ) {
    return {
      status: "authorization-error",
      message: "This draft session is missing or no longer valid.",
    };
  }

  if (error instanceof PlanHomeDraftConflictError) {
    return {
      status: "conflict",
      message: error.message,
      ...(error.currentRevision === undefined
        ? {}
        : { currentRevision: error.currentRevision }),
    };
  }

  if (error instanceof PlanHomeDraftSessionConfigurationError) {
    return {
      status: "server-error",
      message: "Draft saving is temporarily unavailable.",
    };
  }

  return null;
}

async function withPlanHomeDraftSession<Result>(
  input: unknown,
  operation: (input: unknown, sessionTokenHash: string) => Promise<Result>,
): Promise<PlanHomeReferenceActionState<Result>> {
  try {
    const session = await getPlanHomeDraftSession();
    if (!session) {
      return {
        status: "authorization-error",
        message: "This draft session is missing or no longer valid.",
      };
    }
    const draftId =
      input && typeof input === "object" && "draftId" in input
        ? input.draftId
        : null;
    if (draftId !== session.draftId) {
      return {
        status: "authorization-error",
        message: "This draft session is missing or no longer valid.",
      };
    }
    return {
      status: "success",
      result: await operation(input, session.sessionTokenHash),
    };
  } catch (error) {
    const knownError = knownActionError(error);
    if (knownError && knownError.status !== "success") return knownError;
    console.error("Plan Your Home reference operation failed", error);
    return {
      status: "server-error",
      message: "References are temporarily unavailable.",
    };
  }
}

export async function createPlanHomeDraftAction(
  input: unknown,
): Promise<PlanHomeDraftActionState> {
  try {
    const parsed = parseCreatePlanHomeDraftInput(input);
    const session = issuePlanHomeDraftSession(parsed.idempotencyKey);
    const result = await createPlanHomeDraft(
      parsed,
      session.sessionTokenHash,
    );
    await setPlanHomeDraftSessionCookie({
      draftId: result.draftId,
      sessionSecret: session.sessionSecret,
    });

    return { status: "success", result };
  } catch (error) {
    const knownError = knownActionError(error);
    if (knownError) {
      return knownError;
    }

    console.error("Plan Your Home draft creation failed", error);
    return {
      status: "server-error",
      message: "Draft saving is temporarily unavailable.",
    };
  }
}

export async function checkpointPlanHomeDraftAction(
  input: unknown,
): Promise<PlanHomeDraftActionState> {
  try {
    const parsed = parseCheckpointPlanHomeDraftInput(input);
    const session = await getPlanHomeDraftSession();
    if (!session || session.draftId !== parsed.draftId) {
      return {
        status: "authorization-error",
        message: "This draft session is missing or no longer valid.",
      };
    }

    const result = await checkpointPlanHomeDraft(
      parsed,
      session.sessionTokenHash,
    );
    return { status: "success", result };
  } catch (error) {
    const knownError = knownActionError(error);
    if (knownError) {
      return knownError;
    }

    console.error("Plan Your Home draft checkpoint failed", error);
    return {
      status: "server-error",
      message: "Draft saving is temporarily unavailable.",
    };
  }
}

export async function restorePlanHomeDraftAction(): Promise<PlanHomeRestoreActionState> {
  const session = await getPlanHomeDraftSession();
  if (!session) return { status: "no-session" };
  try {
    return {
      status: "success",
      result: await readPlanHomeDraftBoundary(
        session.draftId,
        session.sessionTokenHash,
      ),
    };
  } catch {
    return { status: "unavailable" };
  }
}

export async function submitPlanHomeDraftAction(
  input: unknown,
): Promise<PlanHomeSubmitActionState> {
  try {
    const parsed = parseSubmitPlanHomeDraftInput(input);
    const session = await getPlanHomeDraftSession();
    if (!session || session.draftId !== parsed.draftId) {
      return {
        status: "authorization-error",
        message: "This draft session is missing or no longer valid.",
      };
    }

    const result = await submitPlanHomeDraft(
      parsed,
      session.sessionTokenHash,
    );
    return { status: "success", result };
  } catch (error) {
    const knownError = knownActionError(error);
    if (knownError && knownError.status !== "success") return knownError;
    console.error("Plan Your Home submission failed", error);
    return {
      status: "server-error",
      message: "Your project brief could not be submitted right now.",
    };
  }
}

export async function issuePlanHomeReferenceUploadAction(
  input: unknown,
): Promise<PlanHomeReferenceActionState<PlanHomeUploadCapability>> {
  return withPlanHomeDraftSession(input, issuePlanHomeReferenceUpload);
}

export async function finalizePlanHomeReferenceUploadAction(
  input: unknown,
): Promise<PlanHomeReferenceActionState<PlanHomeReferenceMutationResult>> {
  return withPlanHomeDraftSession(input, finalizePlanHomeReferenceUpload);
}

export async function abandonPlanHomeReferenceUploadAction(
  input: unknown,
): Promise<PlanHomeReferenceActionState<Readonly<{ applied: boolean }>>> {
  return withPlanHomeDraftSession(input, abandonPlanHomeReferenceUpload);
}

export async function addPlanHomeReferenceLinkAction(
  input: unknown,
): Promise<PlanHomeReferenceActionState<PlanHomeReferenceMutationResult>> {
  return withPlanHomeDraftSession(input, addPlanHomeReferenceLink);
}

export async function removePlanHomeReferenceAction(
  input: unknown,
): Promise<PlanHomeReferenceActionState<PlanHomeReferenceMutationResult>> {
  return withPlanHomeDraftSession(input, removePlanHomeReference);
}

export async function syncPlanHomeReferenceNotesAction(
  input: unknown,
): Promise<PlanHomeReferenceActionState<PlanHomeReferenceMutationResult>> {
  return withPlanHomeDraftSession(input, syncPlanHomeReferenceNotes);
}
