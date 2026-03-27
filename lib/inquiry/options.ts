import { buildTypes, finishLevels } from "@/lib/content";
import type {
  InquiryBudgetRange,
  InquiryFinishLevel,
  InquiryLotStatus,
  InquiryPreferredContactMethod,
  InquiryProjectType,
  InquiryServiceNeeded,
  InquiryStepId,
  InquiryTimeline,
} from "@/types/inquiry";

export type InquiryOption<TValue extends string> = {
  value: TValue;
  label: string;
  description?: string;
};

export type InquiryProgressStep = {
  id: InquiryStepId;
  label: string;
  title: string;
  description: string;
};

export const projectTypeOptions = [
  ...buildTypes.map((buildType) => ({
    value: buildType.slug,
    label: buildType.title,
    description: buildType.tagline,
  })),
  {
    value: "not-sure-yet",
    label: "Not Sure Yet",
    description: "The category is still taking shape.",
  },
] satisfies ReadonlyArray<InquiryOption<InquiryProjectType>>;

export const finishLevelOptions = [
  ...finishLevels.map((finishLevel) => ({
    value: finishLevel.slug,
    label: finishLevel.title,
    description: finishLevel.tagline,
  })),
  {
    value: "not-sure-yet",
    label: "Not Sure Yet",
    description: "The finish direction still needs discussion.",
  },
] satisfies ReadonlyArray<InquiryOption<InquiryFinishLevel>>;

export const preferredContactMethodOptions = [
  {
    value: "email",
    label: "Email",
    description: "Best when the response needs a written recap.",
  },
  {
    value: "phone",
    label: "Phone",
    description: "Best when timing and scope need a direct conversation.",
  },
  {
    value: "text",
    label: "Text",
    description: "Best when a quick first reply is easiest.",
  },
] satisfies ReadonlyArray<InquiryOption<InquiryPreferredContactMethod>>;

export const servicesNeededOptions = [
  {
    value: "architectural-design",
    label: "Architectural Design",
    description: "Planning, layouts, and design direction.",
  },
  {
    value: "building",
    label: "Building",
    description: "Construction delivery and execution.",
  },
  {
    value: "land-development",
    label: "Land Development",
    description: "Lot fit, development thinking, and site coordination.",
  },
  {
    value: "not-sure-yet",
    label: "Not Sure Yet",
    description: "The service mix still needs to be clarified.",
  },
] satisfies ReadonlyArray<InquiryOption<InquiryServiceNeeded>>;

export const lotStatusOptions = [
  {
    value: "already-owned",
    label: "Already Owned",
    description: "A specific lot or property is already secured.",
  },
  {
    value: "actively-looking",
    label: "Actively Looking",
    description: "The property search is underway now.",
  },
  {
    value: "evaluating-options",
    label: "Evaluating Options",
    description: "A few sites or directions are being compared.",
  },
  {
    value: "not-sure-yet",
    label: "Not Sure Yet",
    description: "Lot status is still open or not applicable yet.",
  },
] satisfies ReadonlyArray<InquiryOption<InquiryLotStatus>>;

export const timelineOptions = [
  {
    value: "asap",
    label: "As Soon As Practical",
    description: "The project needs to start moving right away.",
  },
  {
    value: "0-3-months",
    label: "Within 3 Months",
    description: "Early planning should begin soon.",
  },
  {
    value: "3-6-months",
    label: "3 To 6 Months",
    description: "The project is forming but not urgent this month.",
  },
  {
    value: "6-12-months",
    label: "6 To 12 Months",
    description: "The work is on a medium-term horizon.",
  },
  {
    value: "12-plus-months",
    label: "12+ Months",
    description: "The project is real, but later in the queue.",
  },
  {
    value: "just-exploring",
    label: "Just Exploring",
    description: "Still gathering direction before committing to a timeline.",
  },
] satisfies ReadonlyArray<InquiryOption<InquiryTimeline>>;

export const budgetRangeOptions = [
  {
    value: "under-500k",
    label: "Under $500K",
  },
  {
    value: "500k-1m",
    label: "$500K To $1M",
  },
  {
    value: "1m-2m",
    label: "$1M To $2M",
  },
  {
    value: "2m-5m",
    label: "$2M To $5M",
  },
  {
    value: "5m-plus",
    label: "$5M+",
  },
  {
    value: "not-sure-yet",
    label: "Not Sure Yet",
  },
] satisfies ReadonlyArray<InquiryOption<InquiryBudgetRange>>;

export const inquiryProgressSteps = [
  {
    id: "contact",
    label: "01",
    title: "Contact",
    description: "How HH should respond once the brief is reviewed.",
  },
  {
    id: "project-basics",
    label: "02",
    title: "Project Basics",
    description: "Category, size, finish direction, and service mix.",
  },
  {
    id: "site-context",
    label: "03",
    title: "Site Context",
    description: "Location, lot status, timing, and optional investment range.",
  },
  {
    id: "description",
    label: "04",
    title: "Priorities",
    description: "A short description of the project and what matters most.",
  },
  {
    id: "review",
    label: "05",
    title: "Review",
    description: "A final pass before the brief is sent.",
  },
] satisfies ReadonlyArray<InquiryProgressStep>;

function getOptionLabel<TValue extends string>(
  options: ReadonlyArray<InquiryOption<TValue>>,
  value: TValue | "" | null | undefined,
) {
  if (!value) {
    return null;
  }

  return options.find((option) => option.value === value)?.label ?? null;
}

export function getProjectTypeLabel(value: InquiryProjectType | "" | null | undefined) {
  return getOptionLabel(projectTypeOptions, value);
}

export function getFinishLevelLabel(value: InquiryFinishLevel | "" | null | undefined) {
  return getOptionLabel(finishLevelOptions, value);
}

export function getPreferredContactMethodLabel(
  value: InquiryPreferredContactMethod | "" | null | undefined,
) {
  return getOptionLabel(preferredContactMethodOptions, value);
}

export function getLotStatusLabel(value: InquiryLotStatus | "" | null | undefined) {
  return getOptionLabel(lotStatusOptions, value);
}

export function getTimelineLabel(value: InquiryTimeline | "" | null | undefined) {
  return getOptionLabel(timelineOptions, value);
}

export function getBudgetRangeLabel(value: InquiryBudgetRange | "" | null | undefined) {
  return getOptionLabel(budgetRangeOptions, value);
}

export function getServiceNeededLabel(
  value: InquiryServiceNeeded | "" | null | undefined,
) {
  return getOptionLabel(servicesNeededOptions, value);
}
