import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { workosSessionCookieName } from "./auth-config";
import { adminSessionDurationSeconds } from "../firebase/admin-session-policy";

function isAuthCookie(name: string) {
  return name === workosSessionCookieName || name.startsWith("wos-auth-verifier");
}

export async function scopeAuthCookiesInStore(includeVerifier = true) {
  const store = await cookies();
  for (const cookie of store.getAll()) {
    if (
      !isAuthCookie(cookie.name) ||
      (!includeVerifier && cookie.name !== workosSessionCookieName)
    ) {
      continue;
    }
    store.set(cookie.name, cookie.value, {
      path: "/admin",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: cookie.value
        ? cookie.name === workosSessionCookieName
          ? adminSessionDurationSeconds
          : 600
        : 0,
    });
  }
}

export function scopeAuthCookiesOnResponse(original: Response) {
  // AuthKit appends headers after constructing the response, so rebuild the
  // cookie collection before changing paths (including on token refresh).
  const response = new NextResponse(original.body, original);
  for (const cookie of response.cookies.getAll()) {
    if (!isAuthCookie(cookie.name)) continue;
    response.cookies.set({
      ...cookie,
      path: "/admin",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // Next can drop Max-Age=0 when merging callback cookies; keep an expiry too.
      ...(!cookie.value ? { value: "", expires: new Date(0) } : {}),
      maxAge: cookie.value
        ? Math.min(cookie.maxAge ?? adminSessionDurationSeconds, adminSessionDurationSeconds)
        : 0,
    });
  }
  return response;
}
