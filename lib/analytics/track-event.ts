"use client";

import type { AnalyticsEvent, AnalyticsPayload } from "@/lib/analytics/events";

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

function cleanPayload(payload: AnalyticsPayload | undefined) {
  return Object.fromEntries(
    Object.entries(payload ?? {}).filter(([, value]) => value !== undefined && value !== null),
  );
}

export function trackEvent({ name, payload }: AnalyticsEvent) {
  if (typeof window === "undefined") {
    return;
  }

  const sanitizedPayload = cleanPayload(payload);
  const eventRecord = {
    event: name,
    ...sanitizedPayload,
  };

  window.dispatchEvent(
    new CustomEvent("hh:analytics", {
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
