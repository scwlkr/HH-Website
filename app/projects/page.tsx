import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { CtaBand } from "@/components/marketing/cta-band";
import { ProjectCard } from "@/components/projects/project-card";
import { DividerFrame } from "@/components/ui/divider-frame";
import { createPageMetadata } from "@/lib/metadata";
import { getPublicProjects } from "@/lib/db/operations";

export const metadata: Metadata = createPageMetadata({
  title: "Completed Homes",
  description:
    "Review completed Howeth & Harp homes with live for-sale and sold status.",
  path: "/projects",
  eyebrow: "Completed Homes",
});

export default async function ProjectsPage() {
  const projects = await getPublicProjects();
  const featuredCount = projects.filter((project) => project.featured).length;
  const availableCount = projects.filter((project) => project.status === "for-sale").length;

  return (
    <>
      <PageIntro
        eyebrow="Completed Homes"
        title="A live project archive that can also surface active inventory."
        description="The projects page is driven from the operations portal so new homes, sale status, and featured ordering update without code changes."
        actions={
          <>
            <ActionLink
              href="/inquire"
              label="Start a Project"
              trackingLocation="projects-intro"
            />
            <ActionLink
              href="/pricing"
              label="Review Finish Levels"
              variant="secondary"
              trackingLocation="projects-intro"
            />
          </>
        }
        detail={
          <div className="space-y-5">
            <DividerFrame label="At A Glance" detail="Live data" />
            <ul className="space-y-3 text-sm leading-7 text-muted">
              <li>{projects.length} completed homes are currently published.</li>
              <li>{availableCount} homes are marked For Sale.</li>
              <li>{featuredCount} homes are pinned as featured entries.</li>
            </ul>
          </div>
        }
      />

      <Section
        eyebrow="Portfolio + Inventory"
        title="Completed homes stay visible whether they are available or sold."
        description="Status badges keep the listing legible while still treating the page as a portfolio of finished work."
      >
        {projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--hh-radius-panel)] border border-line-strong bg-surface px-6 py-12 text-center text-sm text-muted">
            No completed homes are published yet. Add the first project from the operations portal.
          </div>
        )}
      </Section>

      <Section>
        <CtaBand
          eyebrow="Inquiry Route"
          title="Finished work can inform direction, but inquiry still starts the real conversation."
          description="If a project resembles what you have in mind, use the inquiry flow so HH can line up category, finish level, site conditions, and timing around actual scope."
          primaryAction={{
            href: "/inquire",
            label: "Start a Project",
            trackingLocation: "projects-band",
          }}
          secondaryAction={{
            href: "/catalog",
            label: "Browse Build Types",
            variant: "secondary",
            trackingLocation: "projects-band",
          }}
          notes={[
            "The completed homes list is updated through the internal operations portal.",
            "Status stays visible so the page can act as both archive and active inventory.",
            "Build type and finish level tags connect each project back into the wider site structure.",
          ]}
        />
      </Section>
    </>
  );
}
