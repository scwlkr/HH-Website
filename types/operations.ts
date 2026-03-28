import type { BuildTypeSlug, FinishLevelSlug } from "@/types/content";

export const projectStatusValues = ["for-sale", "sold"] as const;

export type ProjectStatus = (typeof projectStatusValues)[number];

export type ProjectImage = {
  id: string;
  storagePath: string;
  publicUrl: string;
  altText: string;
  sortOrder: number;
  isCover: boolean;
};

export type ProjectSummary = {
  id: string;
  slug: string;
  title: string;
  status: ProjectStatus;
  buildTypeSlug: BuildTypeSlug;
  finishLevelSlug: FinishLevelSlug;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  shortDescription: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  coverImage: ProjectImage | null;
};

export type ProjectDetail = ProjectSummary & {
  fullDescription: string;
  images: ProjectImage[];
};

export type PricingSettings = {
  builderGradePricePerSqft: number | null;
  builderPlusPricePerSqft: number | null;
  customPricePerSqft: number | null;
  pricingNote: string | null;
  updatedAt: string | null;
};

export type ExistingProjectImageFormInput = {
  id: string;
  altText: string;
  sortOrder: number;
  remove: boolean;
  isCover: boolean;
};

export type ProjectFormValues = {
  title: string;
  slug: string;
  status: ProjectStatus | "";
  buildTypeSlug: BuildTypeSlug | "";
  finishLevelSlug: FinishLevelSlug | "";
  squareFootage: string;
  bedrooms: string;
  bathrooms: string;
  location: string;
  shortDescription: string;
  fullDescription: string;
  featured: boolean;
  coverAltText: string;
};

export const emptyProjectFormValues: ProjectFormValues = {
  title: "",
  slug: "",
  status: "",
  buildTypeSlug: "",
  finishLevelSlug: "",
  squareFootage: "",
  bedrooms: "",
  bathrooms: "",
  location: "",
  shortDescription: "",
  fullDescription: "",
  featured: false,
  coverAltText: "",
};

export type ProjectFieldName = keyof ProjectFormValues | "coverImage" | "galleryImages";

export type ProjectFieldErrors = Partial<Record<ProjectFieldName, string>>;

export type ProjectWriteInput = {
  id?: string;
  title: string;
  slug: string;
  status: ProjectStatus;
  buildTypeSlug: BuildTypeSlug;
  finishLevelSlug: FinishLevelSlug;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  shortDescription: string;
  fullDescription: string;
  featured: boolean;
  coverAltText: string | null;
};

export type ProjectActionState = {
  status: "idle" | "field-error" | "server-error";
  message?: string;
  fieldErrors: ProjectFieldErrors;
  values?: ProjectFormValues;
};

export const projectActionInitialState: ProjectActionState = {
  status: "idle",
  fieldErrors: {},
};

export type PricingFormValues = {
  builderGradePricePerSqft: string;
  builderPlusPricePerSqft: string;
  customPricePerSqft: string;
  pricingNote: string;
};

export type PricingFieldName = keyof PricingFormValues;

export type PricingFieldErrors = Partial<Record<PricingFieldName, string>>;

export type PricingWriteInput = {
  builderGradePricePerSqft: number;
  builderPlusPricePerSqft: number;
  customPricePerSqft: number;
  pricingNote: string | null;
};

export type PricingActionState = {
  status: "idle" | "field-error" | "server-error";
  message?: string;
  fieldErrors: PricingFieldErrors;
};

export const pricingActionInitialState: PricingActionState = {
  status: "idle",
  fieldErrors: {},
};

export type AdminLoginValues = {
  email: string;
  password: string;
};

export type AdminLoginFieldName = keyof AdminLoginValues;

export type AdminLoginFieldErrors = Partial<Record<AdminLoginFieldName, string>>;

export type AdminLoginActionState = {
  status: "idle" | "field-error" | "server-error";
  message?: string;
  fieldErrors: AdminLoginFieldErrors;
};

export const adminLoginActionInitialState: AdminLoginActionState = {
  status: "idle",
  fieldErrors: {},
};
