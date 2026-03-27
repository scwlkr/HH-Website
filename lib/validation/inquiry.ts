import { z } from "zod";
import { buildTypeSlugs, finishLevelSlugs } from "@/lib/content";
import type {
  InquiryActionState,
  InquiryBudgetRange,
  InquiryFieldErrors,
  InquiryFieldName,
  InquiryFinishLevel,
  InquiryFormValues,
  InquiryLotStatus,
  InquiryPreferredContactMethod,
  InquiryProjectType,
  InquiryServiceNeeded,
  InquirySubmissionInput,
  InquiryTimeline,
} from "@/types/inquiry";

const buildTypeEnum = z.enum(buildTypeSlugs as [InquiryProjectType, ...InquiryProjectType[]]);
const finishLevelEnum = z.enum(
  finishLevelSlugs as [InquiryFinishLevel, ...InquiryFinishLevel[]],
);

const preferredContactMethodValues = ["email", "phone", "text"] as const;
const preferredContactMethodEnum = z.enum(preferredContactMethodValues);

const lotStatusValues = [
  "already-owned",
  "actively-looking",
  "evaluating-options",
  "not-sure-yet",
] as const;
const lotStatusEnum = z.enum(lotStatusValues);

const servicesNeededValues = [
  "architectural-design",
  "building",
  "land-development",
  "not-sure-yet",
] as const;
const servicesNeededEnum = z.enum(servicesNeededValues);

const timelineValues = [
  "asap",
  "0-3-months",
  "3-6-months",
  "6-12-months",
  "12-plus-months",
  "just-exploring",
] as const;
const timelineEnum = z.enum(timelineValues);

const budgetRangeValues = [
  "under-500k",
  "500k-1m",
  "1m-2m",
  "2m-5m",
  "5m-plus",
  "not-sure-yet",
] as const;
const budgetRangeEnum = z.enum(budgetRangeValues);

const projectTypeEnum = z.union([buildTypeEnum, z.literal("not-sure-yet")]);
const inquiryFinishLevelEnum = z.union([finishLevelEnum, z.literal("not-sure-yet")]);

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

function normalizeEnumValue(value: unknown) {
  return normalizeSingleLineText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeOptionalText(value: unknown) {
  const normalizedValue = normalizeSingleLineText(value);
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function normalizeOptionalSourcePath(value: unknown) {
  const normalizedValue = normalizeSingleLineText(value);

  if (!normalizedValue || !normalizedValue.startsWith("/")) {
    return undefined;
  }

  return normalizedValue.slice(0, 200);
}

function normalizeServicesNeeded(value: unknown) {
  if (!Array.isArray(value)) {
    if (typeof value === "string") {
      const normalizedValue = normalizeEnumValue(value);
      return normalizedValue ? [normalizedValue] : [];
    }

    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => normalizeEnumValue(item))
    .filter((item) => item.length > 0);
}

function countPhoneDigits(value: string) {
  return value.replace(/\D/g, "").length;
}

function parseSquareFootage(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, "");

  if (!digitsOnly) {
    return null;
  }

  const parsed = Number.parseInt(digitsOnly, 10);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

const nameSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(2, "Please share your name.")
    .max(120, "Keep the name under 120 characters."),
);

const phoneSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(7, "Please share a phone number.")
    .max(32, "Keep the phone number under 32 characters.")
    .refine(
      (value) => countPhoneDigits(value) >= 10,
      "Please provide a phone number with at least 10 digits.",
    ),
);

const emailSchema = z.preprocess(
  normalizeEmail,
  z
    .string()
    .email("Please provide a valid email address.")
    .max(160, "Keep the email address under 160 characters."),
);

const preferredContactMethodSchema = z.preprocess(
  normalizeEnumValue,
  preferredContactMethodEnum,
);

const projectTypeSchema = z.preprocess(normalizeEnumValue, projectTypeEnum);

const approxSquareFootageSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(1, "Please share an approximate square footage.")
    .max(40, "Keep the square footage estimate concise.")
    .refine(
      (value) => parseSquareFootage(value) !== null,
      "Please provide a numeric square footage estimate.",
    )
    .refine((value) => {
      const parsedValue = parseSquareFootage(value);
      return parsedValue !== null && parsedValue >= 100 && parsedValue <= 500000;
    }, "Please provide a realistic square footage estimate."),
);

