import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { getBuildTypeBySlug, getFinishLevelBySlug } from "@/lib/content";
import { createPageMetadata } from "@/lib/metadata";
import { formatProjectBathrooms } from "@/lib/operations/format";
import { listAdminProjects } from "@/lib/db/operations";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = createPageMetadata({
  title: "Admin Projects",
  description: "Manage completed homes in the HH operations portal.",
  path: "/admin/projects",
  noIndex: true,
});

type AdminProjectsPageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export default async function AdminProjectsPage({
  searchParams,
}: AdminProjectsPageProps) {
  const { saved } = await searchParams;
  const projects = await listAdminProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
            Projects Manager
          </p>
          <h1 className="mt-3 text-4xl">Completed Homes</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
            Create, edit, and reorder the completed homes shown on the public
            `/projects` routes.
          </p>
        </div>

        <Link
          href={"/admin/projects/new" as Route}
          className={cn(
            buttonVariants(),
            "rounded-[var(--hh-radius-tight)]",
          )}
        >
          Add Project
        </Link>
      </div>

      {saved ? (
        <AdminNotice tone="success">Project changes were saved.</AdminNotice>
      ) : null}

      <div className="overflow-hidden rounded-[var(--hh-radius-tight)] border border-line-strong bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line-strong bg-surface-raised">
              <tr>
                <th className="px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
                  Project
                </th>
                <th className="px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
                  Category
                </th>
                <th className="px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
                  Specs
                </th>
                <th className="px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
                  Status
                </th>
                <th className="px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.length > 0 ? (
                projects.map((project) => {
                  const buildType = getBuildTypeBySlug(project.buildTypeSlug);
                  const finishLevel = getFinishLevelBySlug(project.finishLevelSlug);

                  return (
                    <tr key={project.id} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-foreground">{project.title}</p>
                            <p className="text-xs text-muted">{project.slug}</p>
                          </div>
                          {project.featured ? (
                            <span className="rounded-[var(--hh-radius-tight)] border border-line-strong bg-background px-2 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                              Featured
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted">
                        <p>{buildType?.shortTitle ?? project.buildTypeSlug}</p>
                        <p className="text-xs">{finishLevel?.shortTitle ?? project.finishLevelSlug}</p>
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {project.squareFootage.toLocaleString("en-US")} sq ft • {project.bedrooms} bd •{" "}
                        {formatProjectBathrooms(project.bathrooms)} ba
                      </td>
                      <td className="px-4 py-4">
                        <ProjectStatusBadge status={project.status} />
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/projects/${project.id}` as Route}
                          className={cn(
                            buttonVariants({
                              variant: "secondary",
                              size: "sm",
                            }),
                            "rounded-[var(--hh-radius-tight)]",
                          )}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                    No completed homes have been added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
