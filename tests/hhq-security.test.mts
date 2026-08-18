import assert from "node:assert/strict";
import test from "node:test";

import {
  adminSessionCookieName,
  adminSessionDurationSeconds,
  getAdminSessionCookieOptions,
} from "../lib/firebase/admin-session-policy.ts";
import {
  adminLoginFailureMessage,
} from "../lib/admin/login-policy.ts";
import { checkAdminLoginRateLimit } from "../lib/admin/login-rate-limit.ts";
import {
  adminResponseHeaders,
  buildContentSecurityPolicy,
  publicResponseHeaders,
} from "../lib/security/response-headers.mjs";

test("HHQ session policy stays on the admin route family for five days", () => {
  assert.equal(adminSessionCookieName, "__session");
  assert.equal(adminSessionDurationSeconds, 60 * 60 * 24 * 5);
  assert.deepEqual(getAdminSessionCookieOptions(true), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: adminSessionDurationSeconds,
  });
  assert.deepEqual(getAdminSessionCookieOptions(false), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/admin",
    maxAge: adminSessionDurationSeconds,
  });
});

test("HHQ login policy is generic and limits repeated session attempts", () => {
  assert.equal(
    adminLoginFailureMessage,
    "HHQ login could not be completed. Check your details or wait a moment and try again.",
  );

  const key = `test-${crypto.randomUUID()}`;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    assert.equal(checkAdminLoginRateLimit(key).allowed, true);
  }
  assert.equal(checkAdminLoginRateLimit(key).allowed, false);
});

test("response policy constrains framing, content, referrers, MIME, and capabilities", () => {
  const publicHeaders = new Map(
    publicResponseHeaders.map(({ key, value }) => [key.toLowerCase(), value]),
  );
  const adminHeaders = new Map(
    adminResponseHeaders.map(({ key, value }) => [key.toLowerCase(), value]),
  );
  const contentSecurityPolicy = buildContentSecurityPolicy({
    firebaseAuthEmulatorHost: "127.0.0.1:9099",
  });
  const developmentContentSecurityPolicy = buildContentSecurityPolicy({
    allowUnsafeEval: true,
    firebaseStorageEmulatorHost: "127.0.0.1:9199",
  });

  assert.equal(publicHeaders.get("x-frame-options"), "DENY");
  assert.equal(publicHeaders.get("x-content-type-options"), "nosniff");
  assert.equal(
    publicHeaders.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.match(publicHeaders.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.match(publicHeaders.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(contentSecurityPolicy, /https:\/\/identitytoolkit\.googleapis\.com/);
  assert.match(contentSecurityPolicy, /http:\/\/127\.0\.0\.1:9099/);
  assert.doesNotMatch(contentSecurityPolicy, /'unsafe-eval'/);
  assert.match(developmentContentSecurityPolicy, /'unsafe-eval'/);
  assert.match(developmentContentSecurityPolicy, /http:\/\/127\.0\.0\.1:9199/);
  assert.doesNotMatch(contentSecurityPolicy, /127\.0\.0\.1:9199/);
  assert.doesNotMatch(contentSecurityPolicy, /default-src \*/);
  assert.equal(adminHeaders.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(adminHeaders.get("x-robots-tag"), "noindex, nofollow, noarchive");
});
