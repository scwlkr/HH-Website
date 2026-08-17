import { z } from "zod";

import {
  generalInquiryProjectTypeValues,
  type GeneralInquiryFieldErrors,
  type GeneralInquiryFieldName,
  type GeneralInquiryFormValues,
  type GeneralInquirySubmissionInput,
  type InquiryActionState,
} from "@/types/inquiry";

function normalizeSingleLineText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMultilineText(value: unknown) {
  if (typeof value !== "string") return "";
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
  const normalized = normalizeSingleLineText(value);
  return normalized || undefined;
}

function normalizeOptionalSourcePath(value: unknown) {
  const normalized = normalizeSingleLineText(value);
  return normalized.startsWith("/") ? normalized.slice(0, 200) : undefined;
}

function countPhoneDigits(value: string) {
  return value.replace(/\D/g, "").length;
}

const nameSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .min(2, "Please share your name.")
    .max(120, "Keep the name under 120 characters."),
);

const optionalPhoneSchema = z.preprocess(
  normalizeSingleLineText,
  z
    .string()
    .max(32, "Keep the phone number under 32 characters.")
    .refine(
      (value) => value.length === 0 || countPhoneDigits(value) >= 10,
      "Please provide a phone number with at least 10 digits.",
    ),
);

const optionalEmailSchema = z.preprocess(
  normalizeEmail,
  z
    .string()
    .max(160, "Keep the email address under 160 characters.")
    .refine(
      (value) => value.length === 0 || z.email().safeParse(value).success,
      "Please provide a valid email address.",
    ),
);

const projectLocationSchema = z.preprocess(
  normalizeSingleLineText,
  z.string().max(160, "Keep the location under 160 characters."),
);

const projectDescriptionSchema = z.preprocess(
  normalizeMultilineText,
  z
    .string()
    .min(10, "Tell us a little about what you are planning.")
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

export const generalInquiryFormSchema = z
  .object({
    name: nameSchema,
    phone: optionalPhoneSchema,
    email: optionalEmailSchema,
    projectType: z.preprocess(
      normalizeEnumValue,
      z.enum(generalInquiryProjectTypeValues),
    ),
    projectLocation: projectLocationSchema,
    projectDescription: projectDescriptionSchema,
    sourcePage: sourcePageSchema,
    utmSource: utmValueSchema,
    utmMedium: utmValueSchema,
    utmCampaign: utmValueSchema,
    company: honeypotSchema,
  })
  .superRefine((values, context) => {
    if (values.email.length > 0 || values.phone.length > 0) return;
    context.addIssue({
      code: "custom",
      path: ["email"],
      message: "Share an email address or phone number.",
    });
  });

export const emptyGeneralInquiryFormValues: GeneralInquiryFormValues = {
  name: "",
  phone: "",
  email: "",
  projectType: "",
  projectLocation: "",
  projectDescription: "",
  sourcePage: "/start",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  company: "",
};

function normalizeGeneralInquiryProjectType(value: unknown) {
  const normalized = normalizeEnumValue(value);
  if (normalized === "multifamily" || normalized === "townhomes") {
    return "multifamily-townhomes";
  }
  return generalInquiryProjectTypeValues.includes(
    normalized as (typeof generalInquiryProjectTypeValues)[number],
  )
    ? (normalized as GeneralInquiryFormValues["projectType"])
    : "";
}

export function createGeneralInquiryInitialValues({
  buildType,
  utmSource,
  utmMedium,
  utmCampaign,
}: {
  buildType?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} = {}): GeneralInquiryFormValues {
  return {
    ...emptyGeneralInquiryFormValues,
    projectType: normalizeGeneralInquiryProjectType(buildType),
    utmSource: normalizeSingleLineText(utmSource).slice(0, 120),
    utmMedium: normalizeSingleLineText(utmMedium).slice(0, 120),
    utmCampaign: normalizeSingleLineText(utmCampaign).slice(0, 120),
  };
}

export function getGeneralInquiryFormValues(
  formData: FormData,
): GeneralInquiryFormValues {
  const getStringValue = (fieldName: keyof GeneralInquiryFormValues) => {
    const value = formData.get(fieldName);
    return typeof value === "string" ? value : "";
  };

  return {
    name: getStringValue("name"),
    phone: getStringValue("phone"),
    email: getStringValue("email"),
    projectType: getStringValue(
      "projectType",
    ) as GeneralInquiryFormValues["projectType"],
    projectLocation: getStringValue("projectLocation"),
    projectDescription: getStringValue("projectDescription"),
    sourcePage: getStringValue("sourcePage"),
    utmSource: getStringValue("utmSource"),
    utmMedium: getStringValue("utmMedium"),
    utmCampaign: getStringValue("utmCampaign"),
    company: getStringValue("company"),
  };
}

export function validateGeneralInquiryValues(values: GeneralInquiryFormValues) {
  return generalInquiryFormSchema.safeParse(values);
}

export function toGeneralInquirySubmissionInput(
  values: GeneralInquiryFormValues,
): GeneralInquirySubmissionInput {
  const parsedValues = generalInquiryFormSchema.parse(values);
  return {
    schemaVersion: 1,
    experience: "general-inquiry",
    name: parsedValues.name,
    phone: parsedValues.phone || null,
    email: parsedValues.email || null,
    projectType: parsedValues.projectType,
    projectLocation: parsedValues.projectLocation || null,
    projectDescription: parsedValues.projectDescription,
    sourcePage: parsedValues.sourcePage ?? null,
    utmSource: parsedValues.utmSource ?? null,
    utmMedium: parsedValues.utmMedium ?? null,
    utmCampaign: parsedValues.utmCampaign ?? null,
  };
}

export function mapInquiryFieldErrors(
  error: z.ZodError,
): GeneralInquiryFieldErrors {
  const fieldErrors: GeneralInquiryFieldErrors = {};
  for (const issue of error.issues) {
    const [fieldName] = issue.path;
    if (typeof fieldName !== "string") continue;
    const typedFieldName = fieldName as GeneralInquiryFieldName;
    if (!fieldErrors[typedFieldName]) {
      fieldErrors[typedFieldName] = issue.message;
    }
  }
  return fieldErrors;
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
