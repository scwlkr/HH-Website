import "server-only";

import { getWorkOS, withAuth } from "@workos-inc/authkit-nextjs";
import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminUser as getFirebaseAdminUser } from "../firebase/auth";
import { getAdminSessionCookieOptions } from "../firebase/admin-session-policy";
import {
  isWorkOSAuthConfigured,
  usesWorkOSAuth,
  workosSessionCookieName,
} from "./auth-config";
import { hasCurrentHHQAccess } from "./workos-access";

export async function getAuthenticatedAdminUser() {
  if (!usesWorkOSAuth()) return getFirebaseAdminUser();
  if (!isWorkOSAuthConfigured()) return null;
  try {
    const identity = await withAuth();
    if (
      await hasCurrentHHQAccess(
        identity,
        process.env.WORKOS_ORGANIZATION_ID,
        getWorkOS().userManagement,
      )
    ) {
      return { uid: identity.user!.id, email: identity.user!.email };
    }
  } catch {
    // Authentication or provider outages must never expose HHQ data.
  }
  return null;
}

export async function requireAdminUser() {
  const user = await getAuthenticatedAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function logoutWorkOSAdmin() {
  let sessionId: string | undefined;
  try {
    sessionId = (await withAuth()).sessionId;
  } catch {
    // Clear local access even when the provider is unavailable.
  }
  const store = await cookies();
  for (const cookie of store.getAll()) {
    if (
      cookie.name === workosSessionCookieName ||
      cookie.name.startsWith("wos-auth-verifier")
    ) {
      store.set(cookie.name, "", {
        ...getAdminSessionCookieOptions(process.env.NODE_ENV === "production"),
        maxAge: 0,
      });
    }
  }
  const returnTo = new URL(
    "/admin/login?signed_out=1",
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
  ).toString();
  redirect(
    (sessionId
      ? getWorkOS().userManagement.getLogoutUrl({ sessionId, returnTo })
      : returnTo) as Route,
  );
}
