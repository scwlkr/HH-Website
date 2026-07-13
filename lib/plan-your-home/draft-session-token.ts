import { createHash, createHmac } from "node:crypto";

const draftSessionVersion = "v1";
const draftIdPattern = /^draft-[a-f0-9]{40}$/;
const sessionSecretPattern = /^[A-Za-z0-9_-]{43}$/;

export const planHomeDraftSessionCookieName = "__plan_home_draft";

export class PlanHomeDraftSessionConfigurationError extends Error {
  constructor() {
    super(
      "PLAN_HOME_DRAFT_SESSION_SECRET must contain at least 32 characters.",
    );
    this.name = "PlanHomeDraftSessionConfigurationError";
  }
}

export function readPlanHomeDraftSessionSigningSecret() {
  const secret = process.env.PLAN_HOME_DRAFT_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new PlanHomeDraftSessionConfigurationError();
  }

  return secret;
}

export function derivePlanHomeDraftSessionSecret(
  idempotencyKey: string,
  signingSecret: string,
) {
  if (signingSecret.length < 32) {
    throw new PlanHomeDraftSessionConfigurationError();
  }

  return createHmac("sha256", signingSecret)
    .update(`plan-home-draft:${idempotencyKey}`)
    .digest("base64url");
}

export function hashPlanHomeDraftSessionSecret(sessionSecret: string) {
  return createHash("sha256").update(sessionSecret).digest("hex");
}

export function serializePlanHomeDraftSession(params: {
  draftId: string;
  sessionSecret: string;
}) {
  if (
    !draftIdPattern.test(params.draftId) ||
    !sessionSecretPattern.test(params.sessionSecret)
  ) {
    throw new Error("The draft session cannot be serialized.");
  }

  return `${draftSessionVersion}.${params.draftId}.${params.sessionSecret}`;
}

export function parsePlanHomeDraftSession(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [version, draftId, sessionSecret, extra] = value.split(".");
  if (
    version !== draftSessionVersion ||
    !draftId ||
    !draftIdPattern.test(draftId) ||
    !sessionSecret ||
    !sessionSecretPattern.test(sessionSecret) ||
    extra !== undefined
  ) {
    return null;
  }

  return {
    draftId,
    sessionTokenHash: hashPlanHomeDraftSessionSecret(sessionSecret),
  };
}
