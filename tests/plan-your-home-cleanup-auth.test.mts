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
  assert.match(authSource, /timingSafeEqual/);
  assert.match(routeSource, /status: 401/);
  assert.doesNotMatch(routeSource, /console\.(?:log|error)\([^)]*(?:secret|authorization)/i);
});
