import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createInitialPlanHomeTourState,
  isPlanHomeSubmissionReady,
  reducePlanHomeTour,
  type PlanHomeTourCommand,
  type PlanHomeTourState,
  type PlanHomeTourTransition,
} from "../features/plan-your-home/tour-state.ts";
import {
  planHomeQuestions,
  planHomeV1Definition,
  type PlanHomeQuestionId,
} from "../features/plan-your-home/registry.ts";

const contact = {
  email: "Taylor@Example.COM",
  phone: "+1 214 555 0100",
  manualFollowUpDisclosureAccepted: true,
} as const;

function apply(
  state: PlanHomeTourState,
  command: PlanHomeTourCommand,
): PlanHomeTourTransition {
  const transition = reducePlanHomeTour(state, command);
  assert.equal(
    transition.error,
    null,
    transition.error?.message ?? `Command ${command.type} failed`,
  );
  return transition;
}

function startTour() {
  let state = createInitialPlanHomeTourState();
  state = apply(state, { type: "set-welcome-name", name: "  Taylor Homeowner  " }).state;
  state = apply(state, { type: "next" }).state;
  return state;
}

function advanceTo(questionId: PlanHomeQuestionId) {
  let state = startTour();

  for (const question of planHomeQuestions) {
    assert.deepEqual(state.location, {
      kind: "question",
      questionId: question.id,
      editingFromReview: false,
    });
    if (question.id === questionId) {
      return state;
    }

    state = apply(state, {
      type: "answer-question",
      questionId: question.id,
      answer: question.response.exampleAnswer,
    }).state;
    state = apply(state, { type: "next" }).state;

    if (question.number === 6) {
      assert.deepEqual(state.location, { kind: "contact-gate" });
      state = apply(state, { type: "complete-contact-gate", contact }).state;
    }
  }

  throw new Error(`Question ${questionId} was not reached.`);
}

function completeTour() {
  let state = startTour();
  const events: PlanHomeTourTransition["events"][number][] = [];

  for (const question of planHomeQuestions) {
    const answerTransition = apply(state, {
      type: "answer-question",
      questionId: question.id,
      answer: question.response.exampleAnswer,
    });
    events.push(...answerTransition.events);
    state = answerTransition.state;

    const nextTransition = apply(state, { type: "next" });
    events.push(...nextTransition.events);
    state = nextTransition.state;

    if (question.number === 6) {
      assert.deepEqual(state.location, { kind: "contact-gate" });
      const contactTransition = apply(state, {
        type: "complete-contact-gate",
        contact,
      });
      events.push(...contactTransition.events);
      state = contactTransition.state;
    }
  }

  return { state, events };
}

