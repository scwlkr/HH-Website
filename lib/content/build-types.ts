import { createContentImage } from "@/lib/content/image-paths";
import { createSlugLookup } from "@/lib/content/slug-helpers";
import { siteConfig } from "@/lib/site-config";
import type { BuildType, BuildTypeSlug } from "@/types/content";

const publicName = siteConfig.name;

const singleFamilyHeroImage = createContentImage({
  collection: "build-types",
  slug: "single-family",
  fileName: "front-elevation.jpg",
  alt: "Single-family home exterior with clear massing, disciplined roof lines, and warm material contrast.",
  width: 1600,
  height: 1100,
  caption: "Single-family work centered on site fit, livability, and long-term value.",
});

const multifamilyHeroImage = createContentImage({
  collection: "build-types",
  slug: "multifamily",
  fileName: "street-frontage.jpg",
  alt: "Multifamily building frontage with organized repetition, clean entries, and durable exterior materials.",
  width: 1600,
  height: 1100,
  caption: "Multifamily projects balancing repeatability, operations, and resident experience.",
});

const townhomesHeroImage = createContentImage({
  collection: "build-types",
  slug: "townhomes",
  fileName: "block-composition.jpg",
  alt: "Townhome block with rhythmic facade composition, stacked units, and coordinated entry sequence.",
  width: 1600,
  height: 1100,
  caption: "Townhome product focused on density, identity, and efficient block planning.",
});

const commercialHeroImage = createContentImage({
  collection: "build-types",
  slug: "commercial",
  fileName: "corner-entry.jpg",
  alt: "Commercial building corner entry with strong signage zone, glazing, and durable architectural materials.",
  width: 1600,
  height: 1100,
  caption: "Commercial environments shaped around operations, brand presence, and user flow.",
});

