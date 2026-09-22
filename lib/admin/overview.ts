import "server-only";

import { requireAdminUser } from "@/lib/admin/auth";
import { getAuthorizedAdminInquiryQueue } from "@/lib/db/admin-inquiries";
import { isFirebaseAdminConfigured } from "@/lib/db/client";
import { listAdminProjects } from "@/lib/db/operations";
import type { HHQOverview } from "./overview-model";

export async function getHHQOverview(): Promise<HHQOverview> {
  await requireAdminUser();
  const queue = await getAuthorizedAdminInquiryQueue();
  const configured = isFirebaseAdminConfigured();
  const [projects, inquiries] = await Promise.allSettled([
    Promise.resolve().then(() => {
      if (!configured) throw new Error("Unavailable");
      return listAdminProjects();
    }),
    Promise.resolve().then(() => queue.list("all")),
  ]);
  return {
    asOf: new Date().toISOString(),
    projectsAvailable: projects.status === "fulfilled",
    inquiriesAvailable: inquiries.status === "fulfilled",
    projects: projects.status === "fulfilled" ? projects.value.map(({ id, title, published, status, location, updatedAt }) => ({ id, title, published, status, location, updatedAt })) : [],
    inquiries: inquiries.status === "fulfilled" ? inquiries.value.map(({ id, name, status, location, lastActivityAt }) => ({ id, name, status, location, lastActivityAt })) : [],
  };
}
