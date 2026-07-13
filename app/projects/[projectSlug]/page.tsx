import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionLink } from "@/components/marketing/action-link";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
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
  const specs = [
    { label: "Location", value: project.location },
    {
      label: "Square Footage",
      value: `${project.squareFootage.toLocaleString("en-US")} sq ft`,
    },
    {
      label: "Bedrooms / Bathrooms",
      value: `${project.bedrooms} bd • ${formatProjectBathrooms(project.bathrooms)} ba`,
    },
    { label: "Build Type", value: buildType?.title ?? project.buildTypeSlug },
    { label: "Finish Level", value: finishLevel?.title ?? project.finishLevelSlug },
    {
      label: "Status",
      value: <ProjectStatusBadge key="status" status={project.status} />,
    },
  ];

  return (
    <>
      <PageIntro
        eyebrow="Completed Home"
        title={project.title}
        description={project.fullDescription}
        actions={
          <ActionLink
            href="/projects"
            label="Back To Projects"
            variant="secondary"
            trackingLocation="project-detail-intro"
          />
        }
        detail={
          <div className="space-y-5">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-accent">
              Project Record
            </p>
            <ProjectStatusBadge status={project.status} />
            <p className="border-t border-line pt-4 text-sm leading-7 text-muted">
              {project.location}<br />
              {project.squareFootage.toLocaleString("en-US")} sq ft • {project.bedrooms} bd •{" "}
              {formatProjectBathrooms(project.bathrooms)} ba
            </p>
          </div>
        }
      />

      <Section
        eyebrow="Gallery"
        title="Project imagery."
        description="Photography stays tied to the completed-work record when it is published."
      >
        <ProjectGallery images={project.images} title={project.title} />
      </Section>

      <Section
        eyebrow="Project Specs"
        title="Core details."
        description="The project record keeps only the essential public facts visible."
      >
        <dl className="grid border-y border-line text-sm leading-7 text-muted md:grid-cols-2">
          {specs.map((item, index) => (
            <div
              key={item.label}
              className={`border-b border-line py-4 ${index >= specs.length - 2 ? "md:border-b-0" : ""} ${index % 2 === 0 ? "md:border-r md:pr-6" : "md:pl-6"}`}
            >
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted-strong">
                {item.label}
              </dt>
              <dd className="mt-1 text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
