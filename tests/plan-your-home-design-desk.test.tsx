import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";

import { DesignDeskScene } from "../features/plan-your-home/design-desk-scene.tsx";
import {
  createPlanHomeClientDraftAdapter,
  PLAN_HOME_CLIENT_DRAFT_KEY,
} from "../features/plan-your-home/client-draft-state.ts";
import { createPlanHomeLocalSnapshotAdapter } from "../features/plan-your-home/local-snapshot.ts";
import {
  PlanYourHomeShell,
  type PlanHomeDirectUploader,
  type PlanHomeDraftAction,
  type PlanHomeReferenceAction,
} from "../features/plan-your-home/plan-your-home-shell.tsx";
import type {
  PlanHomeReferenceMutationResult,
  PlanHomeUploadCapability,
} from "../features/plan-your-home/reference-upload-contract.ts";
import type { PlanHomeReferenceMetadata } from "../features/plan-your-home/references.ts";
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

const draftId = `draft-${"c".repeat(40)}`;
const checkpointKeys = {
  createIdempotencyKey:
    "local-13f6b97b-d609-4d36-b6a8-e0eb9d539a6a:plan-home-v1:contact-gate",
  projectAndLivingCheckpointKey:
    "local-a0899c55-caa5-464a-8a90-8dbed7d65037:plan-home-v1:zone:project-and-living",
  kitchenAndDiningCheckpointKey:
    "local-af15e806-7a04-4f03-856d-e10bdd09147c:plan-home-v1:zone:kitchen-and-dining",
  primarySuiteCheckpointKey:
    "local-fe664a3e-68bc-43aa-af46-201065f29ed3:plan-home-v1:zone:primary-suite",
  bedroomsAndSharedBathroomsCheckpointKey:
    "local-24a0afe1-a586-4eac-8e0e-806162292fab:plan-home-v1:zone:bedrooms-and-shared-bathrooms",
  utilityAndSystemsCheckpointKey:
    "local-c747d0dd-d47f-4baa-94cb-bd6af05f2093:plan-home-v1:zone:utility-and-systems",
  exteriorAndSiteCheckpointKey:
    "local-45e3fd84-633a-4624-a923-e4835d62ed86:plan-home-v1:zone:exterior-and-site",
} as const;

function answersThrough(questionNumber: number): Record<string, unknown> {
  return Object.fromEntries(
    planHomeQuestions.slice(0, questionNumber).map((question) => [
      question.id,
      structuredClone(question.response.exampleAnswer),
    ]),
  );
}

function seedDesignDesk(questionId = "design.feeling") {
  const completedZoneIds = planHomeZones
    .slice(0, 6)
    .map(({ id }) => id) as PlanHomeTourState["completedZoneIds"];
  const answers = answersThrough(30);
  answers["home.daily-life"] = ["not-sure-yet"];
  answers["living.features"] = ["none"];
  answers["exterior.garage"] = {
    bays: "2",
    needs: ["storage"],
    other: "",
  };
  const state: PlanHomeTourState = {
    definitionId: "plan-home-v1",
    welcomeName: "Taylor Homeowner",
    answers,
    location: {
      kind: "question",
      questionId: questionId as "design.feeling",
      editingFromReview: false,
    },
    contactCheckpoint: {
      email: "taylor@example.com",
      phone: "+12145550100",
      manualFollowUpDisclosureAccepted: true,
    },
    completedZoneIds,
    checkpointedZoneIds: completedZoneIds,
    references: [],
  };
  assert.equal(
    createPlanHomeLocalSnapshotAdapter({ storage: window.localStorage }).save(state),
    true,
  );
  assert.equal(
    createPlanHomeClientDraftAdapter(window.localStorage).save({
      ...checkpointKeys,
      designDeskCheckpointKey: null,
      draftId,
      revision: 7,
    }),
    true,
  );
}

