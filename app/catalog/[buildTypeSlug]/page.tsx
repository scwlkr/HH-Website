import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { ContentImageGrid } from "@/components/marketing/content-image-grid";
import { CtaBand } from "@/components/marketing/cta-band";
import { FinishCard } from "@/components/marketing/finish-card";
import { CardShell } from "@/components/ui/card-shell";
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
        title="Project imagery stays tied to the structure of the category."
        description="The gallery shows the category in terms of frontage, circulation, shared conditions, and finish posture rather than turning it into a blog post."
      >
        <ContentImageGrid images={buildType.gallery} />
      </Section>

      <Section
        eyebrow="Typical Considerations"
        title="What usually needs to be solved inside this category."
        description="These are the recurring planning and execution considerations that shape the work early."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <CardShell>
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
          </CardShell>

          <CardShell tone="muted">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Finish Direction
            </p>
            <p className="mt-5 text-sm leading-7 text-muted">
              Suggested finish levels reflect where this category commonly lands,
              not a hard rule. The inquiry process is where that recommendation
              gets tested against the actual project.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {buildType.recommendedFinishLevels.map((slug) => {
                const finish = finishLevels.find((item) => item.slug === slug);

                if (!finish) {
                  return null;
                }

                return (
                  <span
                    key={slug}
                    className="rounded-full border border-line-strong bg-surface-raised px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted"
                  >
                    {finish.shortTitle}
                  </span>
                );
              })}
            </div>
          </CardShell>
        </div>
      </Section>

      <Section
        eyebrow="Suggested Finish Levels"
        title="Relevant finish paths for this category."
        description="These recommendations help connect project type to specification posture before the inquiry begins."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {recommendedFinishes.map((finish) => (
            <FinishCard key={finish.slug} finish={finish} variant="preview" />
          ))}
        </div>
      </Section>

      <Section>
        <CtaBand
          eyebrow="Start The Project Brief"
          title={`Use ${buildType.title} as the starting project category.`}
          description="The inquiry form can carry this build type into the guided intake so the discussion begins from the right category frame."
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
            "The brief is where HH can connect the category to site conditions, size, and timing.",
          ]}
        />
      </Section>
    </>
  );
}
