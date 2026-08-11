"use client";

import type {
  AnalyticsPayload,
  PlanHomeAnalyticsEventName,
} from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track-event";

const sessionStorageKey = "hh-plan-home-analytics-session-v1";
let memorySessionId: string | null = null;

function createAnonymousSessionId() {
  return window.crypto.randomUUID();
}

function getAnonymousSessionId() {
  if (memorySessionId) return memorySessionId;

  try {
    const existing = window.sessionStorage.getItem(sessionStorageKey);
    if (existing) {
      memorySessionId = existing;
      return existing;
    }
    memorySessionId = createAnonymousSessionId();
    window.sessionStorage.setItem(sessionStorageKey, memorySessionId);
    return memorySessionId;
  } catch {
    memorySessionId = createAnonymousSessionId();
    return memorySessionId;
  }
}

function getDeviceCategory() {
  if (window.innerWidth <= 600) return "phone";
  if (window.innerWidth <= 1024) return "tablet";
  return "desktop";
}

export function trackPlanHomeEvent(
  name: PlanHomeAnalyticsEventName,
  payload: AnalyticsPayload = {},
) {
  trackEvent({
    name,
    payload: {
      ...payload,
      anonymous_session_id: getAnonymousSessionId(),
      device_category: getDeviceCategory(),
    },
  });
}
