import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createTourStateFromServerBoundary,
  reconcilePlanHomeDraft,
  safeAnonymousLocalState,
  type PlanHomeServerBoundary,
} from "../features/plan-your-home/draft-resume-contract.ts";
import { planHomeQuestions } from "../features/plan-your-home/registry.ts";
import type { PlanHomeTourState } from "../features/plan-your-home/tour-state.ts";
import {
  createPlanHomeResumeToken,
  hashPlanHomeResumeValue,
  isPlanHomeResumeToken,
} from "../lib/plan-your-home/draft-resume-token.ts";

const secret = "resume-contract-test-secret-with-32-characters";

function answersThrough(questionNumber: number) {
  return Object.fromEntries(
    planHomeQuestions
      .slice(0, questionNumber)
      .map((question) => [question.id, question.response.exampleAnswer]),
  );
}

function boundary(): PlanHomeServerBoundary {
  return {
    draftId: `draft-${"a".repeat(40)}`,
    revision: 3,
    welcomeName: "Trusted Taylor",
    contact: {
      email: "trusted@example.com",
      phone: "+12145550100",
      manualFollowUpDisclosureAccepted: true,
    },
    answers: answersThrough(15),
    progress: {
      currentPromptId: "primary.location",
      currentZoneId: "primary-suite",
      completedZoneIds: ["project-and-living", "kitchen-and-dining"],
    },
    references: [],
  };
}

function localAhead(): PlanHomeTourState {
  return {
    definitionId: "plan-home-v1",
    welcomeName: "Stale Local Name",
    contactCheckpoint: {
      email: "stale@example.com",
      phone: "+19725550123",
      manualFollowUpDisclosureAccepted: true,
    },
    answers: answersThrough(17),
    location: {
      kind: "question",
      questionId: "primary.bath-features",
      editingFromReview: false,
    },
    completedZoneIds: ["project-and-living", "kitchen-and-dining"],
    checkpointedZoneIds: ["project-and-living", "kitchen-and-dining"],
    references: [],
  };
}

describe("Plan Your Home draft resume contract", () => {
  it("migrates the removed land-development service in server progress", () => {
    const trusted = boundary();
    const legacyAnswers = { ...trusted.answers };
    delete legacyAnswers["home.ceiling-height"];
    const legacy = {
      ...trusted,
      answers: {
        ...legacyAnswers,
        "project.starting-services": {
          startingPoint: "fully-custom",
          services: ["architectural-design", "land-development"],
        },
      },
    } as unknown as PlanHomeServerBoundary;

    const restored = createTourStateFromServerBoundary(legacy);
    assert.deepEqual(restored.answers["project.starting-services"], {
      startingPoint: "fully-custom",
      services: ["architectural-design"],
    });
    assert.equal(restored.answers["home.ceiling-height"], "not-sure-yet");
    assert.deepEqual(restored.location, {
      kind: "question",
      questionId: "primary.location",
      editingFromReview: false,
    });
  });

  it("keeps the exact same-device prompt only at the current trusted revision", () => {
    const trusted = boundary();
    const result = reconcilePlanHomeDraft({
      local: localAhead(),
      localDraftId: trusted.draftId,
      localRevision: trusted.revision,
      boundary: trusted,
    });

    assert.equal(result.usedExactLocalPrompt, true);
    assert.deepEqual(result.state.location, localAhead().location);
    assert.equal(result.state.welcomeName, "Trusted Taylor");
    assert.deepEqual(result.state.contactCheckpoint, trusted.contact);
    assert.equal(
      result.state.answers["primary.bedroom-features"],
      localAhead().answers["primary.bedroom-features"],
    );
  });

  it("lets a newer server revision or different draft replace stale local progress", () => {
    const trusted = boundary();
    for (const input of [
      { localDraftId: trusted.draftId, localRevision: trusted.revision - 1 },
      { localDraftId: `draft-${"b".repeat(40)}`, localRevision: trusted.revision },
    ]) {
      const result = reconcilePlanHomeDraft({
        local: localAhead(),
        ...input,
        boundary: trusted,
      });
      assert.equal(result.usedExactLocalPrompt, false);
      assert.deepEqual(result.state, createTourStateFromServerBoundary(trusted));
    }
  });

  it("does not accept local progress that claims an unsynced checkpoint", () => {
    const trusted = boundary();
    const result = reconcilePlanHomeDraft({
      local: {
        ...localAhead(),
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
      },
      localDraftId: trusted.draftId,
      localRevision: trusted.revision,
      boundary: trusted,
    });
    assert.equal(result.usedExactLocalPrompt, false);
    assert.deepEqual(result.state.location, {
      kind: "question",
      questionId: "primary.location",
      editingFromReview: false,
    });
  });

  it("keeps anonymous local work but clears stale identified identity", () => {
    const anonymous = {
      ...localAhead(),
      location: { kind: "contact-gate" as const },
      contactCheckpoint: null,
      answers: answersThrough(7),
      completedZoneIds: [],
      checkpointedZoneIds: [],
    };
    assert.equal(safeAnonymousLocalState(anonymous), anonymous);
    const cleared = safeAnonymousLocalState(localAhead());
    assert.deepEqual(cleared.location, { kind: "welcome" });
    assert.equal(cleared.contactCheckpoint, null);
  });

  it("issues opaque values and derives purpose-separated hashes", () => {
    const token = createPlanHomeResumeToken();
    assert.equal(isPlanHomeResumeToken(token), true);
    assert.equal(token.length, 43);
    assert.notEqual(
      hashPlanHomeResumeValue("token", token, secret),
      hashPlanHomeResumeValue("email", token, secret),
    );
    assert.equal(isPlanHomeResumeToken(`${token}x`), false);
  });
});
