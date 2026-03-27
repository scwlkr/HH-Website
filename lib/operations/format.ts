import type { FinishLevelSlug } from "@/types/content";
import type { PricingSettings, ProjectStatus } from "@/types/operations";

export function getProjectStatusLabel(status: ProjectStatus) {
  return status === "for-sale" ? "For Sale" : "Sold";
}

export function formatProjectBathrooms(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

export function formatCurrencyValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDirectionalPrice(value: number | null) {
  return value !== null
    ? `${formatCurrencyValue(value)} / sq ft`
    : "Pricing benchmark pending";
}

export function getDirectionalPriceForFinish(
  pricingSettings: PricingSettings,
  finishSlug: FinishLevelSlug,
) {
  switch (finishSlug) {
    case "builder-grade":
      return pricingSettings.builderGradePricePerSqft;
    case "builder-plus":
      return pricingSettings.builderPlusPricePerSqft;
    case "custom":
      return pricingSettings.customPricePerSqft;
  }
}