const finishLevelSchema = z.preprocess(
  normalizeEnumValue,
  inquiryFinishLevelEnum,
);

const servicesNeededSchema = z.preprocess(
  normalizeServicesNeeded,
  z
    .array(servicesNeededEnum)
    .min(1, "Select at least one service area.")
    .max(4, "Too many service selections were submitted.")
    .refine(
      (values) => new Set(values).size === values.length,
      "Each service area only needs to be selected once.",
    )
    .refine(
      (values) => !(values.includes("not-sure-yet") && values.length > 1),
      "Choose either specific services or “Not Sure Yet,” not both.",
    ),
);

const projectLocationSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(2, "Please share the project location or target area.")
    .max(160, "Keep the location under 160 characters."),
);

const lotStatusSchema = z.preprocess(normalizeEnumValue, lotStatusEnum);

const timelineSchema = z.preprocess(normalizeEnumValue, timelineEnum);

const budgetRangeSchema = z.preprocess(
  (value) => {
    const normalizedValue = normalizeEnumValue(value);
    return normalizedValue.length > 0 ? normalizedValue : undefined;
  },
  budgetRangeEnum.optional(),
);

const projectDescriptionSchema = z.preprocess(
  normalizeMultilineText,
  z
    .string()
    .min(24, "Add a few sentences on the project and its priorities.")
    .max(1600, "Keep the description under 1,600 characters."),
);

const sourcePageSchema = z.preprocess(
  normalizeOptionalSourcePath,
  z
    .string()
    .max(200, "Source page is too long.")
    .regex(/^\/[^\s]*$/, "Source page must be a relative path.")
    .optional(),
);

const utmValueSchema = z.preprocess(
  normalizeOptionalText,
  z.string().max(120, "Tracking values must stay under 120 characters.").optional(),
);

const honeypotSchema = z.preprocess(
  normalizeSingleLineText,
  z.string().max(0, "Leave this field empty.").optional(),
);

export const inquiryFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  preferredContactMethod: preferredContactMethodSchema,
  projectType: projectTypeSchema,
  approxSquareFootage: approxSquareFootageSchema,
  finishLevel: finishLevelSchema,
  servicesNeeded: servicesNeededSchema,
  projectLocation: projectLocationSchema,
  lotStatus: lotStatusSchema,
  timeline: timelineSchema,
  budgetRange: budgetRangeSchema,
  projectDescription: projectDescriptionSchema,
  sourcePage: sourcePageSchema,
  utmSource: utmValueSchema,
  utmMedium: utmValueSchema,
  utmCampaign: utmValueSchema,
  company: honeypotSchema,
});

export const inquiryStepSchemas = {
  contact: inquiryFormSchema.pick({
    name: true,
    phone: true,
    email: true,
    preferredContactMethod: true,
  }),
  projectBasics: inquiryFormSchema.pick({
    projectType: true,
    approxSquareFootage: true,
    finishLevel: true,
    servicesNeeded: true,
  }),
  siteContext: inquiryFormSchema.pick({
    projectLocation: true,
    lotStatus: true,
    timeline: true,
    budgetRange: true,
  }),
  description: inquiryFormSchema.pick({
    projectDescription: true,
  }),
};

export const emptyInquiryFormValues: InquiryFormValues = {
  name: "",
  phone: "",
  email: "",
  preferredContactMethod: "",
  projectType: "",
  approxSquareFootage: "",
  finishLevel: "",
  servicesNeeded: [],
  projectLocation: "",
  lotStatus: "",
  timeline: "",
  budgetRange: "",
  projectDescription: "",
  sourcePage: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  company: "",
};

