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

export const metadata: Metadata = createPageMetadata({
  title: "Architectural Design, Construction, And Land Development",
  description:
    "Howeth and Harp provides architectural design, construction, and land development grounded in thoughtful planning, site fit, and finish quality.",
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
  { index: "02", title: "Construction" },
  { index: "03", title: "Land Development" },
] as const;

export default function Home() {
  return (
    <>
      <DraftingHero
        headline="Design. Build. Develop."
        subhead={marketingPageContent.home.hero.description}
        capabilities={heroCapabilities}
        primaryCta={{
          href: "/start" as Route,
          label: "Start a Project",
        }}
      />

      <section className="border-b border-line py-16 sm:py-20 lg:py-24">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-[minmax(18rem,0.62fr)_minmax(0,1.38fr)] lg:gap-16 xl:gap-20">
            <div>
              <DividerFrame label="Services" />
              <h2 className="mt-7 max-w-xl text-3xl leading-tight sm:text-4xl">
                What we do
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted">
                Design, construction, and land development—available individually
                or coordinated together.
              </p>
            </div>

            <div className="border-t border-line-strong">
              {marketingPageContent.home.capabilities.map((capability, index) => (
                <article
                  key={capability.title}
                  className="grid gap-4 border-b border-line py-6 sm:grid-cols-[2rem_minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-5 sm:py-8"
                >
                  <span className="font-mono text-[0.68rem] tracking-[0.2em] text-accent">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <h3 className="text-xl leading-tight sm:text-2xl">
                    {capability.title}
                  </h3>
                  <p className="text-base leading-7 text-muted">
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
          <div className="grid gap-10 lg:grid-cols-[minmax(18rem,0.62fr)_minmax(0,1.38fr)] lg:gap-16 xl:gap-20">
            <div>
              <DividerFrame label="FAQ" />
              <h2 className="mt-7 max-w-xl text-3xl leading-tight sm:text-4xl">
                Common questions
              </h2>
            </div>

            <Accordion items={faqPreview} />
          </div>
        </Container>
      </section>
    </>
  );
}
