import type { Metadata } from "next";
import { AnalyticsEventTrigger } from "@/components/analytics/analytics-event-trigger";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { marketingPageContent } from "@/lib/content";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Thank You",
  description:
    "Confirmation for a submitted Howeth and Harp project inquiry, including next steps and direct contact.",
  path: "/thank-you",
  eyebrow: "Submission Received",
  noIndex: true,
});

export default function ThankYouPage() {
  return (
    <>
      <AnalyticsEventTrigger
        name="inquiry_success"
        payload={{
          destination: "/thank-you",
        }}
      />
      <PageIntro
        eyebrow={marketingPageContent.thankYou.eyebrow}
        title={marketingPageContent.thankYou.title}
        lede={marketingPageContent.thankYou.lede}
        description={marketingPageContent.thankYou.description}
        actions={
          <>
            <ActionLink
              href="/"
              label="Back Home"
              variant="secondary"
              trackingLocation="thank-you-actions"
            />
            <ActionLink
              href="/inquire"
              label="Start Another Project"
              trackingLocation="thank-you-actions"
            />
          </>
        }
      />

      <Section
        eyebrow="Next Steps"
        title="We'll review your brief and follow up."
        description="h and h will review the project details and contact you using the method you selected."
      >
        <div className="grid border-y border-line-strong lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
          <div className="py-7 lg:pr-10">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              What Happens Next
            </p>
            <ol className="mt-5 border-t border-line text-sm leading-7 text-muted">
              {marketingPageContent.thankYou.nextSteps.map((step, index) => (
                <li
                  key={step}
                  className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-line py-4"
                >
                  <span className="font-mono text-[0.68rem] tracking-[0.16em] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-line py-7 lg:border-l lg:border-t-0 lg:pl-10">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Need To Add Something?
            </p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-muted">
              <p>
                If you need to add or correct a detail, email h and h while your project
                brief is being reviewed.
              </p>
              <a href={siteConfig.contact.email.href} className="hh-link block text-base text-foreground">
                {siteConfig.contact.email.label}
              </a>
              <p className="text-xs leading-6 text-muted">
                {siteConfig.contact.note}
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
