export const generalInquiryProjectTypeValues = [
  "single-family",
  "remodel-addition",
  "multifamily-townhomes",
  "commercial",
  "land-site-development",
  "other-not-sure",
] as const;

export type GeneralInquiryProjectType =
  (typeof generalInquiryProjectTypeValues)[number];

export type GeneralInquiryFormValues = {
  name: string;
  phone: string;
  email: string;
  projectType: GeneralInquiryProjectType | "";
  projectLocation: string;
  projectDescription: string;
  sourcePage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  company: string;
};

export type GeneralInquiryFieldName = keyof GeneralInquiryFormValues;

export type GeneralInquiryFieldErrors = Partial<
  Record<GeneralInquiryFieldName, string>
>;

export type GeneralInquirySubmissionInput = {
  schemaVersion: 1;
  experience: "general-inquiry";
  name: string;
  phone: string | null;
  email: string | null;
  projectType: GeneralInquiryProjectType;
  projectLocation: string | null;
  projectDescription: string;
  sourcePage: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

export type InquiryActionState = {
  status: "idle" | "field-error" | "server-error";
  message?: string;
  fieldErrors: GeneralInquiryFieldErrors;
  values?: GeneralInquiryFormValues;
  attempt: number;
};

export const inquiryActionInitialState: InquiryActionState = {
  status: "idle",
  fieldErrors: {},
  attempt: 0,
};
