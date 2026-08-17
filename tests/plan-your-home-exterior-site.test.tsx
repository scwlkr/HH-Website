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
  "local-3eb31b7a-333f-4b2c-9138-5d66206ed96f:plan-home-v1:contact-gate";
const projectCheckpointKey =
  "local-20fae105-0151-40ad-b394-9723ab274540:plan-home-v1:zone:project-and-living";
const kitchenCheckpointKey =
  "local-b7787ddb-1c0d-47da-8f18-4cd8bbf771d5:plan-home-v1:zone:kitchen-and-dining";
const primaryCheckpointKey =
  "local-2d392a65-da37-40c3-9a84-b903a01c2df3:plan-home-v1:zone:primary-suite";
const bedroomsCheckpointKey =
  "local-2c4ae354-a898-4de5-864a-bfa52e38e258:plan-home-v1:zone:bedrooms-and-shared-bathrooms";
const utilityCheckpointKey =
  "local-9f7436b8-49c7-4e20-8e03-108bb23d7b74:plan-home-v1:zone:utility-and-systems";

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

function seedQuestion(questionId: "home.systems" | "exterior.garage") {
  const atExterior = questionId === "exterior.garage";
  const completedZoneIds = [
    "project-and-living",
    "kitchen-and-dining",
    "primary-suite",
    "bedrooms-and-shared-bathrooms",
    ...(atExterior ? ["utility-and-systems"] : []),
  ] as PlanHomeTourState["completedZoneIds"];
  const state: PlanHomeTourState = {
    definitionId: "plan-home-v1",
    welcomeName: "Taylor Homeowner",
    answers: answersThrough(atExterior ? 21 : 20),
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
    completedZoneIds,
    checkpointedZoneIds: completedZoneIds,
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
      bedroomsAndSharedBathroomsCheckpointKey: bedroomsCheckpointKey,
      utilityAndSystemsCheckpointKey: atExterior ? utilityCheckpointKey : null,
      exteriorAndSiteCheckpointKey: null,
      draftId,
      revision: atExterior ? 6 : 5,
    }),
    true,
  );
}

async function renderExterior(checkpointDraft?: PlanHomeDraftAction) {
  seedQuestion("exterior.garage");
  const view = render(
    <PlanYourHomeShell checkpointDraft={checkpointDraft} reducedMotion />,
  );
  const query = within(view.container);
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "What should the garage handle?" }),
    ),
  );
  await waitFor(() =>
    assert.ok(
      view.container.querySelector('[data-scene-variant="exterior-site-study"]'),
    ),
  );
  return { view, query };
}

