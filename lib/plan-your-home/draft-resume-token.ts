import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const PLAN_HOME_RESUME_TOKEN_TTL_MS = 15 * 60 * 1000;
export const PLAN_HOME_RESUME_RATE_WINDOW_MS = 15 * 60 * 1000;
export const PLAN_HOME_RESUME_RATE_LIMIT = 3;

const opaqueTokenPattern = /^[A-Za-z0-9_-]{43}$/;
const hashPattern = /^[a-f0-9]{64}$/;

export class PlanHomeResumeConfigurationError extends Error {
  constructor(message = "Plan Your Home resume is not configured.") {
    super(message);
    this.name = "PlanHomeResumeConfigurationError";
  }
}

export function readPlanHomeResumeSecret() {
  const secret =
    process.env.PLAN_HOME_RESUME_SECRET?.trim() ||
    process.env.PLAN_HOME_DRAFT_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new PlanHomeResumeConfigurationError();
  }
  return secret;
}

export function createPlanHomeResumeToken() {
  return randomBytes(32).toString("base64url");
}

export function isPlanHomeResumeToken(value: unknown): value is string {
  return typeof value === "string" && opaqueTokenPattern.test(value);
}

export function hashPlanHomeResumeValue(
  purpose: "token" | "email" | "requester",
  value: string,
  secret: string,
) {
  if (secret.length < 32) {
    throw new PlanHomeResumeConfigurationError();
  }
  return createHmac("sha256", secret)
    .update(`plan-home-resume:${purpose}:${value}`)
    .digest("hex");
}

export function hashesMatch(left: string, right: string) {
  if (!hashPattern.test(left) || !hashPattern.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}
