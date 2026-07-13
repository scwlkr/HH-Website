import { z } from "zod";

import {
  PLAN_HOME_REFERENCE_LIMITS,
  planHomeReferenceCollectionSchema,
  type PlanHomeReferenceMetadata,
} from "./references.ts";

export type PlanHomeOptionSemantic = "uncertain" | "none" | "not-applicable";

export type PlanHomeOption = Readonly<{
  slug: string;
  label: string;
  semantic?: PlanHomeOptionSemantic;
}>;

export type PlanHomeOptionGroup = Readonly<{
  id: string;
  label: string;
  options: readonly PlanHomeOption[];
  maxSelections?: number;
  exclusiveOptionSlugs?: readonly string[];
}>;

export type PlanHomeResponseDefinition = Readonly<{
  kind: "choice" | "multi-choice" | "grouped" | "references" | "priorities";
  optionGroups: readonly PlanHomeOptionGroup[];
  limits?: Readonly<Record<string, number>>;
  responseSchema: z.ZodType;
  answerSchema: z.ZodType;
  defaultAnswer: unknown;
  exampleAnswer: unknown;
  summarize: (answer: unknown) => string;
}>;

export type PlanHomeQuestionDefinition = Readonly<{
  number: number;
  id: string;
  zoneId: string;
  prompt: string;
  helper?: string;
  sceneAnchor: string;
  cameraKey: string;
  response: PlanHomeResponseDefinition;
}>;

export type PlanHomeZoneDefinition = Readonly<{
  order: number;
  id: string;
  title: string;
  sceneAnchors: readonly string[];
  cameraKeys: readonly string[];
}>;

export type PlanHomeDefinition = Readonly<{
  id: string;
  zones: readonly PlanHomeZoneDefinition[];
  questions: readonly PlanHomeQuestionDefinition[];
}>;

function option(
  slug: string,
  label: string,
  semantic?: PlanHomeOptionSemantic,
): PlanHomeOption {
  return semantic ? { slug, label, semantic } : { slug, label };
}

function optionEnum(options: readonly PlanHomeOption[]) {
  const slugs = options.map(({ slug }) => slug) as [string, ...string[]];
  return z.enum(slugs);
}

function optionLabel(options: readonly PlanHomeOption[], slug: string) {
  return options.find((item) => item.slug === slug)?.label ?? slug;
}

function optionLabels(options: readonly PlanHomeOption[], slugs: readonly string[]) {
  return slugs.map((slug) => optionLabel(options, slug)).join(", ");
}

function uniqueValues(values: readonly string[]) {
  return new Set(values).size === values.length;
}

function choiceResponse(
  groupId: string,
  groupLabel: string,
  options: readonly PlanHomeOption[],
): PlanHomeResponseDefinition {
  const answerSchema = optionEnum(options);
  const example = options.find((item) => item.semantic === undefined) ?? options[0];

  return {
    kind: "choice",
    optionGroups: [{ id: groupId, label: groupLabel, options }],
    responseSchema: answerSchema.nullable(),
    answerSchema,
    defaultAnswer: null,
    exampleAnswer: example.slug,
    summarize: (answer) => optionLabel(options, answerSchema.parse(answer)),
  };
}

function multiChoiceSchemas(
  options: readonly PlanHomeOption[],
  maxSelections?: number,
  exclusiveOptionSlugs: readonly string[] = [],
) {
  let responseSchema = z
    .array(optionEnum(options))
    .refine(uniqueValues, "Selections must be unique.")
    .refine(
      (values) =>
        !exclusiveOptionSlugs.some((slug) => values.includes(slug)) ||
        values.length === 1,
      "Exclusive selections cannot be combined with another option.",
    );

  if (maxSelections !== undefined) {
    responseSchema = responseSchema.max(maxSelections);
  }

  return {
    responseSchema,
    answerSchema: responseSchema.min(1),
  };
}

function multiChoiceResponse(
  groupId: string,
  groupLabel: string,
  options: readonly PlanHomeOption[],
  settings: Readonly<{
    maxSelections?: number;
    exclusiveOptionSlugs?: readonly string[];
  }> = {},
): PlanHomeResponseDefinition {
  const exclusiveOptionSlugs = settings.exclusiveOptionSlugs ?? [];
  const schemas = multiChoiceSchemas(
    options,
    settings.maxSelections,
    exclusiveOptionSlugs,
  );
  const example = options.find((item) => item.semantic === undefined) ?? options[0];

  return {
    kind: "multi-choice",
    optionGroups: [
      {
        id: groupId,
        label: groupLabel,
        options,
        ...(settings.maxSelections === undefined
          ? {}
          : { maxSelections: settings.maxSelections }),
        ...(exclusiveOptionSlugs.length === 0
          ? {}
          : { exclusiveOptionSlugs }),
      },
    ],
    responseSchema: schemas.responseSchema,
    answerSchema: schemas.answerSchema,
    defaultAnswer: [],
    exampleAnswer: [example.slug],
    summarize: (answer) => optionLabels(options, schemas.answerSchema.parse(answer)),
  };
}

function groupedResponse(
  definition: Omit<PlanHomeResponseDefinition, "kind">,
): PlanHomeResponseDefinition {
  return { kind: "grouped", ...definition };
}

function formatParts(parts: readonly [string, string][]) {
  return parts.map(([label, value]) => `${label}: ${value}`).join("; ");
}

const uncertain = (slug = "not-sure-yet", label = "Not sure yet") =>
  option(slug, label, "uncertain");
const none = (slug = "none", label = "None") => option(slug, label, "none");

export const planHomeZones = [
  {
    order: 1,
    id: "project-and-living",
    title: "Entry, Project Frame, and Living Room",
    sceneAnchors: [
      "rolled-plans",
      "site-map",
      "landscape-window",
      "floor-plan-rug",
      "stair",
      "hall-doors",
      "family-photos",
      "seating",
      "kitchen-opening",
      "fireplace-window",
      "finish-board",
    ],
    cameraKeys: [
      "entry-plans",
      "entry-site",
      "entry-landscape",
      "living-floor-plan",
      "living-stair",
      "living-hall",
      "living-family",
      "living-seating",
      "living-connection",
      "living-features",
      "living-finishes",
    ],
  },
  {
    order: 2,
    id: "kitchen-and-dining",
    title: "Kitchen and Dining",
    sceneAnchors: ["range-and-island", "room-opening", "pantry-door", "dining-table"],
    cameraKeys: ["kitchen-use", "kitchen-arrangement", "kitchen-support", "dining-use"],
  },
  {
    order: 3,
    id: "primary-suite",
    title: "Primary Suite",
    sceneAnchors: ["hall-stair-marker", "bed-and-window", "bath-vanity", "closet"],
    cameraKeys: ["primary-location", "primary-bedroom", "primary-bath", "primary-closet"],
  },
  {
    order: 4,
    id: "bedrooms-and-shared-bathrooms",
    title: "Bedrooms and Shared Bathrooms",
    sceneAnchors: ["bedroom-door-cluster", "shared-bath-vanity"],
    cameraKeys: ["secondary-bedrooms", "secondary-bathrooms"],
  },
  {
    order: 5,
    id: "utility-and-systems",
    title: "Laundry, Mudroom, Storage, and Home Systems",
    sceneAnchors: ["washer", "mudroom-bench", "storage-built-ins", "system-panel"],
    cameraKeys: ["utility-laundry", "utility-mudroom", "utility-storage", "home-systems"],
  },
  {
    order: 6,
    id: "exterior-and-site",
    title: "Garage, Exterior, Site, Outdoor Living, and Specialty Spaces",
    sceneAnchors: [
      "garage",
      "elevation-samples",
      "sun-compass-trees",
      "patio",
      "outbuilding-plan",
    ],
    cameraKeys: ["exterior-garage", "exterior-style", "site-context", "outdoor-living", "specialty-spaces"],
  },
  {
    order: 7,
    id: "design-desk-and-review",
    title: "Design Desk, Inspiration, and Review",
    sceneAnchors: ["mood-board", "pinboard-scanner", "priority-stacks", "ruler-calendar", "review-brief"],
    cameraKeys: ["design-feeling", "design-references", "design-priorities", "budget-timing", "review-follow-up"],
  },
] as const satisfies readonly PlanHomeZoneDefinition[];

