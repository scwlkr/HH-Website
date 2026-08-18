export const adminSessionCookieName = "__session";
export const adminSessionDurationSeconds = 60 * 60 * 24 * 5;

export function getAdminSessionCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/admin",
    maxAge: adminSessionDurationSeconds,
  };
}
