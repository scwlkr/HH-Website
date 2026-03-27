"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

function readAttribute(element: HTMLElement, name: string) {
  const value = element.dataset[name];

  if (!value) {
    return undefined;
  }

  return value;
}

export function AnalyticsProvider() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const trackedElement = target.closest<HTMLElement>("[data-analytics-event]");

      if (!trackedElement) {
        return;
      }

      const name = trackedElement.dataset.analyticsEvent;

      if (!name) {
        return;
      }

      trackEvent({
        name: name as "cta_click",
        payload: {
          label:
            readAttribute(trackedElement, "analyticsLabel") ??
            trackedElement.textContent?.trim().slice(0, 120),
          destination:
            readAttribute(trackedElement, "analyticsDestination") ??
            trackedElement.getAttribute("href") ??
            undefined,
          location: readAttribute(trackedElement, "analyticsLocation"),
          context: readAttribute(trackedElement, "analyticsContext"),
        },
      });
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}