const startingPointOptions = [
  option("fully-custom", "Fully custom"),
  option("adapt-existing-plan", "Adapt an existing plan"),
  option("bring-completed-plan", "Bring a completed plan"),
  uncertain(),
] as const;
const serviceOptions = [
  option("architectural-design", "Architectural design"),
  option("building", "Building"),
  option("land-development", "Land development"),
  uncertain(),
] as const;
const startingServicesResponseSchema = z.object({
  startingPoint: optionEnum(startingPointOptions).nullable(),
  services: multiChoiceSchemas(serviceOptions, undefined, ["not-sure-yet"]).responseSchema,
});
const startingServicesAnswerSchema = z.object({
  startingPoint: optionEnum(startingPointOptions),
  services: multiChoiceSchemas(serviceOptions, undefined, ["not-sure-yet"]).answerSchema,
});
const startingServicesResponse = groupedResponse({
  optionGroups: [
    { id: "startingPoint", label: "Starting point", options: startingPointOptions },
    {
      id: "services",
      label: "Services",
      options: serviceOptions,
      exclusiveOptionSlugs: ["not-sure-yet"],
    },
  ],
  responseSchema: startingServicesResponseSchema,
  answerSchema: startingServicesAnswerSchema,
  defaultAnswer: { startingPoint: null, services: [] },
  exampleAnswer: {
    startingPoint: "fully-custom",
    services: ["architectural-design", "building"],
  },
  summarize: (answer) => {
    const value = startingServicesAnswerSchema.parse(answer);
    return formatParts([
      ["Starting point", optionLabel(startingPointOptions, value.startingPoint)],
      ["Services", optionLabels(serviceOptions, value.services)],
    ]);
  },
});

const lotStatusOptions = [
  option("own-it", "Own it"),
  option("under-contract", "Under contract"),
  option("actively-looking", "Actively looking"),
  option("need-h-and-h-evaluation", "Need h and h to evaluate options"),
  uncertain(),
] as const;
const lotLocationResponseSchema = z.object({
  lotStatus: optionEnum(lotStatusOptions).nullable(),
  location: z.string().trim().max(160),
  locationUncertain: z.boolean(),
});
const lotLocationAnswerSchema = z
  .object({
    lotStatus: optionEnum(lotStatusOptions),
    location: z.string().trim().max(160),
    locationUncertain: z.boolean(),
  })
  .refine(
    (value) =>
      (value.locationUncertain && value.location.length === 0) ||
      (!value.locationUncertain && value.location.length >= 2),
    "Provide a location or explicitly choose Not sure yet.",
  );
const lotLocationResponse = groupedResponse({
  optionGroups: [{ id: "lotStatus", label: "Lot status", options: lotStatusOptions }],
  responseSchema: lotLocationResponseSchema,
  answerSchema: lotLocationAnswerSchema,
  defaultAnswer: { lotStatus: null, location: "", locationUncertain: false },
  exampleAnswer: {
    lotStatus: "actively-looking",
    location: "Denton County",
    locationUncertain: false,
  },
  summarize: (answer) => {
    const value = lotLocationAnswerSchema.parse(answer);
    return formatParts([
      ["Lot status", optionLabel(lotStatusOptions, value.lotStatus)],
      ["Location", value.locationUncertain ? "Not sure yet" : value.location],
    ]);
  },
});

const siteContextOptions = [
  option("flat-or-gently-sloped", "Flat or gently sloped"),
  option("steep-or-complex-slope", "Steep or complex slope"),
  option("wooded", "Wooded"),
  option("important-views-or-water", "Important views or water"),
  option("utilities-available", "Utilities available"),
  option("well-or-septic", "Well or septic"),
  option("hoa-or-deed-restrictions", "HOA or deed restrictions"),
  option("existing-structure", "Existing structure"),
  none("nothing-known-yet", "Nothing known yet"),
  uncertain(),
] as const;

const squareFootageOptions = [
  option("under-1000", "Under 1,000"),
  option("1000-1499", "1,000–1,499"),
  option("1500-1999", "1,500–1,999"),
  option("2000-2499", "2,000–2,499"),
  option("2500-2999", "2,500–2,999"),
  option("3000-3999", "3,000–3,999"),
  option("4000-4999", "4,000–4,999"),
  option("5000-plus", "5,000+"),
  uncertain(),
] as const;

const storyOptions = [
  option("one", "One"),
  option("one-and-a-half", "One-and-a-half"),
  option("two", "Two"),
  option("three-or-more", "Three or more"),
  uncertain(),
] as const;

const bedroomOptions = [
  option("1", "1"),
  option("2", "2"),
  option("3", "3"),
  option("4", "4"),
  option("5", "5"),
  option("6-plus", "6+"),
  uncertain("not-sure", "Not sure"),
] as const;
const fullBathroomOptions = bedroomOptions;
const halfBathroomOptions = [
  option("0", "0"),
  option("1", "1"),
  option("2", "2"),
  option("3", "3"),
  option("4-plus", "4+"),
  uncertain("not-sure", "Not sure"),
] as const;
const bedBathResponseSchema = z.object({
  bedrooms: optionEnum(bedroomOptions).nullable(),
  fullBathrooms: optionEnum(fullBathroomOptions).nullable(),
  halfBathrooms: optionEnum(halfBathroomOptions).nullable(),
});
const bedBathAnswerSchema = z.object({
  bedrooms: optionEnum(bedroomOptions),
  fullBathrooms: optionEnum(fullBathroomOptions),
  halfBathrooms: optionEnum(halfBathroomOptions),
});
const bedBathResponse = groupedResponse({
  optionGroups: [
    { id: "bedrooms", label: "Bedrooms", options: bedroomOptions },
    { id: "fullBathrooms", label: "Full bathrooms", options: fullBathroomOptions },
    { id: "halfBathrooms", label: "Half bathrooms", options: halfBathroomOptions },
  ],
  responseSchema: bedBathResponseSchema,
  answerSchema: bedBathAnswerSchema,
  defaultAnswer: { bedrooms: null, fullBathrooms: null, halfBathrooms: null },
  exampleAnswer: { bedrooms: "4", fullBathrooms: "3", halfBathrooms: "1" },
  summarize: (answer) => {
    const value = bedBathAnswerSchema.parse(answer);
    return formatParts([
      ["Bedrooms", optionLabel(bedroomOptions, value.bedrooms)],
      ["Full bathrooms", optionLabel(fullBathroomOptions, value.fullBathrooms)],
      ["Half bathrooms", optionLabel(halfBathroomOptions, value.halfBathrooms)],
    ]);
  },
});

