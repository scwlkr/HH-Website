import { authkit, handleAuthkitHeaders } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession as updateFirebaseSession } from "../firebase/proxy";
import { isWorkOSAuthConfigured, usesWorkOSAuth } from "./auth-config";
import { scopeAuthCookiesOnResponse } from "./auth-cookies";

export async function updateSession(request: NextRequest) {
  if (!usesWorkOSAuth()) return updateFirebaseSession(request);
  const pathname = request.nextUrl.pathname;
  if (!/^\/admin(?:\/|$)/.test(pathname)) return NextResponse.next({ request });
  const publicRoute = ["/admin/login", "/admin/sign-in", "/admin/callback"].includes(pathname);
  if (!isWorkOSAuthConfigured()) {
    return publicRoute
      ? NextResponse.next({ request })
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const { session, headers } = await authkit(request);
  const response = handleAuthkitHeaders(
    request,
    headers,
    !session.user && !publicRoute
      ? { redirect: `/admin/login?next=${encodeURIComponent(pathname + request.nextUrl.search)}` }
      : undefined,
  );
  return scopeAuthCookiesOnResponse(response);
}
