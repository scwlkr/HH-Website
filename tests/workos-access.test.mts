import assert from "node:assert/strict";
import test from "node:test";
import type { WorkOS } from "@workos-inc/node";
import { normalizeAdminNextPath } from "../lib/admin/auth-config.ts";
import { hasCurrentHHQAccess } from "../lib/admin/workos-access.ts";

const now = Date.parse("2026-09-22T12:00:00Z");
const identity = {
  user: { id: "user_staff", emailVerified: true },
  organizationId: "org_hhq", sessionId: "session_staff",
};
function fixture() {
  const membership = {
    userId: "user_staff", organizationId: "org_hhq", status: "active",
    role: { slug: "hhq-staff" },
  };
  const session = {
    id: "session_staff", userId: "user_staff", organizationId: "org_hhq",
    status: "active", createdAt: new Date(now - 60000).toISOString(),
    expiresAt: new Date(now + 60000).toISOString(),
  };
  const api = {
    listOrganizationMemberships: async () => ({ data: [membership] }),
    listSessions: async () => ({ autoPagination: async () => [session] }),
  } as unknown as WorkOS["userManagement"];
  return { api, membership, session };
}

test("HHQ requires the approved identity, organization, and current staff role", async () => {
  const { api, membership } = fixture();
  assert.equal(await hasCurrentHHQAccess(identity, "org_hhq", api, now), true);
  for (const change of [
    { user: null }, { user: { id: "user_other", emailVerified: true } },
    { user: { id: "user_staff", emailVerified: false } },
    { organizationId: "org_other" }, { sessionId: undefined },
    { impersonator: { email: "actor@fixture.invalid" } },
  ]) {
    assert.equal(await hasCurrentHHQAccess({ ...identity, ...change }, "org_hhq", api, now), false);
  }
  assert.equal(await hasCurrentHHQAccess(identity, undefined, api, now), false);
  membership.role.slug = "member";
  assert.equal(await hasCurrentHHQAccess(identity, "org_hhq", api, now), false);
  membership.role.slug = "hhq-staff";
  membership.status = "inactive";
  assert.equal(await hasCurrentHHQAccess(identity, "org_hhq", api, now), false);
});

test("HHQ rechecks removal, revocation, and the absolute five-day session limit", async () => {
  const { api, membership, session } = fixture();
  const check = () => hasCurrentHHQAccess(identity, "org_hhq", api, now);
  assert.equal(await check(), true);
  membership.status = "inactive";
  assert.equal(await check(), false);
  membership.status = "active";
  session.status = "revoked";
  assert.equal(await check(), false);
  session.status = "active";
  session.createdAt = new Date(now - 5 * 86400000).toISOString();
  assert.equal(await check(), false);
  session.createdAt = new Date(now - 1000).toISOString();
  session.expiresAt = new Date(now).toISOString();
  assert.equal(await check(), false);
  session.expiresAt = new Date(now + 1000).toISOString();
  session.userId = "user_other";
  assert.equal(await check(), false);
  session.userId = "user_staff";
  session.organizationId = "org_other";
  assert.equal(await check(), false);
});

test("HHQ fails closed when current authority cannot be checked", async () => {
  const { api } = fixture();
  api.listOrganizationMemberships = async () => { throw new Error("Unavailable"); };
  assert.equal(await hasCurrentHHQAccess(identity, "org_hhq", api, now), false);
});

test("sign-in continuation stays within HHQ and avoids auth loops", () => {
  assert.equal(normalizeAdminNextPath("/admin/inquiries?status=new"), "/admin/inquiries?status=new");
  for (const input of [undefined, "https://evil.invalid/admin", "//evil.invalid", "/admin/../../", "/admin\\evil", "/administrator", "/admin/login", "/admin/sign-in", "/admin/callback", "http://["]) {
    assert.equal(normalizeAdminNextPath(input), "/admin/projects");
  }
});
