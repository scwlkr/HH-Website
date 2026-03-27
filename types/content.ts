export type FinishLevelSlug = "builder-grade" | "builder-plus" | "custom";

export type BuildTypeSlug =
  | "single-family"
  | "multifamily"
  | "townhomes"
  | "commercial";

export type FAQGroupSlug =
  | "process"
  | "pricing"
  | "project-types"
  | "timeline"
  | "next-steps";

export type ContentImageCollection = "finishes" | "build-types";

export type ContentImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
};

export type ComparisonPoint = {
  label: string;
  value: string;
};

export type FinishLevel = {
  slug: FinishLevelSlug;
  title: string;
  shortTitle: string;
  tagline: string;
  cardSummary: string;
  detailSummary: string;
  differentiators: string[];
  includedCharacteristics: string[];
  bestFit: string[];
  comparisonPoints: ComparisonPoint[];
  gallery: ContentImage[];
};

export type BuildType = {
  slug: BuildTypeSlug;
  title: string;
  shortTitle: string;
  tagline: string;
  cardSummary: string;
  detailSummary: string;
  heroImage: ContentImage;
  gallery: ContentImage[];
  typicalConsiderations: string[];
  serviceMix: string[];
  recommendedFinishLevels: FinishLevelSlug[];
};

export type FAQGroup = {
  slug: FAQGroupSlug;
  title: string;
  description: string;
};

export type FAQItem = {
  id: string;
  group: FAQGroupSlug;
  question: string;
  answer: string;
};
