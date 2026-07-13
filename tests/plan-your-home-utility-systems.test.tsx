import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";

import {
  createPlanHomeClientDraftAdapter,
  PLAN_HOME_CLIENT_DRAFT_KEY,
} from "../features/plan-your-home/client-draft-state.ts";
import { createPlanHomeLocalSnapshotAdapter } from "../features/plan-your-home/local-snapshot.ts";
import {
  PlanYourHomeShell,
  type PlanHomeDraftAction,
} from "../features/plan-your-home/plan-your-home-shell.tsx";
import {
  planHomeQuestions,
  planHomeZones,
  summarizePlanHomeAnswer,
} from "../features/plan-your-home/registry.ts";
import type { PlanHomeTourState } from "../features/plan-your-home/tour-state.ts";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const draftId = `draft-${"f".repeat(40)}`;
const createKey =
  "local-8ce5de47-3de7-4bd8-9d5f-09e0e0899129:plan-home-v1:contact-gate";
const projectCheckpointKey =
  "local-51005aac-f61f-466b-aad0-863a3594336e:plan-home-v1:zone:project-and-living";
const kitchenCheckpointKey =
  "local-8f5d5d2a-84f4-4f19-99d2-6a77af3bbb2f:plan-home-v1:zone:kitchen-and-dining";
const primaryCheckpointKey =
  "local-aa78d1a4-7559-473e-9560-b0ca4852ef19:plan-home-v1:zone:primary-suite";
const bedroomsCheckpointKey =
  "local-04a32f83-69b8-46ac-92da-4098211d6624:plan-home-v1:zone:bedrooms-and-shared-bathrooms";

function answersThrough(questionNumber: number): Record<string, unknown> {
  return Object.fromEntries(
    planHomeQuestions
      .slice(0, questionNumber)
      .map((question) => [
        question.id,
        structuredClone(question.response.exampleAnswer),
      ]),
  );
}

function seedQuestion(questionId: "secondary.bath-sharing" | "utility.laundry") {
  const atUtility = questionId === "utility.laundry";
  const state: PlanHomeTourState = {
    definitionId: "plan-home-v1",
    welcomeName: "Taylor Homeowner",
    answers: answersThrough(atUtility ? 21 : 20),
    location: {
      kind: "question",
      questionId,
      editingFromReview: false,
    },
    contactCheckpoint: {
      email: "taylor@example.com",
      phone: "+12145550100",
      manualFollowUpDisclosureAccepted: true,
    },
    completedZoneIds: atUtility
      ? [
          "project-and-living",
          "kitchen-and-dining",
          "primary-suite",
          "bedrooms-and-shared-bathrooms",
        ]
      : ["project-and-living", "kitchen-and-dining", "primary-suite"],
    checkpointedZoneIds: atUtility
      ? [
          "project-and-living",
          "kitchen-and-dining",
          "primary-suite",
          "bedrooms-and-shared-bathrooms",
        ]
      : ["project-and-living", "kitchen-and-dining", "primary-suite"],
    references: [],
  };

  assert.equal(
    createPlanHomeLocalSnapshotAdapter({ storage: window.localStorage }).save(
      state,
    ),
    true,
  );
  assert.equal(
    createPlanHomeClientDraftAdapter(window.localStorage).save({
      createIdempotencyKey: createKey,
      projectAndLivingCheckpointKey: projectCheckpointKey,
      kitchenAndDiningCheckpointKey: kitchenCheckpointKey,
      primarySuiteCheckpointKey: primaryCheckpointKey,
      bedroomsAndSharedBathroomsCheckpointKey: atUtility
        ? bedroomsCheckpointKey
        : null,
      utilityAndSystemsCheckpointKey: null,
      draftId,
      revision: atUtility ? 5 : 4,
    }),
    true,
  );
}

async function renderUtility(checkpointDraft?: PlanHomeDraftAction) {
  seedQuestion("utility.laundry");
  const view = render(
    <PlanYourHomeShell checkpointDraft={checkpointDraft} reducedMotion />,
  );
  const query = within(view.container);
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "Where and how should laundry work?" }),
    ),
  );
  return { view, query };
}

