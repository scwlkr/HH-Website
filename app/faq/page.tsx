import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { Accordion } from "@/components/ui/accordion";
import {
  faqGroups,
  getFaqItemsByGroup,
  marketingPageContent,
} from "@/lib/content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Read grouped answers about process, finish levels, project types, timeline expectations, and next steps.",
  path: "/faq",
  eyebrow: "FAQ",
});

export default function FaqPage() {
  return (
    <>
      <PageIntro
        eyebrow={marketingPageContent.faq.eyebrow}
        title={marketingPageContent.faq.title}
        lede={marketingPageContent.faq.lede}
        description={marketingPageContent.faq.description}
        detail={
          <p className="max-w-xs text-sm leading-7 text-muted">
            {marketingPageContent.faq.detail}
          </p>
        }
      />

      <Section
        eyebrow="Grouped Questions"
        title="Questions clients ask before getting started."
        description="Browse answers about process, finish levels, project types, timing, and next steps."
      >
        <div className="border-t border-line-strong">
          {faqGroups.map((group, groupIndex) => {
            const items = getFaqItemsByGroup(group.slug).map((item, index) => ({
              id: item.id,
              title: item.question,
              content: item.answer,
              defaultOpen: groupIndex === 0 && index === 0,
            }));

            return (
              <article
                key={group.slug}
                className="grid gap-7 border-b border-line py-7 lg:grid-cols-[minmax(14rem,0.48fr)_minmax(0,1.52fr)] lg:gap-12 lg:py-9"
              >
                <div>
                  <p className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-accent">
                    {group.title}
                  </p>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-muted">
                    {group.description}
                  </p>
                </div>
                <Accordion items={items} />
              </article>
            );
          })}
        </div>
      </Section>
    </>
  );
}
