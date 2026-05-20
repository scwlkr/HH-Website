import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { formatProjectBathrooms } from "@/lib/operations/format";
import { getBuildTypeBySlug, getFinishLevelBySlug } from "@/lib/content";
import type { ProjectSummary } from "@/types/operations";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";

type ProjectCardProps = {
  project: ProjectSummary;
};

function ProjectCoverPlaceholder({ title }: { title: string }) {
  return (
    <div className="relative h-full bg-white" role="img" aria-label={`${title} abstract project image`}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(35,45,63,0.052)_0_1px,transparent_1px_38%),linear-gradient(90deg,rgba(17,17,15,0.032)_1px,transparent_1px),linear-gradient(180deg,rgba(17,17,15,0.026)_1px,transparent_1px)] bg-[length:100%_100%,1.15rem_1.15rem,1.15rem_1.15rem]" />
      <div className="absolute inset-x-7 bottom-7 top-9 border border-line" />
      <div className="absolute bottom-11 left-10 h-px w-1/2 bg-line-strong" />
      <div className="absolute bottom-[3.75rem] left-10 h-px w-1/3 bg-line" />
    </div>
  );
}

export function ProjectCard({ project }: ProjectCardProps) {
  const buildType = getBuildTypeBySlug(project.buildTypeSlug);
  const finishLevel = getFinishLevelBySlug(project.finishLevelSlug);

  return (
    <Link
      href={`/projects/${project.slug}` as Route}
      className="group block h-full rounded-[var(--hh-radius-panel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={`View ${project.title}`}
    >
      <article className="flex h-full flex-col border-t border-line pt-4">
        <div className="relative aspect-[16/11] overflow-hidden rounded-[var(--hh-radius-panel)] border border-line bg-surface-raised">
          {project.coverImage ? (
            <Image
              src={project.coverImage.publicUrl}
              alt={project.coverImage.altText || project.title}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <ProjectCoverPlaceholder title={project.title} />
          )}
          <ProjectStatusBadge
            status={project.status}
            className="absolute left-4 top-4"
          />
        </div>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent">
              {project.location}
            </p>
            <h3 className="mt-3 text-2xl transition-colors group-hover:text-accent sm:text-[1.8rem]">
              {project.title}
            </h3>
          </div>
          {project.featured ? (
            <span className="rounded-[var(--hh-radius-tight)] border border-line-strong bg-white px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted-strong">
              Featured
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm leading-7 text-muted">{project.shortDescription}</p>

        <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-sm text-muted">
          <div>
            <dt className="sr-only">Specs</dt>
            <dd>
              {project.squareFootage.toLocaleString("en-US")} sq ft • {project.bedrooms} bd •{" "}
              {formatProjectBathrooms(project.bathrooms)} ba
            </dd>
          </div>
          <div>
            <dt className="sr-only">Build Type</dt>
            <dd>{buildType?.shortTitle ?? project.buildTypeSlug}</dd>
          </div>
          <div>
            <dt className="sr-only">Finish Level</dt>
            <dd>{finishLevel?.shortTitle ?? project.finishLevelSlug}</dd>
          </div>
        </dl>
      </article>
    </Link>
  );
}
