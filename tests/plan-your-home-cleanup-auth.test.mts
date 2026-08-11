import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isAuthorizedPlanHomeCleanupRequest } from "../lib/plan-your-home/cleanup-auth.ts";

test("scheduled cleanup fails closed and accepts only an exact bearer secret", () => {
  const secret = "cleanup-test-secret-that-is-longer-than-32-characters";
  assert.equal(isAuthorizedPlanHomeCleanupRequest(null, secret), false);
  assert.equal(isAuthorizedPlanHomeCleanupRequest(`Bearer ${secret}`, undefined), false);
  assert.equal(
    isAuthorizedPlanHomeCleanupRequest("Bearer too-short", "too-short"),
    false,
  );
  assert.equal(
    isAuthorizedPlanHomeCleanupRequest(`Basic ${secret}`, secret),
    false,
  );
  assert.equal(
    isAuthorizedPlanHomeCleanupRequest(`Bearer ${secret}-wrong`, secret),
    false,
  );
  assert.equal(
    isAuthorizedPlanHomeCleanupRequest(`Bearer ${secret}`, secret),
    true,
  );

  const authSource = readFileSync(
    new URL("../lib/plan-your-home/cleanup-auth.ts", import.meta.url),
    "utf8",
  );
  const routeSource = readFileSync(
    new URL(
      "../app/api/internal/plan-your-home/cleanup/route.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const indexes = JSON.parse(
    readFileSync(
      new URL("../firestore.indexes.json", import.meta.url),
      "utf8",
    ),
  ) as {
    fieldOverrides?: Array<{
      collectionGroup?: string;
      fieldPath?: string;
      indexes?: Array<{ order?: string; queryScope?: string }>;
    }>;
  };
  assert.match(authSource, /timingSafeEqual/);
  assert.match(routeSource, /status: 401/);
  assert.doesNotMatch(routeSource, /console\.(?:log|error)\([^)]*(?:secret|authorization)/i);
  assert(
    indexes.fieldOverrides?.some(
      (override) =>
        override.collectionGroup === "referenceUploads" &&
        override.fieldPath === "expiresAt" &&
        override.indexes?.some(
          (index) =>
            index.order === "ASCENDING" &&
            index.queryScope === "COLLECTION_GROUP",
        ),
    ),
    "The production index manifest must support expired upload-ticket cleanup.",
  );
});
