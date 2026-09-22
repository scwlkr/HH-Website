import { isWorkOSAuthConfigured, usesWorkOSAuth, normalizeAdminNextPath } from "@/lib/admin/auth-config";
import { adminLoginFailureMessage } from "@/lib/admin/login-policy";
import { logoutAdminAction } from "@/app/admin/actions";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminNotice } from "@/components/admin/admin-notice";
import { formatAdminPageTitle } from "@/lib/admin/branding";
import { isFirebaseAuthConfigured } from "@/lib/firebase/auth";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: formatAdminPageTitle("Login"),
  description: "Authorized staff access.",
  path: "/admin/login",
  noIndex: true,
});

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string;
    signed_out?: string;
    error?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { next, signed_out: signedOut, error } = await searchParams;
  const workos = usesWorkOSAuth();
  const configured = workos ? isWorkOSAuthConfigured() : isFirebaseAuthConfigured();

  return (
    <div className="hhq-login">
      <div>
        <div className="hhq-card hhq-login-card">
          <div className="hhq-wordmark">HHQ<span className="hhq-brand-dot" /></div>
          <h1>Staff Login</h1>
          <p className="mt-3 text-base leading-7 text-muted">
            Welcome back. Your H and H workspace is ready.
          </p>

          <div className="mt-6 space-y-4">
            {!configured ? (
              <AdminNotice tone="error">
                Staff login is temporarily unavailable.
              </AdminNotice>
            ) : null}

            {error ? (
              <AdminNotice tone="error">{adminLoginFailureMessage}</AdminNotice>
            ) : null}

            {signedOut ? (
              <AdminNotice tone="success">You have been signed out.</AdminNotice>
            ) : null}
          </div>

          <div className="mt-6">
            {workos ? (
              <div className="space-y-4">
                {configured ? (
                  <a
                    className={cn(buttonVariants(), "hh-admin-button w-full rounded-[var(--hh-radius-tight)]")}
                    href={`/admin/sign-in?next=${encodeURIComponent(normalizeAdminNextPath(next ?? "/admin"))}`}
                  >
                    Continue to sign in
                  </a>
                ) : null}
                <p className="text-sm text-muted">Use Google or a code sent to your email.</p>
                {error ? (
                  <form action={logoutAdminAction}>
                    <button className="text-sm underline" type="submit">
                      Sign out and try another account
                    </button>
                  </form>
                ) : null}
              </div>
            ) : (
              <AdminLoginForm nextPath={next ?? "/admin"} />
            )}
          </div>
        </div>
        <p className="hhq-login-footer">H and H · Authorized staff only</p>
      </div>
    </div>
  );
}
