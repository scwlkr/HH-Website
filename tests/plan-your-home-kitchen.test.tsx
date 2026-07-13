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

const draftId = `draft-${"c".repeat(40)}`;
const createKey =
  "local-338725f7-706e-4c9e-9548-3ceeb9730afb:plan-home-v1:contact-gate";
const projectCheckpointKey =
  "local-f7368c8f-6af0-4277-8151-850768ff1894:plan-home-v1:zone:project-and-living";

function answersThrough(questionNumber: number) {
  return Object.fromEntries(
    planHomeQuestions
      .slice(0, questionNumber)
      .map((question) => [
        question.id,
        structuredClone(question.response.exampleAnswer),
      ]),
  );
}

function seedKitchenStart() {
  const state: PlanHomeTourState = {
    definitionId: "plan-home-v1",
    welcomeName: "Taylor Homeowner",
    answers: answersThrough(11),
    location: {
      kind: "question",
      questionId: "kitchen.use",
      editingFromReview: false,
    },
    contactCheckpoint: {
      email: "taylor@example.com",
      phone: "+12145550100",
      manualFollowUpDisclosureAccepted: true,
    },
    completedZoneIds: ["project-and-living"],
    checkpointedZoneIds: ["project-and-living"],
    references: [],
  };

  assert.equal(
    createPlanHomeLocalSnapshotAdapter({
      storage: window.localStorage,
    }).save(state),
    true,
  );
  assert.equal(
    createPlanHomeClientDraftAdapter(window.localStorage).save({
      createIdempotencyKey: createKey,
      projectAndLivingCheckpointKey: projectCheckpointKey,
      kitchenAndDiningCheckpointKey: null,
      draftId,
      revision: 2,
    }),
    true,
  );
}

async function renderKitchen(checkpointDraft?: PlanHomeDraftAction) {
  seedKitchenStart();
  const view = render(
    <PlanYourHomeShell
      checkpointDraft={checkpointDraft}
      reducedMotion
    />,
  );
  const query = within(view.container);
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "How will the kitchen be used most often?",
      }),
    ),
  );
  return { view, query };
}

