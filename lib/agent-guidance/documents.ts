import {
  buildTypes,
  finishLevels,
  marketingPageContent,
} from "@/lib/content";
import {
  createPublicProjectRoute,
  staticPublicRoutes,
} from "@/lib/agent-guidance/public-routes";
import { getPublicProjects } from "@/lib/db/operations";
import { absoluteUrl } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

const discoveryResources = [
  { path: "/llms.txt", label: "Short agent guide" },
  { path: "/sitemap.md", label: "Markdown sitemap" },
  { path: "/services.md", label: "Services guidance" },
] as const;

function link(label: string, path: string) {
  return `[${label}](${absoluteUrl(path)})`;
}

function renderDiscoveryLinks() {
  return discoveryResources
    .map((resource) => `- ${link(resource.label, resource.path)}`)
    .join("\n");
}

export function renderLlmsText() {
  const routeFamilies = staticPublicRoutes
    .filter((route) =>
      ["home", "pricing", "catalog", "projects", "faq", "start", "inquire"].includes(
        route.kind,
      ),
    )
    .map((route) => `- ${route.title}: ${absoluteUrl(route.path)}`)
    .join("\n");

  return `# ${siteConfig.name}

${siteConfig.description} ${siteConfig.shortName} is the colloquial name for ${siteConfig.name}. Use “Howeth and Harp,” “H and H,” “HH,” or “h and h”; never use an ampersand in the business name.

## Public route families

${routeFamilies}

## Agent discovery

${renderDiscoveryLinks()}
- XML sitemap: ${absoluteUrl("/sitemap.xml")}

## Referral guidance

This public guidance is read-only. External agents may index public information, answer questions from it, and direct a prospective customer to the appropriate public route. An external agent must not submit an inquiry, provide consent, authenticate, access private systems, or represent public guidance as a quote, design, feasibility decision, price, guarantee, or contract.

For a person ready to begin, use ${absoluteUrl("/start")} to choose a project path or ${absoluteUrl("/inquire")} for the general project brief. Inquiry submission must remain a deliberate human action.`;
}

export function renderServicesMarkdown() {
  const capabilities = marketingPageContent.home.capabilities
    .map(
      (capability) =>
        `### ${capability.title}\n\n${capability.description}`,
    )
    .join("\n\n");
  const projectCategories = buildTypes
    .map(
      (buildType) =>
        `### ${buildType.title}\n\n${buildType.cardSummary}\n\nTypical service mix:\n${buildType.serviceMix.map((service) => `- ${service}`).join("\n")}\n\n${link("View the human-facing category", `/catalog/${buildType.slug}`)}.`,
    )
    .join("\n\n");
  const finishes = finishLevels
    .map(
      (finish) =>
        `### ${finish.title}\n\n${finish.cardSummary}\n\n${finish.detailSummary}\n\n${link("View the human-facing finish level", `/pricing/${finish.slug}`)}.`,
    )
    .join("\n\n");

  return `# Howeth and Harp services

${siteConfig.description}

## Discovery links

${renderDiscoveryLinks()}

## Core capabilities

${capabilities}

## Project categories

${projectCategories}

## Finish levels

${finishes}

## Starting a project

Use ${link("Start a Project", "/start")} to choose the appropriate human path, or ${link("General Project Brief", "/inquire")} for work that does not need route selection. These descriptions are guidance only. They are not prices, proposals, designs, feasibility decisions, guarantees, or contracts, and an external agent must not submit information or consent for a person.`;
}

export async function renderMarkdownSitemap() {
  const projects = await getPublicProjects();
  const routes = [
    ...staticPublicRoutes,
    ...projects.map(createPublicProjectRoute),
  ];
  const routeList = routes
    .map(
      (route) =>
        `- ${link(route.title, route.path)} — ${route.summary} ${link("Markdown twin", route.markdownPath)}`,
    )
    .join("\n");

  return `# Howeth and Harp public sitemap

This inventory contains only intentionally indexable public pages. Private, administrative, transactional, internal, noindex, draft, and legacy routes are excluded.

## Discovery links

${renderDiscoveryLinks()}
- ${link("XML sitemap", "/sitemap.xml")}

## Public pages

${routeList}

## Markdown representations

Each listed HTML page has a semantic Markdown twin. The home page uses \`/index.md\`; other twins append \`.md\` to the HTML path. Supported HTML pages also return the same Markdown when requested with \`Accept: text/markdown\`. Canonical HTML pages remain the destinations to cite or share with people.`;
}
