import "server-only";

import { createAdminInquiryDetailRepository } from "@/features/plan-your-home/admin-inquiry-detail";
import {
  getFirebaseDatabase,
  getFirebaseStorageBucket,
  isFirebaseAdminConfigured,
} from "@/lib/db/client";
import { requireAdminUser } from "@/lib/firebase/auth";

export async function getAuthorizedAdminInquiryDetailRepository() {
  const admin = await requireAdminUser();
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase admin credentials are not configured.");
  }
  return {
    admin,
    repository: createAdminInquiryDetailRepository(
      getFirebaseDatabase(),
      getFirebaseStorageBucket(),
    ),
  };
}
