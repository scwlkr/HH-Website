import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminNotice } from "@/components/admin/admin-notice";
import { BrandWordmark } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { adminBrand, formatAdminPageTitle } from "@/lib/admin/branding";
import { createPageMetadata } from "@/lib/metadata";
import { isSupabaseAuthConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = createPageMetadata({
  title: formatAdminPageTitle("Login"),
  description: "Internal access to HHQ, the Howeth and Harp admin workspace.",
  path: "/admin/login",
  noIndex: true,
});

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string;
    signed_out?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { next, signed_out: signedOut } = await searchParams;

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
            Use your named internal account to access HHQ and manage completed homes
            and pricing.
          </p>

          <div className="mt-6 space-y-4">
            {!isSupabaseAuthConfigured() ? (
              <AdminNotice tone="error">
                Supabase auth is not configured yet. Add `NEXT_PUBLIC_SUPABASE_URL`
                and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before using HHQ.
              </AdminNotice>
            ) : null}

            {signedOut ? (
              <AdminNotice tone="success">You have been signed out.</AdminNotice>
            ) : null}
          </div>

          <div className="mt-6">
            <AdminLoginForm nextPath={next ?? "/admin/projects"} />
          </div>
        </div>
      </Container>
    </div>
  );
}