test("the registered anchors share one utility hall and every question supports explicit uncertainty", async () => {
  const user = userEvent.setup({ document: window.document });
  const { view, query } = await renderUtility();
  const scene = view.container.querySelector('[data-scene-variant="utility-hall"]');
  assert.ok(scene);
  const registeredAnchors = planHomeZones[4].sceneAnchors;
  assert.deepEqual(
    Array.from(scene.querySelectorAll("[data-scene-anchor]"), (anchor) =>
      anchor.getAttribute("data-scene-anchor"),
    ),
    [...registeredAnchors],
  );
  assert.equal(
    scene
      .querySelector('[data-scene-anchor="washer"]')
      ?.getAttribute("data-active"),
    "true",
  );

  await user.click(query.getByRole("checkbox", { name: "Near bedrooms" }));
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Near bedrooms" }) as HTMLInputElement)
      .checked,
    false,
  );
  await user.click(query.getByRole("button", { name: "Next" }));

  assert.ok(
    query.getByRole("heading", {
      name: "What should the everyday entry or mudroom handle?",
    }),
  );
  await user.click(query.getByRole("checkbox", { name: "None" }));
  await user.click(query.getByRole("checkbox", { name: "Shoes and coats" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "None" }) as HTMLInputElement).checked,
    false,
  );
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Shoes and coats" }) as HTMLInputElement)
      .checked,
    false,
  );
  await user.click(query.getByRole("button", { name: "Next" }));

  assert.ok(
    query.getByRole("heading", {
      name: "Which easy-to-overlook storage needs matter?",
    }),
  );
  await user.click(query.getByRole("checkbox", { name: "Linens" }));
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Linens" }) as HTMLInputElement).checked,
    false,
  );
  await user.click(query.getByRole("button", { name: "Next" }));

  assert.ok(
    query.getByRole("heading", {
      name: "Which whole-home comfort or system priorities matter?",
    }),
  );
  assert.match(
    query.getByText(/Choose up to 6 broad planning priorities/).textContent ?? "",
    /not engineering, equipment specifications, feasibility decisions, or pricing/,
  );
  for (const option of [
    "Energy efficiency",
    "Generator",
    "Solar-ready",
    "All-electric",
    "Smart controls",
    "Security",
  ]) {
    await user.click(query.getByRole("checkbox", { name: option }));
  }
  await user.click(query.getByRole("checkbox", { name: "Network or audio" }));
  assert.match(query.getByRole("alert").textContent ?? "", /no more than 6/);
  assert.equal(
    (query.getByRole("checkbox", { name: "Network or audio" }) as HTMLInputElement)
      .checked,
    false,
  );
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Energy efficiency" }) as HTMLInputElement)
      .checked,
    false,
  );
  assert.equal(
    (query.getByRole("checkbox", { name: "Not sure yet" }) as HTMLInputElement)
      .checked,
    true,
  );

  const renderedCopy = view.container.textContent ?? "";
  assert.doesNotMatch(
    renderedCopy,
    /guaranteed price|price quote|designed system|specified equipment|BTU|SEER|model number/i,
  );
  const results = await axe.run(view.container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(
    results.violations.map((violation) => violation.id),
    [],
  );
});

test("the bedroom hall turns into utility and Back retains in-zone answers", async () => {
  const calls: Array<{ completedZoneId: string }> = [];
  const checkpointDraft: PlanHomeDraftAction = async (input) => {
    calls.push(input as (typeof calls)[number]);
    return {
      status: "success",
      result: { draftId, revision: 5, applied: true },
    };
  };
  seedQuestion("secondary.bath-sharing");
  const view = render(
    <PlanYourHomeShell checkpointDraft={checkpointDraft} reducedMotion />,
  );
  const query = within(view.container);
  const user = userEvent.setup({ document: window.document });
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "How should secondary bathrooms be shared?" }),
    ),
  );
  await user.click(query.getByRole("radio", { name: "Hall bath" }));
  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.ok(query.getByRole("heading", { name: "The utility hall is next." })),
  );
  assert.equal(calls[0].completedZoneId, "bedrooms-and-shared-bathrooms");
  assert.ok(
    view.container.querySelector(
      '[data-tour-beat="utility-hall-transition"][data-reduced-motion="true"]',
    ),
  );
  await user.click(query.getByRole("button", { name: "Turn into the utility hall" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "Where and how should laundry work?" }),
    ),
  );
  assert.ok(
    view.container.querySelector(
      '[data-tour-beat="utility-hall-entrance"][data-reduced-motion="true"]',
    ),
  );
  await user.click(query.getByRole("checkbox", { name: "Near bedrooms" }));
  await user.click(query.getByRole("checkbox", { name: "Folding counter" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("checkbox", { name: "Shoes and coats" }));
  await user.click(query.getByRole("button", { name: "Back" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "Where and how should laundry work?" }),
    ),
  );
  assert.equal(
    (query.getByRole("checkbox", { name: "Near bedrooms" }) as HTMLInputElement)
      .checked,
    true,
  );
  assert.equal(
    (query.getByRole("checkbox", { name: "Folding counter" }) as HTMLInputElement)
      .checked,
    true,
  );
});

