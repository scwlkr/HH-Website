import { isWorkOSAuthConfigured, usesWorkOSAuth, normalizeAdminNextPath } from "@/lib/admin/auth-config";
import { adminLoginFailureMessage } from "@/lib/admin/login-policy";
import { logoutAdminAction } from "@/app/admin/actions";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminNotice } from "@/components/admin/admin-notice";
import { BrandWordmark } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { adminBrand, formatAdminPageTitle } from "@/lib/admin/branding";
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
    <div className="hh-admin-theme flex min-h-screen items-center py-10 text-foreground">
      <Container size="narrow">
        <div className="hh-admin-panel rounded-[var(--hh-radius-panel)] px-6 py-8 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-[var(--hh-radius-tight)] border border-line-strong bg-background/80 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
              {adminBrand.name}
            </span>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
              {adminBrand.descriptor}
            </p>
          </div>

          <BrandWordmark
            tone="reversed"
            sizes="(max-width: 640px) 10.5rem, 12rem"
            className="mt-6 h-7 w-[10.5rem] sm:h-8 sm:w-[12rem]"
          />

          <h1 className="mt-6 text-4xl">Staff Login</h1>
          <p className="mt-3 text-base leading-7 text-muted">
            Authorized staff only.
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
                    href={`/admin/sign-in?next=${encodeURIComponent(normalizeAdminNextPath(next))}`}
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
              <AdminLoginForm nextPath={next ?? "/admin/projects"} />
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
