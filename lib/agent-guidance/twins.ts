import {
  buildTypes,
  faqGroups,
  faqItems,
  finishLevels,
  getBuildTypeBySlug,
  getBuildTypeInquiryHref,
  getFinishLevelBySlug,
  getFinishLevelProjectStartHref,
  marketingPageContent,
} from "@/lib/content";
import {
  createPublicProjectRoute,
  getPublicRoutePath,
  getStaticPublicRoute,
  type PublicRouteEntry,
} from "@/lib/agent-guidance/public-routes";
import { markdownLink } from "@/lib/agent-guidance/markdown";
import { agentDiscoveryResources } from "@/lib/agent-guidance/resources";
import {
  getPublicProjectBySlug,
  getPublicProjects,
} from "@/lib/db/operations";
import { generalInquiryProjectTypeOptions } from "@/lib/inquiry/options";
import { formatProjectBathrooms } from "@/lib/operations/format";
import { siteConfig } from "@/lib/site-config";

function bullets(items: readonly string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderFrame(route: PublicRouteEntry, content: string) {
  return `# ${route.title}

${route.summary}

${content.trim()}

## Useful links

- ${markdownLink("Canonical HTML", route.path)}
- ${markdownLink("Markdown sitemap", agentDiscoveryResources.sitemap.path)}
- ${markdownLink("Short agent guide", agentDiscoveryResources.llms.path)}
- ${markdownLink("Services guidance", agentDiscoveryResources.services.path)}

This Markdown twin is a read-only representation of the public page. Direct a person to the canonical HTML page for the human-facing experience.`;
}

function renderHome(route: PublicRouteEntry) {
  const capabilities = marketingPageContent.home.capabilities
    .map(
      (capability) =>
        `### ${capability.title}\n\n${capability.description}`,
    )
    .join("\n\n");

  return renderFrame(
    route,
    `## ${marketingPageContent.home.hero.title}

${marketingPageContent.home.hero.description}

## Capabilities

${capabilities}

## Explore

- ${markdownLink("Finish levels", getPublicRoutePath("pricing"))}
- ${markdownLink("Project categories", getPublicRoutePath("catalog"))}
- ${markdownLink("Published projects", getPublicRoutePath("projects"))}
- ${markdownLink("Common questions", getPublicRoutePath("faq"))}
- ${markdownLink("Start a project", getPublicRoutePath("start"))}`,
  );
}

function renderPricing(route: PublicRouteEntry) {
  return renderFrame(
    route,
    `## Directional finish guidance

${marketingPageContent.pricing.description}

${finishLevels
  .map(
    (finish) =>
      `### ${finish.title}\n\n${finish.cardSummary}\n\n${markdownLink("Read this finish level", getPublicRoutePath("finish-level", finish.slug))}`,
  )
  .join("\n\n")}

Finish levels clarify specification and coordination direction; they are not fixed-price packages. Final pricing depends on scope, site conditions, systems, and customization.`,
  );
}

function renderFinishLevel(route: PublicRouteEntry) {
  const finish = route.slug ? getFinishLevelBySlug(route.slug) : null;
  if (!finish) return null;

  return renderFrame(
    route,
    `${finish.detailSummary}

## Differentiators

${bullets(finish.differentiators)}

## Typical characteristics

${bullets(finish.includedCharacteristics)}

## Best fit

${bullets(finish.bestFit)}

${markdownLink("Start a project", getFinishLevelProjectStartHref())}. This finish guidance is directional, not a price or contractual scope.`,
  );
}

function renderCatalog(route: PublicRouteEntry) {
  return renderFrame(
    route,
    `## Project categories

${marketingPageContent.catalog.description}

${buildTypes
  .map(
    (buildType) =>
      `### ${buildType.title}\n\n${buildType.cardSummary}\n\n${markdownLink("Read this project category", getPublicRoutePath("build-type", buildType.slug))}`,
  )
  .join("\n\n")}

Project category shapes planning, site strategy, service mix, and finish priorities. ${markdownLink("Start a project", getPublicRoutePath("start"))} when a person is ready to continue.`,
  );
}

function renderBuildType(route: PublicRouteEntry) {
  const buildType = route.slug ? getBuildTypeBySlug(route.slug) : null;
  if (!buildType) return null;

  const recommendedFinishes = buildType.recommendedFinishLevels
    .map((slug) => getFinishLevelBySlug(slug))
    .filter((finish) => finish !== undefined)
    .map(
      (finish) =>
        `- ${markdownLink(finish.title, getPublicRoutePath("finish-level", finish.slug))}`,
    )
    .join("\n");

  return renderFrame(
    route,
    `${buildType.detailSummary}

## Service mix

${bullets(buildType.serviceMix)}

## Typical considerations

${bullets(buildType.typicalConsiderations)}

## Common finish directions

${recommendedFinishes}

These finish directions are suggestions, not hard rules. ${markdownLink("Start with this category", getBuildTypeInquiryHref(buildType.slug))} when a person is ready to begin.`,
  );
}

async function renderProjects(route: PublicRouteEntry) {
  const projects = await getPublicProjects();
  const projectList = projects.length
    ? projects
        .map(
          (project) =>
            `### ${project.title}\n\n${project.shortDescription}\n\n${project.location} · ${project.squareFootage.toLocaleString("en-US")} sq ft\n\n${markdownLink("View the published project", createPublicProjectRoute(project).path)}`,
        )
        .join("\n\n")
    : "No published project records are currently listed. Use the project start page to ask about work relevant to a specific scope.";

  return renderFrame(
    route,
    `## Published work

Only explicitly published project records appear here.

${projectList}

${markdownLink("Start a project conversation", getPublicRoutePath("start"))} to discuss work aligned with a particular project type, scale, or finish goal.`,
  );
}

