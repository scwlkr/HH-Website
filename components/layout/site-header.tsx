import Link from "next/link";
import type { Route } from "next";
import { ActionLink } from "@/components/marketing/action-link";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line-strong bg-white shadow-[0_18px_28px_-30px_rgba(17,17,15,0.5)]">
      <Container
        size="wide"
        className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <Link href="/" className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-[var(--hh-radius-pill)] border border-line-strong bg-white font-mono text-sm uppercase tracking-[0.28em] text-accent shadow-[0_14px_20px_-22px_rgba(17,17,15,0.45)]">
            HH
          </span>
          <div className="space-y-1">
            <p className="text-lg font-semibold tracking-[-0.04em]">
              {siteConfig.name}
            </p>
            <p className="max-w-md font-mono text-[0.72rem] uppercase tracking-[0.22em] text-muted">
              {siteConfig.descriptor}
            </p>
          </div>
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <nav aria-label="Primary" className="flex flex-wrap gap-2">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href as Route}
                className="hh-link rounded-[var(--hh-radius-pill)] border border-transparent px-3 py-2 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-muted hover:border-line-strong hover:bg-background"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ActionLink
            href={siteConfig.primaryCta.href}
            label={siteConfig.primaryCta.label}
            trackingLocation="site-header"
          />
        </div>
      </Container>
    </header>
  );
}
