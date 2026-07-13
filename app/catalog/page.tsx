import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { BuildTypeCard } from "@/components/marketing/build-type-card";
import { CtaBand } from "@/components/marketing/cta-band";
import { DividerFrame } from "@/components/ui/divider-frame";
import { buildTypes, marketingPageContent } from "@/lib/content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Project Catalog",
  description:
    "Review Howeth and Harp project categories across single-family, multifamily, townhomes, and commercial work.",
  path: "/catalog",
  eyebrow: "Project Categories",
});

export default function CatalogPage() {
  return (
    <>
      <PageIntro
        eyebrow={marketingPageContent.catalog.eyebrow}
        title={marketingPageContent.catalog.title}
        description={marketingPageContent.catalog.description}
        actions={
          <>
            <ActionLink
              href="/inquire"
              label="Start a Project"
              trackingLocation="catalog-intro"
            />
            <ActionLink
              href="/pricing"
              label="Review Finish Levels"
              variant="secondary"
              trackingLocation="catalog-intro"
            />
          </>
        }
        detail={
          <div className="space-y-5">
            <DividerFrame label="Read This Page As" detail="Routing" />
            <p className="text-sm leading-7 text-muted">
              {marketingPageContent.catalog.detail}
            </p>
          </div>
        }
      />

      <Section
        eyebrow="Build Types"
        title="Four category pages make the scope legible before inquiry."
        description="Each category stays disciplined: clear summary, project considerations, relevant finish direction, and a direct route into the project brief."
      >
        <div className="border-b border-line-strong">
          {buildTypes.map((buildType, index) => (
            <BuildTypeCard
              key={buildType.slug}
              buildType={buildType}
              index={index}
            />
          ))}
        </div>
      </Section>

      <Section>
        <CtaBand
          eyebrow={marketingPageContent.catalog.cta.eyebrow}
          title={marketingPageContent.catalog.cta.title}
          description={marketingPageContent.catalog.cta.description}
          primaryAction={{
            href: "/inquire",
            label: "Start a Project",
            trackingLocation: "catalog-band",
          }}
          secondaryAction={{
            href: "/pricing",
            label: "Compare Finish Levels",
            variant: "secondary",
            trackingLocation: "catalog-band",
          }}
          notes={[
            `${buildTypes.length} project categories are already modeled with stable slugs and finish-level cross-links.`,
            "Category pages are meant to clarify scope, not replace the inquiry conversation.",
            "Final imagery can be added later without touching the route structure.",
          ]}
        />
      </Section>
    </>
  );
}
