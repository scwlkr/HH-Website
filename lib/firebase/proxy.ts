import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  firebaseSessionCookieName,
  verifyAdminSessionCookie,
} from "@/lib/firebase/auth";

function clearInvalidSessionCookie(response: NextResponse) {
  response.cookies.set(firebaseSessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (!isAdminRoute || !env.hasFirebasePublicEnv) {
    return NextResponse.next({ request });
  }

  const sessionCookie = request.cookies.get(firebaseSessionCookieName)?.value;
  const authenticatedUser = await verifyAdminSessionCookie(sessionCookie);

  if (!authenticatedUser && !isLoginRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);

    const response = NextResponse.redirect(loginUrl);
    if (sessionCookie) {
      clearInvalidSessionCookie(response);
    }
    return response;
  }

  if (authenticatedUser && isLoginRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/admin/projects";
    dashboardUrl.searchParams.delete("next");
    return NextResponse.redirect(dashboardUrl);
  }

  const response = NextResponse.next({ request });
  if (sessionCookie && !authenticatedUser) {
    clearInvalidSessionCookie(response);
  }
  return response;
}