const futureSupportOptions = [
  option("growing-family", "Growing family"),
  option("multigenerational-household", "Multigenerational household"),
  option("frequent-guests", "Frequent guests"),
  option("aging-in-place", "Aging in place"),
  option("mobility-or-accessibility-needs", "Mobility or accessibility needs"),
  option("pets", "Pets"),
  option("live-in-caregiver", "Live-in caregiver"),
  option("downsizing", "Downsizing"),
  none("no-major-change-expected", "No major change expected"),
  uncertain(),
] as const;
const dailyLifeOptions = [
  option("gathering", "Gathering"),
  option("quiet-and-privacy", "Quiet and privacy"),
  option("entertaining", "Entertaining"),
  option("remote-work-or-study", "Remote work or study"),
  option("hobbies-or-making", "Hobbies or making"),
  option("caregiving", "Caregiving"),
  option("pet-routines", "Pet routines"),
  option("indoor-outdoor-living", "Indoor-outdoor living"),
  uncertain(),
] as const;
const livingRelationshipOptions = [
  option("open", "Open"),
  option("connected-but-defined", "Connected but defined"),
  option("mostly-separate", "Mostly separate"),
  uncertain(),
] as const;
const livingFeatureOptions = [
  option("fireplace", "Fireplace"),
  option("tv-or-media", "TV or media"),
  option("built-ins", "Built-ins"),
  option("vaulted-or-tall-ceilings", "Vaulted or tall ceilings"),
  option("strong-views", "Strong views"),
  option("outdoor-connection", "Outdoor connection"),
  option("flexible-furniture-layout", "Flexible furniture layout"),
  none(),
  uncertain(),
] as const;
const finishLevelOptions = [
  option("builder-grade", "Builder Grade"),
  option("builder-plus", "Builder+"),
  option("custom", "Custom"),
  uncertain(),
] as const;

const kitchenUseOptions = [
  option("everyday-cooking", "Everyday cooking"),
  option("serious-cooking-or-baking", "Serious cooking or baking"),
  option("family-gathering", "Family gathering"),
  option("entertaining", "Entertaining"),
  option("large-groups", "Large groups"),
  option("catering-or-separate-prep", "Catering or separate prep"),
  uncertain(),
] as const;
const workCenterOptions = [
  option("single-island", "Single island"),
  option("double-island", "Double island"),
  option("peninsula", "Peninsula"),
  option("no-island", "No island", "none"),
  uncertain("not-sure", "Not sure"),
] as const;
const kitchenConnectionOptions = [
  option("open", "Open"),
  option("connected-but-defined", "Connected but defined"),
  option("separate", "Separate"),
  uncertain("not-sure", "Not sure"),
] as const;
const kitchenArrangementResponseSchema = z.object({
  workCenter: optionEnum(workCenterOptions).nullable(),
  connection: optionEnum(kitchenConnectionOptions).nullable(),
});
const kitchenArrangementAnswerSchema = z.object({
  workCenter: optionEnum(workCenterOptions),
  connection: optionEnum(kitchenConnectionOptions),
});
const kitchenArrangementResponse = groupedResponse({
  optionGroups: [
    { id: "workCenter", label: "Work center", options: workCenterOptions },
    { id: "connection", label: "Connection", options: kitchenConnectionOptions },
  ],
  responseSchema: kitchenArrangementResponseSchema,
  answerSchema: kitchenArrangementAnswerSchema,
  defaultAnswer: { workCenter: null, connection: null },
  exampleAnswer: { workCenter: "single-island", connection: "open" },
  summarize: (answer) => {
    const value = kitchenArrangementAnswerSchema.parse(answer);
    return formatParts([
      ["Work center", optionLabel(workCenterOptions, value.workCenter)],
      ["Connection", optionLabel(kitchenConnectionOptions, value.connection)],
    ]);
  },
});
const kitchenSupportOptions = [
  option("cabinet-pantry", "Cabinet pantry"),
  option("walk-in-pantry", "Walk-in pantry"),
  option("butler-pantry", "Butler pantry"),
  option("scullery-or-prep-kitchen", "Scullery or prep kitchen"),
  option("appliance-garage", "Appliance garage"),
  none(),
  uncertain(),
] as const;
const diningUseOptions = [
  option("island-seating", "Island seating"),
  option("breakfast-nook", "Breakfast nook"),
  option("open-everyday-dining", "Open everyday dining"),
  option("formal-dining", "Formal dining"),
  option("large-group-dining", "Large-group dining"),
  option("outdoor-connection", "Outdoor connection"),
  uncertain(),
] as const;

const primaryLocationOptions = [
  option("main-floor", "Main floor"),
  option("upper-floor", "Upper floor"),
  option("separate-wing", "Separate wing"),
  option("no-preference", "No preference", "none"),
  uncertain(),
] as const;
const primaryBedroomFeatureOptions = [
  option("sitting-area", "Sitting area"),
  option("fireplace", "Fireplace"),
  option("outdoor-access", "Outdoor access"),
  option("morning-bar", "Morning bar"),
  option("strong-view", "Strong view"),
  option("vaulted-or-tall-ceiling", "Vaulted or tall ceiling"),
  option("compact-and-simple", "Compact and simple"),
  none(),
  uncertain(),
] as const;
const primaryBathFeatureOptions = [
  option("large-shower", "Large shower"),
  option("soaking-tub", "Soaking tub"),
  option("separate-vanities", "Separate vanities"),
  option("private-toilet-room", "Private toilet room"),
  option("natural-light", "Natural light"),
  option("curbless-or-accessible-layout", "Curbless or accessible layout"),
  option("linen-storage", "Linen storage"),
  uncertain(),
] as const;
const primaryClosetOptions = [
  option("one-shared-walk-in", "One shared walk-in"),
  option("separate-walk-ins", "Separate walk-ins"),
  option("direct-laundry-access", "Direct laundry access"),
  option("closet-built-ins", "Closet built-ins"),
  option("accessible-clearances", "Accessible clearances"),
  none(),
  uncertain(),
] as const;

