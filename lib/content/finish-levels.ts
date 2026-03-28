import { createContentImage } from "@/lib/content/image-paths";
import { createSlugLookup } from "@/lib/content/slug-helpers";
import { siteConfig } from "@/lib/site-config";
import type { FinishLevel, FinishLevelSlug } from "@/types/content";

const shortName = siteConfig.shortName;

const builderGradeGallery = [
  createContentImage({
    collection: "finishes",
    slug: "builder-grade",
    fileName: "street-elevation.jpg",
    alt: "Builder Grade single-family exterior with disciplined massing and restrained exterior materials.",
    width: 1600,
    height: 1100,
    caption: "Efficient exterior palette with clean linework and repeatable detailing.",
  }),
  createContentImage({
    collection: "finishes",
    slug: "builder-grade",
    fileName: "kitchen-core-palette.jpg",
    alt: "Builder Grade kitchen with practical cabinet layout, durable finishes, and standard fixture package.",
    width: 1600,
    height: 1100,
    caption: "Durable baseline interior selections focused on consistency and value.",
  }),
  createContentImage({
    collection: "finishes",
    slug: "builder-grade",
    fileName: "bath-standard-fixtures.jpg",
    alt: "Builder Grade bath with straightforward tile layout and standard plumbing fixtures.",
    width: 1600,
    height: 1100,
    caption: "Streamlined fixture and surface package suited to cost-aware delivery.",
  }),
];

const builderPlusGallery = [
  createContentImage({
    collection: "finishes",
    slug: "builder-plus",
    fileName: "entry-material-layering.jpg",
    alt: "Builder Plus entry sequence with upgraded material layering, warmer millwork, and stronger lighting accents.",
    width: 1600,
    height: 1100,
    caption: "A more curated material stack without moving into fully bespoke detailing.",
  }),
  createContentImage({
    collection: "finishes",
    slug: "builder-plus",
    fileName: "kitchen-upgraded-fixtures.jpg",
    alt: "Builder Plus kitchen with upgraded appliance package, layered cabinet finish, and refined hardware.",
    width: 1600,
    height: 1100,
    caption: "Elevated everyday spaces with clearer material hierarchy and better fixture presence.",
  }),
  createContentImage({
    collection: "finishes",
    slug: "builder-plus",
    fileName: "primary-bath-curated-tile.jpg",
    alt: "Builder Plus primary bath with curated tile selections, upgraded plumbing trim, and improved lighting.",
    width: 1600,
    height: 1100,
    caption: "Refined interior finish selections intended to feel composed, not generic.",
  }),
];

const customGallery = [
  createContentImage({
    collection: "finishes",
    slug: "custom",
    fileName: "site-specific-exterior.jpg",
    alt: "Custom residence exterior designed around the site with bespoke massing, glazing, and materials.",
    width: 1600,
    height: 1100,
    caption: "Site-driven composition with tailored detailing and signature material moves.",
  }),
  createContentImage({
    collection: "finishes",
    slug: "custom",
    fileName: "custom-kitchen-millwork.jpg",
    alt: "Custom kitchen with bespoke millwork, specialty stone, and integrated lighting details.",
    width: 1600,
    height: 1100,
    caption: "Fully tailored interior expression with custom millwork and fixture coordination.",
  }),
  createContentImage({
    collection: "finishes",
    slug: "custom",
    fileName: "feature-stair-and-gallery.jpg",
    alt: "Custom interior stair and gallery space with strong geometry, refined finishes, and architectural focal elements.",
    width: 1600,
    height: 1100,
    caption: "Architectural moments designed to be specific to the project rather than selected from a standard package.",
  }),
];

