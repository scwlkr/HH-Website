import "server-only";

import { createAdminInquiryQueueRepository } from "@/features/plan-your-home/admin-inquiry-queue";
import {
  getFirebaseDatabase,
  isFirebaseAdminConfigured,
} from "@/lib/db/client";
import type { AdminInquiryStatusFilter } from "@/features/plan-your-home/admin-inquiry-queue";
import { requireAdminUser } from "@/lib/firebase/auth";

export async function getAuthorizedAdminInquiryQueue() {
  await requireAdminUser();

  return {
    list(statusFilter: AdminInquiryStatusFilter) {
      if (!isFirebaseAdminConfigured()) {
        throw new Error("Firebase admin credentials are not configured.");
      }

      return createAdminInquiryQueueRepository(getFirebaseDatabase()).list(
        statusFilter,
      );
    },
  };
}
