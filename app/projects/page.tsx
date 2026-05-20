import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ProjectCard } from "@/components/projects/project-card";
import { DividerFrame } from "@/components/ui/divider-frame";
import { createPageMetadata } from "@/lib/metadata";
import { getPublicProjects } from "@/lib/db/operations";

export const metadata: Metadata = createPageMetadata({
  title: "Completed Homes",
  description:
    "Review completed Howeth and Harp homes with live for-sale and sold status.",
  path: "/projects",
  eyebrow: "Completed Homes",
});

function ProjectArchivePreview() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="relative aspect-[16/11] overflow-hidden rounded-[var(--hh-radius-panel)] border border-line bg-white"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(35,45,63,0.055)_0_1px,transparent_1px_38%),linear-gradient(90deg,rgba(17,17,15,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(17,17,15,0.028)_1px,transparent_1px)] bg-[length:100%_100%,1.25rem_1.25rem,1.25rem_1.25rem]" />
            <div className="absolute inset-x-6 bottom-6 top-10 border border-line" />
            <div className="absolute bottom-10 left-10 h-px w-1/2 bg-line-strong" />
            <div className="absolute bottom-14 left-10 h-px w-1/3 bg-line" />
          </div>
        ))}
      </div>
      <p className="max-w-2xl text-sm leading-7 text-muted">
        Published project photography and completed-work records will appear
        here once approved.
      </p>
    </div>
  );
}

export default async function ProjectsPage() {
  const projects = await getPublicProjects();

  return (
    <>
      <PageIntro
        eyebrow="Completed Homes"
        title="Completed work, held as a quiet archive."
        description="Projects are the primary proof surface for Howeth and Harp. The page stays image-led, minimal, and tied to published records."
        detail={
          <div className="space-y-5">
            <DividerFrame label="Archive" detail="Managed records" />
            <ul className="space-y-3 text-sm leading-7 text-muted">
              <li>Completed-home records are managed internally.</li>
              <li>For-sale and sold status remain visible when present.</li>
              <li>Final photography will strengthen the archive as records mature.</li>
            </ul>
          </div>
        }
      />

      <Section
        eyebrow="Projects"
        title="An archival view of finished work."
        description="Copy stays secondary here. Imagery, status, location, and a few essential facts do the work."
      >
        {projects.length > 0 ? (
          <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <ProjectArchivePreview />
        )}
      </Section>
    </>
  );
}
