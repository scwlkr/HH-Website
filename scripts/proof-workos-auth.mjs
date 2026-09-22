import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { chromium } from "playwright";

// A local OAuth/API fixture exercises the real AuthKit SDK and HHQ boundaries.
// It never calls WorkOS, sends mail, uses real identities, or accesses Firebase.
const appPort = 3317;
const apiPort = 3318;
const origin = `http://localhost:${appPort}`;
const org = "org_hhq_fixture";
const client = "client_hhq_fixture";
const sessions = new Map();
const codes = new Map();
const authResponses = new Map();
let refreshes = 0;
let nextSignInEmail = "staff@fixture.invalid";
let membershipActive = true;
let providerAvailable = true;
const { privateKey, publicKey } = await generateKeyPair("RS256");
const jwk = { ...await exportJWK(publicKey), kid: "hhq-fixture", alg: "RS256", use: "sig" };
const json = (response, value, status = 200) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
};
const api = createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${apiPort}`);
  const parts = [];
  for await (const part of request) parts.push(part);
  const body = Buffer.concat(parts).toString();
  if (url.pathname === "/user_management/authorize") {
    const email = nextSignInEmail;
    const code = randomUUID();
    codes.set(code, { email, challenge: url.searchParams.get("code_challenge") });
    const callback = new URL(url.searchParams.get("redirect_uri"));
    assert.equal(callback.origin, origin);
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", url.searchParams.get("state"));
    response.writeHead(302, { location: callback.toString() });
    response.end();
  } else if (url.pathname === "/user_management/authenticate") {
    const input = JSON.parse(body);
    if (input.grant_type === "refresh_token") {
      const previous = authResponses.get(input.refresh_token);
      const session = sessions.get(input.refresh_token);
      if (!previous || session?.status !== "active") return json(response, { message: "Revoked" }, 401);
      refreshes++;
      const accessToken = await new SignJWT({ sid: session.id, org_id: org, role: "hhq-staff" })
        .setProtectedHeader({ alg: "RS256", kid: "hhq-fixture" }).setSubject(session.user_id)
        .setIssuedAt().setExpirationTime("5m").sign(privateKey);
      return json(response, { ...previous, access_token: accessToken });
    }
    const entry = codes.get(input.code);
    codes.delete(input.code);
    if (!entry || createHash("sha256").update(input.code_verifier).digest("base64url") !== entry.challenge) {
      return json(response, { message: "Invalid code or verifier" }, 401);
    }
    const id = entry.email.startsWith("staff@") ? "user_staff" : "user_unapproved";
    const sid = `session_${randomUUID()}`;
    const now = new Date();
    sessions.set(sid, { object: "session", id: sid, user_id: id, organization_id: org,
      status: "active", auth_method: "magic_code", created_at: now.toISOString(),
      updated_at: now.toISOString(), expires_at: new Date(Date.now() + 432000000).toISOString(),
      ended_at: null, ip_address: null, user_agent: null });
    const token = await new SignJWT({ sid, org_id: org, role: "hhq-staff" })
      .setProtectedHeader({ alg: "RS256", kid: "hhq-fixture" }).setSubject(id)
      .setIssuedAt().setExpirationTime("1s").sign(privateKey);
    const authResponse = { access_token: token, refresh_token: sid,
      organization_id: org, authentication_method: "MagicAuth",
      user: { object: "user", id, email: entry.email, email_verified: true,
        first_name: "Fixture", last_name: "Staff", profile_picture_url: null,
        created_at: now.toISOString(), updated_at: now.toISOString(), metadata: {} } };
    authResponses.set(sid, authResponse);
    json(response, authResponse);
  } else if (url.pathname === `/sso/jwks/${client}`) {
    json(response, { keys: [jwk] });
  } else if (url.pathname === "/user_management/organization_memberships") {
    if (!providerAvailable) return json(response, { message: "Unavailable" }, 503);
    const id = url.searchParams.get("user_id");
    json(response, { data: [{ object: "organization_membership", id: "om_fixture",
      user_id: id, organization_id: org, organization_name: "H and H",
      status: membershipActive ? "active" : "inactive",
      role: { slug: id === "user_staff" ? "hhq-staff" : "member" },
      created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
      list_metadata: { before: null, after: null } });
  } else if (/^\/user_management\/users\/[^/]+\/sessions$/.test(url.pathname)) {
    if (!providerAvailable) return json(response, { message: "Unavailable" }, 503);
    json(response, { data: [...sessions.values()].filter((s) => url.pathname.includes(`/${s.user_id}/`)),
      list_metadata: { before: null, after: null } });
  } else if (url.pathname === "/user_management/sessions/logout") {
    const session = sessions.get(url.searchParams.get("session_id"));
    if (session) session.status = "revoked";
    response.writeHead(302, { location: `${origin}/admin/login?signed_out=1` });
    response.end();
  } else json(response, { message: "Not found" }, 404);
});
await new Promise((resolve) => api.listen(apiPort, "127.0.0.1", resolve));
const env = { ...process.env, HHQ_AUTH_PROVIDER: "workos",
  WORKOS_API_KEY: "sk_test_local_fixture", WORKOS_CLIENT_ID: client,
  WORKOS_COOKIE_PASSWORD: "fixture-only-cookie-password-at-least-32-characters",
  WORKOS_COOKIE_MAX_AGE: "432000", WORKOS_COOKIE_NAME: "wos-session",
  WORKOS_ORGANIZATION_ID: org, WORKOS_API_HOSTNAME: "127.0.0.1",
  WORKOS_API_HTTPS: "false", WORKOS_API_PORT: String(apiPort),
  NEXT_PUBLIC_WORKOS_REDIRECT_URI: `${origin}/admin/callback`,
  FIREBASE_PROJECT_ID: "", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
  GOOGLE_CLOUD_PROJECT: "", GCLOUD_PROJECT: "", GCP_PROJECT_ID: "",
};
let next, browser;
let serverOutput = "";
const output = "output/workos-auth";
try {
  // The fixture intentionally has no database; never reuse or leave its empty
  // public-data cache for the emulator suite or a subsequent production build.
  await rm(".next/cache/fetch-cache", { recursive: true, force: true });
  console.log("Building production app against local AuthKit fixture...");
  const build = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build"], { env, stdio: "pipe" });
  let buildOutput = "";
  build.stdout.on("data", (value) => { buildOutput += value; });
  build.stderr.on("data", (value) => { buildOutput += value; });
  const [buildStatus] = await once(build, "exit");
  assert.equal(buildStatus, 0, buildOutput);
  next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(appPort)], { env, stdio: "pipe" });
  next.stdout.on("data", (value) => { serverOutput += value; });
  next.stderr.on("data", (value) => { serverOutput += value; });
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`${origin}/admin/login`)).ok) break; } catch { /* Starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await mkdir(output, { recursive: true });
  await page.goto(`${origin}/admin/projects`);
  assert.equal(new URL(page.url()).pathname, "/admin/login");
  for (const [name, width, height] of [["desktop", 1440, 1000], ["phone", 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `${output}/login-${name}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await context.setExtraHTTPHeaders({ "x-workos-middleware": "true", "x-workos-session": "forged" });
  await page.goto(`${origin}/admin/projects`);
  assert.equal(new URL(page.url()).pathname, "/admin/login");
  await context.setExtraHTTPHeaders({});
  const signin = async (approved = true) => {
    await page.goto(`${origin}/admin/login`);
    nextSignInEmail = approved ? "staff@fixture.invalid" : "unapproved@fixture.invalid";
    await page.getByRole("link", { name: "Continue to sign in" }).click();
    await page.waitForURL(approved ? `${origin}/admin/projects` : `${origin}/admin/login?error=1`);
  };
  await signin(false);
  assert.equal((await context.cookies()).some((c) => c.name === "wos-session"), false, `Session cookie remains at ${page.url()}`);
  await signin();
  await page.getByRole("heading", { name: "Completed Homes" }).waitFor();
  const cookie = (await context.cookies()).find((c) => c.name === "wos-session");
  assert.ok(cookie?.httpOnly && cookie.secure && cookie.sameSite === "Lax" && cookie.path === "/admin");
  assert.ok(cookie.expires - Date.now() / 1000 <= 432001);
  assert.equal((await context.cookies()).some((c) => c.name.startsWith("wos-auth-verifier")), false, "PKCE cookie remains after callback");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await page.reload();
  assert.ok(refreshes > 0, "Expired token must refresh through the real SDK");
  const refreshedCookies = (await context.cookies()).filter((c) => c.name === "wos-session");
  assert.equal(refreshedCookies.length, 1, "Refresh must not introduce a second cookie path");
  assert.equal(refreshedCookies[0].path, "/admin");
  await page.getByRole("heading", { name: "Completed Homes" }).waitFor();
  membershipActive = false;
  await page.goto(`${origin}/admin/projects`);
  assert.equal(new URL(page.url()).pathname, "/admin/login");
  const privateRead = await context.request.post(`${origin}/admin/inquiries/file`, { form: { inquiryId: "fixture", referenceId: "fixture" }, maxRedirects: 0 });
  assert.ok([303, 307].includes(privateRead.status()));
  assert.match(privateRead.headers().location, /\/admin\/login/);
  membershipActive = true;
  for (const session of sessions.values()) session.status = "revoked";
  await page.goto(`${origin}/admin/projects`);
  assert.equal(new URL(page.url()).pathname, "/admin/login");
  await signin();
  providerAvailable = false;
  await page.goto(`${origin}/admin/projects`);
  assert.equal(new URL(page.url()).pathname, "/admin/login");
  providerAvailable = true;
  await page.goto(`${origin}/admin/projects`);
  await page.getByRole("button", { name: "Your account" }).click();
  await page.getByRole("button", { name: "Sign Out" }).click();
  await page.waitForURL(`${origin}/admin/login?signed_out=1`);
  assert.equal((await context.cookies()).some((c) => c.name === "wos-session"), false, `Session cookie remains at ${page.url()}`);
  await page.goto(`${origin}/admin/callback?code=forged&state=forged`);
  assert.equal(page.url(), `${origin}/admin/login?error=1`);
  assert.equal((await context.cookies()).some((c) => c.name === "wos-session"), false, `Session cookie remains at ${page.url()}`);
  assert.deepEqual(failures, []);
  const result = { provider: "local OAuth/API fixture; real AuthKit SDK", productionBuild: true,
    approvedSignIn: true, unauthorizedSignInDenied: true, spoofedHeadersDenied: true,
    sessionCookieScope: "/admin", tokenRefresh: true, removedStaffDenied: true,
    revokedSessionDenied: true, privateFileDenied: true, outageDenied: true,
    logout: true, forgedCallbackDenied: true, browserErrors: failures };
  await writeFile(`${output}/summary.json`, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(error.message);
  // The fixture contains no real secrets or personal information. Avoid printing tokens.
  console.error(serverOutput.replace(/(?:Fe26\.[^\s]+|eyJ[A-Za-z0-9_.-]+)/g, "[fixture token redacted]").slice(-4000));
  process.exitCode = 1;
} finally {
  await browser?.close();
  next?.kill("SIGTERM");
  api.close();
  await rm(".next/cache/fetch-cache", { recursive: true, force: true });
}
