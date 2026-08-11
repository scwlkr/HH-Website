import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { DividerFrame } from "@/components/ui/divider-frame";
import { createPageMetadata } from "@/lib/metadata";
import { getGenericInquiryHrefFromProjectStart } from "@/lib/project-start";

export const metadata: Metadata = createPageMetadata({
  title: "Start A Project",
  description:
    "Choose the right Howeth and Harp project intake for a new detached single-family home or other work.",
  path: "/start",
  eyebrow: "Project Start",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const projectPaths = [
  {
    index: "01",
    eyebrow: "New detached single-family home",
    title: "Walk through Plan Your Home.",
    description:
      "Use the illustrated 35-question tour for a new home. It captures household needs, rooms, site, finish direction, budget context, timing, and inspiration.",
    href: "/plan-your-home",
    label: "Plan Your Home",
  },
  {
    index: "02",
    eyebrow: "Every other kind of work",
    title: "Use the general project brief.",
    description:
      "Use the shorter inquiry for remodels, additions, multifamily, townhomes, commercial work, land-only work, or anything that does not fit the new-home tour.",
    href: "/inquire",
    label: "Start Another Project Type",
  },
] as const;

export default async function ProjectStartPage({
  searchParams,
}: Readonly<{ searchParams: SearchParams }>) {
  const resolvedSearchParams = await searchParams;
  const genericInquiryHref =
    getGenericInquiryHrefFromProjectStart(resolvedSearchParams);

  return (
    <>
      <PageIntro
        eyebrow="Project Start"
        title="Choose the brief that fits the work."
        lede="New detached homes have a room-by-room planning tour. Every other project keeps a shorter general inquiry."
        description="Choose one path below. Both begin a conversation with h and h; neither creates a design, price, feasibility decision, or contract."
        detail={
          <div className="space-y-5">
            <DividerFrame label="Intake Register" detail="Two project paths" />
            <p className="text-sm leading-7 text-muted">
              Not sure which path fits? Use the general project brief and h and h
              can help sort out the project type during follow-up.
            </p>
          </div>
        }
      />

      <Section
        eyebrow="Select A Path"
        title="What are you planning?"
        description="The distinction is the project itself, not how much detail you already know."
      >
        <div className="border-t border-line-strong">
          {projectPaths.map((path) => {
            const href =
              path.href === "/inquire" ? genericInquiryHref : path.href;
            return (
              <article
                key={path.index}
                className="grid gap-5 border-b border-line py-8 md:grid-cols-[4rem_minmax(15rem,0.72fr)_minmax(0,1fr)] md:gap-8 md:py-10"
              >
                <p className="font-mono text-[0.68rem] tracking-[0.2em] text-accent">
                  {path.index}
                </p>
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-strong">
                    {path.eyebrow}
                  </p>
                  <h2 className="mt-3 text-2xl leading-tight sm:text-3xl">
                    {path.title}
                  </h2>
                </div>
                <div className="flex flex-col items-start justify-between gap-6">
                  <p className="max-w-2xl text-sm leading-7 text-muted">
                    {path.description}
                  </p>
                  <ActionLink
                    href={href}
                    label={path.label}
                    variant={path.index === "01" ? "primary" : "secondary"}
                    trackingLocation="project-start-register"
                    trackingContext={path.eyebrow}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </Section>
    </>
  );
}
