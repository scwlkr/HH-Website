"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { insertInquirySubmission } from "@/lib/db/queries";
import { checkInquiryRateLimit } from "@/lib/inquiry/rate-limit";
import {
  createInquiryServerErrorState,
  getGeneralInquiryFormValues,
  mapInquiryFieldErrors,
  toGeneralInquirySubmissionInput,
  validateGeneralInquiryValues,
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
  const values = getGeneralInquiryFormValues(formData);
  const attempt = previousState.attempt + 1;

  if (values.company.trim().length > 0) {
    redirect("/thank-you");
  }

  const headerList = await headers();
  const rateLimit = checkInquiryRateLimit(getRateLimitKey(headerList));

  if (!rateLimit.allowed) {
    return createInquiryServerErrorState(
      "Too many submission attempts came through in a short window. Please wait a few minutes and try again.",
      values,
      attempt,
    );
  }

  const validationResult = validateGeneralInquiryValues(values);

  if (!validationResult.success) {
    return {
      status: "field-error",
      message: "Please review the highlighted fields before sending the inquiry.",
      fieldErrors: mapInquiryFieldErrors(validationResult.error),
      values,
      attempt,
    };
  }

  try {
    const submissionInput = toGeneralInquirySubmissionInput(values);
    await insertInquirySubmission(submissionInput);
  } catch (error) {
    console.error("Inquiry submission failed", error);

    return createInquiryServerErrorState(
      "The project inquiry could not be sent right now. Please try again in a moment or email h and h directly.",
      values,
      attempt,
    );
  }

  redirect("/thank-you");
}
