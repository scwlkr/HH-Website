import type { Metadata } from "next";
import { AnalyticsEventTrigger } from "@/components/analytics/analytics-event-trigger";
import { InquiryForm } from "@/components/inquiry/inquiry-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import {
  getFinishLevelLabel,
  getProjectTypeLabel,
} from "@/lib/inquiry/options";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";
import { createInquiryInitialValues } from "@/lib/validation/inquiry";

export const metadata: Metadata = createPageMetadata({
  title: "Start A Project",
  description:
    "Guided Howeth and Harp project brief intake covering contact details, project basics, site context, and priorities.",
  path: "/inquire",
  eyebrow: "Project Brief",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InquirePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const initialValues = createInquiryInitialValues({
    buildType: readFirstValue(resolvedSearchParams.buildType),
    finish: readFirstValue(resolvedSearchParams.finish),
    utmSource: readFirstValue(resolvedSearchParams.utm_source),
    utmMedium: readFirstValue(resolvedSearchParams.utm_medium),
    utmCampaign: readFirstValue(resolvedSearchParams.utm_campaign),
  });

  const detailLines = [
    initialValues.projectType
      ? `Project type preselected: ${getProjectTypeLabel(initialValues.projectType)}`
      : null,
    initialValues.finishLevel
      ? `Finish direction preselected: ${getFinishLevelLabel(initialValues.finishLevel)}`
      : null,
  ].filter((detail): detail is string => Boolean(detail));

  return (
    <>
      <AnalyticsEventTrigger
        name="inquiry_start"
        payload={{
          build_type_prefill: initialValues.projectType || undefined,
          finish_level_prefill: initialValues.finishLevel || undefined,
          utm_source: initialValues.utmSource || undefined,
          utm_medium: initialValues.utmMedium || undefined,
          utm_campaign: initialValues.utmCampaign || undefined,
        }}
      />
      <PageIntro
        eyebrow="Project Brief"
        title="Start a Project"
        lede={`Share enough context to give ${siteConfig.shortName} something real to respond to.`}
        description="Tell us what you are planning, where the project stands, and what matters most. Rough answers are welcome."
        actions={
          <ActionLink
            href="/pricing"
            label="Review Finish Levels"
            variant="secondary"
            trackingLocation="inquiry-intro"
          />
        }
        detail={
          <div className="space-y-4">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Intake Notes
            </p>
            <p className="text-sm leading-7 text-muted">
              Five short steps, one usable project brief. Rough direction is enough;
              the goal is clarity, not perfection.
            </p>
            {detailLines.length > 0 ? (
              <ul className="space-y-3 text-sm leading-7 text-muted">
                {detailLines.map((detail) => (
                  <li key={detail} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                    {detail}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        }
      />

      <Section
        eyebrow="Project Details"
        title="Tell us what you're planning."
        description={`Share the project type, finish direction, location, priorities, and timeline so ${siteConfig.shortName} can prepare for the first conversation.`}
      >
        <InquiryForm initialValues={initialValues} />
      </Section>
    </>
  );
}
