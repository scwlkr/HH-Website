import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createPlanHomeLocalSnapshotAdapter,
  PLAN_HOME_LOCAL_SNAPSHOT_KEY,
  PLAN_HOME_LOCAL_SNAPSHOT_TTL_MS,
  type StorageLike,
} from "../features/plan-your-home/local-snapshot.ts";
import {
  createInitialPlanHomeTourState,
  reducePlanHomeTour,
  type PlanHomeTourCommand,
  type PlanHomeTourState,
} from "../features/plan-your-home/tour-state.ts";
import { planHomeQuestions } from "../features/plan-your-home/registry.ts";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const contact = {
  email: "taylor@example.com",
  phone: "+1 214 555 0100",
  manualFollowUpDisclosureAccepted: true,
} as const;

function namedState() {
  const initial = createInitialPlanHomeTourState();
  const transition = reducePlanHomeTour(initial, {
    type: "set-welcome-name",
    name: "Taylor Homeowner",
  });
  assert.equal(transition.error, null);
  return transition.state;
}

function completedReviewState() {
  let state = namedState();
  let transition = reducePlanHomeTour(state, { type: "next" });
  assert.equal(transition.error, null);
  state = transition.state;

  for (const question of planHomeQuestions) {
    transition = reducePlanHomeTour(state, {
      type: "answer-question",
      questionId: question.id,
      answer: question.response.exampleAnswer,
    });
    assert.equal(transition.error, null);
    state = transition.state;

    transition = reducePlanHomeTour(state, { type: "next" });
    assert.equal(transition.error, null);
    state = transition.state;

    if (question.number === 6) {
      transition = reducePlanHomeTour(state, {
        type: "complete-contact-gate",
        contact,
      });
      assert.equal(transition.error, null);
      state = transition.state;
    }
  }

  assert.deepEqual(state.location, { kind: "review" });
  return state;
}

