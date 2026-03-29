import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminProjectForm } from "@/components/admin/admin-project-form";
import { buildTypes, finishLevels } from "@/lib/content";
import { formatAdminPageTitle } from "@/lib/admin/branding";
import { getAdminProjectById } from "@/lib/db/operations";
import { createPageMetadata } from "@/lib/metadata";

type EditProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    saved?: string;
  }>;
};

export async function generateMetadata({
  params,
}: EditProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getAdminProjectById(id);

  return createPageMetadata({
    title: formatAdminPageTitle(project ? `Edit ${project.title}` : "Edit Project"),
    description: "Edit completed-home records in HHQ, the Howeth and Harp admin workspace.",
    path: `/admin/projects/${id}`,
    noIndex: true,
  });
}

export default async function EditProjectPage({
  params,
  searchParams,
}: EditProjectPageProps) {
  const { id } = await params;
  const { saved } = await searchParams;
  const project = await getAdminProjectById(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
          HHQ Projects
        </p>
        <h1 className="mt-3 text-4xl">Edit {project.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
          Changes here publish immediately to the live `/projects` pages.
        </p>
      </div>

      {saved ? (
        <AdminNotice tone="success">Project changes were saved.</AdminNotice>
      ) : null}

      <div className="hh-admin-panel rounded-[var(--hh-radius-panel)] p-5 sm:p-6">
        <AdminProjectForm
          project={project}
          buildTypeOptions={buildTypes.map((buildType) => ({
            label: buildType.shortTitle,
            value: buildType.slug,
          }))}
          finishLevelOptions={finishLevels.map((finishLevel) => ({
            label: finishLevel.shortTitle,
            value: finishLevel.slug,
          }))}
        />
      </div>
    </div>
  );
}
