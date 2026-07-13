import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { ProjectCard } from "@/components/projects/project-card";
import { DividerFrame } from "@/components/ui/divider-frame";
import { createPageMetadata } from "@/lib/metadata";
import { getPublicProjects } from "@/lib/db/operations";

export const metadata: Metadata = createPageMetadata({
  title: "Selected Work",
  description:
    "Explore selected Howeth and Harp work across architecture, building, and land development.",
  path: "/projects",
  eyebrow: "Selected Work",
});

function ProjectInquiryPrompt() {
  return (
    <div className="grid gap-7 border-y border-line-strong py-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)] lg:gap-10">
      <div className="relative aspect-[16/9] overflow-hidden border border-line bg-white" aria-hidden="true">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(35,45,63,0.055)_0_1px,transparent_1px_38%),linear-gradient(90deg,rgba(17,17,15,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(17,17,15,0.028)_1px,transparent_1px)] bg-[length:100%_100%,1.25rem_1.25rem,1.25rem_1.25rem]" />
            <div className="absolute inset-x-6 bottom-6 top-10 border border-line" />
            <div className="absolute bottom-10 left-10 h-px w-1/2 bg-line-strong" />
            <div className="absolute bottom-14 left-10 h-px w-1/3 bg-line" />
      </div>
      <div className="flex flex-col justify-between border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-accent">
          Selected Work
        </p>
        <p className="mt-5 max-w-md text-sm leading-7 text-muted">
          For examples aligned with your project type, scale, and finish goals,
          start with a conversation about the work you are planning.
        </p>
        <div className="mt-6">
          <ActionLink
            href="/inquire"
            label="Discuss Your Project"
            variant="secondary"
          />
        </div>
      </div>
    </div>
  );
}

export default async function ProjectsPage() {
  const projects = await getPublicProjects();

  return (
    <>
      <PageIntro
        eyebrow="Selected Work"
        title="Completed Work"
        lede="Architecture, construction, and development shaped by site, scope, and long-term use."
        description="h and h works across single-family, multifamily, townhome, commercial, and land-development projects."
        detail={
          <div className="space-y-5">
            <DividerFrame label="Project Focus" detail="Built around scope" />
            <ul className="space-y-3 text-sm leading-7 text-muted">
              <li>Residential and commercial work.</li>
              <li>Architectural design, building, and land development.</li>
              <li>Finish direction matched to use, budget, and long-term value.</li>
            </ul>
          </div>
        }
      />

      <Section
        eyebrow="Projects"
        title="Work shaped by real constraints."
        description="Browse completed work by location, scale, project type, finish level, and availability."
      >
        {projects.length > 0 ? (
          <div className="border-b border-line-strong">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                lead={index === 0}
              />
            ))}
          </div>
        ) : (
          <ProjectInquiryPrompt />
        )}
      </Section>
    </>
  );
}
