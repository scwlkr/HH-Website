export type AnalyticsEventName =
  | "cta_click"
  | "inquiry_start"
  | "inquiry_success";

export type AnalyticsPayloadValue = string | number | boolean;

export type AnalyticsPayload = Record<
  string,
  AnalyticsPayloadValue | null | undefined
>;

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  payload?: AnalyticsPayload;
};

type CtaAnalyticsAttributesInput = {
  label: string;
  destination: string;
  location?: string;
  context?: string;
};

export function getCtaAnalyticsAttributes({
  label,
  destination,
  location,
  context,
}: CtaAnalyticsAttributesInput) {
  return {
    "data-analytics-event": "cta_click",
    "data-analytics-label": label,
    "data-analytics-destination": destination,
    "data-analytics-location": location,
    "data-analytics-context": context,
  } as const;
}
