import { NextResponse } from "next/server";

import { getPlanHomeCleanupRepository } from "@/lib/db/plan-home-cleanup";
import { isAuthorizedPlanHomeCleanupRequest } from "@/lib/plan-your-home/cleanup-auth";

export const dynamic = "force-dynamic";

async function runCleanup(request: Request) {
  const configuredSecret = process.env.PLAN_HOME_CLEANUP_SECRET;
  if (
    !isAuthorizedPlanHomeCleanupRequest(
      request.headers.get("authorization"),
      configuredSecret,
    )
  ) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await getPlanHomeCleanupRepository().run();
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error("Plan Your Home scheduled cleanup failed.");
    return NextResponse.json(
      { error: "Cleanup is unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: Request) {
  return runCleanup(request);
}

export async function POST(request: Request) {
  return runCleanup(request);
}
