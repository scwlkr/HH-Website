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
  summarizePlanHomeAnswer,
} from "../features/plan-your-home/registry.ts";
import type { PlanHomeTourState } from "../features/plan-your-home/tour-state.ts";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const draftId = `draft-${"e".repeat(40)}`;
const createKey =
  "local-02a7fc4b-33b4-49d2-b258-dd4a7ef075d2:plan-home-v1:contact-gate";
const projectCheckpointKey =
  "local-42f5f285-75a2-4df4-a6ae-33f52bf48fe0:plan-home-v1:zone:project-and-living";
const kitchenCheckpointKey =
  "local-31b10274-8c25-42fb-a9e5-fe64b30f3912:plan-home-v1:zone:kitchen-and-dining";
const primaryCheckpointKey =
  "local-27ae0eea-682c-45b2-9a08-2c72614e49fe:plan-home-v1:zone:primary-suite";

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

function seedSecondaryStart(bedrooms: "1" | "6-plus" = "1") {
  const answers = answersThrough(17);
  answers["home.bed-bath-counts"] =
    bedrooms === "1"
      ? "1 bedroom, 1 full bathroom"
      : "6 or more bedrooms, 3 full bathrooms, and 1 half bathroom";
  const state: PlanHomeTourState = {
    definitionId: "plan-home-v1",
    welcomeName: "Taylor Homeowner",
    answers,
    location: {
      kind: "question",
      questionId: "secondary.users-layout",
      editingFromReview: false,
    },
    contactCheckpoint: {
      email: "taylor@example.com",
      phone: "+12145550100",
      manualFollowUpDisclosureAccepted: true,
    },
    completedZoneIds: [
      "project-and-living",
      "kitchen-and-dining",
      "primary-suite",
    ],
    checkpointedZoneIds: [
      "project-and-living",
      "kitchen-and-dining",
      "primary-suite",
    ],
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
      bedroomsAndSharedBathroomsCheckpointKey: null,
      draftId,
      revision: 4,
    }),
    true,
  );
}

async function renderSecondary(
  checkpointDraft?: PlanHomeDraftAction,
  bedrooms: "1" | "6-plus" = "1",
) {
  seedSecondaryStart(bedrooms);
  const view = render(
    <PlanYourHomeShell checkpointDraft={checkpointDraft} reducedMotion />,
  );
  const query = within(view.container);
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Who will use the secondary bedrooms?",
      }),
    ),
  );
  await waitFor(() =>
    assert.ok(
      view.container.querySelector(
        '[data-scene-variant="representative-bedroom-hall"]',
      ),
    ),
  );
  return { view, query };
}

test("one representative scene serves every bedroom count and validates both grouped answers", async () => {
  const user = userEvent.setup({ document: window.document });
  const { view, query } = await renderSecondary(undefined, "1");
  const firstScene = view.container.querySelector(
    '[data-scene-variant="representative-bedroom-hall"]',
  );
  assert.ok(firstScene);
  const fixedArtwork = firstScene.querySelector("svg")?.innerHTML;
  assert.equal(view.container.querySelectorAll("[data-scene-anchor]").length, 2);
  assert.equal(
    firstScene.getAttribute("data-active-anchor"),
    "bedroom-door-cluster",
  );
  assert.equal(
    firstScene.querySelector("svg")?.getAttribute("preserveAspectRatio"),
    "xMidYMid slice",
  );
  assert.equal(
    view.container
      .querySelector('[data-scene-anchor="bedroom-door-cluster"]')
      ?.getAttribute("data-active"),
    "true",
  );
  assert.equal(
    view.container.querySelector('[data-scene-anchor="bedroom-door-cluster"]')
      ?.tagName,
    "path",
  );
  assert.equal(query.queryByText("Representative bedroom hall study"), null);
  assert.equal(query.queryByText("bedroom door cluster"), null);
  assert.ok(query.getByRole("group", { name: "Users" }));
  assert.equal(query.queryByRole("group", { name: "Arrangement" }), null);

  await user.click(query.getByRole("checkbox", { name: "Children" }));
  await user.click(query.getByRole("button", { name: "Continue" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  assert.ok(query.getByRole("alert"));
  await user.click(query.getByRole("radio", { name: "Grouped" }));
  await user.click(query.getByRole("button", { name: "Edit Users" }));
  await user.click(query.getByRole("checkbox", { name: "Children" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  assert.ok(query.getByRole("alert"));
  await user.click(query.getByRole("checkbox", { name: "Guests" }));
  await user.click(query.getByRole("button", { name: "Done" }));
  await user.click(query.getByRole("button", { name: "Next" }));

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "How should secondary bathrooms be shared?",
      }),
    ),
  );
  assert.match(
    query.getByText(/A Jack-and-Jill bath connects two bedrooms/)
      .textContent ?? "",
    /separate lockable entries/,
  );
  assert.equal(
    view.container
      .querySelector('[data-scene-anchor="shared-bath-vanity"]')
      ?.getAttribute("data-active"),
    "true",
  );
  assert.equal(
    firstScene.getAttribute("data-active-anchor"),
    "shared-bath-vanity",
  );
  assert.equal(
    firstScene.querySelector("svg")?.getAttribute("preserveAspectRatio"),
    "xMidYMid slice",
  );
  const results = await axe.run(view.container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(
    results.violations.map((violation) => violation.id),
    [],
  );

  cleanup();
  window.localStorage.clear();
  const second = await renderSecondary(undefined, "6-plus");
  const secondScene = second.view.container.querySelector(
    '[data-scene-variant="representative-bedroom-hall"]',
  );
  assert.ok(secondScene);
  assert.equal(secondScene.querySelector("svg")?.innerHTML, fixedArtwork);
  assert.equal(second.view.container.querySelectorAll("[data-scene-anchor]").length, 2);
});

test("Back crosses the Primary Suite boundary and keeps the grouped bedroom answer", async () => {
  const calls: Array<{ idempotencyKey: string; completedZoneId: string }> = [];
  const checkpointDraft: PlanHomeDraftAction = async (input) => {
    calls.push(input as (typeof calls)[number]);
    return {
      status: "success",
      result: { draftId, revision: 4, applied: false },
    };
  };
  const user = userEvent.setup({ document: window.document });
  const { view, query } = await renderSecondary(checkpointDraft);

  assert.ok(
    view.container.querySelector(
      '[data-tour-beat="bedroom-hall-entrance"][data-reduced-motion="true"]',
    ),
  );
  await user.click(query.getByRole("checkbox", { name: "Children" }));
  await user.click(query.getByRole("button", { name: "Continue" }));
  await user.click(query.getByRole("radio", { name: "Grouped" }));
  await user.click(query.getByRole("button", { name: "Back" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "What should the suite's closet and access support?",
      }),
    ),
  );
  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "The bedroom hall continues beyond the suite.",
      }),
    ),
  );
  await user.click(query.getByRole("button", { name: "Continue down the hall" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Who will use the secondary bedrooms?",
      }),
    ),
  );
  assert.match(
    query.getByRole("group", { name: "Completed Users" }).textContent ?? "",
    /Children/,
  );
  assert.equal(
    (query.getByRole("radio", { name: "Grouped" }) as HTMLInputElement).checked,
    true,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].idempotencyKey, primaryCheckpointKey);
  assert.equal(calls[0].completedZoneId, "primary-suite");
});

