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

const draftId = `draft-${"d".repeat(40)}`;
const createKey =
  "local-65a76ee2-c1a1-4cb1-a133-bbdb2ee570de:plan-home-v1:contact-gate";
const projectCheckpointKey =
  "local-787bd8c0-f5d1-4a90-872a-bf9c531c63da:plan-home-v1:zone:project-and-living";
const kitchenCheckpointKey =
  "local-527fa4a2-7906-4cfa-b73a-e6ecda078880:plan-home-v1:zone:kitchen-and-dining";

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

function seedPrimaryStart() {
  const state: PlanHomeTourState = {
    definitionId: "plan-home-v1",
    welcomeName: "Taylor Homeowner",
    answers: answersThrough(13),
    location: {
      kind: "question",
      questionId: "primary.location",
      editingFromReview: false,
    },
    contactCheckpoint: {
      email: "taylor@example.com",
      phone: "+12145550100",
      manualFollowUpDisclosureAccepted: true,
    },
    completedZoneIds: ["project-and-living", "kitchen-and-dining"],
    checkpointedZoneIds: ["project-and-living", "kitchen-and-dining"],
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
      primarySuiteCheckpointKey: null,
      draftId,
      revision: 3,
    }),
    true,
  );
}

async function renderPrimary(checkpointDraft?: PlanHomeDraftAction) {
  seedPrimaryStart();
  const view = render(
    <PlanYourHomeShell checkpointDraft={checkpointDraft} reducedMotion />,
  );
  const query = within(view.container);
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Where should the primary suite go?",
      }),
    ),
  );
  await waitFor(() =>
    assert.ok(view.container.querySelector('[data-scene-variant="primary-suite"]')),
  );
  return { view, query };
}

async function answerPrimarySuite(
  user: ReturnType<typeof userEvent.setup>,
  query: ReturnType<typeof within>,
) {
  await user.click(query.getByRole("radio", { name: "Main floor" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Which primary-bedroom features matter?",
      }),
    ),
  );
  await user.click(query.getByRole("checkbox", { name: "Sitting area" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Which primary-bath features matter?",
      }),
    ),
  );
  await user.click(query.getByRole("checkbox", { name: "Large shower" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "What should the suite's closet and access support?",
      }),
    ),
  );
  await user.click(
    query.getByRole("checkbox", { name: "Direct laundry access" }),
  );
}

test("one still primary-suite sketch carries exact prompts and explicit uncertainty", async () => {
  const user = userEvent.setup({ document: window.document });
  const { view, query } = await renderPrimary();

  assert.equal(
    view.container.querySelectorAll("[data-scene-anchor]").length,
    0,
  );
  assert.equal(query.queryByText("hall stair marker") === null, true);
  assert.equal(
    view.container
      .querySelector('[data-scene-variant="primary-suite"]')
      ?.getAttribute("data-active-anchor"),
    "hall-stair-marker",
  );
  assert.equal(
    view.container.querySelector(
      '[data-tour-beat="kitchen-hall-to-primary"][data-reduced-motion="true"]',
    ) !== null,
    true,
  );
  assert.equal(view.container.querySelectorAll("h1").length, 1);
  assert.equal(
    window.document.activeElement,
    query.getByRole("heading", {
      name: "Where should the primary suite go?",
    }),
  );

  await user.click(query.getByRole("button", { name: "Next" }));
  assert.match(
    query.getByRole("alert").textContent ?? "",
    /Choose an answer before continuing\./,
  );
  assert.equal(query.queryByText(/Invalid option:/), null);
  await user.click(query.getByRole("radio", { name: "Not sure yet" }));
  await user.click(query.getByRole("button", { name: "Next" }));

  assert.equal(
    view.container
      .querySelector('[data-scene-variant="primary-suite"]')
      ?.getAttribute("data-active-anchor"),
    "bed-and-window",
  );
  await user.click(query.getByRole("checkbox", { name: "Sitting area" }));
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Sitting area" }) as HTMLInputElement)
      .checked,
    false,
  );
  await user.click(query.getByRole("button", { name: "Next" }));

  assert.equal(
    view.container
      .querySelector('[data-scene-variant="primary-suite"]')
      ?.getAttribute("data-active-anchor"),
    "bath-vanity",
  );
  await user.click(query.getByRole("checkbox", { name: "Natural light" }));
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Natural light" }) as HTMLInputElement)
      .checked,
    false,
  );
  await user.click(query.getByRole("button", { name: "Next" }));

  assert.equal(
    view.container
      .querySelector('[data-scene-variant="primary-suite"]')
      ?.getAttribute("data-active-anchor"),
    "closet",
  );
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(query.queryByRole("checkbox", { name: "None" }), null);
  assert.equal(
    query.queryByRole("checkbox", { name: "Accessible clearances" }),
    null,
  );

  assert.equal(view.container.querySelectorAll("fieldset").length, 1);
  const results = await axe.run(view.container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(
    results.violations.map((violation) => violation.id),
    [],
  );
});

