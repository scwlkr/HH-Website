import type { MetadataRoute } from "next";
import {
  buildTypes,
  finishLevels,
  getBuildTypeHref,
  getFinishLevelHref,
} from "@/lib/content";
import { absoluteUrl } from "@/lib/metadata";

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
  { path: "/catalog", priority: 0.9, changeFrequency: "weekly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/inquire", priority: 0.8, changeFrequency: "monthly" },
] as const satisfies ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path).toString(),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...finishLevels.map((finish) => ({
      url: absoluteUrl(getFinishLevelHref(finish.slug)).toString(),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...buildTypes.map((buildType) => ({
      url: absoluteUrl(getBuildTypeHref(buildType.slug)).toString(),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
