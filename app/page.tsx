import type { Metadata } from "next";
import type { Route } from "next";
import { Section } from "@/components/layout/section";
import { DraftingHero } from "@/components/marketing/drafting-hero";
import { Accordion } from "@/components/ui/accordion";
import {
  getFaqPreviewItems,
  marketingPageContent,
} from "@/lib/content";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Architectural Design, Building, And Land Development",
  description:
    "Howeth and Harp provides architectural design, building, and land development with clear finish and project-type paths into inquiry.",
  path: "/",
  eyebrow: "Howeth and Harp",
});

const faqPreview = getFaqPreviewItems(4).map((item, index) => ({
  id: item.id,
  title: item.question,
  content: item.answer,
  defaultOpen: index === 0,
}));

const heroCapabilities = [
  { index: "01", title: "Architectural Design" },
  { index: "02", title: "Building" },
  { index: "03", title: "Land Development" },
] as const;

export default function Home() {
  return (
    <>
      <DraftingHero
        headline="Advancing design, building, and land development."
        subhead="Howeth and Harp delivers architectural design, building, and land development with a disciplined eye for scope, site, and finish."
        capabilities={heroCapabilities}
        primaryCta={{ href: "/projects" as Route, label: "View Projects" }}
      />

      <Section
        eyebrow="Capabilities"
        title={`What ${siteConfig.name} Does`}
        description="The work is organized around three connected disciplines. Each one stays direct, practical, and tied to the decisions that shape scope."
        className="border-t border-line py-14 sm:py-16"
      >
        <div className="grid border-y border-line lg:grid-cols-3">
          {marketingPageContent.home.capabilities.map((capability) => (
            <article
              key={capability.title}
              className="border-t border-line px-0 py-6 first:border-t-0 lg:border-l lg:border-t-0 lg:border-line lg:px-8 lg:py-8 lg:first:border-l-0"
            >
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent">
                {capability.title}
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">
                {capability.description}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="FAQ"
        title="A few practical questions, answered directly."
        description="The full FAQ stays available from the header. The front page keeps only the questions most likely to clarify fit."
        className="py-14 sm:py-16"
        size="content"
      >
        <Accordion items={faqPreview} />
      </Section>
    </>
  );
}
