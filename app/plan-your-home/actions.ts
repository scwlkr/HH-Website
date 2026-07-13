"use server";

import {
  PlanHomeDraftValidationError,
  parseCheckpointPlanHomeDraftInput,
  parseCreatePlanHomeDraftInput,
} from "@/features/plan-your-home/server-draft-contract";
import {
  PlanHomeDraftAuthorizationError,
  PlanHomeDraftConflictError,
  PlanHomeDraftNotFoundError,
  type PlanHomeDraftWriteResult,
} from "@/features/plan-your-home/server-draft-repository";
import {
  checkpointPlanHomeDraft,
  createPlanHomeDraft,
} from "@/lib/db/plan-home-drafts";
import {
  getPlanHomeDraftSession,
  issuePlanHomeDraftSession,
  setPlanHomeDraftSessionCookie,
} from "@/lib/plan-your-home/draft-session";
import { PlanHomeDraftSessionConfigurationError } from "@/lib/plan-your-home/draft-session-token";

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

function knownActionError(error: unknown): PlanHomeDraftActionState | null {
  if (error instanceof PlanHomeDraftValidationError) {
    return {
      status: "validation-error",
      message: error.message,
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
