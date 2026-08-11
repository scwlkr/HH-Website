import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function isAuthorizedPlanHomeCleanupRequest(
  authorizationHeader: string | null,
  configuredSecret: string | undefined,
) {
  const secret = configuredSecret?.trim();
  if (!secret || secret.length < 32 || !authorizationHeader) return false;
  const match = /^Bearer ([^\s]+)$/.exec(authorizationHeader);
  if (!match) return false;
  return timingSafeEqual(digest(match[1]), digest(secret));
}
