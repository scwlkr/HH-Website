import "server-only";

import {
  getFirebaseDatabase,
  isFirebaseAdminConfigured,
} from "@/lib/db/client";
import type { InquirySubmissionInput } from "@/types/inquiry";

export async function insertInquirySubmission(input: InquirySubmissionInput) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase admin credentials are not configured.");
  }

  const submissionReference = getFirebaseDatabase()
    .collection("inquirySubmissions")
    .doc();

  try {
    await submissionReference.create({
      ...input,
      status: "new",
      createdAt: new Date(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to persist inquiry submission: ${message}`);
  }

  return {
    id: submissionReference.id,
  };
}