export const finishLevels = [
  {
    slug: "builder-grade",
    title: "Builder Grade",
    shortTitle: "Builder Grade",
    tagline: "Disciplined baseline specification for cost-aware delivery.",
    cardSummary:
      "A streamlined finish package built around durability, repeatability, and a clean architectural baseline.",
    detailSummary:
      `Builder Grade is suited to projects that need ${shortName} planning discipline and a credible finished result without drifting into custom specification work. It prioritizes durable materials, efficient detailing, and controlled upgrade decisions.`,
    differentiators: [
      "Focused material palette with dependable, readily available selections.",
      "Repeatable trim, cabinet, and hardware strategies that support efficient construction.",
      "Standardized lighting and plumbing packages chosen for durability and clarity rather than novelty.",
    ],
    includedCharacteristics: [
      "Straightforward cabinet layouts with dependable finish options.",
      "Durable flooring and countertop selections appropriate for everyday wear.",
      "Clean trim profiles and fixture schedules that keep the build coordinated.",
      "Exterior material combinations designed to stay restrained and easy to maintain.",
    ],
    bestFit: [
      "Production-minded single-family homes where budget discipline matters.",
      "Investor-led or repeatable housing product that still needs architectural order.",
      "Projects where speed, consistency, and durability carry more weight than customization.",
    ],
    comparisonPoints: [
      {
        label: "Design flexibility",
        value: "Focused palette with limited custom detailing and controlled upgrades.",
      },
      {
        label: "Material posture",
        value: "Durable baseline selections chosen for consistency and availability.",
      },
      {
        label: "Construction fit",
        value: "Supports efficient delivery and repeatable field coordination.",
      },
      {
        label: "Investment signal",
        value: "Best when disciplined cost control matters more than bespoke expression.",
      },
    ],
    gallery: builderGradeGallery,
  },
  {
    slug: "builder-plus",
    title: "Builder+",
    shortTitle: "Builder+",
    tagline: "An upgraded finish package with a stronger sense of curation.",
    cardSummary:
      "Builder+ adds warmer material layering, better fixtures, and more tailored finish coordination while staying grounded in pragmatic delivery.",
    detailSummary:
      "Builder+ is for clients who want the project to feel more resolved and elevated without stepping all the way into a one-off custom specification process. It allows room for stronger material choices, better fixture packages, and a more noticeable design point of view.",
    differentiators: [
      "Broader material choices with visible upgrades in surfaces, hardware, and lighting.",
      "More refined interior layering that improves the lived experience of high-use spaces.",
      "Balanced specification decisions that keep the build practical while clearly moving past baseline delivery.",
    ],
    includedCharacteristics: [
      "Upgraded cabinet, countertop, and hardware combinations in key living spaces.",
      "More deliberate lighting plans with stronger decorative and task-light coordination.",
      "Improved tile, plumbing, and trim selections in kitchens, baths, and entries.",
      "Exterior compositions with a sharper material hierarchy and stronger curb presence.",
    ],
    bestFit: [
      "Primary residences where daily experience and resale posture both matter.",
      "Townhome or multifamily projects targeting a stronger market position.",
      "Commercial or mixed-use work that needs a more polished, client-facing finish level.",
    ],
    comparisonPoints: [
      {
        label: "Design flexibility",
        value: "Expanded options with meaningful upgrades across visible touchpoints.",
      },
      {
        label: "Material posture",
        value: "Curated, higher-performing selections that feel intentionally composed.",
      },
      {
        label: "Construction fit",
        value: "Works well when the project can support tighter finish coordination.",
      },
      {
        label: "Investment signal",
        value: "Balanced choice for projects seeking stronger identity without full bespoke scope.",
      },
    ],
    gallery: builderPlusGallery,
  },
  {
    slug: "custom",
    title: "Custom",
    shortTitle: "Custom",
    tagline: "Fully tailored specification shaped around site, scope, and design intent.",
    cardSummary:
      "Custom is the most flexible finish level, built for projects where the architectural idea, material expression, and user experience need to be highly specific.",
    detailSummary:
      "Custom is appropriate when the project should be designed and detailed around its particular site, program, and priorities rather than fitted into a preset package. It supports bespoke millwork, specialty materials, deeper consultant coordination, and a stronger architectural signature.",
    differentiators: [
      "Project-specific material and fixture selection driven by the architectural concept.",
      "Greater coordination around bespoke details, specialty elements, and custom millwork.",
      "Flexibility to prioritize unique user experience, site response, and signature moments.",
    ],
    includedCharacteristics: [
      "Tailored finish schedules that can vary substantially from room to room or zone to zone.",
      "Specialty surfaces, lighting, millwork, and hardware chosen for a specific design language.",
      "Custom detailing opportunities at entries, stairs, feature walls, kitchens, and baths.",
      "Exterior material compositions shaped around site, orientation, and project identity.",
    ],
    bestFit: [
      "High-touch residences with strong site conditions or a clear architectural agenda.",
      "Signature commercial work where brand expression and user experience are central.",
      "Projects where customization, detailing, and long-range design value outweigh standardization.",
    ],
    comparisonPoints: [
      {
        label: "Design flexibility",
        value: "Highest latitude for bespoke materials, details, and project-specific solutions.",
      },
      {
        label: "Material posture",
        value: "Concept-driven selection process shaped around the exact goals of the project.",
      },
      {
        label: "Construction fit",
        value: "Best when the team can support deeper coordination and more custom detailing.",
      },
      {
        label: "Investment signal",
        value: "Appropriate when distinct identity and long-term design value are primary priorities.",
      },
    ],
    gallery: customGallery,
  },
] satisfies ReadonlyArray<FinishLevel>;

const finishLevelLookup = createSlugLookup(finishLevels);

export const finishLevelSlugs = finishLevelLookup.slugs;

export function isFinishLevelSlug(slug: string): slug is FinishLevelSlug {
  return finishLevelLookup.hasSlug(slug);
}

export function getFinishLevelBySlug(slug: string) {
  return finishLevelLookup.getBySlug(slug);
}

export function getOtherFinishLevels(slug: FinishLevelSlug) {
  return finishLevelLookup.getOtherItems(slug);
}

export function getFinishLevelHref(slug: FinishLevelSlug) {
  return `/pricing/${slug}`;
}

export function getFinishLevelInquiryHref(slug: FinishLevelSlug) {
  return `/inquire?finish=${slug}`;
}
