import Link from "next/link";
import type { Route } from "next";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { DividerFrame } from "@/components/ui/divider-frame";
import { getCtaAnalyticsAttributes } from "@/lib/analytics/events";
import { siteConfig } from "@/lib/site-config";
import { DraftingArmAnimated } from "@/components/marketing/drafting-arm-animated";

type DraftingHeroProps = {
  headline: string;
  subhead: string;
  capabilities: ReadonlyArray<{ title: string; index: string }>;
  primaryCta: { href: Route; label: string };
  secondaryCta?: { href: Route; label: string };
};

export function DraftingHero({
  headline,
  subhead,
  capabilities,
  primaryCta,
  secondaryCta,
}: DraftingHeroProps) {
  return (
    <section className="hh-drafting-hero-section pb-12 pt-2 sm:pb-16">
      <Container size="wide">
        <div className="hh-drafting-board relative overflow-hidden">
          <div className="hh-corner hh-corner--tl" aria-hidden="true" />
          <div className="hh-corner hh-corner--tr" aria-hidden="true" />
          <div className="hh-corner hh-corner--bl" aria-hidden="true" />
          <div className="hh-corner hh-corner--br" aria-hidden="true" />

          <div className="grid lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.62fr)]">
            <div className="flex flex-col justify-between gap-8 px-6 py-8 sm:px-9 sm:py-10 lg:px-10 lg:py-12">
              <DividerFrame
                label={siteConfig.name}
                detail={siteConfig.shortName}
              />

              <div className="flex flex-1 flex-col justify-center gap-7">
                <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-normal sm:text-[2.9rem] lg:text-[3.6rem] lg:leading-[1.04]">
                  {headline}
                </h1>

                <p className="max-w-xl text-[0.95rem] leading-[1.78] text-muted">
                  {subhead}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={primaryCta.href}
                    className={buttonVariants({ variant: "secondary", size: "lg" })}
                    {...getCtaAnalyticsAttributes({
                      label: primaryCta.label,
                      destination: primaryCta.href,
                      location: "home-drafting-hero",
                    })}
                  >
                    {primaryCta.label}
                  </Link>
                  {secondaryCta ? (
                    <Link
                      href={secondaryCta.href}
                      className={buttonVariants({ variant: "secondary", size: "lg" })}
                      {...getCtaAnalyticsAttributes({
                        label: secondaryCta.label,
                        destination: secondaryCta.href,
                        location: "home-drafting-hero",
                      })}
                    >
                      {secondaryCta.label}
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-line pt-5">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted">
                  Sheet&nbsp;01
                </span>
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted">
                  {new Date().getFullYear()}
                </span>
              </div>
            </div>

            <aside
              className="hh-drafting-panel relative flex flex-col overflow-hidden border-t border-line lg:border-l lg:border-t-0"
              aria-label="Core capabilities"
            >
              <DraftingArmAnimated />

              <div className="relative z-10 mt-auto border-t border-line bg-white/60 px-6 py-6 backdrop-blur-[2px] sm:px-7 sm:py-7">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-accent">
                  Primary Scope
                </p>
                <ul className="mt-4 space-y-0">
                  {capabilities.map((cap) => (
                    <li
                      key={cap.index}
                      className="flex items-baseline gap-4 border-b border-line py-3 last:border-b-0 last:pb-0"
                    >
                      <span className="shrink-0 font-mono text-[0.6rem] tracking-[0.2em] text-line-ink">
                        {cap.index}
                      </span>
                      <span className="text-[0.82rem] font-medium leading-snug tracking-normal text-foreground">
                        {cap.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </section>
  );
}


