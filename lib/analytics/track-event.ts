"use client";

import type { AnalyticsEvent, AnalyticsPayload } from "@/lib/analytics/events";

const payloadKeysByEvent = {
  cta_click: ["label", "destination", "location", "context"],
  inquiry_start: [
    "build_type_prefill",
    "finish_level_prefill",
    "utm_source",
    "utm_medium",
    "utm_campaign",
  ],
  inquiry_success: [],
  plan_home_start: [
    "anonymous_session_id",
    "prompt_index",
    "device_category",
    "source_tag",
  ],
  zone_complete: [
    "anonymous_session_id",
    "zone_id",
    "prompt_index",
    "device_category",
    "source_tag",
  ],
  contact_checkpoint_saved: [
    "anonymous_session_id",
    "prompt_index",
    "device_category",
    "source_tag",
  ],
  draft_resumed: [
    "anonymous_session_id",
    "zone_id",
    "prompt_index",
    "device_category",
    "source_tag",
  ],
  reference_added: [
    "anonymous_session_id",
    "zone_id",
    "prompt_index",
    "reference_kind",
    "device_category",
    "source_tag",
  ],
  plan_home_submitted: [
    "anonymous_session_id",
    "zone_id",
    "prompt_index",
    "device_category",
    "source_tag",
  ],
} as const;

const planHomeEventNames = new Set([
  "plan_home_start",
  "zone_complete",
  "contact_checkpoint_saved",
  "draft_resumed",
  "reference_added",
  "plan_home_submitted",
]);

const planHomeZoneIds = new Set([
  "project-and-living",
  "kitchen-and-dining",
  "primary-suite",
  "bedrooms-and-shared-bathrooms",
  "utility-and-systems",
  "exterior-and-site",
  "design-desk-and-review",
]);

const planHomeSourceTags = new Set([
  "direct",
  "homepage",
  "project-start",
  "single-family-catalog",
]);

function isAnalyticsPayloadValue(value: unknown) {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isAllowedPlanHomeValue(key: string, value: unknown) {
  if (key === "anonymous_session_id") {
    return (
      typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      )
    );
  }
  if (key === "zone_id") {
    return typeof value === "string" && planHomeZoneIds.has(value);
  }
  if (key === "prompt_index") {
    return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 35;
  }
  if (key === "reference_kind") {
    return value === "file" || value === "link";
  }
  if (key === "device_category") {
    return value === "phone" || value === "tablet" || value === "desktop";
  }
  if (key === "source_tag") {
    return typeof value === "string" && planHomeSourceTags.has(value);
  }
  return false;
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (
      command: "event",
      name: string,
      params?: Record<string, unknown>,
    ) => void;
    plausible?: (
      name: string,
      options?: {
        props?: Record<string, unknown>;
      },
    ) => void;
  }
}

function cleanPayload(
  name: keyof typeof payloadKeysByEvent,
  payload: AnalyticsPayload | undefined,
) {
  const allowedKeys = new Set<string>(payloadKeysByEvent[name]);
  return Object.fromEntries(
    Object.entries(payload ?? {}).filter(([key, value]) => {
      if (!allowedKeys.has(key) || value === undefined || value === null) {
        return false;
      }
      return planHomeEventNames.has(name)
        ? isAllowedPlanHomeValue(key, value)
        : isAnalyticsPayloadValue(value);
    }),
  );
}

export function trackEvent({ name, payload }: AnalyticsEvent) {
  if (typeof window === "undefined") {
    return;
  }

  if (!(name in payloadKeysByEvent)) {
    return;
  }

  const sanitizedPayload = cleanPayload(name, payload);
  const eventRecord = {
    event: name,
    ...sanitizedPayload,
  };

  window.dispatchEvent(
    new window.CustomEvent("hh:analytics", {
      detail: eventRecord,
    }),
  );

  if (!Array.isArray(window.dataLayer)) {
    window.dataLayer = [];
  }

  window.dataLayer.push(eventRecord);

  if (typeof window.gtag === "function") {
    window.gtag("event", name, sanitizedPayload);
  }

  if (typeof window.plausible === "function") {
    window.plausible(name, {
      props: sanitizedPayload,
    });
  }
}
