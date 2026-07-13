import type { Metadata } from "next";
import type { Route } from "next";
import { Container } from "@/components/layout/container";
import { DraftingHero } from "@/components/marketing/drafting-hero";
import { Accordion } from "@/components/ui/accordion";
import { DividerFrame } from "@/components/ui/divider-frame";
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
        headline="Design. Build. Develop."
        subhead="Howeth and Harp delivers architectural design, building, and land development with a disciplined eye for scope, site, and finish."
        capabilities={heroCapabilities}
        primaryCta={{ href: "/projects" as Route, label: "View Projects" }}
      />

      <section className="border-b border-line py-16 sm:py-20 lg:py-24">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-[minmax(18rem,0.62fr)_minmax(0,1.38fr)] lg:gap-16 xl:gap-20">
            <div>
              <DividerFrame label="Capabilities" detail="Scope Register" />
              <h2 className="mt-7 max-w-xl text-3xl leading-tight sm:text-4xl">
                What {siteConfig.name} Does
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted">
                The work is organized around three connected disciplines. Each one stays
                direct, practical, and tied to the decisions that shape scope.
              </p>
            </div>

            <div className="border-t border-line-strong">
              {marketingPageContent.home.capabilities.map((capability, index) => (
                <article
                  key={capability.title}
                  className="grid gap-4 border-b border-line py-6 sm:grid-cols-[3.5rem_minmax(12rem,0.65fr)_minmax(0,1fr)] sm:gap-6 sm:py-8"
                >
                  <span className="font-mono text-[0.68rem] tracking-[0.2em] text-accent">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <h3 className="text-xl leading-tight sm:text-2xl">
                    {capability.title}
                  </h3>
                  <p className="text-sm leading-7 text-muted">
                    {capability.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white/35 py-16 sm:py-20 lg:py-24">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-[minmax(17rem,0.58fr)_minmax(0,1.42fr)] lg:gap-16 xl:gap-24">
            <div>
              <DividerFrame
                label="FAQ"
                detail={`${faqPreview.length.toString().padStart(2, "0")} Questions`}
              />
              <h2 className="mt-7 max-w-xl text-3xl leading-tight sm:text-4xl">
                A few practical questions, answered directly.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted">
                The full FAQ stays available from the header. The front page keeps only
                the questions most likely to clarify fit.
              </p>
            </div>

            <Accordion items={faqPreview} />
          </div>
        </Container>
      </section>
    </>
  );
}
