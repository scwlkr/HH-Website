import "server-only";

import { cookies } from "next/headers";

import { PLAN_HOME_DRAFT_RETENTION_MS } from "@/features/plan-your-home/server-draft-repository";
import {
  derivePlanHomeDraftSessionSecret,
  hashPlanHomeDraftSessionSecret,
  parsePlanHomeDraftSession,
  planHomeDraftSessionCookieName,
  readPlanHomeDraftSessionSigningSecret,
  serializePlanHomeDraftSession,
} from "@/lib/plan-your-home/draft-session-token";

function draftSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/plan-your-home",
    maxAge: Math.floor(PLAN_HOME_DRAFT_RETENTION_MS / 1000),
  };
}

export function issuePlanHomeDraftSession(idempotencyKey: string) {
  const sessionSecret = derivePlanHomeDraftSessionSecret(
    idempotencyKey,
    readPlanHomeDraftSessionSigningSecret(),
  );

  return {
    sessionSecret,
    sessionTokenHash: hashPlanHomeDraftSessionSecret(sessionSecret),
  };
}

export async function setPlanHomeDraftSessionCookie(params: {
  draftId: string;
  sessionSecret: string;
}) {
  const cookieStore = await cookies();
  cookieStore.set(
    planHomeDraftSessionCookieName,
    serializePlanHomeDraftSession(params),
    draftSessionCookieOptions(),
  );
}

export async function getPlanHomeDraftSession() {
  const cookieStore = await cookies();
  return parsePlanHomeDraftSession(
    cookieStore.get(planHomeDraftSessionCookieName)?.value,
  );
}
