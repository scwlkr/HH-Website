import "server-only";

import { createPlanHomeReferenceRepository } from "@/features/plan-your-home/reference-repository";
import {
  getFirebaseDatabase,
  getFirebaseStorageBucket,
  isFirebaseAdminConfigured,
} from "@/lib/db/client";

function getPlanHomeReferenceRepository() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase admin credentials are not configured.");
  }
  return createPlanHomeReferenceRepository(
    getFirebaseDatabase(),
    getFirebaseStorageBucket(),
  );
}

export async function issuePlanHomeReferenceUpload(
  input: unknown,
  sessionTokenHash: string,
) {
  return getPlanHomeReferenceRepository().issueUpload(input, sessionTokenHash);
}

export async function finalizePlanHomeReferenceUpload(
  input: unknown,
  sessionTokenHash: string,
) {
  return getPlanHomeReferenceRepository().finalizeUpload(input, sessionTokenHash);
}

export async function abandonPlanHomeReferenceUpload(
  input: unknown,
  sessionTokenHash: string,
) {
  return getPlanHomeReferenceRepository().abandonUpload(input, sessionTokenHash);
}

export async function addPlanHomeReferenceLink(
  input: unknown,
  sessionTokenHash: string,
) {
  return getPlanHomeReferenceRepository().addLink(input, sessionTokenHash);
}

export async function removePlanHomeReference(
  input: unknown,
  sessionTokenHash: string,
) {
  return getPlanHomeReferenceRepository().removeReference(input, sessionTokenHash);
}

export async function syncPlanHomeReferenceNotes(
  input: unknown,
  sessionTokenHash: string,
) {
  return getPlanHomeReferenceRepository().syncNotes(input, sessionTokenHash);
}