describe("Plan Your Home local snapshot adapter", () => {
  it("saves valid answer transitions and restores the exact prompt mid-zone", () => {
    const storage = new MemoryStorage();
    const now = () => new Date("2026-07-13T12:00:00.000Z");
    const adapter = createPlanHomeLocalSnapshotAdapter({ storage, now });
    let state = createInitialPlanHomeTourState();

    function dispatch(command: PlanHomeTourCommand) {
      const transition = reducePlanHomeTour(state, command);
      assert.equal(transition.error, null, transition.error?.message);
      state = transition.state;
      assert.equal(adapter.saveAfterTransition(transition), true);
    }

    dispatch({ type: "set-welcome-name", name: "Taylor Homeowner" });
    dispatch({ type: "next" });
    for (const question of planHomeQuestions.slice(0, 4)) {
      dispatch({
        type: "answer-question",
        questionId: question.id,
        answer: question.response.exampleAnswer,
      });
      dispatch({ type: "next" });
    }

    assert.deepEqual(state.location, {
      kind: "question",
      questionId: "home.stories",
      editingFromReview: false,
    });

    const refreshedAdapter = createPlanHomeLocalSnapshotAdapter({ storage, now });
    const restored = refreshedAdapter.load();
    assert.deepEqual(restored, state);
    assert.deepEqual(restored?.location, state.location);
  });

  it("does not save rejected answers and does save canonical valid answers", () => {
    const storage = new MemoryStorage();
    const adapter = createPlanHomeLocalSnapshotAdapter({
      storage,
      now: () => new Date("2026-07-13T12:00:00.000Z"),
    });
    let state = namedState();
    let transition = reducePlanHomeTour(state, { type: "next" });
    assert.equal(transition.error, null);
    state = transition.state;
    assert.equal(adapter.saveAfterTransition(transition), true);
    const before = storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY);

    transition = reducePlanHomeTour(state, {
      type: "answer-question",
      questionId: "project.starting-services",
      answer: {
        startingPoint: "fully-custom",
        services: ["building", "not-sure-yet"],
      },
    });
    assert.equal(transition.error?.code, "invalid-answer");
    assert.equal(adapter.saveAfterTransition(transition), false);
    assert.equal(storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY), before);

    transition = reducePlanHomeTour(state, {
      type: "answer-question",
      questionId: "project.starting-services",
      answer: planHomeQuestions[0].response.exampleAnswer,
    });
    assert.equal(transition.error, null);
    assert.equal(adapter.saveAfterTransition(transition), true);
    assert.notEqual(storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY), before);
  });

  it("expires at the exact 30-day boundary and removes the expired snapshot", () => {
    const storage = new MemoryStorage();
    const savedAt = Date.parse("2026-07-13T12:00:00.000Z");
    let nowMs = savedAt;
    const adapter = createPlanHomeLocalSnapshotAdapter({
      storage,
      now: () => new Date(nowMs),
    });

    assert.equal(adapter.save(namedState()), true);
    nowMs = savedAt + PLAN_HOME_LOCAL_SNAPSHOT_TTL_MS - 1;
    assert.notEqual(adapter.load(), null);
    nowMs = savedAt + PLAN_HOME_LOCAL_SNAPSHOT_TTL_MS;
    assert.equal(adapter.load(), null);
    assert.equal(storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY), null);
  });

  it("rejects and removes malformed, unknown-version, and impossible snapshots", () => {
    const storage = new MemoryStorage();
    const adapter = createPlanHomeLocalSnapshotAdapter({
      storage,
      now: () => new Date("2026-07-13T12:00:00.000Z"),
    });

    storage.setItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY, "{not-json");
    assert.equal(adapter.load(), null);
    assert.equal(storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY), null);

    storage.setItem(
      PLAN_HOME_LOCAL_SNAPSHOT_KEY,
      JSON.stringify({ snapshotVersion: 99, definitionId: "plan-home-v1" }),
    );
    assert.equal(adapter.load(), null);
    assert.equal(storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY), null);

    assert.equal(adapter.save(namedState()), true);
    const impossible = JSON.parse(
      storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY) as string,
    ) as Record<string, unknown>;
    impossible.progress = {
      location: {
        kind: "question",
        questionId: "contact.follow-up",
        editingFromReview: false,
      },
      completedZoneIds: [],
      checkpointedZoneIds: [],
    };
    storage.setItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY, JSON.stringify(impossible));
    assert.equal(adapter.load(), null);
    assert.equal(storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY), null);
  });

  it("rejects and clears non-contiguous completed-zone progress", () => {
    const storage = new MemoryStorage();
    const adapter = createPlanHomeLocalSnapshotAdapter({
      storage,
      now: () => new Date("2026-07-13T12:00:00.000Z"),
    });

    assert.equal(adapter.save(namedState()), true);
    const tampered = JSON.parse(
      storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY) as string,
    ) as {
      answers: Record<string, unknown>;
      progress: {
        completedZoneIds: string[];
        checkpointedZoneIds: string[];
      };
    };
    tampered.answers = Object.fromEntries(
      planHomeQuestions
        .filter((question) => question.zoneId === "primary-suite")
        .map((question) => [question.id, question.response.exampleAnswer]),
    );
    tampered.progress.completedZoneIds = ["primary-suite"];
    tampered.progress.checkpointedZoneIds = [];
    storage.setItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY, JSON.stringify(tampered));

    assert.equal(adapter.load(), null);
    assert.equal(storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY), null);
  });

  it("restores completed review and review-edit locations with later answers intact", () => {
    const storage = new MemoryStorage();
    const adapter = createPlanHomeLocalSnapshotAdapter({
      storage,
      now: () => new Date("2026-07-13T12:00:00.000Z"),
    });
    const reviewState = completedReviewState();
    const laterAnswer = structuredClone(
      reviewState.answers["project.budget-timing"],
    );

    assert.equal(adapter.save(reviewState), true);
    assert.deepEqual(adapter.load(), reviewState);

    const editTransition = reducePlanHomeTour(reviewState, {
      type: "jump-to-review-question",
      questionId: "project.starting-services",
    });
    assert.equal(editTransition.error, null);
    assert.equal(adapter.saveAfterTransition(editTransition), true);

    const restoredEdit = adapter.load();
    assert.deepEqual(restoredEdit, editTransition.state);
    assert.deepEqual(restoredEdit?.location, {
      kind: "question",
      questionId: "project.starting-services",
      editingFromReview: true,
    });
    assert.deepEqual(
      restoredEdit?.answers["project.budget-timing"],
      laterAnswer,
    );
  });

  it("never writes and always rejects raw blobs or sensitive resume tokens", () => {
    const storage = new MemoryStorage();
    const adapter = createPlanHomeLocalSnapshotAdapter({
      storage,
      now: () => new Date("2026-07-13T12:00:00.000Z"),
    });
    const state = {
      ...namedState(),
      rawFileBlobs: ["private-file-body"],
      resumeToken: "sensitive-token",
    } as PlanHomeTourState & {
      rawFileBlobs: string[];
      resumeToken: string;
    };

    assert.equal(adapter.save(state), true);
    const serialized = storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY) as string;
    assert.doesNotMatch(serialized, /private-file-body|sensitive-token|rawFileBlobs|resumeToken/);

    const unsafe = JSON.parse(serialized) as Record<string, unknown>;
    unsafe.rawFileBlobs = ["private-file-body"];
    unsafe.resumeToken = "sensitive-token";
    storage.setItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY, JSON.stringify(unsafe));
    assert.equal(adapter.load(), null);
    assert.equal(storage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY), null);
  });

  it("restores contact-gate progress without network or server state", () => {
    const storage = new MemoryStorage();
    const adapter = createPlanHomeLocalSnapshotAdapter({
      storage,
      now: () => new Date("2026-07-13T12:00:00.000Z"),
    });
    let state = namedState();
    state = reducePlanHomeTour(state, { type: "next" }).state;

    for (const question of planHomeQuestions.slice(0, 6)) {
      state = reducePlanHomeTour(state, {
        type: "answer-question",
        questionId: question.id,
        answer: question.response.exampleAnswer,
      }).state;
      state = reducePlanHomeTour(state, { type: "next" }).state;
    }

    assert.deepEqual(state.location, { kind: "contact-gate" });
    assert.equal(adapter.save(state), true);
    assert.deepEqual(adapter.load()?.location, { kind: "contact-gate" });

    const completed = reducePlanHomeTour(state, {
      type: "complete-contact-gate",
      contact,
    });
    assert.equal(completed.error, null);
    assert.equal(adapter.saveAfterTransition(completed), true);
    assert.deepEqual(adapter.load()?.location, {
      kind: "question",
      questionId: "home.future-support",
      editingFromReview: false,
    });
  });
});
