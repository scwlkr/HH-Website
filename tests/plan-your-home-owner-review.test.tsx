import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  createPlanHomeLocalSnapshotAdapter,
  PLAN_HOME_LOCAL_SNAPSHOT_KEY,
  PLAN_HOME_REVIEW_SNAPSHOT_KEY,
} from "../features/plan-your-home/local-snapshot.ts";
import { PlanYourHomeShell } from "../features/plan-your-home/plan-your-home-shell.tsx";
import { createPlanHomeRefinementFixture } from "../features/plan-your-home/refinement-fixture.ts";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.dataLayer = [];
});

test("review snapshots resume exactly and clear without touching a customer draft", () => {
  const customer = createPlanHomeLocalSnapshotAdapter({
    storage: window.localStorage,
  });
  const review = createPlanHomeLocalSnapshotAdapter({
    storage: window.localStorage,
    key: PLAN_HOME_REVIEW_SNAPSHOT_KEY,
  });
  const reviewState = createPlanHomeRefinementFixture("q9").state;

  assert.equal(
    customer.save(createPlanHomeRefinementFixture("q1").state),
    true,
  );
  assert.equal(review.save(reviewState), true);
  assert.deepEqual(review.load()?.location, {
    kind: "question",
    questionId: "living.features",
    editingFromReview: false,
  });
  assert.notEqual(
    window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY),
    window.localStorage.getItem(PLAN_HOME_REVIEW_SNAPSHOT_KEY),
  );

  const customerSnapshot = window.localStorage.getItem(
    PLAN_HOME_LOCAL_SNAPSHOT_KEY,
  );
  review.clear();
  assert.equal(
    window.localStorage.getItem(PLAN_HOME_REVIEW_SNAPSHOT_KEY),
    null,
  );
  assert.equal(
    window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY),
    customerSnapshot,
  );
});

test("review mode fake-submits without server, upload, or analytics side effects", async () => {
  const review = createPlanHomeLocalSnapshotAdapter({
    storage: window.localStorage,
    key: PLAN_HOME_REVIEW_SNAPSHOT_KEY,
  });
  assert.equal(
    review.save(createPlanHomeRefinementFixture("q31").state),
    true,
  );
  const customer = createPlanHomeLocalSnapshotAdapter({
    storage: window.localStorage,
  });
  assert.equal(
    customer.save(createPlanHomeRefinementFixture("q1").state),
    true,
  );
  const customerSnapshot = window.localStorage.getItem(
    PLAN_HOME_LOCAL_SNAPSHOT_KEY,
  );

  const calls: Array<{ seam: string; input?: unknown }> = [];
  const rejectedAction = (seam: string) => async (input?: unknown) => {
    calls.push({ seam, input });
    return {
      status: "server-error" as const,
      message: `${seam} must stay closed in review mode.`,
    };
  };
  const restoreDraft = async () => {
    calls.push({ seam: "restore" });
    return { status: "unavailable" as const };
  };
  const directUploader = async () => {
    calls.push({ seam: "direct-upload" });
  };
  window.dataLayer = [];

  const view = render(
    <PlanYourHomeShell
      reviewMode
      createDraft={rejectedAction("create")}
      restoreDraft={restoreDraft}
      checkpointDraft={rejectedAction("checkpoint")}
      submitDraft={rejectedAction("submit")}
      issueReferenceUpload={rejectedAction("issue-upload")}
      finalizeReferenceUpload={rejectedAction("finalize-upload")}
      abandonReferenceUpload={rejectedAction("abandon-upload")}
      addReferenceLink={rejectedAction("add-link")}
      removeReference={rejectedAction("remove-reference")}
      syncReferenceNotes={rejectedAction("sync-notes")}
      directUploader={directUploader}
      reducedMotion
    />,
  );
  const query = within(view.container);
  const user = userEvent.setup({ document: window.document });

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "How should we follow up?" }),
    ),
  );
  await user.click(query.getByRole("radio", { name: "Email" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "One walkthrough, ready for a real conversation.",
      }),
    ),
  );
  await user.click(
    query.getByRole("checkbox", {
      name: /I am submitting an inquiry and permit h and h to contact me/,
    }),
  );
  await user.click(
    query.getByRole("button", { name: "Submit project brief" }),
  );

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "Thank you, Refinement Homeowner." }),
    ),
  );
  assert.deepEqual(calls, []);
  assert.deepEqual(window.dataLayer, []);
  assert.equal(
    window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY),
    customerSnapshot,
  );
  assert.ok(query.getByRole("button", { name: "Reset review" }));
});
