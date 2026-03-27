import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionLink } from "@/components/marketing/action-link";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { CardShell } from "@/components/ui/card-shell";
import { createPageMetadata } from "@/lib/metadata";
import { getBuildTypeBySlug, getFinishLevelBySlug } from "@/lib/content";
import { getPublicProjectBySlug } from "@/lib/db/operations";
import { formatProjectBathrooms } from "@/lib/operations/format";

type ProjectDetailPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { projectSlug } = await params;
  const project = await getPublicProjectBySlug(projectSlug);

  if (!project) {
    return {};
  }

  return createPageMetadata({
    title: project.title,
    description: project.shortDescription,
    path: `/projects/${project.slug}`,
    eyebrow: "Completed Home",
    detail: project.location,
  });
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectSlug } = await params;
  const project = await getPublicProjectBySlug(projectSlug);

  if (!project) {
    notFound();
  }

  const buildType = getBuildTypeBySlug(project.buildTypeSlug);
  const finishLevel = getFinishLevelBySlug(project.finishLevelSlug);

  return (
    <>
      <PageIntro
        eyebrow="Completed Home"
        title={project.title}
        description={project.fullDescription}
        actions={
          <>
            <ActionLink
              href={`/inquire?buildType=${project.buildTypeSlug}&finish=${project.finishLevelSlug}`}
              label="Start A Similar Project"
              trackingLocation="project-detail-intro"
            />
            <ActionLink
              href="/projects"
              label="Back To Projects"
              variant="secondary"
              trackingLocation="project-detail-intro"
            />
          </>
        }
        detail={
          <div className="space-y-5">
            <ProjectStatusBadge status={project.status} />
            <ul className="space-y-3 text-sm leading-7 text-muted">
              <li>{project.location}</li>
              <li>
                {project.squareFootage.toLocaleString("en-US")} sq ft • {project.bedrooms} bd •{" "}
                {formatProjectBathrooms(project.bathrooms)} ba
              </li>
              <li>{buildType?.title ?? project.buildTypeSlug}</li>
              <li>{finishLevel?.title ?? project.finishLevelSlug}</li>
            </ul>
          </div>
        }
      />

      <Section
        eyebrow="Project Gallery"
        title="Project imagery stays tied to the completed home entry."
        description="Cover and gallery images are managed in the operations portal and update here automatically."
      >
        <ProjectGallery images={project.images} title={project.title} />
      </Section>

      <Section
        eyebrow="Project Specs"
        title="Core details stay explicit."
        description="Build type, finish direction, and sale status remain visible alongside the baseline specs."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <CardShell>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Listing Summary
            </p>
            <dl className="mt-5 space-y-4 text-sm leading-7 text-muted">
              <div className="border-b border-line pb-3">
                <dt className="font-medium text-foreground">Location</dt>
                <dd>{project.location}</dd>
              </div>
              <div className="border-b border-line pb-3">
                <dt className="font-medium text-foreground">Square Footage</dt>
                <dd>{project.squareFootage.toLocaleString("en-US")} sq ft</dd>
              </div>
              <div className="border-b border-line pb-3">
                <dt className="font-medium text-foreground">Bedrooms / Bathrooms</dt>
                <dd>
                  {project.bedrooms} bd • {formatProjectBathrooms(project.bathrooms)} ba
                </dd>
              </div>
              <div className="border-b border-line pb-3">
                <dt className="font-medium text-foreground">Build Type</dt>
                <dd>{buildType?.title ?? project.buildTypeSlug}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Finish Level</dt>
                <dd>{finishLevel?.title ?? project.finishLevelSlug}</dd>
              </div>
            </dl>
          </CardShell>

          <CardShell tone="muted">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Public Listing Status
            </p>
            <div className="mt-5">
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="mt-5 text-sm leading-7 text-muted">
              The completed homes archive intentionally keeps both sold and available
              work visible so the page can function as a finished-work portfolio and
              a live inventory surface at the same time.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink
                href="/projects"
                label="Back To Projects"
                variant="secondary"
                trackingLocation="project-detail-band"
              />
              <ActionLink
                href="/inquire"
                label="Start A Project"
                trackingLocation="project-detail-band"
              />
            </div>
          </CardShell>
        </div>
      </Section>
    </>
  );
}
