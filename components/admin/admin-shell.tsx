import Link from "next/link";
import type { Route } from "next";
import { BrandWordmark } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-background">
      <div className="border-b border-line-strong bg-background/92 backdrop-blur-sm">
        <Container
          size="wide"
          className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
              Operations Portal
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <BrandWordmark
                sizes="(max-width: 640px) 10.5rem, 12rem"
                className="h-7 w-[10.5rem] sm:h-8 sm:w-[12rem]"
              />
              <h1 className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-muted-strong">
                Admin
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted">{userEmail}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav className="flex flex-wrap gap-2" aria-label="Admin">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={cn(
                    "rounded-[var(--hh-radius-tight)] border border-line px-3 py-2 font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted transition-colors hover:border-accent hover:text-accent",
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
                className="rounded-[var(--hh-radius-tight)]"
              >
                Sign Out
              </Button>
            </form>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-8 sm:py-10">
        {children}
      </Container>
    </div>
  );
}
