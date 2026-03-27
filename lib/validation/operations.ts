import { z } from "zod";
import { buildTypeSlugs, finishLevelSlugs } from "@/lib/content";
import { slugify } from "@/lib/utils/slugify";
import { projectStatusValues } from "@/types/operations";
import type {
  AdminLoginActionState,
  AdminLoginFieldErrors,
  AdminLoginValues,
  ExistingProjectImageFormInput,
  PricingActionState,
  PricingFieldErrors,
  PricingFormValues,
  PricingWriteInput,
  ProjectActionState,
  ProjectFieldErrors,
  ProjectFormValues,
  ProjectWriteInput,
} from "@/types/operations";

const buildTypeEnum = z.enum(buildTypeSlugs);
const finishLevelEnum = z.enum(finishLevelSlugs);
const projectStatusEnum = z.enum(projectStatusValues);

const maxProjectImageBytes = 10 * 1024 * 1024;
const allowedProjectImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function normalizeSingleLineText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMultilineText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeEmail(value: unknown) {
  return normalizeSingleLineText(value).toLowerCase();
}

function normalizeSlugValue(value: unknown) {
  return slugify(normalizeSingleLineText(value));
}

function normalizeEnumValue(value: unknown) {
  return normalizeSingleLineText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBooleanValue(value: unknown) {
  return value === "on" || value === true;
}

function normalizeOptionalText(value: unknown) {
  const normalizedValue = normalizeSingleLineText(value);
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function parseInteger(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, "");

  if (!digitsOnly) {
    return null;
  }

  const parsedValue = Number.parseInt(digitsOnly, 10);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseDecimal(value: string) {
  const normalizedValue = value.replace(/[^0-9.]/g, "");

  if (!normalizedValue || !/^\d+(\.\d+)?$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number.parseFloat(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function validateImageFile(file: File | null) {
  if (!file || file.size === 0) {
    return false;
  }

  if (!allowedProjectImageTypes.has(file.type)) {
    return false;
  }

  return file.size <= maxProjectImageBytes;
}

const titleSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(2, "Add a project title.")
    .max(120, "Keep the title under 120 characters."),
);

const slugSchema = z.preprocess(
  normalizeSlugValue,
  z
    .string()
    .min(2, "Add a slug for the public route.")
    .max(120, "Keep the slug under 120 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
);

const statusSchema = z.preprocess(normalizeEnumValue, projectStatusEnum);
const buildTypeSchema = z.preprocess(normalizeEnumValue, buildTypeEnum);
const finishLevelSchema = z.preprocess(normalizeEnumValue, finishLevelEnum);

const squareFootageSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(1, "Add the square footage.")
    .refine(
      (value) => {
        const parsedValue = parseInteger(value);
        return parsedValue !== null && parsedValue >= 100 && parsedValue <= 500000;
      },
      "Use a realistic square-footage value.",
    ),
);

const bedroomsSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(1, "Add the bedroom count.")
    .refine((value) => {
      const parsedValue = parseInteger(value);
      return parsedValue !== null && parsedValue >= 1 && parsedValue <= 20;
    }, "Use a realistic bedroom count."),
);

const bathroomsSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(1, "Add the bathroom count.")
    .refine((value) => {
      const parsedValue = parseDecimal(value);
      return parsedValue !== null && parsedValue >= 1 && parsedValue <= 20;
    }, "Use a realistic bathroom count."),
);

const locationSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(2, "Add the project location.")
    .max(160, "Keep the location under 160 characters."),
);

const shortDescriptionSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(12, "Add a short description for the listing card.")
    .max(240, "Keep the short description under 240 characters."),
);

const fullDescriptionSchema = z.preprocess(
  normalizeMultilineText,
  z
    .string()
    .min(24, "Add a fuller project description.")
    .max(4000, "Keep the full description under 4,000 characters."),
);

const coverAltTextSchema = z.preprocess(
  normalizeOptionalText,
  z
    .string()
    .max(160, "Keep the cover alt text under 160 characters.")
    .optional(),
);

const projectFormSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  status: statusSchema,
  buildTypeSlug: buildTypeSchema,
  finishLevelSlug: finishLevelSchema,
  squareFootage: squareFootageSchema,
  bedrooms: bedroomsSchema,
  bathrooms: bathroomsSchema,
  location: locationSchema,
  shortDescription: shortDescriptionSchema,
  fullDescription: fullDescriptionSchema,
  featured: z.preprocess(normalizeBooleanValue, z.boolean()),
  coverAltText: coverAltTextSchema,
});
type ValidProjectFormValues = z.infer<typeof projectFormSchema>;

const pricingNumberSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(1, "Add a pricing benchmark.")
    .refine((value) => {
      const parsedValue = parseDecimal(value);
      return parsedValue !== null && parsedValue > 0 && parsedValue <= 10000;
    }, "Use a realistic dollar-per-square-foot value."),
);

const pricingNoteSchema = z.preprocess(
  normalizeMultilineText,
  z
    .string()
    .max(600, "Keep the pricing note under 600 characters.")
    .optional(),
);

const pricingFormSchema = z.object({
  builderGradePricePerSqft: pricingNumberSchema,
  builderPlusPricePerSqft: pricingNumberSchema,
  customPricePerSqft: pricingNumberSchema,
  pricingNote: pricingNoteSchema,
});
type ValidPricingFormValues = z.infer<typeof pricingFormSchema>;

const adminLoginSchema = z.object({
  email: z.preprocess(
    normalizeEmail,
    z
      .string()
      .email("Enter a valid email address.")
      .max(160, "Keep the email under 160 characters."),
  ),
  password: z.preprocess(
    normalizeSingleLineText,
    z
      .string()
      .min(8, "Enter the account password.")
      .max(160, "Keep the password under 160 characters."),
  ),
});

export function getProjectFormValues(formData: FormData): ProjectFormValues {
  return {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    status: String(formData.get("status") ?? "") as ProjectFormValues["status"],
    buildTypeSlug: String(formData.get("buildTypeSlug") ?? "") as ProjectFormValues["buildTypeSlug"],
    finishLevelSlug: String(formData.get("finishLevelSlug") ?? "") as ProjectFormValues["finishLevelSlug"],
    squareFootage: String(formData.get("squareFootage") ?? ""),
    bedrooms: String(formData.get("bedrooms") ?? ""),
    bathrooms: String(formData.get("bathrooms") ?? ""),
    location: String(formData.get("location") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    fullDescription: String(formData.get("fullDescription") ?? ""),
    featured: formData.get("featured") === "on",
    coverAltText: String(formData.get("coverAltText") ?? ""),
  };
}

export function validateProjectFormValues(values: ProjectFormValues) {
  return projectFormSchema.safeParse(values);
}

export function mapProjectFieldErrors(error: z.ZodError<ValidProjectFormValues>) {
  return error.flatten().fieldErrors as ProjectFieldErrors;
}

export function toProjectWriteInput(values: ValidProjectFormValues): ProjectWriteInput {
  const parsedSquareFootage = parseInteger(values.squareFootage);
  const parsedBedrooms = parseInteger(values.bedrooms);
  const parsedBathrooms = parseDecimal(values.bathrooms);

  if (
    parsedSquareFootage === null ||
    parsedBedrooms === null ||
    parsedBathrooms === null ||
    !values.status ||
    !values.buildTypeSlug ||
    !values.finishLevelSlug
  ) {
    throw new Error("Project values could not be parsed.");
  }

  return {
    title: normalizeSingleLineText(values.title),
    slug: normalizeSlugValue(values.slug),
    status: values.status,
    buildTypeSlug: values.buildTypeSlug as ProjectWriteInput["buildTypeSlug"],
    finishLevelSlug: values.finishLevelSlug as ProjectWriteInput["finishLevelSlug"],
    squareFootage: parsedSquareFootage,
    bedrooms: parsedBedrooms,
    bathrooms: parsedBathrooms,
    location: normalizeSingleLineText(values.location),
    shortDescription: normalizeSingleLineText(values.shortDescription),
    fullDescription: normalizeMultilineText(values.fullDescription),
    featured: values.featured,
    coverAltText: normalizeOptionalText(values.coverAltText) ?? null,
  };
}

export function getPricingFormValues(formData: FormData): PricingFormValues {
  return {
    builderGradePricePerSqft: String(formData.get("builderGradePricePerSqft") ?? ""),
    builderPlusPricePerSqft: String(formData.get("builderPlusPricePerSqft") ?? ""),
    customPricePerSqft: String(formData.get("customPricePerSqft") ?? ""),
    pricingNote: String(formData.get("pricingNote") ?? ""),
  };
}

export function validatePricingFormValues(values: PricingFormValues) {
  return pricingFormSchema.safeParse(values);
}

export function mapPricingFieldErrors(error: z.ZodError<ValidPricingFormValues>) {
  return error.flatten().fieldErrors as PricingFieldErrors;
}

export function toPricingWriteInput(values: ValidPricingFormValues): PricingWriteInput {
  const builderGradePricePerSqft = parseDecimal(values.builderGradePricePerSqft);
  const builderPlusPricePerSqft = parseDecimal(values.builderPlusPricePerSqft);
  const customPricePerSqft = parseDecimal(values.customPricePerSqft);

  if (
    builderGradePricePerSqft === null ||
    builderPlusPricePerSqft === null ||
    customPricePerSqft === null
  ) {
    throw new Error("Pricing values could not be parsed.");
  }

  const normalizedPricingNote = normalizeMultilineText(values.pricingNote);

  return {
    builderGradePricePerSqft,
    builderPlusPricePerSqft,
    customPricePerSqft,
    pricingNote: normalizedPricingNote.length > 0 ? normalizedPricingNote : null,
  };
}

export function getAdminLoginValues(formData: FormData): AdminLoginValues {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

export function validateAdminLoginValues(values: AdminLoginValues) {
  return adminLoginSchema.safeParse(values);
}

export function mapAdminLoginFieldErrors(error: z.ZodError<AdminLoginValues>) {
  return error.flatten().fieldErrors as AdminLoginFieldErrors;
}

export function parseExistingProjectImageInputs(formData: FormData) {
  const imageMap = new Map<string, ExistingProjectImageFormInput>();
  const selectedCoverImageId = normalizeSingleLineText(formData.get("coverImageId"));

  for (const [key, rawValue] of formData.entries()) {
    if (key.startsWith("existingImageAltText:")) {
      const imageId = key.slice("existingImageAltText:".length);
      imageMap.set(imageId, {
        ...(imageMap.get(imageId) ?? {
          id: imageId,
          altText: "",
          sortOrder: 0,
          remove: false,
          isCover: false,
        }),
        altText: normalizeSingleLineText(rawValue),
      });
    }

    if (key.startsWith("existingImageSortOrder:")) {
      const imageId = key.slice("existingImageSortOrder:".length);
      const parsedSortOrder = parseInteger(String(rawValue));
      imageMap.set(imageId, {
        ...(imageMap.get(imageId) ?? {
          id: imageId,
          altText: "",
          sortOrder: 0,
          remove: false,
          isCover: false,
        }),
        sortOrder: parsedSortOrder ?? 0,
      });
    }

    if (key.startsWith("existingImageRemove:")) {
      const imageId = key.slice("existingImageRemove:".length);
      imageMap.set(imageId, {
        ...(imageMap.get(imageId) ?? {
          id: imageId,
          altText: "",
          sortOrder: 0,
          remove: false,
          isCover: false,
        }),
        remove: normalizeBooleanValue(rawValue),
      });
    }
  }

  return [...imageMap.values()]
    .map((image) => ({
      ...image,
      isCover: image.id === selectedCoverImageId,
    }))
    .sort((leftImage, rightImage) => leftImage.sortOrder - rightImage.sortOrder);
}

export function getProjectUploads(formData: FormData) {
  const coverImageCandidate = formData.get("coverImage");
  const coverImage =
    coverImageCandidate instanceof File && coverImageCandidate.size > 0
      ? coverImageCandidate
      : null;
  const galleryImages = formData
    .getAll("galleryImages")
    .filter((value): value is File => value instanceof File && value.size > 0);

  return {
    coverImage,
    galleryImages,
  };
}

export function validateProjectUploads(input: {
  coverImage: File | null;
  galleryImages: File[];
  requireCoverImage: boolean;
}) {
  if (input.requireCoverImage && !validateImageFile(input.coverImage)) {
    return {
      fieldErrors: {
        coverImage: "Upload a cover image as JPG, PNG, WebP, or AVIF (max 10 MB).",
      } satisfies ProjectFieldErrors,
    };
  }

  if (input.coverImage && !validateImageFile(input.coverImage)) {
    return {
      fieldErrors: {
        coverImage: "Cover image must be JPG, PNG, WebP, or AVIF and under 10 MB.",
      } satisfies ProjectFieldErrors,
    };
  }

  const hasInvalidGalleryImage = input.galleryImages.some(
    (file) => !validateImageFile(file),
  );

  if (hasInvalidGalleryImage) {
    return {
      fieldErrors: {
        galleryImages:
          "All gallery uploads must be JPG, PNG, WebP, or AVIF and under 10 MB.",
      } satisfies ProjectFieldErrors,
    };
  }

  return null;
}

export function createProjectServerErrorState(message: string): ProjectActionState {
  return {
    status: "server-error",
    message,
    fieldErrors: {},
  };
}

export function createPricingServerErrorState(message: string): PricingActionState {
  return {
    status: "server-error",
    message,
    fieldErrors: {},
  };
}

export function createAdminLoginServerErrorState(
  message: string,
): AdminLoginActionState {
  return {
    status: "server-error",
    message,
    fieldErrors: {},
  };
}
