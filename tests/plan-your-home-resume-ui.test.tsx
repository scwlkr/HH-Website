import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, waitFor, within } from "@testing-library/react";

import {
  PLAN_HOME_CLIENT_DRAFT_KEY,
  createPlanHomeClientDraftAdapter,
} from "../features/plan-your-home/client-draft-state.ts";
import type { PlanHomeServerBoundary } from "../features/plan-your-home/draft-resume-contract.ts";
import {
  PLAN_HOME_LOCAL_SNAPSHOT_KEY,
  createPlanHomeLocalSnapshotAdapter,
} from "../features/plan-your-home/local-snapshot.ts";
import {
  PlanYourHomeShell,
  type PlanHomeRestoreAction,
} from "../features/plan-your-home/plan-your-home-shell.tsx";
import { planHomeQuestions } from "../features/plan-your-home/registry.ts";
import type { PlanHomeTourState } from "../features/plan-your-home/tour-state.ts";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const draftId = `draft-${"c".repeat(40)}`;
const createKey =
  "local-3f2504e0-4f89-41d3-9a0c-0305e82c3301:plan-home-v1:contact-gate";
const contact = {
  email: "trusted@example.com",
  phone: "+12145550100",
  manualFollowUpDisclosureAccepted: true,
} as const;

function answersThrough(questionNumber: number) {
  return Object.fromEntries(
    planHomeQuestions
      .slice(0, questionNumber)
      .map((question) => [question.id, question.response.exampleAnswer]),
  );
}

function localIdentifiedState(): PlanHomeTourState {
  return {
    definitionId: "plan-home-v1",
    welcomeName: "Taylor Homeowner",
    answers: answersThrough(6),
    location: {
      kind: "question",
      questionId: "home.future-support",
      editingFromReview: false,
    },
    contactCheckpoint: contact,
    completedZoneIds: [],
    checkpointedZoneIds: [],
    references: [],
  };
}

function seedIdentifiedLocalState() {
  assert.equal(
    createPlanHomeLocalSnapshotAdapter({
      storage: window.localStorage,
    }).save(localIdentifiedState()),
    true,
  );
  assert.equal(
    createPlanHomeClientDraftAdapter(window.localStorage).save({
      createIdempotencyKey: createKey,
      projectAndLivingCheckpointKey: null,
      draftId,
      revision: 1,
    }),
    true,
  );
}

test("transient restore failure keeps persisted identified progress and offers retry", async () => {
  seedIdentifiedLocalState();
  const beforeSnapshot = window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY);
  const beforeClient = window.localStorage.getItem(PLAN_HOME_CLIENT_DRAFT_KEY);
  const restoreDraft: PlanHomeRestoreAction = async () => ({
    status: "unavailable",
  });
  const view = render(<PlanYourHomeShell restoreDraft={restoreDraft} reducedMotion />);
  const query = within(view.container);

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Your saved plan is still protected.",
      }),
    ),
  );
  assert.ok(query.getByRole("button", { name: "Try verification again" }));
  assert.equal(
    window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY),
    beforeSnapshot,
  );
  assert.equal(
    window.localStorage.getItem(PLAN_HOME_CLIENT_DRAFT_KEY),
    beforeClient,
  );
  assert.equal(query.queryByRole("textbox", { name: "Your name" }), null);
});

test("missing safe session clears stale identified identity before showing Welcome", async () => {
  seedIdentifiedLocalState();
  const restoreDraft: PlanHomeRestoreAction = async () => ({
    status: "no-session",
  });
  const view = render(<PlanYourHomeShell restoreDraft={restoreDraft} reducedMotion />);
  const query = within(view.container);

  await waitFor(() => assert.ok(query.getByRole("textbox", { name: "Your name" })));
  assert.equal(window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY), null);
  assert.equal(window.localStorage.getItem(PLAN_HOME_CLIENT_DRAFT_KEY), null);
});

test("cross-device restore opens only the trusted last-synced room boundary", async () => {
  const boundary: PlanHomeServerBoundary = {
    draftId,
    revision: 2,
    welcomeName: "Taylor Homeowner",
    contact,
    answers: answersThrough(11),
    progress: {
      currentPromptId: "kitchen.use",
      currentZoneId: "kitchen-and-dining",
      completedZoneIds: ["project-and-living"],
    },
    references: [],
  };
  const restoreDraft: PlanHomeRestoreAction = async () => ({
    status: "success",
    result: boundary,
  });
  const view = render(<PlanYourHomeShell restoreDraft={restoreDraft} reducedMotion />);
  const query = within(view.container);

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "How will the kitchen be used most often?",
      }),
    ),
  );
  const client = createPlanHomeClientDraftAdapter(window.localStorage).load();
  assert.equal(client?.draftId, draftId);
  assert.equal(client?.revision, 2);
  assert.equal(client?.projectAndLivingCheckpointKey, null);
  const restored = createPlanHomeLocalSnapshotAdapter({
    storage: window.localStorage,
  }).load();
  assert.deepEqual(restored?.location, {
    kind: "question",
    questionId: "kitchen.use",
    editingFromReview: false,
  });
});
