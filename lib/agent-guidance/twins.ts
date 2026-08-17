import {
  buildTypes,
  faqGroups,
  faqItems,
  finishLevels,
  getBuildTypeBySlug,
  getFinishLevelBySlug,
  marketingPageContent,
} from "@/lib/content";
import {
  createPublicProjectRoute,
  getStaticPublicRoute,
  type PublicRouteEntry,
} from "@/lib/agent-guidance/public-routes";
import {
  getPublicProjectBySlug,
  getPublicProjects,
} from "@/lib/db/operations";
import {
  finishLevelOptions,
  inquiryProgressSteps,
  projectTypeOptions,
  servicesNeededOptions,
} from "@/lib/inquiry/options";
import { absoluteUrl } from "@/lib/metadata";
import { formatProjectBathrooms } from "@/lib/operations/format";
import { siteConfig } from "@/lib/site-config";

function link(label: string, path: string) {
  return `[${label}](${absoluteUrl(path)})`;
}

function bullets(items: readonly string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderFrame(route: PublicRouteEntry, content: string) {
  return `# ${route.title}

${route.summary}

${content.trim()}

## Useful links

- ${link("Canonical HTML", route.path)}
- ${link("Markdown sitemap", "/sitemap.md")}
- ${link("Short agent guide", "/llms.txt")}
- ${link("Services guidance", "/services.md")}

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

- ${link("Finish levels", "/pricing")}
- ${link("Project categories", "/catalog")}
- ${link("Published projects", "/projects")}
- ${link("Common questions", "/faq")}
- ${link("Start a project", "/start")}`,
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
      `### ${finish.title}\n\n${finish.cardSummary}\n\n${link("Read this finish level", `/pricing/${finish.slug}`)}`,
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

${link("Start with this finish direction", `/start?finish=${finish.slug}`)}. This finish guidance is directional, not a price or contractual scope.`,
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
      `### ${buildType.title}\n\n${buildType.cardSummary}\n\n${link("Read this project category", `/catalog/${buildType.slug}`)}`,
  )
  .join("\n\n")}

Project category shapes planning, site strategy, service mix, and finish priorities. ${link("Start a project", "/start")} when a person is ready to continue.`,
  );
}

function renderBuildType(route: PublicRouteEntry) {
  const buildType = route.slug ? getBuildTypeBySlug(route.slug) : null;
  if (!buildType) return null;

  const recommendedFinishes = buildType.recommendedFinishLevels
    .map((slug) => getFinishLevelBySlug(slug))
    .filter((finish) => finish !== undefined)
    .map((finish) => `- ${link(finish.title, `/pricing/${finish.slug}`)}`)
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

These finish directions are suggestions, not hard rules. ${link("Start with this category", `/inquire?buildType=${buildType.slug}`)} when a person is ready to provide a project brief.`,
  );
}

async function renderProjects(route: PublicRouteEntry) {
  const projects = await getPublicProjects();
  const projectList = projects.length
    ? projects
        .map(
          (project) =>
            `### ${project.title}\n\n${project.shortDescription}\n\n${project.location} · ${project.squareFootage.toLocaleString("en-US")} sq ft\n\n${link("View the published project", `/projects/${project.slug}`)}`,
        )
        .join("\n\n")
    : "No published project records are currently listed. Use the project brief to ask about work relevant to a specific scope.";

  return renderFrame(
    route,
    `## Published work

Only explicitly published project records appear here.

${projectList}

${link("Start a project conversation", "/start")} to discuss work aligned with a particular project type, scale, or finish goal.`,
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
  return renderFrame(
    route,
    `## Choose the brief that fits the work

Both paths begin a conversation with ${siteConfig.shortName}; neither creates a design, price, feasibility decision, or contract.

### New detached single-family home

Use the ${link("general project brief with single-family preselected", "/inquire?buildType=single-family")} to describe the home, site, priorities, budget context, timing, and inspiration.

### Every other kind of work

Use the ${link("general project brief", "/inquire")} for remodels, additions, multifamily, townhomes, commercial work, land-only work, or an uncertain project type.

An external agent may explain or link to these paths, but must not complete or submit either path for a person.`,
  );
}

function renderInquiry(route: PublicRouteEntry) {
  const fields = inquiryProgressSteps.map(
    (step) => `${step.title}: ${step.description}`,
  );
  const projectTypes = projectTypeOptions.map(
    (option) => `${option.label}${option.description ? ` — ${option.description}` : ""}`,
  );
  const finishes = finishLevelOptions.map(
    (option) => `${option.label}${option.description ? ` — ${option.description}` : ""}`,
  );
  const services = servicesNeededOptions.map(
    (option) => `${option.label}${option.description ? ` — ${option.description}` : ""}`,
  );

  return renderFrame(
    route,
    `## What the human project brief covers

${bullets(fields)}

## Project types

${bullets(projectTypes)}

## Finish directions

${bullets(finishes)}

## Service needs

${bullets(services)}

Rough answers are welcome. Submission and consent must remain deliberate human actions; an external agent must not fill or submit the inquiry.`,
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
- Project category: ${buildType ? link(buildType.title, `/catalog/${buildType.slug}`) : project.buildTypeSlug}
- Finish level: ${finish ? link(finish.title, `/pricing/${finish.slug}`) : project.finishLevelSlug}
- Status: ${project.status === "for-sale" ? "For sale" : "Sold"}

Only explicitly published project records have Markdown twins. ${link("Browse all published projects", "/projects")}.`,
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
    case "inquire":
      return renderInquiry(route);
    case "project":
      return null;
  }
}
