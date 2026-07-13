import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { ContentImageGrid } from "@/components/marketing/content-image-grid";
import { CtaBand } from "@/components/marketing/cta-band";
import { FinishCard } from "@/components/marketing/finish-card";
import {
  buildTypeSlugs,
  finishLevels,
  getBuildTypeBySlug,
  getBuildTypeHref,
  getBuildTypeInquiryHref,
} from "@/lib/content";
import { createPageMetadata } from "@/lib/metadata";

type BuildTypeDetailPageProps = {
  params: Promise<{
    buildTypeSlug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return buildTypeSlugs.map((buildTypeSlug) => ({
    buildTypeSlug,
  }));
}

export async function generateMetadata({
  params,
}: BuildTypeDetailPageProps): Promise<Metadata> {
  const { buildTypeSlug } = await params;
  const buildType = getBuildTypeBySlug(buildTypeSlug);

  if (!buildType) {
    return {};
  }

  return {
    ...createPageMetadata({
      title: `${buildType.title} Projects`,
      description: buildType.detailSummary,
      path: getBuildTypeHref(buildType.slug),
      eyebrow: "Project Category",
      detail: buildType.tagline,
    }),
  };
}

export default async function BuildTypeDetailPage({
  params,
}: BuildTypeDetailPageProps) {
  const { buildTypeSlug } = await params;
  const buildType = getBuildTypeBySlug(buildTypeSlug);

  if (!buildType) {
    notFound();
  }

  const recommendedFinishSlugs = new Set(buildType.recommendedFinishLevels);
  const recommendedFinishes = finishLevels.filter((finish) =>
    recommendedFinishSlugs.has(finish.slug),
  );

  return (
    <>
      <PageIntro
        eyebrow="Project Category"
        title={buildType.title}
        description={buildType.detailSummary}
        actions={
          <>
            <ActionLink
              href={getBuildTypeInquiryHref(buildType.slug)}
              label="Start With This Category"
              trackingLocation="build-type-detail-intro"
            />
            <ActionLink
              href="/catalog"
              label="Back To Catalog"
              variant="secondary"
              trackingLocation="build-type-detail-intro"
            />
          </>
        }
        detail={
          <div className="space-y-4">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
              Service Mix
            </p>
            <ul className="space-y-3 text-sm leading-7 text-muted">
              {buildType.serviceMix.map((item) => (
                <li
                  key={item}
                  className="border-b border-line pb-3 last:border-b-0 last:pb-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section
        eyebrow="Category Visuals"
        title="How this work takes shape."
        description="Representative views highlight frontage, circulation, shared spaces, and finish character."
      >
        <ContentImageGrid images={buildType.gallery} />
      </Section>

      <Section
        eyebrow="Typical Considerations"
        title="What usually needs to be solved inside this category."
        description="These are the recurring planning and execution considerations that shape the work early."
      >
        <div className="grid border-y border-line-strong lg:grid-cols-2">
          <div className="py-7 lg:pr-10">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Category Considerations
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
              {buildType.typicalConsiderations.map((item) => (
                <li
                  key={item}
                  className="border-b border-line pb-3 last:border-b-0 last:pb-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-line py-7 lg:border-l lg:border-t-0 lg:pl-10">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Finish Direction
            </p>
            <p className="mt-5 text-sm leading-7 text-muted">
              Suggested finish levels reflect where this category commonly lands,
              not a hard rule. Final direction depends on budget, intended use,
              durability needs, market position, and project-specific goals.
            </p>
            <ul className="mt-6 border-t border-line">
              {buildType.recommendedFinishLevels.map((slug) => {
                const finish = finishLevels.find((item) => item.slug === slug);

                if (!finish) {
                  return null;
                }

                return (
                  <li key={slug} className="border-b border-line py-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                    {finish.shortTitle}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Suggested Finish Levels"
        title="Relevant finish paths for this category."
        description="These recommendations help connect project type to specification posture before the inquiry begins."
      >
        <div className="grid border-b border-line lg:grid-cols-3">
          {recommendedFinishes.map((finish) => (
            <FinishCard
              key={finish.slug}
              finish={finish}
              variant="preview"
              className="lg:border-l lg:px-8 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
            />
          ))}
        </div>
      </Section>

      <Section>
        <CtaBand
          eyebrow="Start The Project Brief"
          title={`Planning a ${buildType.title.toLowerCase()} project?`}
          description="Share the site, size, timing, priorities, and finish direction so h and h can evaluate the right path forward."
          primaryAction={{
            href: getBuildTypeInquiryHref(buildType.slug),
            label: "Start With This Category",
            trackingLocation: "build-type-detail-band",
          }}
          secondaryAction={{
            href: "/pricing",
            label: "Review Finish Levels",
            variant: "secondary",
            trackingLocation: "build-type-detail-band",
          }}
          notes={[
            buildType.tagline,
            "Project category shapes planning, finish strategy, and the relevant service mix.",
            "The brief is where h and h can connect the category to site conditions, size, and timing.",
          ]}
        />
      </Section>
    </>
  );
}