test("question 25 retries one revision-safe checkpoint and reveals only the exterior threshold", async () => {
  const calls: Array<{
    expectedRevision: number;
    idempotencyKey: string;
    completedZoneId: string;
    answers: Record<string, unknown>;
  }> = [];
  const checkpointDraft: PlanHomeDraftAction = async (input) => {
    calls.push(input as (typeof calls)[number]);
    if (calls.length === 1) {
      return { status: "server-error", message: "Saving is unavailable. Try again." };
    }
    return {
      status: "success",
      result: {
        draftId,
        revision: calls.length === 3 ? 7 : 6,
        applied: calls.length !== 2,
      },
    };
  };
  const { view, query } = await renderUtility(checkpointDraft);
  const user = userEvent.setup({ document: window.document });

  await user.click(query.getByRole("checkbox", { name: "Near bedrooms" }));
  await user.click(query.getByRole("checkbox", { name: "Folding counter" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("checkbox", { name: "None" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("checkbox", { name: "Linens" }));
  await user.click(query.getByRole("checkbox", { name: "Seasonal items" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("checkbox", { name: "Energy efficiency" }));
  await user.click(query.getByRole("checkbox", { name: "Smart controls" }));
  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.match(query.getByRole("alert").textContent ?? "", /Try again/),
  );
  await user.click(query.getByRole("button", { name: "Save room" }));

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "The back door opens to the exterior.",
      }),
    ),
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
  assert.equal(calls[0].expectedRevision, 5);
  assert.equal(calls[0].completedZoneId, "utility-and-systems");
  assert.equal(Object.keys(calls[0].answers).length, 25);
  assert.equal(
    summarizePlanHomeAnswer("utility.laundry", calls[0].answers["utility.laundry"]),
    "Near bedrooms, Folding counter",
  );
  assert.equal(
    summarizePlanHomeAnswer("utility.mudroom", calls[0].answers["utility.mudroom"]),
    "None",
  );
  assert.equal(
    summarizePlanHomeAnswer("utility.storage", calls[0].answers["utility.storage"]),
    "Linens, Seasonal items",
  );
  assert.equal(
    summarizePlanHomeAnswer("home.systems", calls[0].answers["home.systems"]),
    "Energy efficiency, Smart controls",
  );

  const clientDraft = JSON.parse(
    window.localStorage.getItem(PLAN_HOME_CLIENT_DRAFT_KEY) ?? "null",
  );
  assert.equal(clientDraft.revision, 6);
  assert.equal(clientDraft.utilityAndSystemsCheckpointKey, calls[0].idempotencyKey);
  assert.ok(
    view.container.querySelector(
      '[data-tour-beat="exterior-back-door-transition"][data-reduced-motion="true"]',
    ),
  );
  assert.ok(view.container.querySelector("[data-scene-variant='utility-hall']"));
  assert.equal(
    view.container.querySelector("[data-scene-variant='exterior']"),
    null,
  );

  await user.click(query.getByRole("button", { name: "Back to home systems" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Which whole-home comfort or system priorities matter?",
      }),
    ),
  );
  assert.equal(
    (query.getByRole("checkbox", { name: "Energy efficiency" }) as HTMLInputElement)
      .checked,
    true,
  );
  assert.equal(
    (query.getByRole("checkbox", { name: "Smart controls" }) as HTMLInputElement)
      .checked,
    true,
  );

  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "The back door opens to the exterior.",
      }),
    ),
  );
  assert.equal(calls.length, 2, "An unchanged boundary crossing must not write again.");

  await user.click(query.getByRole("button", { name: "Back to home systems" }));
  await user.click(query.getByRole("checkbox", { name: "Smart controls" }));
  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.equal(calls.length, 3),
  );
  assert.notEqual(calls[2].idempotencyKey, calls[0].idempotencyKey);
  assert.equal(calls[2].expectedRevision, 6);
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "The back door opens to the exterior.",
      }),
    ),
  );
});
