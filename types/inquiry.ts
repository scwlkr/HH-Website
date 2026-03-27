import type { BuildTypeSlug, FinishLevelSlug } from "@/types/content";

export type InquiryProjectType = BuildTypeSlug | "not-sure-yet";

export type InquiryFinishLevel = FinishLevelSlug | "not-sure-yet";

export type InquiryPreferredContactMethod = "email" | "phone" | "text";

export type InquiryLotStatus =
  | "already-owned"
  | "actively-looking"
  | "evaluating-options"
  | "not-sure-yet";

export type InquiryServiceNeeded =
  | "architectural-design"
  | "building"
  | "land-development"
  | "not-sure-yet";

export type InquiryTimeline =
  | "asap"
  | "0-3-months"
  | "3-6-months"
  | "6-12-months"
  | "12-plus-months"
  | "just-exploring";

export type InquiryBudgetRange =
  | "under-500k"
  | "500k-1m"
  | "1m-2m"
  | "2m-5m"
  | "5m-plus"
  | "not-sure-yet";

export type InquirySubmissionStatus = "new" | "reviewed" | "spam";

export type InquiryFormValues = {
  name: string;
  phone: string;
  email: string;
  preferredContactMethod: InquiryPreferredContactMethod | "";
  projectType: InquiryProjectType | "";
  approxSquareFootage: string;
  finishLevel: InquiryFinishLevel | "";
  servicesNeeded: InquiryServiceNeeded[];
  projectLocation: string;
  lotStatus: InquiryLotStatus | "";
  timeline: InquiryTimeline | "";
  budgetRange: InquiryBudgetRange | "";
  projectDescription: string;
  sourcePage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  company: string;
};

export type InquiryFieldName = keyof InquiryFormValues;

export type InquiryFieldErrors = Partial<Record<InquiryFieldName, string>>;

export type InquirySubmissionInput = {
  name: string;
  phone: string;
  email: string;
  preferredContactMethod: InquiryPreferredContactMethod;
  projectType: InquiryProjectType;
  approxSquareFootage: number;
  finishLevel: InquiryFinishLevel;
  servicesNeeded: InquiryServiceNeeded[];
  projectLocation: string;
  lotStatus: InquiryLotStatus;
  timeline: InquiryTimeline;
  budgetRange: InquiryBudgetRange | null;
  projectDescription: string;
  sourcePage: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

export type InquiryActionState = {
  status: "idle" | "field-error" | "server-error";
  message?: string;
  fieldErrors: InquiryFieldErrors;
};

export const inquiryActionInitialState: InquiryActionState = {
  status: "idle",
  fieldErrors: {},
};

export type InquiryStepId =
  | "contact"
  | "project-basics"
  | "site-context"
  | "description"
  | "review";