export const buildTypes = [
  {
    slug: "single-family",
    title: "Single Family",
    shortTitle: "Single Family",
    tagline: "Residences shaped around site, daily use, and long-term livability.",
    cardSummary:
      "Single-family work ranges from efficient family homes to highly tailored residences, with planning, finish strategy, and site response scaled to the project.",
    detailSummary:
      `Single-family projects give ${publicName} room to align architecture, construction, and finish level around how the home should actually live. Scope can range from disciplined baseline delivery to fully bespoke residential work, but the goal stays the same: a house that feels resolved and coherent rather than assembled from disconnected choices.`,
    heroImage: singleFamilyHeroImage,
    gallery: [
      singleFamilyHeroImage,
      createContentImage({
        collection: "build-types",
        slug: "single-family",
        fileName: "living-space.jpg",
        alt: "Single-family living space with clear circulation, layered daylight, and practical millwork.",
        width: 1600,
        height: 1100,
        caption: "Interior planning focused on comfort, circulation, and architectural clarity.",
      }),
      createContentImage({
        collection: "build-types",
        slug: "single-family",
        fileName: "rear-patio.jpg",
        alt: "Single-family rear patio transition with indoor-outdoor connection and coordinated exterior detailing.",
        width: 1600,
        height: 1100,
        caption: "Connections between interior life, exterior space, and site orientation.",
      }),
    ],
    typicalConsiderations: [
      "Program planning around family routines, entertaining, privacy, and storage.",
      "Site-specific massing, setbacks, and orientation decisions that affect the whole plan.",
      "Finish-level calibration between daily durability, desired atmosphere, and budget posture.",
      "Early coordination of garage, outdoor living, utility zones, and circulation.",
    ],
    serviceMix: [
      "Architectural design and planning",
      "Ground-up construction",
      "Site and lot evaluation",
    ],
    recommendedFinishLevels: ["builder-grade", "builder-plus", "custom"],
  },
  {
    slug: "multifamily",
    title: "Multifamily",
    shortTitle: "Multifamily",
    tagline: "Repeatable housing systems with stronger planning discipline and market clarity.",
    cardSummary:
      "Multifamily work emphasizes repeatability, operational efficiency, durable specifications, and a resident experience that still feels considered.",
    detailSummary:
      `Multifamily projects require disciplined coordination between unit layouts, shared spaces, code requirements, and construction efficiency. ${publicName} approaches them as systems work with architectural consequences, where circulation, durability, market positioning, and finish strategy all need to align instead of competing with each other.`,
    heroImage: multifamilyHeroImage,
    gallery: [
      multifamilyHeroImage,
      createContentImage({
        collection: "build-types",
        slug: "multifamily",
        fileName: "common-lobby.jpg",
        alt: "Multifamily lobby with durable finishes, clear wayfinding, and a restrained material palette.",
        width: 1600,
        height: 1100,
        caption: "Shared spaces designed to carry traffic well while still presenting clearly.",
      }),
      createContentImage({
        collection: "build-types",
        slug: "multifamily",
        fileName: "courtyard.jpg",
        alt: "Multifamily courtyard framed by organized building edges, amenity seating, and circulation paths.",
        width: 1600,
        height: 1100,
        caption: "Site planning that balances density, amenity value, and practical circulation.",
      }),
    ],
    typicalConsiderations: [
      "Unit efficiency, repeatable detailing, and coordination with life-safety and access requirements.",
      "Durable finish packages that can support operations and maintenance over time.",
      "Amenity, corridor, and arrival spaces that influence leasing posture and resident experience.",
      "Site planning, parking, and circulation logic that shape density and construction feasibility.",
    ],
    serviceMix: [
      "Architectural design and unit planning",
      "Construction coordination",
      "Land development planning",
    ],
    recommendedFinishLevels: ["builder-grade", "builder-plus"],
  },
  {
    slug: "townhomes",
    title: "Townhomes",
    shortTitle: "Townhomes",
    tagline: "Attached housing product where repetition, frontage, and identity must stay in balance.",
    cardSummary:
      "Townhome work sits between single-family and multifamily, requiring efficient block planning while still giving each unit a credible street presence.",
    detailSummary:
      `Townhomes succeed when density, marketability, and constructability are handled as one design problem. ${publicName} focuses on frontage rhythm, unit efficiency, parking strategy, and finish calibration so the product feels coherent at both the block scale and the individual unit scale.`,
    heroImage: townhomesHeroImage,
    gallery: [
      townhomesHeroImage,
      createContentImage({
        collection: "build-types",
        slug: "townhomes",
        fileName: "entry-sequence.jpg",
        alt: "Townhome entry sequence with coordinated stoops, lighting, and facade articulation.",
        width: 1600,
        height: 1100,
        caption: "Street-facing details that help attached housing feel legible and intentional.",
      }),
      createContentImage({
        collection: "build-types",
        slug: "townhomes",
        fileName: "interior-main-level.jpg",
        alt: "Townhome main level with efficient open-plan organization, daylight, and durable upgraded finishes.",
        width: 1600,
        height: 1100,
        caption: "Compact interior planning that still preserves light, storage, and livability.",
      }),
    ],
    typicalConsiderations: [
      "Block layout, access, and frontage rhythm across multiple attached units.",
      "Parking and circulation decisions that affect both plan efficiency and exterior character.",
      "Finish-level choices that need to support market expectations without slowing delivery.",
      "Coordination between repeatable unit types and enough variation to avoid visual monotony.",
    ],
    serviceMix: [
      "Architectural planning",
      "Construction delivery",
      "Development feasibility support",
    ],
    recommendedFinishLevels: ["builder-grade", "builder-plus", "custom"],
  },
  {
    slug: "commercial",
    title: "Commercial",
    shortTitle: "Commercial",
    tagline: "Business-focused environments where operations and brand presence both matter.",
    cardSummary:
      "Commercial projects need practical planning, durable materials, and a finish strategy that supports how the business should function and present itself.",
    detailSummary:
      `Commercial work is driven by operations, code, customer experience, and brand clarity. ${publicName} approaches it with the same restrained architectural discipline as the residential categories while adapting the finish level and build strategy to fit staffing, maintenance, public-facing needs, and the pace of the business.`,
    heroImage: commercialHeroImage,
    gallery: [
      commercialHeroImage,
      createContentImage({
        collection: "build-types",
        slug: "commercial",
        fileName: "interior-work-zone.jpg",
        alt: "Commercial interior work zone with integrated storage, circulation, and durable lighting strategy.",
        width: 1600,
        height: 1100,
        caption: "Interior planning that supports workflow, maintenance, and customer perception.",
      }),
      createContentImage({
        collection: "build-types",
        slug: "commercial",
        fileName: "tenant-frontage.jpg",
        alt: "Commercial tenant frontage with signage band, glazing, and restrained material palette.",
        width: 1600,
        height: 1100,
        caption: "Exterior presence aligned with access, visibility, and long-term durability.",
      }),
    ],
    typicalConsiderations: [
      "Operational flow, staffing needs, public access, and brand presentation.",
      "Material durability and maintenance expectations in higher-traffic environments.",
      "Code, utility, and systems coordination that can drive plan and finish decisions.",
      "Finish-level calibration between business goals, customer-facing spaces, and budget reality.",
    ],
    serviceMix: [
      "Architectural design and layout planning",
      "Construction execution",
      "Site and development coordination",
    ],
    recommendedFinishLevels: ["builder-plus", "custom"],
  },
] satisfies ReadonlyArray<BuildType>;

const buildTypeLookup = createSlugLookup(buildTypes);

export const buildTypeSlugs = buildTypeLookup.slugs;

export function isBuildTypeSlug(slug: string): slug is BuildTypeSlug {
  return buildTypeLookup.hasSlug(slug);
}

export function getBuildTypeBySlug(slug: string) {
  return buildTypeLookup.getBySlug(slug);
}

export function getOtherBuildTypes(slug: BuildTypeSlug) {
  return buildTypeLookup.getOtherItems(slug);
}

export function getBuildTypeHref(slug: BuildTypeSlug) {
  return `/catalog/${slug}`;
}

export function getBuildTypeInquiryHref(slug: BuildTypeSlug) {
  return `/inquire?buildType=${slug}`;
}
