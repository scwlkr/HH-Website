import assert from "node:assert/strict";
import test from "node:test";

import type { PlanHomeAnalyticsEventName } from "../lib/analytics/events.ts";
import { trackPlanHomeEvent } from "../lib/analytics/plan-home-events.ts";
import { trackEvent } from "../lib/analytics/track-event.ts";

const planHomeEventNames: readonly PlanHomeAnalyticsEventName[] = [
  "plan_home_start",
  "zone_complete",
  "contact_checkpoint_saved",
  "draft_resumed",
  "reference_added",
  "plan_home_submitted",
];

test("Plan Your Home emits the six product events with only runtime-allowlisted non-PII properties", () => {
  const received: Array<Record<string, unknown>> = [];
  const gtagEvents: Array<Record<string, unknown>> = [];
  const plausibleEvents: Array<Record<string, unknown>> = [];
  window.dataLayer = [];
  window.gtag = (_command, name, payload) => {
    gtagEvents.push({ event: name, ...payload });
  };
  window.plausible = (name, options) => {
    plausibleEvents.push({ event: name, ...options?.props });
  };
  const listener = (event: Event) => {
    received.push((event as CustomEvent<Record<string, unknown>>).detail);
  };
  window.addEventListener("hh:analytics", listener);

  try {
    for (const name of planHomeEventNames) {
      trackPlanHomeEvent(name, {
        zone_id: "design-desk-and-review",
        prompt_index: 32,
        reference_kind: "file",
        source_tag: "homepage",
        name: "Private Person",
        email: "private@example.com",
        phone: "+12145550100",
        answers: "private answers",
        reference_url: "https://private.example/plan",
        object_path: "inquiryReferences/private/object",
        original_name: "private-plan.pdf",
        resume_token: "private-resume-token",
      });
    }
  } finally {
    window.removeEventListener("hh:analytics", listener);
  }

  assert.deepEqual(received.map(({ event }) => event), planHomeEventNames);
  assert.equal(received.length, 6);
  assert.deepEqual(window.dataLayer, received);
  assert.deepEqual(gtagEvents, received);
  assert.deepEqual(plausibleEvents, received);

  const allowedKeys = new Set([
    "event",
    "anonymous_session_id",
    "zone_id",
    "prompt_index",
    "reference_kind",
    "device_category",
    "source_tag",
  ]);
  const forbiddenValues = [
    "Private Person",
    "private@example.com",
    "+12145550100",
    "private answers",
    "https://private.example/plan",
    "inquiryReferences/private/object",
    "private-plan.pdf",
    "private-resume-token",
  ];
  for (const event of received) {
    assert(Object.keys(event).every((key) => allowedKeys.has(key)));
    const serialized = JSON.stringify(event);
    assert(forbiddenValues.every((value) => !serialized.includes(value)));
  }
});

test("runtime validation drops invalid Plan Your Home values and unknown events", () => {
  const received: Array<Record<string, unknown>> = [];
  const listener = (event: Event) => {
    received.push((event as CustomEvent<Record<string, unknown>>).detail);
  };
  window.addEventListener("hh:analytics", listener);
  try {
    trackEvent({
      name: "reference_added",
      payload: {
        anonymous_session_id: "private@example.com",
        zone_id: "contact.private-zone",
        prompt_index: 3200,
        reference_kind: "https://private.example/plan",
        device_category: "private-phone-number",
        source_tag: "private@example.com",
      },
    });
    trackEvent({
      name: "plan_home_start",
      payload: {
        source_tag: "john-smith",
      },
    });
    trackEvent({
      name: "plan_home_start",
      payload: {
        source_tag: "2145550199",
      },
    });
    (trackEvent as (event: { name: string; payload: Record<string, string> }) => void)(
      { name: "not_a_product_event", payload: { email: "private@example.com" } },
    );
  } finally {
    window.removeEventListener("hh:analytics", listener);
  }

  assert.deepEqual(received, [
    { event: "reference_added" },
    { event: "plan_home_start" },
    { event: "plan_home_start" },
  ]);
});
