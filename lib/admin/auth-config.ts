export const workosSessionCookieName = "wos-session";
export const hhqStaffRole = "hhq-staff";

export function usesWorkOSAuth() {
  const provider = process.env.HHQ_AUTH_PROVIDER;
  return Boolean(provider && provider !== "firebase");
}

export function isWorkOSAuthConfigured() {
  return Boolean(
    process.env.HHQ_AUTH_PROVIDER === "workos" &&
      process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      process.env.WORKOS_ORGANIZATION_ID &&
      (process.env.WORKOS_COOKIE_PASSWORD?.length ?? 0) >= 32 &&
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
  );
}

export function normalizeAdminNextPath(value: string | null | undefined) {
  if (!value || /[\\\r\n]/.test(value)) return "/admin/projects";
  let url: URL;
  try {
    url = new URL(value, "https://hhq.invalid");
  } catch {
    return "/admin/projects";
  }
  if (
    url.origin !== "https://hhq.invalid" ||
    !/^\/admin(?:\/|$)/.test(url.pathname) ||
    ["/admin/login", "/admin/sign-in", "/admin/callback"].includes(url.pathname)
  ) {
    return "/admin/projects";
  }
  return `${url.pathname}${url.search}`;
}
