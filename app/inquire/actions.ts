"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { insertInquirySubmission } from "@/lib/db/queries";
import { checkInquiryRateLimit } from "@/lib/inquiry/rate-limit";
import {
  createInquiryServerErrorState,
  getInquiryFormValues,
  mapInquiryFieldErrors,
  toInquirySubmissionInput,
  validateInquiryValues,
} from "@/lib/validation/inquiry";
import {
  inquiryActionInitialState,
  type InquiryActionState,
} from "@/types/inquiry";

function getRateLimitKey(headerList: Headers) {
  const forwardedFor = headerList.get("x-forwarded-for");
  const realIp = headerList.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp?.trim();

  return ipAddress && ipAddress.length > 0 ? ipAddress : "unknown";
}

export async function submitInquiryAction(
  previousState: InquiryActionState = inquiryActionInitialState,
  formData: FormData,
): Promise<InquiryActionState> {
  void previousState;

  const values = getInquiryFormValues(formData);

  if (values.company.trim().length > 0) {
    redirect("/thank-you");
  }

  const headerList = await headers();
  const rateLimit = checkInquiryRateLimit(getRateLimitKey(headerList));

  if (!rateLimit.allowed) {
    return createInquiryServerErrorState(
      "Too many submission attempts came through in a short window. Please wait a few minutes and try again.",
    );
  }

  const validationResult = validateInquiryValues(values);

  if (!validationResult.success) {
    return {
      status: "field-error",
      message: "Please review the highlighted fields before sending the brief.",
      fieldErrors: mapInquiryFieldErrors(validationResult.error),
    };
  }

  try {
    const submissionInput = toInquirySubmissionInput(values);
    await insertInquirySubmission(submissionInput);
  } catch (error) {
    console.error("Inquiry submission failed", error);

    return createInquiryServerErrorState(
      "The project brief could not be sent right now. Please try again in a moment or email H&H directly.",
    );
  }

  redirect("/thank-you");
}
