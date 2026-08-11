"use server";

import { headers } from "next/headers";

import { PLAN_HOME_RESUME_GENERIC_MESSAGE } from "@/features/plan-your-home/draft-resume-contract";
import { requestPlanHomeResumeLink } from "@/lib/db/plan-home-draft-resume";
import { sendPlanHomeResumeLink } from "@/lib/plan-your-home/resume-mail";

export type PlanHomeResumeRequestState = Readonly<{
  submitted: boolean;
  message: string;
}>;

function requesterIdentity(headerList: Headers) {
  const forwardedFor = headerList.get("x-forwarded-for");
  const realIp = headerList.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
}

function publicOrigin(headerList: Headers) {
  const configured = process.env.PLAN_HOME_PUBLIC_ORIGIN?.trim();
  if (configured) {
    const origin = new URL(configured).origin;
    if (process.env.NODE_ENV === "production" && !origin.startsWith("https://")) {
      throw new Error("The Plan Your Home public origin must use HTTPS.");
    }
    return origin;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("The Plan Your Home public origin is not configured.");
  }

  const host = headerList.get("host")?.trim() ?? "localhost:3000";
  const hostname = new URL(`http://${host}`).hostname;
  if (!hostname || !["localhost", "127.0.0.1", "[::1]"].includes(hostname)) {
    throw new Error("The local Plan Your Home origin is invalid.");
  }
  return `http://${host}`;
}

export async function requestPlanHomeResumeAction(
  previousState: PlanHomeResumeRequestState,
  formData: FormData,
): Promise<PlanHomeResumeRequestState> {
  void previousState;
  try {
    const headerList = await headers();
    const delivery = await requestPlanHomeResumeLink({
      email: formData.get("email"),
      requesterIdentity: requesterIdentity(headerList),
      publicOrigin: publicOrigin(headerList),
    });
    if (delivery) await sendPlanHomeResumeLink(delivery);
  } catch {
    console.error("Plan Your Home resume request could not be completed.");
  }

  return { submitted: true, message: PLAN_HOME_RESUME_GENERIC_MESSAGE };
}
