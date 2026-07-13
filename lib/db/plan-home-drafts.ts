import "server-only";

import { createPlanHomeDraftRepository } from "@/features/plan-your-home/server-draft-repository";
import { getFirebaseDatabase, isFirebaseAdminConfigured } from "@/lib/db/client";

function getPlanHomeDraftRepository() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase admin credentials are not configured.");
  }

  return createPlanHomeDraftRepository(getFirebaseDatabase());
}

export async function createPlanHomeDraft(
  input: unknown,
  sessionTokenHash: string,
) {
  return getPlanHomeDraftRepository().createDraft(input, sessionTokenHash);
}

export async function checkpointPlanHomeDraft(
  input: unknown,
  sessionTokenHash: string,
) {
  return getPlanHomeDraftRepository().checkpointDraft(input, sessionTokenHash);
}