const secondaryUserOptions = [
  option("children", "Children"),
  option("guests", "Guests"),
  option("multigenerational-family", "Multigenerational family"),
  option("flexible-bedroom-office", "Flexible bedroom/office"),
  option("caregiver", "Caregiver"),
  uncertain("not-sure", "Not sure"),
] as const;
const secondaryArrangementOptions = [
  option("grouped", "Grouped"),
  option("split-for-privacy", "Split for privacy"),
  option("separate-guest-suite", "Separate guest suite"),
  option("no-preference", "No preference", "none"),
] as const;
const secondaryLayoutUsersResponseSchema = z.object({
  users: multiChoiceSchemas(secondaryUserOptions, undefined, ["not-sure"]).responseSchema,
  arrangement: optionEnum(secondaryArrangementOptions).nullable(),
});
const secondaryLayoutUsersAnswerSchema = z.object({
  users: multiChoiceSchemas(secondaryUserOptions, undefined, ["not-sure"]).answerSchema,
  arrangement: optionEnum(secondaryArrangementOptions),
});
const secondaryLayoutUsersResponse = groupedResponse({
  optionGroups: [
    {
      id: "users",
      label: "Users",
      options: secondaryUserOptions,
      exclusiveOptionSlugs: ["not-sure"],
    },
    { id: "arrangement", label: "Arrangement", options: secondaryArrangementOptions },
  ],
  responseSchema: secondaryLayoutUsersResponseSchema,
  answerSchema: secondaryLayoutUsersAnswerSchema,
  defaultAnswer: { users: [], arrangement: null },
  exampleAnswer: { users: ["children", "guests"], arrangement: "grouped" },
  summarize: (answer) => {
    const value = secondaryLayoutUsersAnswerSchema.parse(answer);
    return formatParts([
      ["Users", optionLabels(secondaryUserOptions, value.users)],
      ["Arrangement", optionLabel(secondaryArrangementOptions, value.arrangement)],
    ]);
  },
});
const bathSharingOptions = [
  option("hall-bath", "Hall bath"),
  option("jack-and-jill", "Jack-and-Jill"),
  option("private-en-suites", "Private en suites"),
  option("mixed-approach", "Mixed approach"),
  uncertain(),
] as const;

const laundryOptions = [
  option("near-bedrooms", "Near bedrooms"),
  option("near-primary-suite", "Near primary suite"),
  option("near-mudroom", "Near mudroom"),
  option("multiple-locations", "Multiple locations"),
  option("folding-counter", "Folding counter"),
  option("sink", "Sink"),
  option("hanging-space", "Hanging space"),
  option("linen-storage", "Linen storage"),
  uncertain(),
] as const;
const mudroomOptions = [
  option("shoes-and-coats", "Shoes and coats"),
  option("bags", "Bags"),
  option("deliveries", "Deliveries"),
  option("pet-gear", "Pet gear"),
  option("dog-wash", "Dog wash"),
  option("extra-fridge-or-freezer", "Extra fridge or freezer"),
  option("charging-drop-zone", "Charging/drop zone"),
  none(),
  uncertain(),
] as const;
const storageOptions = [
  option("linens", "Linens"),
  option("seasonal-items", "Seasonal items"),
  option("sports-or-outdoor-gear", "Sports or outdoor gear"),
  option("hobbies", "Hobbies"),
  option("food-or-bulk-goods", "Food or bulk goods"),
  option("cleaning-supplies", "Cleaning supplies"),
  option("luggage", "Luggage"),
  option("safe-or-storm-storage", "Safe or storm storage"),
  uncertain(),
] as const;
const systemOptions = [
  option("energy-efficiency", "Energy efficiency"),
  option("generator", "Generator"),
  option("solar-ready", "Solar-ready"),
  option("all-electric", "All-electric"),
  option("smart-controls", "Smart controls"),
  option("security", "Security"),
  option("network-or-audio", "Network or audio"),
  option("indoor-air-quality", "Indoor air quality"),
  option("water-filtration", "Water filtration"),
  option("low-maintenance-systems", "Low-maintenance systems"),
  uncertain(),
] as const;

const garageBayOptions = [
  option("no-garage", "No garage", "none"),
  option("1", "1"),
  option("2", "2"),
  option("3", "3"),
  option("4-plus", "4+"),
  uncertain("not-sure", "Not sure"),
] as const;
const garageNeedOptions = [
  option("truck-or-suv", "Truck or SUV"),
  option("ev-charging", "EV charging"),
  option("boat-or-rv", "Boat or RV"),
  option("workshop", "Workshop"),
  option("storage", "Storage"),
  option("attached-or-detached-preference", "Attached or detached preference"),
] as const;
const garageNeedsResponseSchema = z.object({
  bays: optionEnum(garageBayOptions).nullable(),
  needs: z.array(optionEnum(garageNeedOptions)).refine(uniqueValues),
  other: z.string().trim().max(120),
});
const garageNeedsAnswerSchema = z.object({
  bays: optionEnum(garageBayOptions),
  needs: z.array(optionEnum(garageNeedOptions)).refine(uniqueValues),
  other: z.string().trim().max(120),
});
const garageNeedsResponse = groupedResponse({
  optionGroups: [
    { id: "bays", label: "Bays", options: garageBayOptions },
    { id: "needs", label: "Needs", options: garageNeedOptions },
  ],
  responseSchema: garageNeedsResponseSchema,
  answerSchema: garageNeedsAnswerSchema,
  defaultAnswer: { bays: null, needs: [], other: "" },
  exampleAnswer: { bays: "2", needs: ["storage"], other: "" },
  summarize: (answer) => {
    const value = garageNeedsAnswerSchema.parse(answer);
    const needs = optionLabels(garageNeedOptions, value.needs);
    return formatParts([
      ["Garage bays", optionLabel(garageBayOptions, value.bays)],
      ["Needs", [needs, value.other].filter(Boolean).join(", ") || "None specified"],
    ]);
  },
});
const exteriorStyleOptions = [
  option("hill-country-or-ranch", "Hill Country or ranch"),
  option("modern-farmhouse", "Modern farmhouse"),
  option("traditional", "Traditional"),
  option("transitional", "Transitional"),
  option("modern-or-contemporary", "Modern or contemporary"),
  option("barndominium", "Barndominium"),
  option("spanish-or-mediterranean", "Spanish or Mediterranean"),
  uncertain(),
] as const;
const siteRelationshipOptions = [
  option("important-views", "Important views"),
  option("morning-light", "Morning light"),
  option("evening-light", "Evening light"),
  option("privacy", "Privacy"),
  option("street-presence", "Street presence"),
  option("preserve-trees", "Preserve trees"),
  option("direct-outdoor-connection", "Direct outdoor connection"),
  option("future-pool-or-outbuilding", "Future pool or outbuilding"),
  uncertain(),
] as const;
const outdoorLivingOptions = [
  option("covered-porch", "Covered porch"),
  option("screened-porch", "Screened porch"),
  option("patio", "Patio"),
  option("outdoor-kitchen", "Outdoor kitchen"),
  option("fireplace-or-firepit", "Fireplace or firepit"),
  option("pool", "Pool"),
  option("spa", "Spa"),
  option("garden", "Garden"),
  option("play-area", "Play area"),
  uncertain(),
] as const;
const specialtySpaceOptions = [
  option("office", "Office"),
  option("gym", "Gym"),
  option("media-room", "Media room"),
  option("game-room", "Game room"),
  option("library", "Library"),
  option("craft-room", "Craft room"),
  option("safe-or-storm-room", "Safe or storm room"),
  option("guest-suite", "Guest suite"),
  option("adu", "ADU"),
  option("workshop", "Workshop"),
  option("home-school-or-music-room", "Home school or music room"),
  none(),
  uncertain(),
] as const;

