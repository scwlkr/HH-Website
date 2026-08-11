import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";

import { createPlanHomeClientDraftAdapter } from "../features/plan-your-home/client-draft-state.ts";
import { createPlanHomeLocalSnapshotAdapter } from "../features/plan-your-home/local-snapshot.ts";
import {
  PlanYourHomeShell,
  type PlanHomeSubmitAction,
} from "../features/plan-your-home/plan-your-home-shell.tsx";
import {
  planHomeQuestions,
  planHomeZones,
} from "../features/plan-your-home/registry.ts";
import type { PlanHomeReferenceMetadata } from "../features/plan-your-home/references.ts";
import type { PlanHomeTourState } from "../features/plan-your-home/tour-state.ts";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const draftId = `draft-${"d".repeat(40)}`;
const references: readonly PlanHomeReferenceMetadata[] = [
  {
    id: "file-9a1d7b3e-0e38-4af5-9ea4-000000000001",
    kind: "file",
    originalName: "kitchen-inspiration.pdf",
    objectPath: `inquiryReferences/${draftId}/private-object`,
    extension: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
    note: "Keep the open prep area.",
    createdAt: "2026-08-11T12:00:00.000Z",
  },
  {
    id: "link-8a1d7b3e-0e38-4af5-9ea4-000000000001",
    kind: "link",
    url: "https://example.com/exterior-reference",
    hostname: "example.com",
    note: "Exterior material direction.",
    createdAt: "2026-08-11T12:01:00.000Z",
  },
];

function seedFinalQuestion() {
  const answers: Record<string, unknown> = Object.fromEntries(
    planHomeQuestions.slice(0, 34).map((question) => [
      question.id,
      structuredClone(question.response.exampleAnswer),
    ]),
  );
  answers["design.references"] = { references, noReferencesYet: false };
  const zoneIds = planHomeZones.map(({ id }) => id);
  const state: PlanHomeTourState = {
    definitionId: "plan-home-v1",
    welcomeName: "Taylor Homeowner",
    answers,
    location: {
      kind: "question",
      questionId: "contact.follow-up",
      editingFromReview: false,
    },
    contactCheckpoint: {
      email: "taylor@example.com",
      phone: "+12145550100",
      manualFollowUpDisclosureAccepted: true,
    },
    completedZoneIds: zoneIds,
    checkpointedZoneIds: zoneIds,
    references,
  };
  assert.equal(
    createPlanHomeLocalSnapshotAdapter({ storage: window.localStorage }).save(state),
    true,
  );
  assert.equal(
    createPlanHomeClientDraftAdapter(window.localStorage).save({
      createIdempotencyKey:
        "local-13f6b97b-d609-4d36-b6a8-e0eb9d539a6a:plan-home-v1:contact-gate",
      projectAndLivingCheckpointKey: null,
      kitchenAndDiningCheckpointKey: null,
      primarySuiteCheckpointKey: null,
      bedroomsAndSharedBathroomsCheckpointKey: null,
      utilityAndSystemsCheckpointKey: null,
      exteriorAndSiteCheckpointKey: null,
      designDeskCheckpointKey:
        "local-6c0de169-e124-4915-a4e2-fcaf1a846929:plan-home-v1:zone:design-desk-and-review",
      submissionIdempotencyKey: null,
      draftId,
      revision: 8,
    }),
    true,
  );
}

test("Q35 leads to a complete grouped review, direct edit-return, consent, and confirmation", async () => {
  seedFinalQuestion();
  const submitCalls: unknown[] = [];
  const submitDraft: PlanHomeSubmitAction = async (input) => {
    submitCalls.push(input);
    return {
      status: "success",
      result: {
        draftId,
        revision: 9,
        submittedAt: "2026-08-11T13:00:00.000Z",
        applied: true,
        notificationIntentCount: 0,
      },
    };
  };
  const view = render(
    <PlanYourHomeShell submitDraft={submitDraft} reducedMotion />,
  );
  const query = within(view.container);
  const user = userEvent.setup({ document: window.document });

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "How should h and h follow up after you submit the project brief?",
      }),
    ),
  );
  assert.deepEqual(
    query.getAllByRole("radio").map((radio) => radio.getAttribute("value")),
    ["email", "phone-call", "text-message"],
  );
  await user.click(query.getByRole("radio", { name: "Phone call" }));
  await user.click(query.getByRole("button", { name: "Review brief" }));

  await waitFor(() =>
    assert.ok(query.getByRole("heading", { name: /One walkthrough/ })),
  );
  assert.equal(
    view.container.querySelectorAll("[data-review-question]").length,
    35,
  );
  assert.equal(view.container.querySelectorAll("[data-review-zone]").length, 7);
  assert.ok(query.getByText("taylor@example.com"));
  assert.ok(query.getByText("kitchen-inspiration.pdf"));
  assert.ok(query.getByText("https://example.com/exterior-reference"));
  assert.match(
    view.container.querySelector('[data-review-question="contact.follow-up"]')
      ?.textContent ?? "",
    /Phone call/,
  );

  const lateSummaryBefore = view.container.querySelector(
    '[data-review-question="project.budget-timing"]',
  )?.textContent;
  await user.click(
    query.getByRole("button", {
      name: "Edit Entry, Project Frame, and Living Room",
    }),
  );
  await waitFor(() =>
    assert.ok(query.getByRole("heading", { name: /Where are you starting/ })),
  );
  await user.click(query.getByRole("radio", { name: "Adapt an existing plan" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.ok(query.getByRole("heading", { name: /One walkthrough/ })),
  );
  assert.equal(
    view.container.querySelector('[data-review-question="project.budget-timing"]')
      ?.textContent,
    lateSummaryBefore,
  );
  assert.match(
    view.container.querySelector('[data-review-question="project.starting-services"]')
      ?.textContent ?? "",
    /Adapt an existing plan/,
  );

  assert.match(
    query.getByText(/This brief starts a conversation/).textContent ?? "",
    /not a design, price, feasibility decision, or contract/,
  );
  const submitButton = query.getByRole("button", { name: "Submit project brief" });
  assert.equal(submitButton.hasAttribute("disabled"), true);
  await user.click(
    query.getByRole("checkbox", {
      name: /I am submitting an inquiry and permit h and h to contact me/,
    }),
  );
  await user.click(submitButton);

  await waitFor(() =>
    assert.ok(query.getByRole("heading", { name: "Thank you, Taylor Homeowner." })),
  );
  assert.equal(submitCalls.length, 1);
  const submission = submitCalls[0] as {
    expectedRevision: number;
    answers: Record<string, unknown>;
    references: readonly PlanHomeReferenceMetadata[];
    consent: { version: string; inquiryAndProjectContactAccepted: boolean };
    idempotencyKey: string;
  };
  assert.equal(submission.expectedRevision, 8);
  assert.equal(Object.keys(submission.answers).length, 35);
  assert.equal(submission.answers["contact.follow-up"], "phone-call");
  assert.deepEqual(submission.references, references);
  assert.deepEqual(submission.consent, {
    version: "plan-home-inquiry-contact-v1",
    inquiryAndProjectContactAccepted: true,
  });
  assert.match(submission.idempotencyKey, /plan-home-v1:submission/);
  assert.ok(view.container.querySelector('[data-tour-beat="plan-home-confirmation"]'));

  const axeResults = await axe.run(view.container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(axeResults.violations.map(({ id }) => id), []);
});
