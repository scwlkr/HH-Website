import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { isWorkOSAuthConfigured, normalizeAdminNextPath, usesWorkOSAuth } from "@/lib/admin/auth-config";
import { scopeAuthCookiesInStore } from "@/lib/admin/auth-cookies";

export async function GET(request: NextRequest) {
  if (!usesWorkOSAuth() || !isWorkOSAuthConfigured()) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url));
  }
  const url = await getSignInUrl({
    organizationId: process.env.WORKOS_ORGANIZATION_ID,
    returnTo: normalizeAdminNextPath(request.nextUrl.searchParams.get("next")),
  });
  await scopeAuthCookiesInStore();
  return NextResponse.redirect(url);
}
