import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PLAN_HOME_CLIENT_DRAFT_KEY,
  createPlanHomeClientDraftAdapter,
} from "../features/plan-your-home/client-draft-state.ts";

function memoryStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
    entries,
  };
}

const createIdempotencyKey =
  "local-3f2504e0-4f89-41d3-9a0c-0305e82c3301:plan-home-v1:contact-gate";

describe("Plan Your Home client draft metadata", () => {
  it("keeps a pending create key stable across refresh without storing a session secret", () => {
    const storage = memoryStorage();
    const adapter = createPlanHomeClientDraftAdapter(storage);

    assert.equal(
      adapter.save({
        createIdempotencyKey,
        projectAndLivingCheckpointKey: null,
        draftId: null,
        revision: null,
      }),
      true,
    );
    assert.deepEqual(adapter.load(), {
      createIdempotencyKey,
      projectAndLivingCheckpointKey: null,
      draftId: null,
      revision: null,
    });
    assert(!storage.entries.get(PLAN_HOME_CLIENT_DRAFT_KEY)?.includes("secret"));
  });

  it("restores identified draft revision and clears malformed metadata", () => {
    const storage = memoryStorage();
    const adapter = createPlanHomeClientDraftAdapter(storage);
    const identified = {
      createIdempotencyKey,
      projectAndLivingCheckpointKey:
        "local-a2cbf314-5057-4f01-b10d-b77647c719f9:plan-home-v1:zone:project-and-living",
      kitchenAndDiningCheckpointKey:
        "local-9bdb3ceb-80cd-4cfd-bf34-4bb16274c9ef:plan-home-v1:zone:kitchen-and-dining",
      primarySuiteCheckpointKey:
        "local-328392c8-4b91-4904-8e60-3840b844349c:plan-home-v1:zone:primary-suite",
      draftId: `draft-${"a".repeat(40)}`,
      revision: 2,
    };

    assert.equal(adapter.save(identified), true);
    assert.deepEqual(adapter.load(), identified);

    storage.setItem(PLAN_HOME_CLIENT_DRAFT_KEY, JSON.stringify({ draftId: "bad" }));
    assert.equal(adapter.load(), null);
    assert.equal(storage.getItem(PLAN_HOME_CLIENT_DRAFT_KEY), null);
  });

  it("rejects malformed room checkpoint keys while accepting earlier metadata", () => {
    const storage = memoryStorage();
    const adapter = createPlanHomeClientDraftAdapter(storage);
    const issueSixMetadata = {
      createIdempotencyKey,
      projectAndLivingCheckpointKey:
        "local-a2cbf314-5057-4f01-b10d-b77647c719f9:plan-home-v1:zone:project-and-living",
      draftId: `draft-${"b".repeat(40)}`,
      revision: 2,
    };

    assert.equal(adapter.save(issueSixMetadata), true);
    assert.deepEqual(adapter.load(), issueSixMetadata);
    assert.equal(
      adapter.save({
        ...issueSixMetadata,
        kitchenAndDiningCheckpointKey: "predictable-kitchen-key",
      }),
      false,
    );
    assert.equal(
      adapter.save({
        ...issueSixMetadata,
        primarySuiteCheckpointKey: "predictable-primary-key",
      }),
      false,
    );
  });
});
