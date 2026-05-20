import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { ContentImageGrid } from "@/components/marketing/content-image-grid";
import { FinishCard } from "@/components/marketing/finish-card";
import { CardShell } from "@/components/ui/card-shell";
import {
  finishLevelSlugs,
  getFinishLevelBySlug,
  getFinishLevelHref,
  getFinishLevelInquiryHref,
  getOtherFinishLevels,
} from "@/lib/content";
import { getPublicPricingSettings } from "@/lib/db/operations";
import { createPageMetadata } from "@/lib/metadata";
import {
  formatDirectionalPrice,
  getDirectionalPriceForFinish,
} from "@/lib/operations/format";

type FinishDetailPageProps = {
  params: Promise<{
    finishSlug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return finishLevelSlugs.map((finishSlug) => ({
    finishSlug,
  }));
}

export async function generateMetadata({
  params,
}: FinishDetailPageProps): Promise<Metadata> {
  const { finishSlug } = await params;
  const finish = getFinishLevelBySlug(finishSlug);

  if (!finish) {
    return {};
  }

  return {
    ...createPageMetadata({
      title: `${finish.title} Finish Level`,
      description: finish.detailSummary,
      path: getFinishLevelHref(finish.slug),
      eyebrow: "Finish Detail",
      detail: finish.tagline,
    }),
  };
}

export default async function FinishDetailPage({
  params,
}: FinishDetailPageProps) {
  const { finishSlug } = await params;
  const finish = getFinishLevelBySlug(finishSlug);

  if (!finish) {
    notFound();
  }

  const otherFinishLevels = getOtherFinishLevels(finish.slug);
  const pricingSettings = await getPublicPricingSettings();
  const directionalPriceLabel = formatDirectionalPrice(
    getDirectionalPriceForFinish(pricingSettings, finish.slug),
  );

  return (
    <>
      <PageIntro
        eyebrow="Finish Detail"
        title={finish.title}
        description={finish.detailSummary}
        actions={
          <>
            <ActionLink
              href={getFinishLevelInquiryHref(finish.slug)}
              label="Start With This Finish"
              variant="ghost"
              trackingLocation="finish-detail-intro"
            />
            <ActionLink
              href="/pricing"
              label="Back To Pricing"
              variant="secondary"
              trackingLocation="finish-detail-intro"
            />
          </>
        }
        detail={
          <div className="space-y-4">
            <div className="rounded-[var(--hh-radius-tight)] border border-line-strong bg-surface-raised px-4 py-4">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
                Directional Benchmark
              </p>
              <p className="mt-2 text-base">{directionalPriceLabel}</p>
              {pricingSettings.pricingNote ? (
                <p className="mt-3 text-sm leading-7 text-muted">
                  {pricingSettings.pricingNote}
                </p>
              ) : null}
            </div>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
              Positioning
            </p>
            <ul className="space-y-3 text-sm leading-7 text-muted">
              {finish.comparisonPoints.map((point) => (
                <li
                  key={point.label}
                  className="border-b border-line pb-3 last:border-b-0 last:pb-0"
                >
                  <span className="block font-medium text-foreground">
                    {point.label}
                  </span>
                  <span>{point.value}</span>
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section
        eyebrow="Gallery"
        title="A visual read on the character of this finish level."
        description="Imagery supports a directional read on material posture and finish character."
      >
        <ContentImageGrid images={finish.gallery} />
      </Section>

      <Section
        eyebrow="Included Characteristics"
        title="What typically defines this level in practice."
        description="These are directional characteristics intended to clarify fit. They are not contract language."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <CardShell>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Typical Characteristics
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
              {finish.includedCharacteristics.map((item) => (
                <li
                  key={item}
                  className="border-b border-line pb-3 last:border-b-0 last:pb-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </CardShell>

          <CardShell tone="muted">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Best Fit
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
              {finish.bestFit.map((item) => (
                <li
                  key={item}
                  className="border-b border-line pb-3 last:border-b-0 last:pb-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </CardShell>
        </div>
      </Section>

      <Section
        eyebrow="Other Finish Levels"
        title="Cross-check the neighboring finish paths before committing to inquiry."
        description="The finish levels are designed to help users orient themselves, not trap them in the first option they open."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {otherFinishLevels.map((item) => (
            <FinishCard
              key={item.slug}
              finish={item}
              variant="preview"
              directionalPriceLabel={formatDirectionalPrice(
                getDirectionalPriceForFinish(pricingSettings, item.slug),
              )}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
