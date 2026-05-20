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
        description={marketingPageContent.faq.description}
        detail={
          <p className="max-w-xs text-sm leading-7 text-muted">
            {marketingPageContent.faq.detail}
          </p>
        }
      />

      <Section
        eyebrow="Grouped Questions"
        title="The page is organized around the questions most likely to block a next step."
        description="Each group stays compact so visitors can scan the relevant section and move on."
      >
        <div className="grid gap-x-10 gap-y-8 xl:grid-cols-2">
          {faqGroups.map((group) => {
            const items = getFaqItemsByGroup(group.slug).map((item, index) => ({
              id: item.id,
              title: item.question,
              content: item.answer,
              defaultOpen: index === 0,
            }));

            return (
              <article key={group.slug} className="border-t border-line pt-5">
                <p className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-accent">
                  {group.title}
                </p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {group.description}
                </p>
                <Accordion items={items} className="mt-6" />
              </article>
            );
          })}
        </div>
      </Section>
    </>
  );
}