const feelingOptions = [
  option("warm", "Warm"),
  option("calm", "Calm"),
  option("bright", "Bright"),
  option("cozy", "Cozy"),
  option("open-and-airy", "Open and airy"),
  option("refined", "Refined"),
  option("simple", "Simple"),
  option("bold", "Bold"),
] as const;
const feelingResponseSchema = z.object({
  feelings: multiChoiceSchemas(feelingOptions, 3).responseSchema,
  likesAndDislikes: z.string().trim().max(500),
});
const feelingAnswerSchema = z.object({
  feelings: multiChoiceSchemas(feelingOptions, 3).answerSchema,
  likesAndDislikes: z.string().trim().max(500),
});
const feelingResponse = groupedResponse({
  optionGroups: [
    { id: "feelings", label: "Feelings", options: feelingOptions, maxSelections: 3 },
  ],
  responseSchema: feelingResponseSchema,
  answerSchema: feelingAnswerSchema,
  defaultAnswer: { feelings: [], likesAndDislikes: "" },
  exampleAnswer: { feelings: ["warm", "calm"], likesAndDislikes: "" },
  summarize: (answer) => {
    const value = feelingAnswerSchema.parse(answer);
    return formatParts([
      ["Feeling", optionLabels(feelingOptions, value.feelings)],
      ["Current-home notes", value.likesAndDislikes || "None provided"],
    ]);
  },
});

const referencesResponseSchema = z.object({
  references: planHomeReferenceCollectionSchema,
  noReferencesYet: z.boolean(),
});
const referencesAnswerSchema = referencesResponseSchema.refine(
  (value) =>
    (value.noReferencesYet && value.references.length === 0) ||
    (!value.noReferencesYet && value.references.length > 0),
  "Add a reference or explicitly choose that you do not have references yet.",
);
const referencesResponse: PlanHomeResponseDefinition = {
  kind: "references",
  optionGroups: [],
  limits: PLAN_HOME_REFERENCE_LIMITS,
  responseSchema: referencesResponseSchema,
  answerSchema: referencesAnswerSchema,
  defaultAnswer: { references: [], noReferencesYet: false },
  exampleAnswer: { references: [], noReferencesYet: true },
  summarize: (answer) => {
    const value = referencesAnswerSchema.parse(answer);
    if (value.noReferencesYet) {
      return "I do not have references yet";
    }

    const files = value.references.filter((reference) => reference.kind === "file").length;
    const links = value.references.length - files;
    return `${files} file${files === 1 ? "" : "s"}; ${links} link${links === 1 ? "" : "s"}`;
  },
};

const priorityLimits = {
  mustHave: 5,
  niceToHave: 5,
  dealBreaker: 3,
  customItems: 1,
} as const;
const priorityItemSchema = z.string().trim().min(1).max(120);
const customPriorityItemSchema = z
  .object({
    label: priorityItemSchema,
    priority: z.enum(["must-have", "nice-to-have", "deal-breaker"]),
  })
  .strict();
const prioritiesResponseSchema = z.object({
  mustHave: z.array(priorityItemSchema).max(priorityLimits.mustHave),
  niceToHave: z.array(priorityItemSchema).max(priorityLimits.niceToHave),
  dealBreakers: z.array(priorityItemSchema).max(priorityLimits.dealBreaker),
  customItem: customPriorityItemSchema.nullable(),
  noStrongPrioritiesYet: z.boolean(),
});
const prioritiesAnswerSchema = prioritiesResponseSchema.superRefine((value, context) => {
  const assigned = [
    ...value.mustHave,
    ...value.niceToHave,
    ...value.dealBreakers,
  ];
  if (!uniqueValues(assigned)) {
    context.addIssue({ code: "custom", message: "A priority can only appear once." });
  }
  const hasPriorities = assigned.length > 0 || value.customItem !== null;
  if (value.noStrongPrioritiesYet === hasPriorities) {
    context.addIssue({
      code: "custom",
      message: "Assign priorities or choose No strong priorities yet.",
    });
  }

  if (value.customItem?.priority === "must-have" && value.mustHave.length >= priorityLimits.mustHave) {
    context.addIssue({ code: "custom", message: "Must-haves are limited to five items." });
  }
  if (
    value.customItem?.priority === "nice-to-have" &&
    value.niceToHave.length >= priorityLimits.niceToHave
  ) {
    context.addIssue({ code: "custom", message: "Nice-to-haves are limited to five items." });
  }
  if (
    value.customItem?.priority === "deal-breaker" &&
    value.dealBreakers.length >= priorityLimits.dealBreaker
  ) {
    context.addIssue({ code: "custom", message: "Deal-breakers are limited to three items." });
  }
});
const prioritiesResponse: PlanHomeResponseDefinition = {
  kind: "priorities",
  optionGroups: [],
  limits: priorityLimits,
  responseSchema: prioritiesResponseSchema,
  answerSchema: prioritiesAnswerSchema,
  defaultAnswer: {
    mustHave: [],
    niceToHave: [],
    dealBreakers: [],
    customItem: null,
    noStrongPrioritiesYet: false,
  },
  exampleAnswer: {
    mustHave: [],
    niceToHave: [],
    dealBreakers: [],
    customItem: null,
    noStrongPrioritiesYet: true,
  },
  summarize: (answer) => {
    const value = prioritiesAnswerSchema.parse(answer);
    if (value.noStrongPrioritiesYet) {
      return "No strong priorities yet";
    }

    return formatParts([
      ["Must-haves", value.mustHave.join(", ") || "None"],
      ["Nice-to-haves", value.niceToHave.join(", ") || "None"],
      ["Deal-breakers", value.dealBreakers.join(", ") || "None"],
      [
        "Custom",
        value.customItem
          ? `${value.customItem.label} (${value.customItem.priority})`
          : "None",
      ],
    ]);
  },
};

