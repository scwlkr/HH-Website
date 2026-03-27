import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { CtaBand } from "@/components/marketing/cta-band";
import { Accordion } from "@/components/ui/accordion";
import { CardShell } from "@/components/ui/card-shell";
import {
  faqGroups,
  getFaqItemsByGroup,
  marketingPageContent,
} from "@/lib/content";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

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
        actions={
          <>
            <ActionLink
              href="/inquire"
              label="Start a Project"
              trackingLocation="faq-intro"
            />
            <ActionLink
              href="/pricing"
              label="Review Finish Levels"
              variant="secondary"
              trackingLocation="faq-intro"
            />
          </>
        }
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
        <div className="grid gap-6 xl:grid-cols-2">
          {faqGroups.map((group) => {
            const items = getFaqItemsByGroup(group.slug).map((item, index) => ({
              id: item.id,
              title: item.question,
              content: item.answer,
              defaultOpen: index === 0,
            }));

            return (
              <CardShell key={group.slug} className="h-full">
                <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
                  {group.title}
                </p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {group.description}
                </p>
                <Accordion items={items} className="mt-6" />
              </CardShell>
            );
          })}
        </div>
      </Section>

      <Section>
        <CtaBand
          eyebrow={marketingPageContent.faq.cta.eyebrow}
          title={marketingPageContent.faq.cta.title}
          description={marketingPageContent.faq.cta.description}
          primaryAction={{
            href: "/inquire",
            label: "Start a Project",
            trackingLocation: "faq-band",
          }}
          secondaryAction={{
            href: siteConfig.contact.email.href,
            label: "Email HH",
            variant: "secondary",
            trackingLocation: "faq-band",
          }}
          notes={[
            "FAQ content can reduce hesitation, but it is not a substitute for the project brief.",
            "Process, finish, category, timeline, and next-step questions are grouped to stay scannable.",
            "The final route still needs to move visitors into inquiry once the key questions are settled.",
          ]}
        />
      </Section>
    </>
  );
}