test("the fixed Design Desk runs Q31-34, retries private uploads, and checkpoints the review threshold", async () => {
  seedDesignDesk();
  let revision = 7;
  let uploadAttempts = 0;
  let abandonCalls = 0;
  let issueCalls = 0;
  let serverReferences: PlanHomeReferenceMetadata[] = [];
  const checkpointCalls: unknown[] = [];

  const issueReferenceUpload: PlanHomeReferenceAction<PlanHomeUploadCapability> =
    async (input) => {
      issueCalls += 1;
      const request = input as { originalName: string; mimeType: string; sizeBytes: number };
      if (request.sizeBytes === 0) {
        return {
          status: "validation-error",
          message: "Too small: expected number to be >0",
        };
      }
      return {
        status: "success",
        result: {
          draftId,
          referenceId: `file-9a1d7b3e-0e38-4af5-9ea4-${String(issueCalls).padStart(12, "0")}`,
          objectPath: `inquiryReferences/${draftId}/object-${issueCalls}`,
          uploadUrl: `https://storage.googleapis.test/upload-${issueCalls}`,
          method: "PUT",
          headers: {
            "content-type": request.mimeType,
            "x-goog-meta-plan-home-draft": draftId,
          },
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        },
      };
    };
  const directUploader: PlanHomeDirectUploader = async (
    capability,
    file,
    onProgress,
  ) => {
    assert.match(capability.uploadUrl, /^https:\/\/storage\.googleapis\.test/);
    assert.equal(file.name, "inspiration.pdf");
    uploadAttempts += 1;
    onProgress(43);
    if (uploadAttempts === 1) throw new Error("Connection interrupted.");
    onProgress(100);
  };
  const finalizeReferenceUpload: PlanHomeReferenceAction<PlanHomeReferenceMutationResult> =
    async (input) => {
      const request = input as { referenceId: string };
      revision += 1;
      serverReferences = [
        ...serverReferences,
        {
          id: request.referenceId,
          kind: "file",
          originalName: "inspiration.pdf",
          objectPath: `inquiryReferences/${draftId}/verified-object`,
          extension: "pdf",
          mimeType: "application/pdf",
          sizeBytes: 12,
          createdAt: new Date().toISOString(),
        },
      ];
      return {
        status: "success",
        result: { draftId, revision, references: serverReferences, applied: true },
      };
    };
  const addReferenceLink: PlanHomeReferenceAction<PlanHomeReferenceMutationResult> =
    async (input) => {
      const { url } = input as { url: string };
      const normalized = new URL(url);
      revision += 1;
      serverReferences = [
        ...serverReferences,
        {
          id: "link-8a1d7b3e-0e38-4af5-9ea4-000000000001",
          kind: "link",
          url: normalized.toString(),
          hostname: normalized.hostname,
          createdAt: new Date().toISOString(),
        },
      ];
      return {
        status: "success",
        result: { draftId, revision, references: serverReferences, applied: true },
      };
    };
  const syncReferenceNotes: PlanHomeReferenceAction<PlanHomeReferenceMutationResult> =
    async (input) => {
      const notes = new Map(
        (input as { notes: Array<{ referenceId: string; note: string }> }).notes.map(
          ({ referenceId, note }) => [referenceId, note],
        ),
      );
      serverReferences = serverReferences.map((reference) => ({
        ...reference,
        note: notes.get(reference.id) || undefined,
      })) as PlanHomeReferenceMetadata[];
      revision += 1;
      return {
        status: "success",
        result: { draftId, revision, references: serverReferences, applied: true },
      };
    };
  const checkpointDraft: PlanHomeDraftAction = async (input) => {
    checkpointCalls.push(input);
    if (checkpointCalls.length === 1) {
      return {
        status: "server-error",
        message: "Saving is unavailable. Try again.",
      };
    }
    revision += 1;
    return {
      status: "success",
      result: { draftId, revision, applied: true },
    };
  };

  const view = render(
    <PlanYourHomeShell
      checkpointDraft={checkpointDraft}
      issueReferenceUpload={issueReferenceUpload}
      directUploader={directUploader}
      finalizeReferenceUpload={finalizeReferenceUpload}
      abandonReferenceUpload={async () => {
        abandonCalls += 1;
        return { status: "success", result: { applied: true } };
      }}
      addReferenceLink={addReferenceLink}
      removeReference={async () => ({
        status: "success",
        result: { draftId, revision, references: serverReferences, applied: false },
      })}
      syncReferenceNotes={syncReferenceNotes}
      reducedMotion
    />,
  );
  const query = within(view.container);
  const user = userEvent.setup({ document: window.document });

  await waitFor(() =>
    assert.ok(query.getByRole("heading", { name: "How should your new home feel?" })),
  );
  await waitFor(() =>
    assert.ok(view.container.querySelector('[data-scene-variant="design-desk"]')),
  );
  const scene = view.container.querySelector('[data-scene-variant="design-desk"]');
  assert.ok(scene);
  assert.deepEqual(
    Array.from(scene.querySelectorAll("[data-scene-anchor]"), (anchor) =>
      anchor.getAttribute("data-scene-anchor"),
    ),
    ["mood-board", "pinboard-scanner", "priority-stacks", "ruler-calendar"],
  );
  for (const feeling of ["Warm", "Calm", "Bright"]) {
    await user.click(query.getByRole("checkbox", { name: feeling }));
  }
  await user.click(query.getByRole("checkbox", { name: "Bold" }));
  assert.match(query.getByRole("alert").textContent ?? "", /no more than 3/);
  await user.click(query.getByRole("button", { name: "Continue" }));
  await user.type(
    query.getByRole("textbox", { name: /What do you like or dislike now/ }),
    "Keep the morning light; lose the dark hallway.",
  );
  await user.click(query.getByRole("button", { name: "Next" }));

  const fileInput = view.container.querySelector('input[type="file"]');
  assert.ok(fileInput);
  await user.upload(
    fileInput as HTMLInputElement,
    new File(["%PDF-1.7\n"], "wrong.pdf", { type: "image/svg+xml" }),
  );
  assert.match(query.getByRole("alert").textContent ?? "", /PDF, JPEG, PNG/);
  await user.upload(
    fileInput as HTMLInputElement,
    new File([], "empty.pdf", { type: "application/pdf" }),
  );
  await waitFor(() => {
    assert.equal(
      query.getByRole("alert").textContent,
      "That reference could not be accepted. Check it and try again.",
    );
    assert.equal(query.queryByText(/Too small|expected number/), null);
  });
  await user.click(query.getByRole("button", { name: /Remove empty\.pdf/ }));
  await user.upload(
    fileInput as HTMLInputElement,
    new File(["%PDF-1.7\n"], "inspiration.pdf", {
      type: "application/pdf",
    }),
  );
  await waitFor(() => assert.ok(query.getByRole("button", { name: /Retry inspiration/ })));
  assert.equal(abandonCalls, 1);
  await user.click(query.getByRole("button", { name: /Retry inspiration/ }));
  await waitFor(() => assert.ok(query.getByText(/PDF · 1 KB · private/)));
  assert.equal(uploadAttempts, 2);

  const linkField = query.getByRole("textbox", { name: "Website link" });
  await user.type(linkField, "javascript:alert(1)");
  await user.click(query.getByRole("button", { name: "Add link" }));
  assert.match(query.getByRole("alert").textContent ?? "", /http or https/);
  await user.clear(linkField);
  await user.type(linkField, "https://Example.com/inspiration");
  await user.click(query.getByRole("button", { name: "Add link" }));
  await waitFor(() => assert.ok(query.getByRole("link", { name: "example.com" })));
  const safeLink = query.getByRole("link", { name: "example.com" });
  assert.equal(safeLink.getAttribute("target"), "_blank");
  assert.equal(safeLink.getAttribute("rel"), "noopener noreferrer");
  const noteFields = query.getAllByRole("textbox", { name: /Note for/ });
  await user.type(noteFields[0], "Kitchen layout reference");
  await user.click(query.getByRole("button", { name: "Next" }));

  assert.ok(query.getByRole("group", { name: "Priority group to edit" }));
  assert.ok(query.getByRole("button", { name: "Storage: Not assigned" }));
  assert.equal(query.queryByRole("button", { name: "2: Not assigned" }), null);
  assert.equal(query.queryByRole("button", { name: "None: Not assigned" }), null);
  assert.equal(
    query.queryByRole("button", { name: "Not sure yet: Not assigned" }),
    null,
  );
  await user.click(query.getByRole("checkbox", { name: "No strong priorities yet" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  assert.equal(
    query.getByText("Budget excludes land and does not calculate a price.")
      .textContent,
    "Budget excludes land and does not calculate a price.",
  );
  await user.click(query.getByRole("radio", { name: "Under $300k" }));
  await user.click(query.getByRole("button", { name: "Continue" }));
  await user.click(query.getByRole("radio", { name: "Within 3 months" }));
  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.match(query.getByRole("alert").textContent ?? "", /Try again/),
  );
  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Your selected sheets are bound into the project brief.",
      }),
    ),
  );

  assert.equal(checkpointCalls.length, 2);
  const checkpoint = checkpointCalls[1] as {
    completedZoneId: string;
    answers: Record<string, unknown>;
    expectedRevision: number;
    idempotencyKey: string;
  };
  assert.equal(
    (checkpointCalls[0] as { idempotencyKey: string }).idempotencyKey,
    checkpoint.idempotencyKey,
  );
  assert.equal(checkpoint.completedZoneId, "design-desk-and-review");
  assert.equal(Object.keys(checkpoint.answers).length, 34);
  assert.equal(checkpoint.expectedRevision, 10);
  assert.equal(
    summarizePlanHomeAnswer("design.references", checkpoint.answers["design.references"]),
    "1 file; 1 link",
  );
  assert.equal(
    summarizePlanHomeAnswer("design.priorities", checkpoint.answers["design.priorities"]),
    "No strong priorities yet",
  );
  assert.match(
    summarizePlanHomeAnswer("project.budget-timing", checkpoint.answers["project.budget-timing"]),
    /Under \$300k/,
  );
  const storedClient = JSON.parse(
    window.localStorage.getItem(PLAN_HOME_CLIENT_DRAFT_KEY) ?? "null",
  );
  assert.equal(storedClient.revision, 11);
  assert.match(storedClient.designDeskCheckpointKey, /zone:design-desk-and-review/);
  assert.ok(
    view.container.querySelector(
      '[data-tour-beat="design-desk-review-transition"][data-reduced-motion="true"]',
    ),
  );
  await user.click(
    query.getByRole("button", { name: "Back to budget and timing" }),
  );
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "What are your budget and timing?",
      }),
    ),
  );
  await user.click(query.getByRole("button", { name: "Save room" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Your selected sheets are bound into the project brief.",
      }),
    ),
  );
  assert.equal(checkpointCalls.length, 2);
  const axeResults = await axe.run(view.container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(axeResults.violations.map(({ id }) => id), []);
});