test("question 19 retries one checkpoint, stores canonical summaries, and exits to the utility hall", async () => {
  const calls: Array<{
    expectedRevision: number;
    idempotencyKey: string;
    completedZoneId: string;
    answers: Record<string, unknown>;
  }> = [];
  const checkpointDraft: PlanHomeDraftAction = async (input) => {
    calls.push(input as (typeof calls)[number]);
    if (calls.length === 1) {
      return {
        status: "server-error",
        message: "Saving is unavailable. Try again.",
      };
    }
    return {
      status: "success",
      result: { draftId, revision: 5, applied: false },
    };
  };
  const user = userEvent.setup({ document: window.document });
  const { view, query } = await renderSecondary(checkpointDraft);

  await user.click(query.getByRole("checkbox", { name: "Children" }));
  await user.click(query.getByRole("checkbox", { name: "Guests" }));
  await user.click(query.getByRole("button", { name: "Continue" }));
  await user.click(query.getByRole("radio", { name: "Split for privacy" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("radio", { name: "Jack-and-Jill" }));
  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.match(query.getByRole("alert").textContent ?? "", /Try again/),
  );
  await user.click(query.getByRole("button", { name: "Save room" }));

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "The utility hall is next." }),
    ),
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
  assert.equal(calls[0].expectedRevision, 4);
  assert.equal(calls[0].completedZoneId, "bedrooms-and-shared-bathrooms");
  assert.equal(Object.keys(calls[0].answers).length, 19);
  assert.equal(
    summarizePlanHomeAnswer(
      "secondary.users-layout",
      calls[0].answers["secondary.users-layout"],
    ),
    "Users: Children, Guests; Arrangement: Split for privacy",
  );
  assert.equal(
    summarizePlanHomeAnswer(
      "secondary.bath-sharing",
      calls[0].answers["secondary.bath-sharing"],
    ),
    "Jack-and-Jill",
  );

  const clientDraft = JSON.parse(
    window.localStorage.getItem(PLAN_HOME_CLIENT_DRAFT_KEY) ?? "null",
  );
  assert.equal(clientDraft.revision, 5);
  assert.equal(
    clientDraft.bedroomsAndSharedBathroomsCheckpointKey,
    calls[0].idempotencyKey,
  );
  assert.ok(
    view.container.querySelector(
      '[data-tour-beat="utility-hall-transition"][data-reduced-motion="true"]',
    ),
  );
  assert.equal(query.queryByText("Utility hall"), null);

  await user.click(
    query.getByRole("button", { name: "Back to shared bathrooms" }),
  );
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "How should secondary bathrooms be shared?",
      }),
    ),
  );
  assert.equal(
    (query.getByRole("radio", { name: "Jack-and-Jill" }) as HTMLInputElement)
      .checked,
    true,
  );
});
