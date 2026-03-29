import Link from "next/link";
import type { Route } from "next";
import { BrandWordmark } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { adminBrand } from "@/lib/admin/branding";
import { cn } from "@/lib/utils/cn";

type AdminShellProps = {
  children: React.ReactNode;
  userEmail: string;
  onSignOut: () => Promise<void>;
};

const adminNavItems = [
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/settings/pricing", label: "Pricing" },
] as const;

export function AdminShell({
  children,
  userEmail,
  onSignOut,
}: AdminShellProps) {
  return (
    <div className="hh-admin-theme min-h-screen bg-background text-foreground">
      <Container size="wide" className="py-5 sm:py-6 lg:py-8">
        <div className="hh-admin-panel rounded-[var(--hh-radius-panel)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-[var(--hh-radius-tight)] border border-line-strong bg-background/80 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
                  {adminBrand.name}
                </span>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                  {adminBrand.descriptor}
                </p>
              </div>

              <div>
                <BrandWordmark
                  tone="reversed"
                  sizes="(max-width: 640px) 10.5rem, 12rem"
                  className="h-7 w-[10.5rem] sm:h-8 sm:w-[12rem]"
                />
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                  Internal workspace for completed homes, pricing controls, and live
                  content updates.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:min-w-[22rem]">
              <div className="rounded-[var(--hh-radius-tight)] border border-line-strong bg-background/70 px-4 py-3">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                  Signed in as
                </p>
                <p className="mt-2 break-all text-sm text-muted-strong">{userEmail}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-stretch">
                <nav
                  className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1"
                  aria-label={`${adminBrand.name} navigation`}
                >
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href as Route}
                      className={cn(
                        "hh-admin-nav-link rounded-[var(--hh-radius-tight)] px-3 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.2em]",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <form action={onSignOut}>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="hh-admin-button hh-admin-button-secondary w-full rounded-[var(--hh-radius-tight)]"
                  >
                    Sign Out
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 sm:py-8">{children}</div>
      </Container>
    </div>
  );
}
