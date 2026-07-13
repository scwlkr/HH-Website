import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { FinishCard } from "@/components/marketing/finish-card";
import { FinishComparison } from "@/components/pricing/finish-comparison";
import { DividerFrame } from "@/components/ui/divider-frame";
import { finishLevels, marketingPageContent } from "@/lib/content";
import { getPublicPricingSettings } from "@/lib/db/operations";
import { createPageMetadata } from "@/lib/metadata";
import {
  formatDirectionalPrice,
  getDirectionalPriceForFinish,
} from "@/lib/operations/format";

export const metadata: Metadata = createPageMetadata({
  title: "Finish Levels",
  description:
    "Review Howeth and Harp finish levels and compare Builder Grade, Builder+, and Custom before starting a project inquiry.",
  path: "/pricing",
  eyebrow: "Finish Levels",
});

export default async function PricingPage() {
  const pricingSettings = await getPublicPricingSettings();
  const pricingLabels = Object.fromEntries(
    finishLevels.map((finish) => [
      finish.slug,
      formatDirectionalPrice(
        getDirectionalPriceForFinish(pricingSettings, finish.slug),
      ),
    ]),
  ) as Partial<Record<(typeof finishLevels)[number]["slug"], string>>;

  return (
    <>
      <PageIntro
        eyebrow={marketingPageContent.pricing.eyebrow}
        title={marketingPageContent.pricing.title}
        lede={marketingPageContent.pricing.lede}
        description={marketingPageContent.pricing.description}
        detail={
          <div className="space-y-5">
            <DividerFrame label="Important" detail="Scope matters" />
            <p className="text-sm leading-7 text-muted">
              {marketingPageContent.pricing.detail}
            </p>
            <div className="space-y-2 border-t border-line pt-5 text-sm text-muted">
              {finishLevels.map((finish) => (
                <div
                  key={finish.slug}
                  className="flex items-center justify-between gap-4"
                >
                  <span>{finish.shortTitle}</span>
                  <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted-strong">
                    {pricingLabels[finish.slug]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        }
      />

      <Section
        eyebrow="Finish Overview"
        title="Finish levels explain posture, not packages."
        description="Use these levels to understand the likely degree of material coordination, flexibility, and customization before a project conversation gets too specific."
      >
        <div className="grid border-b border-line lg:grid-cols-3">
          {finishLevels.map((finish) => (
            <FinishCard
              key={finish.slug}
              finish={finish}
              directionalPriceLabel={pricingLabels[finish.slug] ?? null}
              className="lg:border-l lg:px-8 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
            />
          ))}
        </div>
      </Section>

      <Section
        eyebrow={marketingPageContent.pricing.comparison.eyebrow}
        title={marketingPageContent.pricing.comparison.title}
        description={marketingPageContent.pricing.comparison.description}
      >
        <FinishComparison
          finishLevels={finishLevels}
          pricingLabels={pricingLabels}
        />
        {pricingSettings.pricingNote ? (
          <div className="mt-8 grid gap-4 border-y border-line py-5 sm:grid-cols-[12rem_1fr] sm:gap-8">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Pricing Note
            </p>
            <p className="text-sm leading-7 text-muted">
              {pricingSettings.pricingNote}
            </p>
          </div>
        ) : null}
      </Section>
    </>
  );
}
