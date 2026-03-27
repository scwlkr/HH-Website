"use client";

import { useEffect, useRef } from "react";
import type {
  AnalyticsEventName,
  AnalyticsPayload,
} from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track-event";

type AnalyticsEventTriggerProps = {
  name: AnalyticsEventName;
  payload?: AnalyticsPayload;
};

export function AnalyticsEventTrigger({
  name,
  payload,
}: AnalyticsEventTriggerProps) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current) {
      return;
    }

    hasTrackedRef.current = true;
    trackEvent({
      name,
      payload,
    });
  }, [name, payload]);

  return null;
}
