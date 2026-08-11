import { NextResponse } from "next/server";

import { consumePlanHomeResumeToken } from "@/lib/db/plan-home-draft-resume";
import {
  planHomeDraftSessionCookieName,
  serializePlanHomeDraftSession,
} from "@/lib/plan-your-home/draft-session-token";
import { planHomeDraftSessionCookieOptions } from "@/lib/plan-your-home/draft-session";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);

  try {
    const origin = request.headers.get("origin");
    const configuredOrigin = process.env.PLAN_HOME_PUBLIC_ORIGIN?.trim();
    const expectedOrigin = configuredOrigin
      ? new URL(configuredOrigin).origin
      : requestUrl.origin;
    if (origin && origin !== expectedOrigin) throw new Error("Invalid origin");
    const body: unknown = await request.json();
    const token =
      body && typeof body === "object" && "token" in body
        ? body.token
        : null;
    const consumed = await consumePlanHomeResumeToken(
      token,
    );
    const response = NextResponse.json(
      { status: "restored" },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(
      planHomeDraftSessionCookieName,
      serializePlanHomeDraftSession(consumed),
      planHomeDraftSessionCookieOptions(),
    );
    return response;
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
