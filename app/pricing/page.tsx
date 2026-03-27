import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { CtaBand } from "@/components/marketing/cta-band";
import { FinishCard } from "@/components/marketing/finish-card";
import { FinishComparison } from "@/components/pricing/finish-comparison";
import { CardShell } from "@/components/ui/card-shell";
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
    "Review Howeth & Harp finish levels and compare Builder Grade, Builder+, and Custom before starting a project inquiry.",
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
        description={marketingPageContent.pricing.description}
        actions={
          <>
            <ActionLink
              href="/inquire"
              label="Start a Project"
              trackingLocation="pricing-intro"
            />
            <ActionLink
              href="/catalog"
              label="Browse Build Types"
              variant="secondary"
              trackingLocation="pricing-intro"
            />
          </>
        }
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
        title="Each finish level frames a different posture toward materials, flexibility, and coordination."
        description="The overview cards stay concise on purpose. Use them to choose the right detail page, then move into inquiry once the direction is clear."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {finishLevels.map((finish) => (
            <FinishCard
              key={finish.slug}
              finish={finish}
              directionalPriceLabel={pricingLabels[finish.slug] ?? null}
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
          <CardShell className="mt-6">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Pricing Note
            </p>
            <p className="mt-4 text-sm leading-7 text-muted">
              {pricingSettings.pricingNote}
            </p>
          </CardShell>
        ) : null}
      </Section>

      <Section>
        <CtaBand
          eyebrow={marketingPageContent.pricing.cta.eyebrow}
          title={marketingPageContent.pricing.cta.title}
          description={marketingPageContent.pricing.cta.description}
          primaryAction={{
            href: "/inquire",
            label: "Start a Project",
            trackingLocation: "pricing-band",
          }}
          secondaryAction={{
            href: "/catalog",
            label: "Review Build Types",
            variant: "secondary",
            trackingLocation: "pricing-band",
          }}
          notes={[
            `${finishLevels.length} finish levels are structured to route users deeper before inquiry.`,
            "Exact pricing still depends on scope, systems, site conditions, and customization.",
            "The finish detail pages carry imagery, included characteristics, and best-fit guidance.",
          ]}
        />
      </Section>
    </>
  );
}
