import "server-only";

import { createAdminInquiryDetailRepository } from "@/features/plan-your-home/admin-inquiry-detail";
import {
  getFirebaseDatabase,
  getFirebaseStorageBucket,
  isFirebaseAdminConfigured,
} from "@/lib/db/client";

export function getAdminInquiryDetailRepository() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase admin credentials are not configured.");
  }
  return createAdminInquiryDetailRepository(
    getFirebaseDatabase(),
    getFirebaseStorageBucket(),
  );
}