async function answerGarage(query: ReturnType<typeof within>, user: ReturnType<typeof userEvent.setup>) {
  await user.click(query.getByRole("radio", { name: "2" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("checkbox", { name: "Storage" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.type(query.getByRole("textbox", { name: /Other/ }), "Golf cart parking");
  await user.click(query.getByRole("button", { name: "Next" }));
}

async function answerExteriorThroughSpecialty(
  query: ReturnType<typeof within>,
  user: ReturnType<typeof userEvent.setup>,
) {
  await answerGarage(query, user);
  await user.click(query.getByRole("checkbox", { name: "Traditional" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("checkbox", { name: "Privacy" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("checkbox", { name: "Covered porch" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("checkbox", { name: "Office" }));
}

test("the utility threshold opens into one fixed exterior study without moving overlays", async () => {
  const checkpointDraft: PlanHomeDraftAction = async () => ({
    status: "success",
    result: { draftId, revision: 6, applied: true },
  });
  seedQuestion("home.systems");
  const view = render(
    <PlanYourHomeShell checkpointDraft={checkpointDraft} reducedMotion />,
  );
  const query = within(view.container);
  const user = userEvent.setup({ document: window.document });
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Which home comfort and system priorities matter?",
      }),
    ),
  );
  await user.click(query.getByRole("checkbox", { name: "Energy efficiency" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "The back door opens to the exterior." }),
    ),
  );
  assert.ok(
    view.container.querySelector(
      '[data-tour-beat="exterior-back-door-transition"][data-reduced-motion="true"]',
    ),
  );
  await user.click(
    query.getByRole("button", { name: "Step through the back door" }),
  );
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "What should the garage handle?" }),
    ),
  );
  assert.ok(
    view.container.querySelector(
      '[data-tour-beat="exterior-back-door-entrance"][data-reduced-motion="true"]',
    ),
  );
  await waitFor(() =>
    assert.ok(
      view.container.querySelector('[data-scene-variant="exterior-site-study"]'),
    ),
  );
  const scene = view.container.querySelector(
    '[data-scene-variant="exterior-site-study"]',
  );
  assert.ok(scene);
  assert.equal(scene.querySelectorAll("[data-scene-anchor]").length, 0);
  assert.equal(scene.getAttribute("data-active-anchor"), "garage");
  assert.equal(
    scene.querySelector("svg")?.getAttribute("preserveAspectRatio"),
    "xMidYMid slice",
  );
  assert.equal(query.queryByText("Fixed exterior and site study"), null);
  assert.equal(query.queryByText("garage"), null);
});

test("garage groups and accessible style cards validate without reconfiguring the fixed house", async () => {
  const user = userEvent.setup({ document: window.document });
  const { view, query } = await renderExterior();
  assert.ok(query.getByRole("group", { name: "Bays" }));
  assert.equal(query.queryByRole("group", { name: "Needs" }), null);
  await user.click(query.getByRole("radio", { name: "2" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  assert.equal(query.queryByRole("textbox", { name: /Other/ }), null);
  await user.click(query.getByRole("checkbox", { name: "Storage" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  const other = query.getByRole("textbox", { name: /Other/ }) as HTMLInputElement;
  await user.type(other, "x".repeat(125));
  assert.equal(other.value.length, 120);
  assert.equal(other.maxLength, 120);
  await user.click(query.getByRole("button", { name: "Next" }));

  const scene = view.container.querySelector(
    '[data-scene-variant="exterior-site-study"]',
  );
  assert.ok(scene);
  assert.equal(scene.getAttribute("data-active-anchor"), "elevation-samples");
  assert.equal(
    scene.querySelector("svg")?.getAttribute("preserveAspectRatio"),
    "xMidYMid slice",
  );
  const fixedSvg = scene.querySelector("svg")?.innerHTML;
  assert.equal(view.container.querySelectorAll("[data-style-card]").length, 8);
  assert.match(
    query.getByText(/These directions communicate character/).textContent ?? "",
    /not promised designs/,
  );

  const ranch = query.getByRole("checkbox", {
    name: "Hill Country or ranch",
  }) as HTMLInputElement;
  ranch.focus();
  await user.keyboard(" ");
  assert.equal(ranch.checked, true);
  await user.click(query.getByRole("checkbox", { name: "Traditional" }));
  await user.click(
    query.getByRole("checkbox", { name: "Modern or contemporary" }),
  );
  assert.match(query.getByRole("alert").textContent ?? "", /no more than 2/);
  assert.equal(
    (query.getByRole("checkbox", {
      name: "Modern or contemporary",
    }) as HTMLInputElement).checked,
    false,
  );
  assert.equal(scene.querySelector("svg")?.innerHTML, fixedSvg);
  assert.equal(scene.querySelectorAll("[data-scene-anchor]").length, 0);

  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(ranch.checked, false);
  assert.equal(
    (query.getByRole("checkbox", { name: "Not sure yet" }) as HTMLInputElement)
      .checked,
    true,
  );
  await user.click(query.getByRole("button", { name: "Back" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "What should the garage handle?" }),
    ),
  );
  assert.match(
    query.getByRole("group", { name: "Completed Bays" }).textContent ?? "",
    /Bays2Edit/,
  );
  assert.match(
    query.getByRole("group", { name: "Completed Needs" }).textContent ?? "",
    /NeedsStorageEdit/,
  );
  await user.click(query.getByRole("button", { name: "Edit Needs" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Storage" }) as HTMLInputElement).checked,
    true,
  );
  await user.click(query.getByRole("button", { name: "Next" }));
  assert.equal((query.getByRole("textbox", { name: /Other/ }) as HTMLInputElement).value.length, 120);

  const results = await axe.run(view.container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(
    results.violations.map((violation) => violation.id),
    [],
  );
});

test("site, outdoor, and specialty choices enforce limits and explicit uncertainty", async () => {
  const user = userEvent.setup({ document: window.document });
  const { view, query } = await renderExterior();
  const scene = view.container.querySelector(
    '[data-scene-variant="exterior-site-study"]',
  );
  assert.ok(scene);
  await user.click(query.getByRole("radio", { name: "No garage" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  assert.equal(scene.getAttribute("data-active-anchor"), "sun-compass-trees");
  assert.equal(
    scene.querySelector("svg")?.getAttribute("preserveAspectRatio"),
    "xMidYMid slice",
  );

  assert.equal(
    query.getByText(
      "Planning priorities only—not zoning, setbacks, feasibility, or engineering review.",
    ).textContent,
    "Planning priorities only—not zoning, setbacks, feasibility, or engineering review.",
  );
  for (const option of [
    "Important views",
    "Morning light",
    "Evening light",
    "Privacy",
  ]) {
    await user.click(query.getByRole("checkbox", { name: option }));
  }
  await user.click(query.getByRole("checkbox", { name: "Street presence" }));
  assert.match(query.getByRole("alert").textContent ?? "", /no more than 4/);
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Important views" }) as HTMLInputElement)
      .checked,
    false,
  );
  await user.click(query.getByRole("button", { name: "Next" }));
  assert.equal(scene.getAttribute("data-active-anchor"), "patio");

  await user.click(query.getByRole("checkbox", { name: "Covered porch" }));
  await user.click(query.getByRole("checkbox", { name: "Patio" }));
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Covered porch" }) as HTMLInputElement)
      .checked,
    false,
  );
  await user.click(query.getByRole("checkbox", { name: "Patio" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  assert.equal(scene.getAttribute("data-active-anchor"), "outbuilding-plan");

  assert.equal(
    query.getByText(
      "Future-space choices record direction, not zoning, permitting, engineering, or feasibility.",
    ).textContent,
    "Future-space choices record direction, not zoning, permitting, engineering, or feasibility.",
  );
  await user.click(query.getByRole("checkbox", { name: "None" }));
  await user.click(query.getByRole("checkbox", { name: "Office" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "None" }) as HTMLInputElement).checked,
    false,
  );
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Office" }) as HTMLInputElement).checked,
    false,
  );
  await user.click(query.getByRole("button", { name: "Back" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", { name: "Which outdoor-living features matter?" }),
    ),
  );
  assert.equal(
    (query.getByRole("checkbox", { name: "Patio" }) as HTMLInputElement).checked,
    true,
  );
});

test("question 26 retries one canonical checkpoint and match-cuts to the design desk threshold", async () => {
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
        revision: calls.length === 3 ? 8 : 7,
        applied: true,
      },
    };
  };
  const { view, query } = await renderExterior(checkpointDraft);
  const user = userEvent.setup({ document: window.document });
  await answerExteriorThroughSpecialty(query, user);
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.match(query.getByRole("alert").textContent ?? "", /Try again/),
  );
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "The site sheet becomes the design desk.",
      }),
    ),
  );

  assert.equal(calls.length, 2);
  assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
  assert.equal(calls[0].expectedRevision, 6);
  assert.equal(calls[0].completedZoneId, "exterior-and-site");
  assert.equal(Object.keys(calls[0].answers).length, 26);
  assert.equal(
    summarizePlanHomeAnswer("exterior.garage", calls[0].answers["exterior.garage"]),
    "Garage bays: 2; Needs: Storage, Golf cart parking",
  );
  assert.equal(
    summarizePlanHomeAnswer("exterior.style", calls[0].answers["exterior.style"]),
    "Traditional",
  );
  assert.equal(
    summarizePlanHomeAnswer("site.relationships", calls[0].answers["site.relationships"]),
    "Privacy",
  );
  assert.equal(
    summarizePlanHomeAnswer(
      "exterior.outdoor-living",
      calls[0].answers["exterior.outdoor-living"],
    ),
    "Covered porch",
  );
  assert.equal(
    summarizePlanHomeAnswer(
      "home.specialty-spaces",
      calls[0].answers["home.specialty-spaces"],
    ),
    "Office",
  );

  const clientDraft = JSON.parse(
    window.localStorage.getItem(PLAN_HOME_CLIENT_DRAFT_KEY) ?? "null",
  );
  assert.equal(clientDraft.revision, 7);
  assert.equal(clientDraft.exteriorAndSiteCheckpointKey, calls[0].idempotencyKey);
  assert.ok(
    view.container.querySelector(
      '[data-tour-beat="blueprint-design-desk-transition"][data-reduced-motion="true"]',
    ),
  );
  assert.equal(query.queryByText("Design desk threshold"), null);
  await waitFor(() =>
    assert.ok(
      view.container.querySelector(
        "[data-scene-variant='blueprint-design-desk-threshold']",
      ),
    ),
  );
  assert.equal(view.container.querySelector("[data-scene-variant='design-desk']"), null);

  await user.click(query.getByRole("button", { name: "Back to specialty spaces" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Which specialty or future spaces matter?",
      }),
    ),
  );
  assert.equal(
    (query.getByRole("checkbox", { name: "Office" }) as HTMLInputElement).checked,
    true,
  );
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "The site sheet becomes the design desk.",
      }),
    ),
  );
  assert.equal(calls.length, 2, "An unchanged boundary crossing must not write again.");

  await user.click(query.getByRole("button", { name: "Back to specialty spaces" }));
  await user.click(query.getByRole("checkbox", { name: "Workshop" }));
  await user.click(query.getByRole("button", { name: "Next" }));
  await waitFor(() => assert.equal(calls.length, 3));
  assert.notEqual(calls[2].idempotencyKey, calls[0].idempotencyKey);
  assert.equal(calls[2].expectedRevision, 7);
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "The site sheet becomes the design desk.",
      }),
    ),
  );
});
