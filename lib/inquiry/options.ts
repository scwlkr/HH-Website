import type { GeneralInquiryProjectType } from "@/types/inquiry";

export type InquiryOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export const generalInquiryProjectTypeOptions = [
  { value: "single-family", label: "New single-family home" },
  { value: "remodel-addition", label: "Remodel or addition" },
  { value: "multifamily-townhomes", label: "Multifamily or townhomes" },
  { value: "commercial", label: "Commercial" },
  { value: "land-site-development", label: "Land or site development" },
  { value: "other-not-sure", label: "Other or not sure" },
] satisfies ReadonlyArray<InquiryOption<GeneralInquiryProjectType>>;