const budgetOptions = [
  option("under-300k", "Under $300k"),
  option("300k-499k", "$300k–$499k"),
  option("500k-749k", "$500k–$749k"),
  option("750k-999k", "$750k–$999k"),
  option("1m-1-49m", "$1m–$1.49m"),
  option("1-5m-2-49m", "$1.5m–$2.49m"),
  option("2-5m-plus", "$2.5m+"),
  uncertain(),
] as const;
const designStartOptions = [
  option("as-soon-as-practical", "As soon as practical"),
  option("within-3-months", "Within 3 months"),
  option("3-6-months", "3–6 months"),
  option("6-12-months", "6–12 months"),
  option("more-than-12-months", "More than 12 months"),
  option("just-exploring", "Just exploring"),
] as const;
const budgetTimingResponseSchema = z.object({
  budget: optionEnum(budgetOptions).nullable(),
  designStart: optionEnum(designStartOptions).nullable(),
});
const budgetTimingAnswerSchema = z.object({
  budget: optionEnum(budgetOptions),
  designStart: optionEnum(designStartOptions),
});
const budgetTimingResponse = groupedResponse({
  optionGroups: [
    { id: "budget", label: "Budget", options: budgetOptions },
    { id: "designStart", label: "Design start", options: designStartOptions },
  ],
  responseSchema: budgetTimingResponseSchema,
  answerSchema: budgetTimingAnswerSchema,
  defaultAnswer: { budget: null, designStart: null },
  exampleAnswer: { budget: "500k-749k", designStart: "3-6-months" },
  summarize: (answer) => {
    const value = budgetTimingAnswerSchema.parse(answer);
    return formatParts([
      ["Budget", optionLabel(budgetOptions, value.budget)],
      ["Design start", optionLabel(designStartOptions, value.designStart)],
    ]);
  },
});

const followUpOptions = [
  option("email", "Email"),
  option("phone-call", "Phone call"),
  option("text-message", "Text message"),
] as const;
const followUpResponseSchema = z.object({
  method: optionEnum(followUpOptions).nullable(),
  projectContactConsent: z.boolean(),
});
const followUpAnswerSchema = z.object({
  method: optionEnum(followUpOptions),
  projectContactConsent: z.literal(true),
});
const followUpResponse = groupedResponse({
  optionGroups: [{ id: "method", label: "Follow-up method", options: followUpOptions }],
  responseSchema: followUpResponseSchema,
  answerSchema: followUpAnswerSchema,
  defaultAnswer: { method: null, projectContactConsent: false },
  exampleAnswer: { method: "email", projectContactConsent: true },
  summarize: (answer) => {
    const value = followUpAnswerSchema.parse(answer);
    return formatParts([
      ["Follow-up", optionLabel(followUpOptions, value.method)],
      ["Project-related contact", "Confirmed"],
    ]);
  },
});

