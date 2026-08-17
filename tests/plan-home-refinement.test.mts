import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PLAN_HOME_REFINEMENT_STATES,
  createPlanHomeRefinementFixture,
  isLoopbackPlanHomeRefinementRequest,
  normalizePlanHomeRefinementState,
} from "../features/plan-your-home/refinement-fixture.ts";
import { getPlanHomeQuestion } from "../features/plan-your-home/registry.ts";

describe("Plan Your Home refinement fixtures", () => {
  it("supports Welcome, contact, Q1-Q31, review, and confirmation exactly", () => {
    assert.equal(PLAN_HOME_REFINEMENT_STATES.length, 35);
    for (const requestedState of PLAN_HOME_REFINEMENT_STATES) {
      const fixture = createPlanHomeRefinementFixture(requestedState);
      const actualState = fixture.submitted
        ? "confirmation"
        : fixture.state.location.kind === "question"
          ? `q${getPlanHomeQuestion(fixture.state.location.questionId)?.number}`
          : fixture.state.location.kind === "contact-gate"
            ? "contact"
            : fixture.state.location.kind;
      assert.equal(actualState, requestedState);
    }
    assert.equal(normalizePlanHomeRefinementState("Q31"), "q31");
    assert.equal(normalizePlanHomeRefinementState("missing"), null);
  });

  it("requires explicit development mode and loopback access", () => {
    assert.equal(isLoopbackPlanHomeRefinementRequest({ enabled: true, environment: "development", host: "127.0.0.1:3000" }), true);
    assert.equal(isLoopbackPlanHomeRefinementRequest({ enabled: true, environment: "development", host: "localhost:3000" }), true);
    assert.equal(isLoopbackPlanHomeRefinementRequest({ enabled: false, environment: "development", host: "127.0.0.1:3000" }), false);
    assert.equal(isLoopbackPlanHomeRefinementRequest({ enabled: true, environment: "production", host: "127.0.0.1:3000" }), false);
    assert.equal(isLoopbackPlanHomeRefinementRequest({ enabled: true, environment: "development", host: "howethandharp.com" }), false);
  });
});
