import "server-only";

import type { PlanHomeResumeDelivery } from "@/features/plan-your-home/draft-resume-repository";
import { PlanHomeResumeConfigurationError } from "@/lib/plan-your-home/draft-resume-token";

type FakeMessage = Readonly<{
  to: string;
  resumeUrl: string;
  expiresAt: string;
}>;

const mailboxSymbol = Symbol.for("hh.plan-home-resume-mailbox");

function fakeMailbox() {
  const shared = globalThis as typeof globalThis & {
    [mailboxSymbol]?: FakeMessage[];
  };
  shared[mailboxSymbol] ??= [];
  return shared[mailboxSymbol];
}

function fakeTransportAllowed() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.PLAN_HOME_RESUME_MAIL_TRANSPORT === "fake" &&
    Boolean(process.env.FIRESTORE_EMULATOR_HOST)
  );
}

export function takeLatestFakePlanHomeResumeMessage() {
  if (!fakeTransportAllowed()) return null;
  return fakeMailbox().pop() ?? null;
}

function readRequiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new PlanHomeResumeConfigurationError();
  return value;
}

async function sendWithResend(delivery: PlanHomeResumeDelivery) {
  const apiKey = readRequiredEnvironment("RESEND_API_KEY");
  const from = readRequiredEnvironment("PLAN_HOME_RESUME_EMAIL_FROM");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [delivery.to],
      subject: "Resume your Plan Your Home project brief",
      text: [
        "You requested a link to resume your Plan Your Home project brief.",
        "",
        delivery.resumeUrl,
        "",
        "This one-time link expires in 15 minutes. If you did not request it, you can ignore this email.",
      ].join("\n"),
    }),
  });
  if (!response.ok) throw new Error("Resume email delivery failed.");
}

export async function sendPlanHomeResumeLink(
  delivery: PlanHomeResumeDelivery,
) {
  const transport = process.env.PLAN_HOME_RESUME_MAIL_TRANSPORT?.trim();
  if (transport === "fake" && fakeTransportAllowed()) {
    fakeMailbox().push({
      to: delivery.to,
      resumeUrl: delivery.resumeUrl,
      expiresAt: delivery.expiresAt.toISOString(),
    });
    return;
  }
  if (transport === "resend") {
    await sendWithResend(delivery);
    return;
  }
  throw new PlanHomeResumeConfigurationError();
}
