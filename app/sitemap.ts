import type { MetadataRoute } from "next";
import {
  createPublicProjectRoute,
  staticPublicRoutes,
} from "@/lib/agent-guidance/public-routes";
import { getPublicProjects } from "@/lib/db/operations";
import { absoluteUrl } from "@/lib/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const projects = await getPublicProjects();

  return [
    ...staticPublicRoutes.map((route) => ({
      url: absoluteUrl(route.path).toString(),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...projects.map((project) => ({
      url: absoluteUrl(createPublicProjectRoute(project).path).toString(),
      lastModified: new Date(project.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
