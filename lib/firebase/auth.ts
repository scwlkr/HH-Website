import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { isAuthorizedAdminClaims } from "@/lib/firebase/admin-access";
import {
  adminSessionCookieName,
  adminSessionDurationSeconds,
  getAdminSessionCookieOptions,
} from "@/lib/firebase/admin-session-policy";

const recentSignInWindowSeconds = 5 * 60;

export class AdminAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthorizationError";
  }
}

export function isFirebaseAuthConfigured() {
  return env.hasFirebasePublicEnv;
}

export async function createAdminSession(idToken: string) {
  const auth = getFirebaseAdminAuth();
  const decodedToken = await auth.verifyIdToken(idToken);
  const currentTimeSeconds = Math.floor(Date.now() / 1000);

  if (
    !decodedToken.auth_time ||
    currentTimeSeconds - decodedToken.auth_time > recentSignInWindowSeconds
  ) {
    throw new AdminAuthorizationError("A recent sign-in is required.");
  }

  if (!isAuthorizedAdminClaims(decodedToken)) {
    throw new AdminAuthorizationError("The authenticated user is not an admin.");
  }

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: adminSessionDurationSeconds * 1000,
  });
  const cookieStore = await cookies();

  cookieStore.set(
    adminSessionCookieName,
    sessionCookie,
    getAdminSessionCookieOptions(process.env.NODE_ENV === "production"),
  );

  return decodedToken;
}

export async function verifyAdminSessionCookie(
  sessionCookie: string | null | undefined,
): Promise<DecodedIdToken | null> {
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await getFirebaseAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );

    return isAuthorizedAdminClaims(decodedToken) ? decodedToken : null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedAdminUser() {
  if (!isFirebaseAuthConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  return verifyAdminSessionCookie(
    cookieStore.get(adminSessionCookieName)?.value,
  );
}

export async function requireAdminUser() {
  const authenticatedUser = await getAuthenticatedAdminUser();

  if (!authenticatedUser) {
    redirect("/admin/login" as Route);
  }

  return authenticatedUser;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, "", {
    ...getAdminSessionCookieOptions(process.env.NODE_ENV === "production"),
    maxAge: 0,
  });
}

export { adminSessionCookieName as firebaseSessionCookieName };
