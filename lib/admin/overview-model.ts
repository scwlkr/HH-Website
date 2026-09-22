import type { AdminInquiryQueueItem } from "@/features/plan-your-home/admin-inquiry-queue";
import type { ProjectSummary } from "@/types/operations";

export type HHQOverview = {
  asOf: string;
  projectsAvailable: boolean;
  inquiriesAvailable: boolean;
  projects: Pick<ProjectSummary, "id" | "title" | "published" | "status" | "location" | "updatedAt">[];
  inquiries: Pick<AdminInquiryQueueItem, "id" | "name" | "status" | "location" | "lastActivityAt">[];
};

export function filterOverview(data: HHQOverview, days: number) {
  const end = new Date(data.asOf).getTime();
  const start = end - days * 86_400_000;
  const inPeriod = (value: string | null) => days === 0 || (!!value && new Date(value).getTime() >= start && new Date(value).getTime() <= end);
  return {
    projects: data.projects.filter((item) => inPeriod(item.updatedAt)),
    inquiries: data.inquiries.filter((item) => inPeriod(item.lastActivityAt)),
  };
}

export function searchOverview(data: HHQOverview, query: string) {
  const term = query.trim().toLocaleLowerCase("en-US");
  if (!term) return { projects: [], inquiries: [] };
  return {
    projects: data.projects.filter((item) => `${item.title} ${item.location}`.toLocaleLowerCase("en-US").includes(term)),
    inquiries: data.inquiries.filter((item) => `${item.name} ${item.location ?? ""}`.toLocaleLowerCase("en-US").includes(term)),
  };
}

export function recentActivity(data: Pick<HHQOverview, "projects" | "inquiries">) {
  return [
    ...data.projects.map((item) => ({ id: `project-${item.id}`, name: item.title, description: item.published ? "Published project updated" : "Draft project updated", href: `/admin/projects/${encodeURIComponent(item.id)}`, date: item.updatedAt, kind: "project" })),
    ...data.inquiries.filter((item) => item.lastActivityAt).map((item) => ({ id: `inquiry-${item.id}`, name: item.name, description: `${item.status[0].toUpperCase()}${item.status.slice(1)} inquiry updated`, href: `/admin/inquiries/${encodeURIComponent(item.id)}`, date: item.lastActivityAt!, kind: "inquiry" })),
  ].sort((a, b) => b.date.localeCompare(a.date));
}
