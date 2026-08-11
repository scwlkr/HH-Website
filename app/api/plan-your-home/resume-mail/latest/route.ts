import { NextResponse } from "next/server";

import { takeLatestFakePlanHomeResumeMessage } from "@/lib/plan-your-home/resume-mail";

export const dynamic = "force-dynamic";

export function GET() {
  const message = takeLatestFakePlanHomeResumeMessage();
  return NextResponse.json(
    message ? { message } : { message: null },
    {
      status: message ? 200 : 404,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
