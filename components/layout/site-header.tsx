import Link from "next/link";
import type { Route } from "next";
import { BrandMark, BrandWordmark } from "@/components/brand/brand-logo";
import { ActionLink } from "@/components/marketing/action-link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils/cn";

function PrimaryNav({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label="Primary"
      className={
        mobile
          ? "flex flex-col gap-2"
          : "flex flex-nowrap items-center gap-2 whitespace-nowrap"
      }
    >
      {siteConfig.nav.map((item) => (
        <Link
          key={item.href}
          href={item.href as Route}
          className={cn(
            "hh-link shrink-0 rounded-[var(--hh-radius-pill)] font-mono uppercase tracking-[0.1em]",
            mobile
              ? "border border-line bg-white px-4 py-3 text-[0.72rem] text-foreground hover:border-accent hover:bg-background"
              : "border border-transparent px-3 py-2 text-[0.72rem] text-muted hover:border-line-strong hover:bg-background",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="hh-drafted-band sticky top-0 z-50 border-b border-line-strong bg-white shadow-[0_18px_28px_-30px_rgba(17,17,15,0.5)]">
      <Container size="wide" className="py-4">
        <div className="hidden items-center justify-between gap-6 xl:flex">
          <Link
            href="/"
            aria-label={siteConfig.name}
            className="flex shrink-0 items-center gap-4"
          >
            <span className="hh-drafted-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--hh-radius-pill)] border border-line-strong bg-white shadow-[0_14px_20px_-22px_rgba(17,17,15,0.45)]">
              <BrandMark decorative priority sizes="32px" className="h-7 w-7" />
            </span>
            <span className="block">
              <BrandWordmark
                decorative
                priority
                sizes="13.5rem"
                className="h-8 w-[13.5rem]"
              />
            </span>
            <span className="sr-only">{siteConfig.name}</span>
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-4">
            <PrimaryNav />
            <ActionLink
              href={siteConfig.primaryCta.href}
              label={siteConfig.primaryCta.label}
              trackingLocation="site-header"
              className="shrink-0"
            />
          </div>
        </div>

        <div className="relative flex items-center justify-between xl:hidden">
          <div className="hh-drafted-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--hh-radius-pill)] border border-line-strong bg-white shadow-[0_14px_20px_-22px_rgba(17,17,15,0.45)]">
            <BrandMark decorative priority sizes="32px" className="h-7 w-7" />
          </div>

          <Link
            href="/"
            aria-label={siteConfig.name}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <BrandWordmark
              decorative
              priority
              sizes="(max-width: 640px) 9.5rem, 10.5rem"
              className="h-7 w-[9.5rem] sm:w-[10.5rem]"
            />
            <span className="sr-only">{siteConfig.name}</span>
          </Link>

          <details className="relative shrink-0">
            <summary
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "w-14 cursor-pointer justify-center px-0 select-none",
              )}
            >
              Menu
            </summary>

            <div className="absolute right-0 top-[calc(100%+0.85rem)] w-[min(22rem,calc(100vw-2.5rem))] rounded-[var(--hh-radius-panel)] border border-line-strong bg-white/97 p-3 shadow-[0_24px_44px_-28px_rgba(17,17,15,0.42)] backdrop-blur-sm">
              <div className="space-y-3">
                <PrimaryNav mobile />
                <ActionLink
                  href={siteConfig.primaryCta.href}
                  label={siteConfig.primaryCta.label}
                  trackingLocation="site-header"
                  className="w-full justify-center"
                />
              </div>
            </div>
          </details>
        </div>
      </Container>
    </header>
  );
}
