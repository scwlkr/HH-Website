import "server-only";

import { createPlanHomeDraftResumeRepository } from "@/features/plan-your-home/draft-resume-repository";
import { getFirebaseDatabase, isFirebaseAdminConfigured } from "@/lib/db/client";
import { readPlanHomeResumeSecret } from "@/lib/plan-your-home/draft-resume-token";

function getRepository() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase admin credentials are not configured.");
  }
  return createPlanHomeDraftResumeRepository(getFirebaseDatabase(), {
    secret: readPlanHomeResumeSecret(),
  });
}

export function requestPlanHomeResumeLink(input: {
  email: unknown;
  requesterIdentity: string;
  publicOrigin: string;
}) {
  return getRepository().requestResumeLink(input);
}

export function consumePlanHomeResumeToken(token: unknown) {
  return getRepository().consumeResumeToken(token);
}