test("Back crosses the kitchen boundary and returns with the Primary Suite answer", async () => {
  const calls: Array<{ idempotencyKey: string; completedZoneId: string }> = [];
  const checkpointDraft: PlanHomeDraftAction = async (input) => {
    calls.push(input as (typeof calls)[number]);
    return {
      status: "success",
      result: { draftId, revision: 3, applied: false },
    };
  };
  const user = userEvent.setup({ document: window.document });
  const { query } = await renderPrimary(checkpointDraft);

  await user.click(query.getByRole("radio", { name: "Separate wing" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("button", { name: "Back" }));
  assert.equal(
    (query.getByRole("radio", { name: "Separate wing" }) as HTMLInputElement)
      .checked,
    true,
  );

  await user.click(query.getByRole("button", { name: "Back" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "What pantry or support spaces interest you?",
      }),
    ),
  );
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Where should the primary suite go?",
      }),
    ),
  );
  assert.equal(
    (query.getByRole("radio", { name: "Separate wing" }) as HTMLInputElement)
      .checked,
    true,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].idempotencyKey, kitchenCheckpointKey);
  assert.equal(calls[0].completedZoneId, "kitchen-and-dining");
});

test("question 17 retries one Primary Suite checkpoint and advances directly to secondary bedrooms", async () => {
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
      result: { draftId, revision: 4, applied: false },
    };
  };
  const user = userEvent.setup({ document: window.document });
  const { query } = await renderPrimary(checkpointDraft);
  await answerPrimarySuite(user, query);

  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.match(query.getByRole("alert").textContent ?? "", /Try again/),
  );
  await user.click(query.getByRole("button", { name: "Next" }));

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Who will use the secondary bedrooms?",
      }),
    ),
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
  assert.equal(calls[0].expectedRevision, 3);
  assert.equal(calls[0].completedZoneId, "primary-suite");
  assert.equal(Object.keys(calls[0].answers).length, 17);
  assert.equal(
    summarizePlanHomeAnswer(
      "primary.location",
      calls[0].answers["primary.location"],
    ),
    "Main floor",
  );
  assert.equal(
    summarizePlanHomeAnswer(
      "primary.closet-access",
      calls[0].answers["primary.closet-access"],
    ),
    "Direct laundry access",
  );

  const clientDraft = JSON.parse(
    window.localStorage.getItem(PLAN_HOME_CLIENT_DRAFT_KEY) ?? "null",
  );
  assert.equal(clientDraft.revision, 4);
  assert.equal(clientDraft.primarySuiteCheckpointKey, calls[0].idempotencyKey);
  assert.equal(query.queryByText("Primary suite saved"), null);

  await user.click(query.getByRole("button", { name: "Back" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "What should the suite's closet and access support?",
      }),
    ),
  );
  assert.equal(
    (
      query.getByRole("checkbox", {
        name: "Direct laundry access",
      }) as HTMLInputElement
    ).checked,
    true,
  );
});
