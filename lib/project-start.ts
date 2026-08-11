const forwardedProjectStartParams = [
  "buildType",
  "finish",
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

export function getGenericInquiryHrefFromProjectStart(
  searchParams: ProjectStartSearchParams,
) {
  const forwarded = new URLSearchParams();

  for (const key of forwardedProjectStartParams) {
    const value = firstValue(searchParams[key]);
    if (typeof value !== "string") continue;
    const normalized = value.trim().slice(0, 120);
    if (normalized) forwarded.set(key, normalized);
  }

  const query = forwarded.toString();
  return query ? `/inquire?${query}` : "/inquire";
}
