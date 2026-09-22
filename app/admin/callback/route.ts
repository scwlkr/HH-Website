import { getTokenClaims, getWorkOS, handleAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { isWorkOSAuthConfigured, usesWorkOSAuth } from "@/lib/admin/auth-config";
import {
  scopeAuthCookiesInStore,
  scopeAuthCookiesOnResponse,
} from "@/lib/admin/auth-cookies";
import { hasCurrentHHQAccess } from "@/lib/admin/workos-access";

export async function GET(request: NextRequest) {
  if (!usesWorkOSAuth() || !isWorkOSAuthConfigured()) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url));
  }
  const response = await handleAuth({
    baseURL: new URL(process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI!).origin,
    returnPathname: "/admin/projects",
    onSuccess: async ({ user, organizationId, impersonator, accessToken }) => {
      const { sid } = await getTokenClaims(accessToken);
      const approved = await hasCurrentHHQAccess(
        {
          user,
          organizationId,
          impersonator,
          sessionId: typeof sid === "string" ? sid : undefined,
        },
        process.env.WORKOS_ORGANIZATION_ID,
        getWorkOS().userManagement,
      );
      if (!approved) throw new Error("HHQ access is not approved.");
    },
    onError: () => NextResponse.redirect(new URL("/admin/login?error=1", request.url)),
  })(request);
  // The callback response deletes the PKCE verifier. Do not reissue the request cookie.
  await scopeAuthCookiesInStore(false);
  return scopeAuthCookiesOnResponse(response);
}