async function answerKitchen(
  user: ReturnType<typeof userEvent.setup>,
  query: ReturnType<typeof within>,
) {
  await user.click(query.getByRole("checkbox", { name: "Everyday cooking" }));
  await user.click(
    query.getByRole("checkbox", { name: "Serious cooking or baking" }),
  );
  await user.click(query.getByRole("checkbox", { name: "Family gathering" }));
  await user.click(query.getByRole("checkbox", { name: "Entertaining" }));
  await user.click(query.getByRole("button", { name: "Next" }));

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "What kitchen arrangement sounds closest to what you want?",
      }),
    ),
  );
  await user.click(query.getByRole("radio", { name: "Single island" }));
  await user.click(query.getByRole("radio", { name: "Open" }));
  await user.click(query.getByRole("button", { name: "Next" }));

  assert.match(
    query.getByText(/A butler pantry supports serving and storage/).textContent ?? "",
    /appliance garage/,
  );
  await user.click(query.getByRole("checkbox", { name: "Butler pantry" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("checkbox", { name: "Island seating" }));
}

test("four registered anchors reframe the exact Kitchen and Dining prompts and enforce the use limit", async () => {
  const user = userEvent.setup({ document: window.document });
  const { view, query } = await renderKitchen();

  assert.equal(
    view.container.querySelector('[data-scene-anchor="range-and-island"]')
      ?.getAttribute("data-active"),
    "true",
  );
  assert.equal(
    view.container.querySelectorAll("[data-scene-anchor]").length,
    4,
  );
  assert.equal(
    window.document.activeElement,
    query.getByRole("heading", {
      name: "How will the kitchen be used most often?",
    }),
  );
  assert.equal(
    view.container.querySelector(
      '[data-tour-beat="living-to-kitchen"][data-reduced-motion="true"]',
    ) !== null,
    true,
  );

  await user.tab();
  assert.equal(
    window.document.activeElement,
    query.getByRole("checkbox", { name: "Everyday cooking" }),
  );
  await user.keyboard("[Space]");
  for (const label of [
    "Serious cooking or baking",
    "Family gathering",
    "Entertaining",
  ]) {
    await user.click(query.getByRole("checkbox", { name: label }));
  }
  await user.click(query.getByRole("checkbox", { name: "Large groups" }));
  assert.match(query.getByRole("alert").textContent ?? "", /no more than 4/);
  assert.equal(
    (query.getByRole("checkbox", { name: "Large groups" }) as HTMLInputElement)
      .checked,
    false,
  );

  await user.click(query.getByRole("button", { name: "Next" }));
  assert.equal(
    view.container.querySelector('[data-scene-anchor="room-opening"]')
      ?.getAttribute("data-active"),
    "true",
  );
  assert.ok(query.getByRole("group", { name: "Work center" }));
  assert.ok(query.getByRole("group", { name: "Connection" }));
  assert.equal(
    view.container.querySelector("[data-transition-state]")?.getAttribute(
      "data-transition-state",
    ),
    "idle",
  );

  const results = await axe.run(view.container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(
    results.violations.map((violation) => violation.id),
    [],
  );
});

test("Back crosses the Living Room boundary without losing the kitchen answer", async () => {
  const calls: unknown[] = [];
  const checkpointDraft: PlanHomeDraftAction = async (input) => {
    calls.push(input);
    return {
      status: "success",
      result: { draftId, revision: 2, applied: false },
    };
  };
  const user = userEvent.setup({ document: window.document });
  const { query } = await renderKitchen(checkpointDraft);

  await user.click(query.getByRole("checkbox", { name: "Everyday cooking" }));
  await user.click(query.getByRole("button", { name: "Back" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Which whole-home finish level feels closest to what you want?",
      }),
    ),
  );
  assert.equal(
    (query.getByRole("radio", { name: "Builder Grade" }) as HTMLInputElement)
      .checked,
    true,
  );

  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "How will the kitchen be used most often?",
      }),
    ),
  );
  assert.equal(
    (query.getByRole("checkbox", {
      name: "Everyday cooking",
    }) as HTMLInputElement).checked,
    true,
  );
  assert.equal(calls.length, 1);
  assert.equal(
    (calls[0] as { idempotencyKey: string }).idempotencyKey,
    projectCheckpointKey,
  );
});

test("question 15 retries one Kitchen and Dining checkpoint and enters the primary hall", async () => {
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
      result: { draftId, revision: 3, applied: false },
    };
  };
  const user = userEvent.setup({ document: window.document });
  const { query } = await renderKitchen(checkpointDraft);
  await answerKitchen(user, query);

  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.match(query.getByRole("alert").textContent ?? "", /Try again/),
  );
  await user.click(query.getByRole("button", { name: "Save room" }));

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "The primary hall is just beyond the dining room.",
      }),
    ),
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
  assert.equal(calls[0].expectedRevision, 2);
  assert.equal(calls[0].completedZoneId, "kitchen-and-dining");
  assert.equal(Object.keys(calls[0].answers).length, 15);
  assert.equal(
    summarizePlanHomeAnswer("kitchen.arrangement", calls[0].answers["kitchen.arrangement"]),
    "Work center: Single island; Connection: Open",
  );
  assert.equal(
    summarizePlanHomeAnswer("kitchen.support", calls[0].answers["kitchen.support"]),
    "Butler pantry",
  );

  const clientDraft = JSON.parse(
    window.localStorage.getItem(PLAN_HOME_CLIENT_DRAFT_KEY) ?? "null",
  );
  assert.equal(clientDraft.revision, 3);
  assert.equal(clientDraft.kitchenAndDiningCheckpointKey, calls[0].idempotencyKey);

  await user.click(query.getByRole("button", { name: "Back to dining" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "How should dining work in the home?" }),
    ),
  );
  assert.equal(
    (query.getByRole("checkbox", { name: "Island seating" }) as HTMLInputElement)
      .checked,
    true,
  );
});
