import type { Metadata } from "next";

import { submitInquiryAction } from "@/app/inquire/actions";
import { ProjectStartContent } from "@/app/start/project-start-content";
import { createPageMetadata } from "@/lib/metadata";
import { createGeneralInquiryInitialValues } from "@/lib/validation/inquiry";

export const metadata: Metadata = createPageMetadata({
  title: "Start A Project",
  description:
    "Plan a new single-family home with the guided Howeth and Harp walkthrough, or send a short inquiry about another project.",
  path: "/start",
  eyebrow: "Project Start",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProjectStartPage({
  searchParams,
}: Readonly<{ searchParams: SearchParams }>) {
  const resolvedSearchParams = await searchParams;
  const initialValues = createGeneralInquiryInitialValues({
    buildType: readFirstValue(resolvedSearchParams.buildType),
    utmSource: readFirstValue(resolvedSearchParams.utm_source),
    utmMedium: readFirstValue(resolvedSearchParams.utm_medium),
    utmCampaign: readFirstValue(resolvedSearchParams.utm_campaign),
  });

  return (
    <ProjectStartContent
      initialValues={initialValues}
      submitAction={submitInquiryAction}
    />
  );
}