export const planHomeQuestions = [
  {
    number: 1,
    id: "project.starting-services",
    zoneId: "project-and-living",
    prompt: "Where are you starting, and what help are you looking for?",
    sceneAnchor: "rolled-plans",
    cameraKey: "entry-plans",
    response: startingServicesResponse,
  },
  {
    number: 2,
    id: "project.lot-location",
    zoneId: "project-and-living",
    prompt: "What is your lot status, and where are you building or hoping to build?",
    helper: "Share a city, county, address, or target area, or choose Not sure yet.",
    sceneAnchor: "site-map",
    cameraKey: "entry-site",
    response: lotLocationResponse,
  },
  {
    number: 3,
    id: "project.site-context",
    zoneId: "project-and-living",
    prompt: "What do you already know about the site?",
    sceneAnchor: "landscape-window",
    cameraKey: "entry-landscape",
    response: multiChoiceResponse("siteContext", "Site context", siteContextOptions, {
      exclusiveOptionSlugs: ["nothing-known-yet", "not-sure-yet"],
    }),
  },
  {
    number: 4,
    id: "home.heated-square-feet",
    zoneId: "project-and-living",
    prompt: "What total heated square footage are you considering?",
    helper: "Heated square footage excludes garages, porches, and unfinished areas.",
    sceneAnchor: "floor-plan-rug",
    cameraKey: "living-floor-plan",
    response: choiceResponse("squareFootage", "Heated square footage", squareFootageOptions),
  },
  {
    number: 5,
    id: "home.stories",
    zoneId: "project-and-living",
    prompt: "How many stories are you considering?",
    sceneAnchor: "stair",
    cameraKey: "living-stair",
    response: choiceResponse("stories", "Stories", storyOptions),
  },
  {
    number: 6,
    id: "home.bed-bath-counts",
    zoneId: "project-and-living",
    prompt: "How many bedrooms, full bathrooms, and half bathrooms do you expect?",
    sceneAnchor: "hall-doors",
    cameraKey: "living-hall",
    response: bedBathResponse,
  },
  {
    number: 7,
    id: "home.future-support",
    zoneId: "project-and-living",
    prompt: "Who should this home support now and over the next five to ten years?",
    sceneAnchor: "family-photos",
    cameraKey: "living-family",
    response: multiChoiceResponse("futureSupport", "Future support", futureSupportOptions, {
      exclusiveOptionSlugs: ["no-major-change-expected", "not-sure-yet"],
    }),
  },
  {
    number: 8,
    id: "home.daily-life",
    zoneId: "project-and-living",
    prompt: "Which parts of daily life should the home support especially well?",
    sceneAnchor: "seating",
    cameraKey: "living-seating",
    response: multiChoiceResponse("dailyLife", "Daily life", dailyLifeOptions, {
      maxSelections: 4,
      exclusiveOptionSlugs: ["not-sure-yet"],
    }),
  },
  {
    number: 9,
    id: "living.relationship",
    zoneId: "project-and-living",
    prompt: "How should the main living areas relate?",
    sceneAnchor: "kitchen-opening",
    cameraKey: "living-connection",
    response: choiceResponse("relationship", "Living-area relationship", livingRelationshipOptions),
  },
  {
    number: 10,
    id: "living.features",
    zoneId: "project-and-living",
    prompt: "What matters most in the main living area?",
    sceneAnchor: "fireplace-window",
    cameraKey: "living-features",
    response: multiChoiceResponse("features", "Living-area features", livingFeatureOptions, {
      maxSelections: 5,
      exclusiveOptionSlugs: ["none", "not-sure-yet"],
    }),
  },
  {
    number: 11,
    id: "home.finish-level",
    zoneId: "project-and-living",
    prompt: "Which whole-home finish level feels closest to what you want?",
    helper: "This is one direction for the full home, not a price quote or room-by-room package.",
    sceneAnchor: "finish-board",
    cameraKey: "living-finishes",
    response: choiceResponse("finishLevel", "Finish level", finishLevelOptions),
  },
  {
    number: 12,
    id: "kitchen.use",
    zoneId: "kitchen-and-dining",
    prompt: "How will the kitchen be used most often?",
    sceneAnchor: "range-and-island",
    cameraKey: "kitchen-use",
    response: multiChoiceResponse("kitchenUse", "Kitchen use", kitchenUseOptions, {
      maxSelections: 4,
      exclusiveOptionSlugs: ["not-sure-yet"],
    }),
  },
  {
    number: 13,
    id: "kitchen.arrangement",
    zoneId: "kitchen-and-dining",
    prompt: "What kitchen arrangement sounds closest to what you want?",
    sceneAnchor: "room-opening",
    cameraKey: "kitchen-arrangement",
    response: kitchenArrangementResponse,
  },
  {
    number: 14,
    id: "kitchen.support",
    zoneId: "kitchen-and-dining",
    prompt: "What pantry or support spaces interest you?",
    helper: "A butler pantry supports serving and storage; a scullery or prep kitchen contains messier prep; an appliance garage keeps countertop appliances ready but concealed.",
    sceneAnchor: "pantry-door",
    cameraKey: "kitchen-support",
    response: multiChoiceResponse("supportSpaces", "Pantry and support spaces", kitchenSupportOptions, {
      exclusiveOptionSlugs: ["none", "not-sure-yet"],
    }),
  },
  {
    number: 15,
    id: "dining.use",
    zoneId: "kitchen-and-dining",
    prompt: "How should dining work in the home?",
    sceneAnchor: "dining-table",
    cameraKey: "dining-use",
    response: multiChoiceResponse("diningUse", "Dining use", diningUseOptions, {
      exclusiveOptionSlugs: ["not-sure-yet"],
    }),
  },
  {
    number: 16,
    id: "primary.location",
    zoneId: "primary-suite",
    prompt: "Where should the primary suite be located?",
    sceneAnchor: "hall-stair-marker",
    cameraKey: "primary-location",
    response: choiceResponse("location", "Primary-suite location", primaryLocationOptions),
  },
  {
    number: 17,
    id: "primary.bedroom-features",
    zoneId: "primary-suite",
    prompt: "Which primary-bedroom features matter?",
    sceneAnchor: "bed-and-window",
    cameraKey: "primary-bedroom",
    response: multiChoiceResponse("features", "Primary-bedroom features", primaryBedroomFeatureOptions, {
      exclusiveOptionSlugs: ["none", "not-sure-yet"],
    }),
  },
  {
    number: 18,
    id: "primary.bath-features",
    zoneId: "primary-suite",
    prompt: "Which primary-bath features matter?",
    sceneAnchor: "bath-vanity",
    cameraKey: "primary-bath",
    response: multiChoiceResponse("features", "Primary-bath features", primaryBathFeatureOptions, {
      exclusiveOptionSlugs: ["not-sure-yet"],
    }),
  },
  {
    number: 19,
    id: "primary.closet-access",
    zoneId: "primary-suite",
    prompt: "What should the suite's closet and access support?",
    sceneAnchor: "closet",
    cameraKey: "primary-closet",
    response: multiChoiceResponse("closetAccess", "Closet and access", primaryClosetOptions, {
      exclusiveOptionSlugs: ["none", "not-sure-yet"],
    }),
  },
  {
    number: 20,
    id: "secondary.users-layout",
    zoneId: "bedrooms-and-shared-bathrooms",
    prompt: "Who will use the secondary bedrooms, and how should they be arranged?",
    sceneAnchor: "bedroom-door-cluster",
    cameraKey: "secondary-bedrooms",
    response: secondaryLayoutUsersResponse,
  },
  {
    number: 21,
    id: "secondary.bath-sharing",
    zoneId: "bedrooms-and-shared-bathrooms",
    prompt: "How should secondary bathrooms be shared?",
    helper: "A Jack-and-Jill bathroom connects two bedrooms directly, usually with separate lockable entries.",
    sceneAnchor: "shared-bath-vanity",
    cameraKey: "secondary-bathrooms",
    response: choiceResponse("bathSharing", "Bathroom sharing", bathSharingOptions),
  },
  {
    number: 22,
    id: "utility.laundry",
    zoneId: "utility-and-systems",
    prompt: "Where and how should laundry work?",
    sceneAnchor: "washer",
    cameraKey: "utility-laundry",
    response: multiChoiceResponse("laundry", "Laundry", laundryOptions, {
      exclusiveOptionSlugs: ["not-sure-yet"],
    }),
  },
  {
    number: 23,
    id: "utility.mudroom",
    zoneId: "utility-and-systems",
    prompt: "What should the everyday entry or mudroom handle?",
    sceneAnchor: "mudroom-bench",
    cameraKey: "utility-mudroom",
    response: multiChoiceResponse("mudroom", "Mudroom", mudroomOptions, {
      exclusiveOptionSlugs: ["none", "not-sure-yet"],
    }),
  },
  {
    number: 24,
    id: "utility.storage",
    zoneId: "utility-and-systems",
    prompt: "Which easy-to-overlook storage needs matter?",
    sceneAnchor: "storage-built-ins",
    cameraKey: "utility-storage",
    response: multiChoiceResponse("storage", "Storage", storageOptions, {
      exclusiveOptionSlugs: ["not-sure-yet"],
    }),
  },
  {
    number: 25,
    id: "home.systems",
    zoneId: "utility-and-systems",
    prompt: "Which whole-home comfort or system priorities matter?",
    sceneAnchor: "system-panel",
    cameraKey: "home-systems",
    response: multiChoiceResponse("systems", "Home systems", systemOptions, {
      maxSelections: 6,
      exclusiveOptionSlugs: ["not-sure-yet"],
    }),
  },
  {
    number: 26,
    id: "exterior.garage",
    zoneId: "exterior-and-site",
    prompt: "What should the garage accommodate?",
    sceneAnchor: "garage",
    cameraKey: "exterior-garage",
    response: garageNeedsResponse,
  },
  {
    number: 27,
    id: "exterior.style",
    zoneId: "exterior-and-site",
    prompt: "Which exterior character feels closest to the home you want?",
    helper: "These visual directions help communicate character; they are not promised designs.",
    sceneAnchor: "elevation-samples",
    cameraKey: "exterior-style",
    response: multiChoiceResponse("style", "Exterior character", exteriorStyleOptions, {
      maxSelections: 2,
      exclusiveOptionSlugs: ["not-sure-yet"],
    }),
  },
  {
    number: 28,
    id: "site.relationships",
    zoneId: "exterior-and-site",
    prompt: "Which relationships to the site matter most?",
    sceneAnchor: "sun-compass-trees",
    cameraKey: "site-context",
    response: multiChoiceResponse("relationships", "Site relationships", siteRelationshipOptions, {
      maxSelections: 4,
      exclusiveOptionSlugs: ["not-sure-yet"],
    }),
  },
  {
    number: 29,
    id: "exterior.outdoor-living",
    zoneId: "exterior-and-site",
    prompt: "Which outdoor-living features matter?",
    sceneAnchor: "patio",
    cameraKey: "outdoor-living",
    response: multiChoiceResponse("features", "Outdoor-living features", outdoorLivingOptions, {
      exclusiveOptionSlugs: ["not-sure-yet"],
    }),
  },
  {
    number: 30,
    id: "home.specialty-spaces",
    zoneId: "exterior-and-site",
    prompt: "Which specialty spaces or future additions should be considered?",
    sceneAnchor: "outbuilding-plan",
    cameraKey: "specialty-spaces",
    response: multiChoiceResponse("spaces", "Specialty spaces", specialtySpaceOptions, {
      exclusiveOptionSlugs: ["none", "not-sure-yet"],
    }),
  },
  {
    number: 31,
    id: "design.feeling",
    zoneId: "design-desk-and-review",
    prompt: "How should the new home feel?",
    helper: "You may also add a short note about what you like or dislike in your current home.",
    sceneAnchor: "mood-board",
    cameraKey: "design-feeling",
    response: feelingResponse,
  },
  {
    number: 32,
    id: "design.references",
    zoneId: "design-desk-and-review",
    prompt: "What plans, images, websites, or homes communicate your direction?",
    helper: "Add approved files or http/https links with an optional note, or say that you do not have references yet.",
    sceneAnchor: "pinboard-scanner",
    cameraKey: "design-references",
    response: referencesResponse,
  },
  {
    number: 33,
    id: "design.priorities",
    zoneId: "design-desk-and-review",
    prompt: "What are your must-haves, nice-to-haves, and deal-breakers?",
    helper: "Assign selected features and up to one custom item, or choose No strong priorities yet.",
    sceneAnchor: "priority-stacks",
    cameraKey: "design-priorities",
    response: prioritiesResponse,
  },
  {
    number: 34,
    id: "project.budget-timing",
    zoneId: "design-desk-and-review",
    prompt: "What budget range and design timing are you currently planning around?",
    helper: "Budget is planning context only. Land is excluded, all features remain explorable, and no price is calculated.",
    sceneAnchor: "ruler-calendar",
    cameraKey: "budget-timing",
    response: budgetTimingResponse,
  },
  {
    number: 35,
    id: "contact.follow-up",
    zoneId: "design-desk-and-review",
    prompt: "How should h and h follow up after you submit the project brief?",
    helper: "Confirm that you are submitting an inquiry and permit project-related contact. This is not marketing consent.",
    sceneAnchor: "review-brief",
    cameraKey: "review-follow-up",
    response: followUpResponse,
  },
] as const satisfies readonly PlanHomeQuestionDefinition[];

