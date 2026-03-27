import Image from "next/image";
import { ActionLink } from "@/components/marketing/action-link";
import { CardShell } from "@/components/ui/card-shell";
import { formatProjectBathrooms } from "@/lib/operations/format";
import { getBuildTypeBySlug, getFinishLevelBySlug } from "@/lib/content";
import type { ProjectSummary } from "@/types/operations";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";

type ProjectCardProps = {
  project: ProjectSummary;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const buildType = getBuildTypeBySlug(project.buildTypeSlug);
  const finishLevel = getFinishLevelBySlug(project.finishLevelSlug);

  return (
    <CardShell className="flex h-full flex-col">
      <div className="relative aspect-[16/11] overflow-hidden rounded-[calc(var(--hh-radius-panel)-0.2rem)] border border-line bg-surface-raised">
        {project.coverImage ? (
          <Image
            src={project.coverImage.publicUrl}
            alt={project.coverImage.altText || project.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-raised px-6 text-center text-sm text-muted">
            Cover image pending
          </div>
        )}
        <ProjectStatusBadge
          status={project.status}
          className="absolute left-4 top-4"
        />
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-accent">
            Completed Home
          </p>
          <h3 className="mt-3 text-2xl sm:text-[1.8rem]">{project.title}</h3>
        </div>
        {project.featured ? (
          <span className="rounded-[var(--hh-radius-pill)] border border-line-strong bg-white px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
            Featured
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-muted">{project.shortDescription}</p>

      <dl className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-2">
        <div className="border-b border-line pb-3">
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
            Location
          </dt>
          <dd className="mt-1">{project.location}</dd>
        </div>
        <div className="border-b border-line pb-3">
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
            Specs
          </dt>
          <dd className="mt-1">
            {project.squareFootage.toLocaleString("en-US")} sq ft • {project.bedrooms} bd •{" "}
            {formatProjectBathrooms(project.bathrooms)} ba
          </dd>
        </div>
        <div className="border-b border-line pb-3 sm:border-b-0 sm:pb-0">
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
            Build Type
          </dt>
          <dd className="mt-1">{buildType?.shortTitle ?? project.buildTypeSlug}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
            Finish Level
          </dt>
          <dd className="mt-1">{finishLevel?.shortTitle ?? project.finishLevelSlug}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <ActionLink
          href={`/projects/${project.slug}`}
          label="View Project Details"
          variant="secondary"
          trackingLocation="projects-grid"
          trackingContext={project.slug}
        />
      </div>
    </CardShell>
  );
}