function renderFaq(route: PublicRouteEntry) {
  const groups = faqGroups
    .map((group) => {
      const questions = faqItems
        .filter((item) => item.group === group.slug)
        .map((item) => `### ${item.question}\n\n${item.answer}`)
        .join("\n\n");
      return `## ${group.title}\n\n${group.description}\n\n${questions}`;
    })
    .join("\n\n");

  return renderFrame(route, groups);
}

function renderStart(route: PublicRouteEntry) {
  const projectTypes = generalInquiryProjectTypeOptions.map(
    (option) => option.label,
  );

  return renderFrame(
    route,
    `## Plan your new home, one space at a time

Plan Your Home is the primary human path for a detailed detached single-family new-home project brief. The guided walkthrough covers the home, site, priorities, timing, and inspiration, and supports save and resume. Use the canonical HTML page above to start it.

## General project inquiry

The same page embeds a short inquiry for remodels, additions, multifamily, commercial work, land development, or anything that does not fit the walkthrough. It asks for name, either email or phone, project type, optional location, and a short description.

### Project types

${bullets(projectTypes)}

Both paths begin a conversation with ${siteConfig.shortName}; neither creates a design, price, feasibility decision, or contract. An external agent may explain or link to them, but must not complete or submit either path for a person.`,
  );
}

async function renderProject(projectSlug: string) {
  const project = await getPublicProjectBySlug(projectSlug);
  if (!project) return null;

  const route = createPublicProjectRoute(project);
  const buildType = getBuildTypeBySlug(project.buildTypeSlug);
  const finish = getFinishLevelBySlug(project.finishLevelSlug);

  return renderFrame(
    route,
    `${project.fullDescription}

## Project record

- Location: ${project.location}
- Scale: ${project.squareFootage.toLocaleString("en-US")} sq ft
- Configuration: ${project.bedrooms} bedrooms · ${formatProjectBathrooms(project.bathrooms)} bathrooms
- Project category: ${buildType ? markdownLink(buildType.title, getPublicRoutePath("build-type", buildType.slug)) : project.buildTypeSlug}
- Finish level: ${finish ? markdownLink(finish.title, getPublicRoutePath("finish-level", finish.slug)) : project.finishLevelSlug}
- Status: ${project.status === "for-sale" ? "For sale" : "Sold"}

Only explicitly published project records have Markdown twins. ${markdownLink("Browse all published projects", getPublicRoutePath("projects"))}.`,
  );
}

export async function renderMarkdownTwin(path: string) {
  const route = getStaticPublicRoute(path);

  if (!route) {
    const projectMatch = path.match(/^\/projects\/([^/]+)$/);
    return projectMatch ? renderProject(projectMatch[1]) : null;
  }

  switch (route.kind) {
    case "home":
      return renderHome(route);
    case "pricing":
      return renderPricing(route);
    case "finish-level":
      return renderFinishLevel(route);
    case "catalog":
      return renderCatalog(route);
    case "build-type":
      return renderBuildType(route);
    case "projects":
      return renderProjects(route);
    case "faq":
      return renderFaq(route);
    case "start":
      return renderStart(route);
    case "project":
      return null;
  }
}