export const planHomeV1Definition = {
  id: "plan-home-v1",
  zones: planHomeZones,
  questions: planHomeQuestions,
} as const satisfies PlanHomeDefinition;

export type PlanHomeQuestionId = (typeof planHomeQuestions)[number]["id"];
export type PlanHomeZoneId = (typeof planHomeZones)[number]["id"];

export const planHomeQuestionIds = planHomeQuestions.map(
  ({ id }) => id,
) as [PlanHomeQuestionId, ...PlanHomeQuestionId[]];
export const planHomeZoneIds = planHomeZones.map(
  ({ id }) => id,
) as [PlanHomeZoneId, ...PlanHomeZoneId[]];

export function validatePlanHomeDefinition(definition: PlanHomeDefinition) {
  const issues: string[] = [];

  if (definition.id !== "plan-home-v1") {
    issues.push("Definition ID must be plan-home-v1.");
  }
  if (definition.zones.length !== 7) {
    issues.push("Registry must contain exactly seven zones.");
  }
  if (definition.questions.length !== 35) {
    issues.push("Registry must contain exactly 35 questions.");
  }

  const zoneIds = definition.zones.map(({ id }) => id);
  if (new Set(zoneIds).size !== zoneIds.length) {
    issues.push("Registry contains a duplicate zone ID.");
  }
  definition.zones.forEach((zone, index) => {
    if (zone.order !== index + 1) {
      issues.push(`Zone ${zone.id} is not in contiguous order.`);
    }
    if (new Set(zone.sceneAnchors).size !== zone.sceneAnchors.length) {
      issues.push(`Zone ${zone.id} contains a duplicate scene anchor.`);
    }
    if (new Set(zone.cameraKeys).size !== zone.cameraKeys.length) {
      issues.push(`Zone ${zone.id} contains a duplicate camera key.`);
    }
  });

  const questionIds = definition.questions.map(({ id }) => id);
  if (new Set(questionIds).size !== questionIds.length) {
    issues.push("Registry contains a duplicate question ID.");
  }

  definition.questions.forEach((question, index) => {
    if (question.number !== index + 1) {
      issues.push(`Question ${question.id} is not in contiguous number order.`);
    }
    if (!question.prompt.trim()) {
      issues.push(`Question ${question.id} is missing public prompt copy.`);
    }

    const zone = definition.zones.find(({ id }) => id === question.zoneId);
    if (!zone) {
      issues.push(`Question ${question.id} has an invalid zone.`);
    } else {
      if (!zone.sceneAnchors.includes(question.sceneAnchor)) {
        issues.push(`Question ${question.id} has an invalid scene anchor.`);
      }
      if (!zone.cameraKeys.includes(question.cameraKey)) {
        issues.push(`Question ${question.id} has an invalid camera key.`);
      }
    }

    if (!question.response.responseSchema.safeParse(question.response.defaultAnswer).success) {
      issues.push(`Question ${question.id} has an incompatible default answer.`);
    }
    if (!question.response.answerSchema.safeParse(question.response.exampleAnswer).success) {
      issues.push(`Question ${question.id} has an incompatible answer schema.`);
    }

    const optionGroupIds = question.response.optionGroups.map(({ id }) => id);
    if (new Set(optionGroupIds).size !== optionGroupIds.length) {
      issues.push(`Question ${question.id} contains a duplicate option-group ID.`);
    }

    for (const group of question.response.optionGroups) {
      const slugs = group.options.map(({ slug }) => slug);
      if (new Set(slugs).size !== slugs.length) {
        issues.push(`Question ${question.id} contains a duplicate option slug.`);
      }

      const exclusiveSlugs = group.exclusiveOptionSlugs ?? [];
      for (const slug of exclusiveSlugs) {
        if (!slugs.includes(slug)) {
          issues.push(`Question ${question.id} has an unknown exclusive option.`);
        }
      }

      const specialOptions = group.options.filter(({ semantic }) => semantic !== undefined);
      const isMultiOptionGroup =
        question.response.kind === "multi-choice" ||
        group.maxSelections !== undefined ||
        group.exclusiveOptionSlugs !== undefined;
      if (
        isMultiOptionGroup &&
        specialOptions.length > 0 &&
        specialOptions.some(({ slug }) => !exclusiveSlugs.includes(slug))
      ) {
        issues.push(
          `Question ${question.id} has invalid uncertainty or exclusive-option configuration.`,
        );
      }
    }

    try {
      const summary = question.response.summarize(question.response.exampleAnswer);
      if (!summary.trim()) {
        issues.push(`Question ${question.id} has an empty answer summary.`);
      }
    } catch {
      issues.push(`Question ${question.id} cannot summarize a valid answer.`);
    }
  });

  return issues;
}

export function getPlanHomeQuestion(id: string) {
  return planHomeQuestions.find((question) => question.id === id);
}

export function validatePlanHomeAnswer(id: string, answer: unknown) {
  const question = getPlanHomeQuestion(id);
  if (!question) {
    return {
      success: false as const,
      issues: [`Unknown Plan Your Home question ID: ${id}`],
    };
  }

  const result = question.response.answerSchema.safeParse(answer);
  if (!result.success) {
    return {
      success: false as const,
      issues: result.error.issues.map((issue) => issue.message),
    };
  }

  return { success: true as const, data: result.data };
}

export function summarizePlanHomeAnswer(id: string, answer: unknown) {
  const question = getPlanHomeQuestion(id);
  if (!question) {
    throw new Error(`Unknown Plan Your Home question ID: ${id}`);
  }

  return question.response.summarize(answer);
}

export function summarizePlanHomeReferences(
  references: readonly PlanHomeReferenceMetadata[],
) {
  return referencesResponse.summarize({ references, noReferencesYet: false });
}
