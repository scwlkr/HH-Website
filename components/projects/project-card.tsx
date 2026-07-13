import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { formatProjectBathrooms } from "@/lib/operations/format";
import { getBuildTypeBySlug, getFinishLevelBySlug } from "@/lib/content";
import type { ProjectSummary } from "@/types/operations";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { cn } from "@/lib/utils/cn";

type ProjectCardProps = {
  project: ProjectSummary;
  index: number;
  lead?: boolean;
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

export function ProjectCard({ project, index, lead = false }: ProjectCardProps) {
  const buildType = getBuildTypeBySlug(project.buildTypeSlug);
  const finishLevel = getFinishLevelBySlug(project.finishLevelSlug);
  const coverImage = project.coverImage?.publicUrl ? project.coverImage : null;

  return (
    <Link
      href={`/projects/${project.slug}` as Route}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={`View ${project.title}`}
    >
      <article
        className={cn(
          "grid gap-6 border-t border-line-strong py-7",
          lead
            ? "lg:grid-cols-[minmax(0,1.48fr)_minmax(20rem,0.52fr)] lg:gap-10 lg:py-9"
            : "md:grid-cols-[minmax(16rem,0.68fr)_minmax(0,1.32fr)] md:gap-8",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden border border-line bg-surface-raised",
            lead ? "aspect-[16/10]" : "aspect-[16/11]",
          )}
        >
          {coverImage ? (
            <Image
              src={coverImage.publicUrl}
              alt={coverImage.altText || project.title}
              fill
              priority={lead}
              sizes={
                lead
                  ? "(min-width: 1024px) 66vw, 100vw"
                  : "(min-width: 768px) 40vw, 100vw"
              }
              className="object-cover transition-transform duration-500 group-hover:scale-[1.015]"
            />
          ) : (
            <ProjectCoverPlaceholder title={project.title} />
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-4 font-mono text-[0.66rem] uppercase tracking-[0.16em]">
              <span className="text-accent">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-muted">{project.location}</span>
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>

          <div className="flex flex-1 flex-col pt-5">
            {project.featured ? (
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent">
                Featured Record
              </p>
            ) : null}
            <h3
              className={cn(
                "transition-colors group-hover:text-accent",
                lead ? "mt-3 text-3xl sm:text-4xl" : "mt-2 text-2xl sm:text-3xl",
              )}
            >
              {project.title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-muted">
              {project.shortDescription}
            </p>

            <dl className="mt-auto grid gap-3 border-t border-line pt-5 text-sm text-muted sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
              <div>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-strong">Scale</dt>
                <dd className="mt-1">
                  {project.squareFootage.toLocaleString("en-US")} sq ft • {project.bedrooms} bd •{" "}
                  {formatProjectBathrooms(project.bathrooms)} ba
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-strong">Type</dt>
                <dd className="mt-1">{buildType?.shortTitle ?? project.buildTypeSlug}</dd>
              </div>
              <div>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-strong">Finish</dt>
                <dd className="mt-1">{finishLevel?.shortTitle ?? project.finishLevelSlug}</dd>
              </div>
            </dl>
          </div>
        </div>
      </article>
    </Link>
  );
}
