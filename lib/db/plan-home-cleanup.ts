import "server-only";

import { createPlanHomeCleanupRepository } from "@/features/plan-your-home/cleanup-repository";
import {
  getFirebaseDatabase,
  getFirebaseStorageBucket,
  isFirebaseAdminConfigured,
} from "@/lib/db/client";

export function getPlanHomeCleanupRepository() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase admin credentials are not configured.");
  }
  return createPlanHomeCleanupRepository(
    getFirebaseDatabase(),
    getFirebaseStorageBucket(),
  );
}
