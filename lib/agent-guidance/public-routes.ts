import type { MetadataRoute } from "next";
import {
  buildTypes,
  finishLevels,
  getBuildTypeHref,
  getFinishLevelHref,
  marketingPageContent,
} from "@/lib/content";
import type { ProjectSummary } from "@/types/operations";

export type PublicRouteKind =
  | "home"
  | "pricing"
  | "finish-level"
  | "catalog"
  | "build-type"
  | "projects"
  | "project"
  | "faq"
  | "start"
  | "inquire";

export type StaticPublicRouteKind = Exclude<PublicRouteKind, "project">;

export type PublicRouteEntry = {
  kind: PublicRouteKind;
  path: string;
  markdownPath: string;
  title: string;
  summary: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  slug?: string;
};

export function getMarkdownTwinPath(path: string) {
  return path === "/" ? "/index.md" : `${path}.md`;
}

function createRoute(
  route: Omit<PublicRouteEntry, "markdownPath">,
): PublicRouteEntry {
  return {
    ...route,
    markdownPath: getMarkdownTwinPath(route.path),
  };
}

export const staticPublicRoutes = [
  createRoute({
    kind: "home",
    path: "/",
    title: "Home",
    summary: marketingPageContent.home.hero.description,
    priority: 1,
    changeFrequency: "weekly",
  }),
  createRoute({
    kind: "pricing",
    path: "/pricing",
    title: "Finish Levels",
    summary: marketingPageContent.pricing.description,
    priority: 0.9,
    changeFrequency: "weekly",
  }),
  ...finishLevels.map((finish) =>
    createRoute({
      kind: "finish-level",
      path: getFinishLevelHref(finish.slug),
      title: finish.title,
      summary: finish.cardSummary,
      priority: 0.8,
      changeFrequency: "monthly",
      slug: finish.slug,
    }),
  ),
  createRoute({
    kind: "catalog",
    path: "/catalog",
    title: "Project Categories",
    summary: marketingPageContent.catalog.description,
    priority: 0.9,
    changeFrequency: "weekly",
  }),
  ...buildTypes.map((buildType) =>
    createRoute({
      kind: "build-type",
      path: getBuildTypeHref(buildType.slug),
      title: buildType.title,
      summary: buildType.cardSummary,
      priority: 0.8,
      changeFrequency: "monthly",
      slug: buildType.slug,
    }),
  ),
  createRoute({
    kind: "projects",
    path: "/projects",
    title: "Completed Work",
    summary:
      "Published Howeth and Harp work across architecture, building, and land development.",
    priority: 0.9,
    changeFrequency: "weekly",
  }),
  createRoute({
    kind: "faq",
    path: "/faq",
    title: "Common Questions",
    summary: marketingPageContent.faq.description,
    priority: 0.7,
    changeFrequency: "monthly",
  }),
  createRoute({
    kind: "start",
    path: "/start",
    title: "Start a Project",
    summary:
      "Choose the appropriate human project-brief path for the work being planned.",
    priority: 0.85,
    changeFrequency: "monthly",
  }),
  createRoute({
    kind: "inquire",
    path: "/inquire",
    title: "General Project Brief",
    summary:
      "A deliberate human inquiry for project type, finish direction, location, priorities, and timing.",
    priority: 0.8,
    changeFrequency: "monthly",
  }),
] as const satisfies ReadonlyArray<PublicRouteEntry>;

export function createPublicProjectRoute(
  project: Pick<ProjectSummary, "slug" | "title" | "shortDescription">,
): PublicRouteEntry {
  return createRoute({
    kind: "project",
    path: `/projects/${project.slug}`,
    title: project.title,
    summary: project.shortDescription,
    priority: 0.8,
    changeFrequency: "weekly",
    slug: project.slug,
  });
}

export function getStaticPublicRoute(path: string) {
  return staticPublicRoutes.find((route) => route.path === path) ?? null;
}

export function getStaticPublicRouteByKind(
  kind: StaticPublicRouteKind,
  slug?: string,
) {
  return (
    staticPublicRoutes.find(
      (route) => route.kind === kind && route.slug === slug,
    ) ?? null
  );
}

export function getPublicRoutePath(
  kind: StaticPublicRouteKind,
  slug?: string,
) {
  const route = getStaticPublicRouteByKind(kind, slug);

  if (!route) {
    throw new Error(
      `Missing public route inventory entry for ${kind}${slug ? `:${slug}` : ""}.`,
    );
  }

  return route.path;
}

export function isPotentialPublicRoute(path: string) {
  if (getStaticPublicRoute(path)) {
    return true;
  }

  return /^\/projects\/[^/]+$/.test(path);
}