describe("Plan Your Home deterministic tour state", () => {
  it("completes welcome, contact gate, all 35 canonical answers, review, and submission readiness", () => {
    const initial = createInitialPlanHomeTourState();
    assert.deepEqual(initial.location, { kind: "welcome" });
    assert.equal(isPlanHomeSubmissionReady(initial), false);

    const blocked = reducePlanHomeTour(initial, { type: "next" });
    assert.equal(blocked.error?.code, "welcome-name-required");
    assert.strictEqual(blocked.state, initial);

    const { state, events } = completeTour();

    assert.equal(state.welcomeName, "Taylor Homeowner");
    assert.deepEqual(state.location, { kind: "review" });
    assert.equal(Object.keys(state.answers).length, 35);
    assert.deepEqual(state.contactCheckpoint, {
      email: "taylor@example.com",
      phone: "+12145550100",
      manualFollowUpDisclosureAccepted: true,
    });
    assert.deepEqual(
      state.completedZoneIds,
      planHomeV1Definition.zones.map((zone) => zone.id),
    );
    assert.equal(isPlanHomeSubmissionReady(state), true);

    const zoneEvents = events.filter((event) => event.type === "zone-completed");
    assert.equal(zoneEvents.length, 7);
    assert.deepEqual(
      zoneEvents.map((event) => event.zoneId),
      planHomeV1Definition.zones.map((zone) => zone.id),
    );
    assert.equal(
      events.filter((event) => event.type === "contact-gate-completed").length,
      1,
    );
  });

  it("moves Back and Next predictably across the contact gate and zone boundaries", () => {
    let state = advanceTo("home.future-support");

    state = apply(state, { type: "back" }).state;
    assert.deepEqual(state.location, { kind: "contact-gate" });

    state = apply(state, { type: "back" }).state;
    assert.deepEqual(state.location, {
      kind: "question",
      questionId: "home.bed-bath-counts",
      editingFromReview: false,
    });

    state = apply(state, { type: "next" }).state;
    assert.deepEqual(state.location, { kind: "contact-gate" });
    state = apply(state, { type: "next" }).state;
    assert.deepEqual(state.location, {
      kind: "question",
      questionId: "home.future-support",
      editingFromReview: false,
    });

    for (const question of planHomeQuestions.slice(6, 11)) {
      state = apply(state, {
        type: "answer-question",
        questionId: question.id,
        answer: question.response.exampleAnswer,
      }).state;
      state = apply(state, { type: "next" }).state;
    }

    assert.deepEqual(state.location, {
      kind: "question",
      questionId: "kitchen.use",
      editingFromReview: false,
    });
    state = apply(state, { type: "back" }).state;
    assert.deepEqual(state.location, {
      kind: "question",
      questionId: "home.finish-level",
      editingFromReview: false,
    });
  });

  it("rejects invalid answers and invalid progress using the registry schemas", () => {
    const requiredState = advanceTo("project.starting-services");
    const required = reducePlanHomeTour(requiredState, { type: "next" });
    assert.equal(required.error?.code, "answer-required");
    assert.strictEqual(required.state, requiredState);

    const cases: readonly [PlanHomeQuestionId, unknown][] = [
      [
        "project.site-context",
        ["wooded", "not-sure-yet"],
      ],
      [
        "home.bed-bath-counts",
        { bedrooms: "4", fullBathrooms: "3" },
      ],
      [
        "home.daily-life",
        [
          "gathering",
          "quiet-and-privacy",
          "entertaining",
          "remote-work-or-study",
          "hobbies-or-making",
        ],
      ],
      [
        "kitchen.arrangement",
        { workCenter: "single-island", connection: null },
      ],
      [
        "design.references",
        { references: [], noReferencesYet: false },
      ],
    ];

    for (const [questionId, answer] of cases) {
      const state = advanceTo(questionId);
      const invalid = reducePlanHomeTour(state, {
        type: "answer-question",
        questionId,
        answer,
      });
      assert.equal(invalid.error?.code, "invalid-answer", questionId);
      assert.strictEqual(invalid.state, state);
      assert.deepEqual(invalid.events, []);
    }

    const wrongPrompt = advanceTo("home.stories");
    const invalidCommand = reducePlanHomeTour(wrongPrompt, {
      type: "answer-question",
      questionId: "home.heated-square-feet",
      answer: "2500-2999",
    });
    assert.equal(invalidCommand.error?.code, "wrong-question");
    assert.strictEqual(invalidCommand.state, wrongPrompt);

    let contactState = advanceTo("home.bed-bath-counts");
    contactState = apply(contactState, {
      type: "answer-question",
      questionId: "home.bed-bath-counts",
      answer: planHomeQuestions[5].response.exampleAnswer,
    }).state;
    contactState = apply(contactState, { type: "next" }).state;

    const missingContact = reducePlanHomeTour(contactState, { type: "next" });
    assert.equal(missingContact.error?.code, "contact-required");
    assert.strictEqual(missingContact.state, contactState);

    const invalidContact = reducePlanHomeTour(contactState, {
      type: "complete-contact-gate",
      contact: {
        email: "not-an-email",
        phone: "123",
        manualFollowUpDisclosureAccepted: false,
      },
    });
    assert.equal(invalidContact.error?.code, "invalid-contact");
    assert.strictEqual(invalidContact.state, contactState);
  });

  it("preserves later answers during backward edits and returns directly to review", () => {
    let { state } = completeTour();
    const laterAnswer = structuredClone(state.answers["project.budget-timing"]);

    state = apply(state, {
      type: "jump-to-review-question",
      questionId: "project.starting-services",
    }).state;
    assert.deepEqual(state.location, {
      kind: "question",
      questionId: "project.starting-services",
      editingFromReview: true,
    });

    state = apply(state, {
      type: "answer-question",
      questionId: "project.starting-services",
      answer: {
        startingPoint: "adapt-existing-plan",
        services: ["architectural-design"],
      },
    }).state;
    state = apply(state, { type: "next" }).state;

    assert.deepEqual(state.location, { kind: "review" });
    assert.deepEqual(state.answers["project.budget-timing"], laterAnswer);
    assert.equal(Object.keys(state.answers).length, 35);
    assert.equal(isPlanHomeSubmissionReady(state), true);

    state = apply(state, {
      type: "jump-to-review-question",
      questionId: "home.stories",
    }).state;
    state = apply(state, {
      type: "answer-question",
      questionId: "home.stories",
      answer: "two",
    }).state;
    state = apply(state, { type: "return-to-review" }).state;
    assert.deepEqual(state.location, { kind: "review" });
  });

  it("emits zone completion once and checkpoints completed zones idempotently", () => {
    let state = advanceTo("home.finish-level");
    state = apply(state, {
      type: "answer-question",
      questionId: "home.finish-level",
      answer: "custom",
    }).state;

    const completed = apply(state, { type: "next" });
    assert.deepEqual(
      completed.events.filter((event) => event.type === "zone-completed"),
      [
        {
          type: "zone-completed",
          zoneId: "project-and-living",
          checkpointKey: "plan-home-v1:zone:project-and-living",
        },
      ],
    );
    state = completed.state;

    state = apply(state, { type: "back" }).state;
    const repeatedCompletion = apply(state, { type: "next" });
    assert.equal(
      repeatedCompletion.events.some((event) => event.type === "zone-completed"),
      false,
    );
    state = repeatedCompletion.state;

    const checkpoint = apply(state, {
      type: "checkpoint-zone",
      zoneId: "project-and-living",
    });
    assert.deepEqual(checkpoint.state.checkpointedZoneIds, ["project-and-living"]);

    const repeatedCheckpoint = apply(checkpoint.state, {
      type: "checkpoint-zone",
      zoneId: "project-and-living",
    });
    assert.strictEqual(repeatedCheckpoint.state, checkpoint.state);
    assert.deepEqual(repeatedCheckpoint.events, []);

    const invalidCheckpoint = reducePlanHomeTour(state, {
      type: "checkpoint-zone",
      zoneId: "kitchen-and-dining",
    });
    assert.equal(invalidCheckpoint.error?.code, "zone-not-completed");
    assert.strictEqual(invalidCheckpoint.state, state);
  });
});
