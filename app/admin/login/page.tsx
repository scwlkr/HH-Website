import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Container } from "@/components/layout/container";
import { createPageMetadata } from "@/lib/metadata";
import { isSupabaseAuthConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = createPageMetadata({
  title: "Portal Login",
  description: "Internal access for the Howeth & Harp operations portal.",
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
    <div className="flex min-h-screen items-center py-10">
      <Container size="narrow">
        <div className="rounded-[var(--hh-radius-tight)] border border-line-strong bg-surface px-6 py-8 shadow-[0_20px_48px_rgba(17,17,15,0.08)] sm:px-8">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
            Operations Portal
          </p>
          <h1 className="mt-4 text-4xl">Staff Login</h1>
          <p className="mt-3 text-base leading-7 text-muted">
            Use your named internal account to manage completed homes and pricing.
          </p>

          <div className="mt-6 space-y-4">
            {!isSupabaseAuthConfigured() ? (
              <AdminNotice tone="error">
                Supabase auth is not configured yet. Add `NEXT_PUBLIC_SUPABASE_URL`
                and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before using the portal.
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
