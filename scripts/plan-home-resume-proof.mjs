import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const outputDirectory = path.join(
  process.cwd(),
  "output",
  "playwright",
  "issue-14",
);
const email = "resume-browser-proof@example.com";
const viewports = {
  desktop: { width: 1440, height: 1000 },
  phone: { width: 390, height: 844 },
};
let proofStage = "initializing";
let serverLogs = "";

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert(address && typeof address === "object");
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForServer(baseUrl, server) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/plan-your-home/resume`);
      if (response.ok) return;
    } catch {
      // The dev server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error("The isolated Plan Your Home proof server did not start.");
}

function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

function watchPage(page, evidence) {
  page.on("pageerror", () => evidence.browserErrors.push("pageerror"));
  page.on("console", (message) => {
    if (message.type() === "error") evidence.browserErrors.push("console-error");
  });
}

async function assertPageQuality(page, evidence) {
  await page.addScriptTag({ path: axePath });
  const results = await page.evaluate(async () => {
    const axe = window.axe;
    const audit = await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"] },
    });
    return audit.violations
      .filter((violation) => ["serious", "critical"].includes(violation.impact))
      .map((violation) => violation.id);
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  evidence.axeSeriousOrCritical.push(...results);
  evidence.overflow ||= overflow;
  assert.deepEqual(results, []);
  assert.equal(overflow, false);
}

async function capture(page, name) {
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: path.join(outputDirectory, `${name}.png`),
  });
}

async function activateOption(control) {
  await control.locator("xpath=..").click();
  await control.evaluate(
    (input) =>
      new Promise((resolve, reject) => {
        if (input.checked) {
          resolve(true);
          return;
        }
        requestAnimationFrame(() =>
          input.checked ? resolve(true) : reject(new Error("option-not-selected")),
        );
      }),
  );
  assert.equal(await control.isChecked(), true);
}

async function createDraftAndProveExactLocalResume(browser, baseUrl, evidence) {
  proofStage = "opening original draft";
  const context = await browser.newContext({
    viewport: viewports.desktop,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  watchPage(page, evidence);
  await page.goto(`${baseUrl}/plan-your-home`, { waitUntil: "networkidle" });
  proofStage = "waiting for Welcome";
  await page.getByLabel("Your name").fill("Resume Browser Proof");
  await page.getByRole("button", { name: "Open the front door" }).click();
  await page.waitForTimeout(750);

  proofStage = "answering question 1";
  await activateOption(page.getByRole("radio", { name: "Fully custom" }));
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await activateOption(
    page.getByRole("checkbox", { name: "Architectural design" }),
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  proofStage = "answering question 2";
  await activateOption(page.getByRole("radio", { name: "Own it" }));
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByLabel("City, county, address, or target area")
    .fill("Denton County");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  proofStage = "answering question 3";
  await activateOption(page.getByRole("checkbox", { name: "Wooded" }));
  await page.getByRole("button", { name: "Next", exact: true }).click();
  proofStage = "answering question 4";
  await activateOption(page.getByRole("radio", { name: "2,000–2,499" }));
  await page.getByRole("button", { name: "Next", exact: true }).click();
  proofStage = "answering question 5";
  await activateOption(
    page.getByRole("radio", { name: "One", exact: true }),
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  proofStage = "answering question 6";
  await activateOption(
    page.getByRole("group", { name: "Bedrooms" }).getByLabel("4"),
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await activateOption(
    page.getByRole("group", { name: "Full bathrooms" }).getByLabel("3"),
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await activateOption(
    page.getByRole("group", { name: "Half bathrooms" }).getByLabel("1"),
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  proofStage = "saving contact gate";
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").fill("2145550100");
  await activateOption(
    page.getByRole("checkbox", { name: /Save my progress/ }),
  );
  await page.getByRole("button", { name: "Save and continue" }).click();
  proofStage = "waiting for identified draft";
  await page
    .getByRole("heading", { name: /Who should this home support/ })
    .waitFor();
  await activateOption(
    page.getByRole("checkbox", { name: "Growing family" }),
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await activateOption(page.getByRole("checkbox", { name: "Gathering" }));
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("heading", { name: "How should the main living areas connect?" })
    .waitFor();
  await page.reload({ waitUntil: "networkidle" });
  proofStage = "verifying exact same-device prompt";
  await page
    .getByRole("heading", { name: "How should the main living areas connect?" })
    .waitFor();
  await assertPageQuality(page, evidence);
  await capture(page, "desktop-same-device-exact-prompt");
  await context.close();
}

async function requestAndConsume(
  browser,
  baseUrl,
  viewportName,
  evidence,
  assertAbsentFromServerLogs,
) {
  proofStage = `${viewportName} request page`;
  const context = await browser.newContext({
    viewport: viewports[viewportName],
    reducedMotion: "reduce",
    ...(viewportName === "phone" ? { hasTouch: true, isMobile: true } : {}),
  });
  const page = await context.newPage();
  watchPage(page, evidence);
  await page.goto(`${baseUrl}/plan-your-home/resume`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("heading", { name: /Pick up the plan/ }).waitFor();
  await assertPageQuality(page, evidence);
  await capture(page, `${viewportName}-request`);

  await page.getByLabel("Email used to save your plan").fill(email);
  await page.getByRole("button", { name: "Email my resume link" }).click();
  proofStage = `${viewportName} generic response`;
  await page.waitForTimeout(1_000);
  await page.getByRole("status").filter({ hasText: "If an eligible" }).waitFor();
  assert.equal(
    await page.getByLabel("Email used to save your plan").inputValue(),
    "",
  );
  await assertPageQuality(page, evidence);
  await capture(page, `${viewportName}-generic-response`);

  const mailboxResponse = await fetch(
    `${baseUrl}/api/plan-your-home/resume-mail/latest`,
  );
  assert.equal(mailboxResponse.status, 200);
  const mailbox = await mailboxResponse.json();
  assert.equal(mailbox.message.to, email);
  const resumeUrl = mailbox.message.resumeUrl;
  const rawToken = new URLSearchParams(
    new URL(resumeUrl).hash.slice(1),
  ).get("token");
  assert(rawToken);
  await context.close();

  proofStage = `${viewportName} consuming separate-context link`;
  const restoredContext = await browser.newContext({
    viewport: viewports[viewportName],
    reducedMotion: "reduce",
    ...(viewportName === "phone" ? { hasTouch: true, isMobile: true } : {}),
  });
  const restoredPage = await restoredContext.newPage();
  watchPage(restoredPage, evidence);
  await restoredPage.goto(resumeUrl, { waitUntil: "networkidle" });
  await restoredPage.waitForTimeout(1_000);
  await restoredPage
    .getByRole("heading", { name: "Your saved boundary is ready." })
    .waitFor();
  assert.equal(restoredPage.url().includes(rawToken), false);
  assert.equal(restoredPage.url().includes(email), false);
  evidence.sanitizedPaths.push(new URL(restoredPage.url()).pathname);
  await assertPageQuality(restoredPage, evidence);
  await capture(restoredPage, `${viewportName}-consume-sanitized`);
  await restoredPage.getByRole("link", { name: "Continue Plan Your Home" }).click();
  proofStage = `${viewportName} restoring server boundary`;
  await restoredPage
    .getByRole("heading", { name: /Who should this home support/ })
    .waitFor();
  assert.equal(restoredPage.url(), `${baseUrl}/plan-your-home`);
  await assertPageQuality(restoredPage, evidence);
  await capture(restoredPage, `${viewportName}-restored-server-boundary`);
  await restoredContext.close();

  proofStage = `${viewportName} replaying used link`;
  const replayContext = await browser.newContext({ viewport: viewports[viewportName] });
  const replayPage = await replayContext.newPage();
  await replayPage.goto(resumeUrl, { waitUntil: "networkidle" });
  proofStage = `${viewportName} inspecting used-link result`;
  await replayPage.getByText("That one-time link is unavailable.").waitFor();
  proofStage = `${viewportName} checking replay URL sanitation`;
  assert.equal(replayPage.url().includes(rawToken), false);
  assert.equal(replayPage.url().includes(email), false);
  await replayContext.close();
  proofStage = `${viewportName} checking token-free server logs`;
  assertAbsentFromServerLogs(rawToken);
}

async function main() {
  assert(
    process.env.FIRESTORE_EMULATOR_HOST,
    "The resume browser proof requires the Firestore emulator.",
  );
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      detached: true,
      env: {
        ...process.env,
        FIREBASE_PROJECT_ID: "demo-hh-website",
        PLAN_HOME_DRAFT_SESSION_SECRET:
          "resume-browser-proof-draft-session-secret",
        PLAN_HOME_RESUME_SECRET: "resume-browser-proof-link-secret-value",
        PLAN_HOME_RESUME_MAIL_TRANSPORT: "fake",
        PLAN_HOME_PUBLIC_ORIGIN: baseUrl,
        NEXT_PUBLIC_SITE_URL: baseUrl,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stdout.on("data", (chunk) => (serverLogs += chunk.toString()));
  server.stderr.on("data", (chunk) => (serverLogs += chunk.toString()));
  let browser;
  const evidence = {
    axeSeriousOrCritical: [],
    browserErrors: [],
    overflow: false,
    sanitizedPaths: [],
  };

  try {
    proofStage = "starting isolated app";
    await waitForServer(baseUrl, server);
    proofStage = "launching browser";
    browser = await chromium.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });
    await createDraftAndProveExactLocalResume(browser, baseUrl, evidence);
    const assertAbsentFromServerLogs = (value) => {
      if (!serverLogs.includes(value)) return;
      const sanitizedLine = serverLogs
        .split("\n")
        .find((line) => line.includes(value))
        ?.replaceAll(value, "[TOKEN]")
        .replaceAll(email, "[EMAIL]");
      throw new Error(`raw-token-log:${sanitizedLine ?? "unknown-line"}`);
    };
    await requestAndConsume(
      browser,
      baseUrl,
      "desktop",
      evidence,
      assertAbsentFromServerLogs,
    );
    await requestAndConsume(
      browser,
      baseUrl,
      "phone",
      evidence,
      assertAbsentFromServerLogs,
    );
    proofStage = "checking browser errors";
    assert.deepEqual(evidence.browserErrors, []);
    proofStage = "checking accessibility scan";
    assert.deepEqual(evidence.axeSeriousOrCritical, []);
    proofStage = "checking overflow";
    assert.equal(evidence.overflow, false);
    proofStage = "checking contact-free server logs";
    assert.equal(serverLogs.includes(email), false);
    await writeFile(
      path.join(outputDirectory, "summary.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
      "utf8",
    );
    process.stdout.write(
      "Plan Home resume browser evidence: sameDeviceExact=true, separateContext=true, tokenUrlSanitized=true, replayGeneric=true, desktopCaptures=4, phoneCaptures=4, browserErrors=0, overflow=false, axeSeriousOrCritical=0\n",
    );
  } finally {
    if (browser) await browser.close();
    stopServer(server);
  }
}

main().catch((error) => {
  const errorKind = error instanceof Error ? error.name : "UnknownError";
  const safeDetail =
    (proofStage === "answering question 1" ||
      proofStage.includes("token-free server logs")) &&
    error instanceof Error
      ? ` Detail: ${error.message}`
      : "";
  const safeServerDetail = proofStage.includes("consum")
    ? ` ${serverLogs
        .split("\n")
        .filter((line) => line.includes("resume consume failed"))
        .slice(-1)
        .join("")}`
    : "";
  process.stderr.write(
    `Plan Home resume browser proof failed during: ${proofStage} (${errorKind}).${safeDetail}${safeServerDetail} Sensitive values were not retained.\n`,
  );
  process.exitCode = 1;
});