const designDeskAnchors = planHomeZones[6].sceneAnchors.slice(0, 4);

test("design desk keeps one fixed concept-sketch scene with automatic semantic anchors", () => {
  const view = render(<DesignDeskScene activeAnchor="mood-board" />);
  const query = within(view.container);
  const scene = view.container.querySelector('[data-scene-variant="design-desk"]');
  assert.ok(scene);
  assert.equal(scene.getAttribute("data-active-anchor"), "mood-board");
  assert.deepEqual(
    Array.from(scene.querySelectorAll("[data-scene-anchor]"), (anchor) =>
      anchor.getAttribute("data-scene-anchor"),
    ),
    [...designDeskAnchors],
  );
  assert.equal(
    scene.querySelector('[data-scene-anchor="mood-board"]')?.tagName,
    "g",
  );
  assert.equal(
    scene
      .querySelector('[data-scene-anchor="mood-board"]')
      ?.getAttribute("data-active"),
    "true",
  );
  assert.equal(
    scene.querySelector("svg")?.getAttribute("preserveAspectRatio"),
    "xMinYMid slice",
  );
  assert.equal(query.queryByText("Fixed design desk study"), null);
  assert.equal(query.queryByText("mood board"), null);
});

test("design desk reframes the same artwork for references, priorities, and timing", () => {
  const view = render(<DesignDeskScene activeAnchor="pinboard-scanner" />);
  const scene = view.container.querySelector('[data-scene-variant="design-desk"]');
  assert.ok(scene);
  const fixedArtwork = Array.from(scene.querySelectorAll("path"), (path) =>
    path.getAttribute("d"),
  );
  assert.equal(
    scene.querySelector("svg")?.getAttribute("preserveAspectRatio"),
    "xMaxYMax slice",
  );

  view.rerender(<DesignDeskScene activeAnchor="priority-stacks" />);
  assert.equal(scene.getAttribute("data-active-anchor"), "priority-stacks");
  assert.equal(
    scene.querySelector("svg")?.getAttribute("preserveAspectRatio"),
    "xMinYMax slice",
  );
  assert.deepEqual(
    Array.from(scene.querySelectorAll("path"), (path) => path.getAttribute("d")),
    fixedArtwork,
  );

  view.rerender(<DesignDeskScene activeAnchor="ruler-calendar" />);
  assert.equal(scene.getAttribute("data-active-anchor"), "ruler-calendar");
  assert.equal(
    scene.querySelector("svg")?.getAttribute("preserveAspectRatio"),
    "xMaxYMax slice",
  );
});
