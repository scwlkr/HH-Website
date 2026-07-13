import type { Metadata } from "next";
import { buildTypes, finishLevels } from "@/lib/content";
import { formatAdminPageTitle } from "@/lib/admin/branding";
import { createPageMetadata } from "@/lib/metadata";
import { AdminProjectForm } from "@/components/admin/admin-project-form";

export const metadata: Metadata = createPageMetadata({
  title: formatAdminPageTitle("New Project"),
  description: "Create a completed home in HHQ, the Howeth and Harp admin workspace.",
  path: "/admin/projects/new",
  noIndex: true,
});

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
          HHQ Projects
        </p>
        <h1 className="mt-3 text-4xl">Add Completed Home</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
          New projects begin as drafts unless you explicitly mark them as
          published.
        </p>
      </div>

      <div className="hh-admin-panel rounded-[var(--hh-radius-panel)] p-5 sm:p-6">
        <AdminProjectForm
          project={null}
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
