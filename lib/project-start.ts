import { buildTypeSlugs } from "@/lib/content";

const legacyInquiryAttributionParams = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
] as const;

type ProjectStartSearchParams = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

function firstValue(value: string | readonly string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getLegacyInquiryRedirectHref(
  searchParams: ProjectStartSearchParams,
) {
  const forwarded = new URLSearchParams();
  const buildType = firstValue(searchParams.buildType);

  if (
    typeof buildType === "string" &&
    buildTypeSlugs.includes(buildType.trim() as (typeof buildTypeSlugs)[number])
  ) {
    forwarded.set("buildType", buildType.trim());
  }

  for (const key of legacyInquiryAttributionParams) {
    const value = firstValue(searchParams[key]);
    if (typeof value !== "string") continue;
    const normalized = value.trim().slice(0, 120);
    if (normalized) forwarded.set(key, normalized);
  }

  const query = forwarded.toString();
  return `${query ? `/start?${query}` : "/start"}#general-inquiry`;
}
