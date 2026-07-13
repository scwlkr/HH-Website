import Link from "next/link";
import type { Route } from "next";
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
    <section className="hh-home-hero border-b border-line-strong">
      <Container size="wide">
        <div className="grid lg:grid-cols-[minmax(0,1.28fr)_minmax(22rem,0.72fr)]">
          <div className="flex min-h-[34rem] flex-col py-10 sm:py-14 lg:min-h-[38rem] lg:pr-12 lg:py-16 xl:pr-16">
            <DividerFrame
              label={siteConfig.name}
              detail={siteConfig.shortName}
            />

            <div className="flex flex-1 flex-col justify-center py-12 sm:py-14">
              <h1 className="max-w-[13ch] text-4xl font-semibold leading-[1.03] tracking-[-0.025em] sm:text-[3.25rem] lg:text-[4.6rem] lg:leading-[0.98] xl:text-[5.1rem]">
                {headline}
              </h1>

              <p className="mt-8 max-w-xl text-base leading-[1.78] text-muted sm:text-lg">
                {subhead}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link
                  href={primaryCta.href}
                  className="hh-home-hero-action group"
                  {...getCtaAnalyticsAttributes({
                    label: primaryCta.label,
                    destination: primaryCta.href,
                    location: "home-drafting-hero",
                  })}
                >
                  <span>{primaryCta.label}</span>
                  <span
                    aria-hidden="true"
                    className="text-base transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
                {secondaryCta ? (
                  <Link
                    href={secondaryCta.href}
                    className="hh-home-hero-action group"
                    {...getCtaAnalyticsAttributes({
                      label: secondaryCta.label,
                      destination: secondaryCta.href,
                      location: "home-drafting-hero",
                    })}
                  >
                    <span>{secondaryCta.label}</span>
                    <span
                      aria-hidden="true"
                      className="text-base transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
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

          <div className="hh-home-hero-drawing relative hidden overflow-hidden border-l border-line lg:block">
            <DraftingArmAnimated />
          </div>
        </div>

        <aside
          className="grid border-t border-line-strong lg:grid-cols-[minmax(14rem,0.48fr)_minmax(0,1.52fr)]"
          aria-label="Core capabilities"
        >
          <div className="flex items-center justify-between gap-6 py-5 lg:pr-8">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent">
              Primary Scope
            </p>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted">
              {capabilities.length.toString().padStart(2, "0")} Disciplines
            </span>
          </div>
          <ul className="grid border-t border-line sm:grid-cols-3 lg:border-l lg:border-t-0">
            {capabilities.map((cap) => (
              <li
                key={cap.index}
                className="flex items-baseline gap-4 border-b border-line py-5 last:border-b-0 sm:block sm:border-b-0 sm:border-l sm:px-6 sm:py-6 sm:first:border-l-0 lg:px-7"
              >
                <span className="shrink-0 font-mono text-[0.62rem] tracking-[0.2em] text-accent">
                  {cap.index}
                </span>
                <span className="text-sm font-medium leading-snug text-foreground sm:mt-3 sm:block">
                  {cap.title}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </Container>
    </section>
  );
}