export function createInquiryInitialValues({
  buildType,
  finish,
  utmSource,
  utmMedium,
  utmCampaign,
}: {
  buildType?: string;
  finish?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} = {}) {
  const normalizedProjectType = normalizeEnumValue(buildType);
  const normalizedFinishLevel = normalizeEnumValue(finish);

  return {
    ...emptyInquiryFormValues,
    projectType: projectTypeSchema.safeParse(normalizedProjectType).success
      ? (normalizedProjectType as InquiryProjectType)
      : "",
    finishLevel: finishLevelSchema.safeParse(normalizedFinishLevel).success
      ? (normalizedFinishLevel as InquiryFinishLevel)
      : "",
    utmSource: normalizeSingleLineText(utmSource),
    utmMedium: normalizeSingleLineText(utmMedium),
    utmCampaign: normalizeSingleLineText(utmCampaign),
  } satisfies InquiryFormValues;
}

export function getInquiryFormValues(formData: FormData): InquiryFormValues {
  const getStringValue = (fieldName: keyof InquiryFormValues) => {
    const value = formData.get(fieldName);
    return typeof value === "string" ? value : "";
  };

  return {
    name: getStringValue("name"),
    phone: getStringValue("phone"),
    email: getStringValue("email"),
    preferredContactMethod: getStringValue(
      "preferredContactMethod",
    ) as InquiryFormValues["preferredContactMethod"],
    projectType: getStringValue("projectType") as InquiryFormValues["projectType"],
    approxSquareFootage: getStringValue("approxSquareFootage"),
    finishLevel: getStringValue("finishLevel") as InquiryFormValues["finishLevel"],
    servicesNeeded: formData
      .getAll("servicesNeeded")
      .filter((value): value is string => typeof value === "string") as InquiryServiceNeeded[],
    projectLocation: getStringValue("projectLocation"),
    lotStatus: getStringValue("lotStatus") as InquiryFormValues["lotStatus"],
    timeline: getStringValue("timeline") as InquiryFormValues["timeline"],
    budgetRange: getStringValue("budgetRange") as InquiryFormValues["budgetRange"],
    projectDescription: getStringValue("projectDescription"),
    sourcePage: getStringValue("sourcePage"),
    utmSource: getStringValue("utmSource"),
    utmMedium: getStringValue("utmMedium"),
    utmCampaign: getStringValue("utmCampaign"),
    company: getStringValue("company"),
  };
}

export function mapInquiryFieldErrors(error: z.ZodError): InquiryFieldErrors {
  const fieldErrors: InquiryFieldErrors = {};

  for (const issue of error.issues) {
    const [fieldName] = issue.path;

    if (typeof fieldName !== "string") {
      continue;
    }

    const typedFieldName = fieldName as InquiryFieldName;

    if (!fieldErrors[typedFieldName]) {
      fieldErrors[typedFieldName] = issue.message;
    }
  }

  return fieldErrors;
}

export function validateInquiryValues(values: InquiryFormValues) {
  return inquiryFormSchema.safeParse(values);
}

export function toInquirySubmissionInput(values: InquiryFormValues): InquirySubmissionInput {
  const parsedValues = inquiryFormSchema.parse(values);
  const approxSquareFootage = parseSquareFootage(parsedValues.approxSquareFootage);

  if (approxSquareFootage === null) {
    throw new Error("Approximate square footage could not be parsed.");
  }

  return {
    name: parsedValues.name,
    phone: parsedValues.phone,
    email: parsedValues.email,
    preferredContactMethod:
      parsedValues.preferredContactMethod as InquiryPreferredContactMethod,
    projectType: parsedValues.projectType as InquiryProjectType,
    approxSquareFootage,
    finishLevel: parsedValues.finishLevel as InquiryFinishLevel,
    servicesNeeded: parsedValues.servicesNeeded as InquiryServiceNeeded[],
    projectLocation: parsedValues.projectLocation,
    lotStatus: parsedValues.lotStatus as InquiryLotStatus,
    timeline: parsedValues.timeline as InquiryTimeline,
    budgetRange: (parsedValues.budgetRange ?? null) as InquiryBudgetRange | null,
    projectDescription: parsedValues.projectDescription,
    sourcePage: parsedValues.sourcePage ?? null,
    utmSource: parsedValues.utmSource ?? null,
    utmMedium: parsedValues.utmMedium ?? null,
    utmCampaign: parsedValues.utmCampaign ?? null,
  };
}

export function createInquiryServerErrorState(
  message: string,
): InquiryActionState {
  return {
    status: "server-error",
    message,
    fieldErrors: {},
  };
}
