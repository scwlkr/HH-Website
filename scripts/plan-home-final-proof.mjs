import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { chromium } from "playwright";

import {
  planHomeQuestions,
  planHomeZones,
} from "../features/plan-your-home/registry.ts";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const outputDirectory = path.join(
  process.cwd(),
  "output",
  "playwright",
  "issue-18",
  "final",
);
const viewports = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1440, height: 1000 },
};
const admin = {
  email: "issue-18-admin@example.invalid",
  password: "Issue18AdminPassword123!",
  uid: "issue-18-final-admin",
};
const visitor = {
  name: "Issue Eighteen Proof",
  email: "issue-18-plan@example.invalid",
  phone: "+1 214 555 0118",
};
const evidence = {
  tenSteps: Object.fromEntries(Array.from({ length: 10 }, (_, index) => [index + 1, false])),
  questionsExercised: [],
  zonesExercised: [],
  browserErrors: [],
  failedRequests: [],
  accessibilityViolations: [],
  inaccessibleControls: [],
  undersizedTargets: [],
  horizontalOverflow: [],
  layoutShift: [],
  transitionMilliseconds: [],
  motion: {
    inRoomContractMilliseconds: 300,
    roomTransitionContractMilliseconds: 420,
    roomTransitions: [],
    reducedMotionCssClampMilliseconds: 0.01,
    reducedMotionMaximumDelayMilliseconds: 0,
    reducedMotionSpatialMovement: false,
    reducedMotionMaximumMilliseconds: 0,
  },
  keyboard: {},
  zoom200: {},
  retainedArtifactAudit: {},
  references: {},
  hq: {},
  generic: {},
  screenshots: [],
};
let proofStage = "initializing";
let serverLogs = "";

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function availablePort() {
  const server = http.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  const { port } = address;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForServer(baseUrl, server) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/plan-your-home`);
      if (response.ok) return;
    } catch {
      // The isolated development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`The final proof server did not start at ${baseUrl}.`);
}

function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  server.kill("SIGINT");
}

function watchPage(page, label) {
  page.on("pageerror", (error) => {
    evidence.browserErrors.push(`${label}: pageerror ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      evidence.browserErrors.push(`${label}: console ${message.text()}`);
    }
  });
  page.on("requestfailed", (request) => {
    evidence.failedRequests.push(
      `${label}: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      evidence.failedRequests.push(
        `${label}: ${response.status()} ${response.request().method()} ${response.url()}`,
      );
    }
  });
}

async function preparePage(page) {
  await page.addInitScript(() => {
    window.__hhLayoutShift = 0;
    window.__hhLayoutShiftEntries = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__hhLayoutShift += entry.value;
          window.__hhLayoutShiftEntries.push({
            startTime: entry.startTime,
            value: entry.value,
            scrollY: window.scrollY,
            documentHeight: document.documentElement.scrollHeight,
            tourBeat: document.querySelector("[data-tour-beat]")?.getAttribute("data-tour-beat") ?? null,
            sources: (entry.sources ?? []).map((source) => ({
              node: source.node?.outerHTML?.slice(0, 180) ?? "",
              previousRect: source.previousRect,
              currentRect: source.currentRect,
            })),
          });
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
}

async function resetLayoutShift(page) {
  await page.evaluate(() => {
    window.__hhLayoutShift = 0;
    window.__hhLayoutShiftEntries = [];
  });
}

async function pageQuality(page, label) {
  if (!(await page.locator("html").evaluate(() => Boolean(window.axe)))) {
    await page.addScriptTag({ path: axePath });
  }
  const quality = await page.evaluate(async () => {
    const results = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"] },
    });
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rectangle = element.getBoundingClientRect();
      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rectangle.width > 0 &&
        rectangle.height > 0
      );
    };
    const controls = Array.from(
      document.querySelectorAll(
        'a[href], button, input:not([type="hidden"]), select, summary, textarea',
      ),
    ).filter(visible);
    const missingNames = controls
      .filter((element) => {
        const labelledBy = element.getAttribute("aria-labelledby");
        const labelledText = labelledBy
          ? labelledBy
              .split(/\s+/)
              .map((id) => document.getElementById(id)?.textContent ?? "")
              .join(" ")
          : "";
        const labels = "labels" in element
          ? Array.from(element.labels ?? []).map((item) => item.textContent ?? "").join(" ")
          : "";
        return ![
          element.getAttribute("aria-label"),
          labelledText,
          labels,
          element.textContent,
          element.getAttribute("title"),
          element.getAttribute("alt"),
          "value" in element && ["button", "submit"].includes(element.type)
            ? element.value
            : "",
        ].some((value) => String(value ?? "").trim().length > 0);
      })
      .map((element) => element.outerHTML.slice(0, 180));
    const undersizedTargets = controls
      .map((element) => {
        const wrappingLabel =
          "labels" in element
            ? Array.from(element.labels ?? []).find((label) => label.contains(element))
            : undefined;
        const target = wrappingLabel ?? element;
        const rectangle = target.getBoundingClientRect();
        return {
          element: element.outerHTML.slice(0, 140),
          width: rectangle.width,
          height: rectangle.height,
        };
      })
      .filter(({ width, height }) => width < 44 || height < 44);
    return {
      violations: results.violations.map((violation) => violation.id),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      missingNames,
      undersizedTargets,
      layoutShift: window.__hhLayoutShift ?? 0,
      layoutShiftEntries: window.__hhLayoutShiftEntries ?? [],
    };
  });
  if (quality.violations.length > 0) {
    evidence.accessibilityViolations.push(`${label}: ${quality.violations.join(", ")}`);
  }
  if (quality.overflow) evidence.horizontalOverflow.push(label);
  if (quality.missingNames.length > 0) {
    evidence.inaccessibleControls.push(`${label}: ${quality.missingNames.join(" | ")}`);
  }
  if (quality.undersizedTargets.length > 0) {
    evidence.undersizedTargets.push(`${label}: ${JSON.stringify(quality.undersizedTargets)}`);
  }
  evidence.layoutShift.push({ label, value: quality.layoutShift });
  assert.deepEqual(quality.violations, [], `${label} has axe violations.`);
  assert.equal(quality.overflow, false, `${label} has horizontal overflow.`);
  assert.deepEqual(quality.missingNames, [], `${label} has unnamed controls.`);
  assert.deepEqual(quality.undersizedTargets, [], `${label} has a target smaller than 44px.`);
  assert(
    quality.layoutShift <= 0.1,
    `${label} CLS ${quality.layoutShift} exceeds 0.1: ${JSON.stringify(quality.layoutShiftEntries)}`,
  );
}

async function waitForSceneReady(page) {
  const stage = page.locator("[data-tour-beat]");
  if ((await stage.count()) === 0) return;

  await page.locator("[data-plan-home-scene-loading]").waitFor({ state: "detached" });
  if ((await page.getByRole("progressbar").count()) > 0) {
    await page.locator("[data-scene-anchor]").first().waitFor({ state: "attached" });
  }
}

async function capture(page, name) {
  await waitForSceneReady(page);
  const filename = `${name}.png`;
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: path.join(outputDirectory, filename),
  });
  evidence.screenshots.push(filename);
  await pageQuality(page, name);
}

async function captureViewport(page, name) {
  await waitForSceneReady(page);
  const filename = `${name}.png`;
  await page.screenshot({
    animations: "disabled",
    path: path.join(outputDirectory, filename),
  });
  evidence.screenshots.push(filename);
  await pageQuality(page, name);
}

async function activate(control) {
  const input = control.first();
  await input.locator("xpath=..").click();
  assert.equal(await input.isChecked(), true);
}

function answerValues(answer) {
  if (typeof answer === "string") return [answer];
  if (Array.isArray(answer)) return answer;
  if (!answer || typeof answer !== "object") return [];
  return Object.values(answer).flatMap((value) => {
    if (Array.isArray(value)) return value;
    return typeof value === "string" ? [value] : [];
  });
}

async function answerRegistryQuestion(page, question) {
  await page.getByRole("heading", { name: question.prompt }).waitFor();
  const progress = page.getByRole("progressbar", {
    name: `Question ${question.number} of 35`,
  });
  await progress.waitFor();
  await waitForSceneReady(page);
  await pageQuality(page, `question-${question.number}`);
  const zone = planHomeZones.find((item) => item.id === question.zoneId);
  assert(zone);
  if (!evidence.zonesExercised.includes(zone.id)) evidence.zonesExercised.push(zone.id);
  evidence.questionsExercised.push(question.id);

  if (question.number === 32) return;
  if (question.number === 33) return;

  if (
    question.response.kind === "grouped" &&
    question.response.exampleAnswer &&
    typeof question.response.exampleAnswer === "object"
  ) {
    for (const group of question.response.optionGroups) {
      const groupAnswer = question.response.exampleAnswer[group.id];
      const groupControl = page.getByRole("group", { name: group.label });
      for (const value of answerValues(groupAnswer)) {
        await activate(groupControl.locator(`input[value="${value}"]`));
      }
      const continueButton = page.getByRole("button", {
        name: "Continue",
        exact: true,
      });
      if ((await continueButton.count()) > 0 && (await continueButton.isVisible())) {
        await continueButton.click();
      }
    }
  } else {
    const values = answerValues(question.response.exampleAnswer);
    for (const value of values) {
      const input = page.locator(`input[value="${value}"]`);
      if ((await input.count()) > 0) await activate(input);
    }
  }
  if (question.number === 2) {
    await page
      .getByLabel("City, county, address, or target area")
      .fill("Denton County");
  }
}

const roomTransitionQuestions = new Set([11, 15, 19, 21, 25, 30, 34]);

async function assertRoomTransitionMotion(page, fromQuestion) {
  const beat = page.locator("[data-tour-beat]").first();
  await beat.waitFor();
  const { animations, reducedMotion } = await beat.evaluate((element) => ({
    animations: element.getAnimations({ subtree: true }).map((animation) => {
      const effect = animation.effect;
      const frames = effect && "getKeyframes" in effect ? effect.getKeyframes() : [];
      const spatialFrames = frames.map((frame) => ({
        transform: frame.transform ?? "none",
        translate: frame.translate ?? "none",
        rotate: frame.rotate ?? "none",
        scale: frame.scale ?? "none",
      }));
      return {
        duration: Number(effect?.getComputedTiming().duration ?? 0),
        delay: Number(effect?.getTiming().delay ?? 0),
        spatialMovement:
          new Set(spatialFrames.map((frame) => JSON.stringify(frame))).size > 1,
      };
    }),
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  if (reducedMotion) {
    assert(
      animations.every(({ duration }) => duration <= evidence.motion.reducedMotionCssClampMilliseconds),
      `Reduced-motion room transition after question ${fromQuestion} exceeded the CSS clamp: ${JSON.stringify(animations)}.`,
    );
    assert(
      animations.every(({ delay }) => delay === 0),
      `Reduced-motion room transition after question ${fromQuestion} retained a delay: ${JSON.stringify(animations)}.`,
    );
    assert(
      animations.every(({ spatialMovement }) => !spatialMovement),
      `Reduced-motion room transition after question ${fromQuestion} retained spatial movement: ${JSON.stringify(animations)}.`,
    );
    evidence.motion.roomTransitions.push({
      from: fromQuestion,
      duration: 0,
      cssClampMaximum: Math.max(0, ...animations.map(({ duration }) => duration)),
      delay: 0,
      spatialMovement: false,
      reducedMotion: true,
    });
    return;
  }
  const durations = animations
    .map(({ duration }) => duration)
    .filter((duration) => Number.isFinite(duration) && duration > 0);
  const contractDuration = durations.find((duration) => duration >= 300 && duration <= 450);
  assert(
    contractDuration,
    `Room transition after question ${fromQuestion} did not expose a 300-450ms animation.`,
  );
  assert.equal(contractDuration, evidence.motion.roomTransitionContractMilliseconds);
  evidence.motion.roomTransitions.push({ from: fromQuestion, duration: contractDuration, reducedMotion: false });
}

async function advanceQuestion(page, question) {
  const label =
    question.number === 35
      ? "Review brief"
      : [11, 15, 19, 21, 25, 30, 34].includes(question.number)
        ? "Save room"
        : "Next";
  const stage = page.locator("[data-transition-state]");
  if ((await stage.count()) > 0) {
    const [exitMilliseconds, enterMilliseconds] = await Promise.all([
      stage.getAttribute("data-in-room-exit-ms"),
      stage.getAttribute("data-in-room-enter-ms"),
    ]);
    assert.equal(Number(exitMilliseconds) + Number(enterMilliseconds), 300);
  }
  const startedAt = Date.now();
  await page.getByRole("button", { name: label, exact: true }).click();
  const boundaryButtons = {
    19: "Continue down the hall",
    21: "Turn into the utility hall",
    25: "Step through the back door",
    30: "Open the design desk",
    34: "Choose follow-up",
  };
  const boundaryButton = boundaryButtons[question.number];
  if (boundaryButton) {
    const button = page.getByRole("button", { name: boundaryButton });
    await button.waitFor();
    await assertRoomTransitionMotion(page, question.number);
    await button.click();
  }
  const nextQuestion = planHomeQuestions[question.number];
  if (nextQuestion) {
    await page.getByRole("heading", { name: nextQuestion.prompt }).waitFor();
    if (roomTransitionQuestions.has(question.number) && !boundaryButton) {
      await assertRoomTransitionMotion(page, question.number);
    }
    await waitForSceneReady(page);
    await page.locator('[data-transition-state="idle"]').waitFor();
  } else {
    await page
      .getByRole("heading", { name: "One walkthrough, ready for a real conversation." })
      .waitFor();
  }
  const duration = Date.now() - startedAt;
  evidence.transitionMilliseconds.push({ from: question.number, duration });
  assert(duration < 3_000, `Transition after question ${question.number} took ${duration}ms.`);
}

async function waitForDraft(firestore, email, answerCount) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const snapshot = await firestore
      .collection("inquirySubmissions")
      .where("contact.email", "==", email)
      .limit(2)
      .get();
    const document = snapshot.docs[0];
    if (snapshot.size === 1 && document) {
      const data = document.data();
      if (Object.keys(data.answers ?? {}).length >= answerCount) {
        return { id: document.id, data };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for a ${answerCount}-answer Plan Home draft.`);
}

async function loginAdmin(page, baseUrl) {
  await page.goto(`${baseUrl}/admin/inquiries`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/admin/login") {
    await page.getByLabel("Email").fill(admin.email);
    await page.getByLabel("Password").fill(admin.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${baseUrl}/admin/inquiries`);
  }
  await page.getByRole("heading", { name: "Project Inquiries" }).waitFor();
}

async function proveDraftInHq(browser, baseUrl, name) {
  const context = await browser.newContext({ viewport: viewports.desktop });
  const page = await context.newPage();
  watchPage(page, "hq-draft");
  await preparePage(page);
  await loginAdmin(page, baseUrl);
  const draftLink = page.getByRole("link", { name });
  await draftLink.waitFor();
  const row = draftLink.locator("xpath=ancestor::li");
  assert((await row.textContent()).includes("Draft"));
  await capture(page, "desktop-hhq-draft-queue");
  await draftLink.click();
  await page.getByRole("heading", { name }).waitFor();
  await page.getByText("0 of 7 zones saved").waitFor();
  await page.getByText(`Question 7: ${planHomeQuestions[6].prompt}`).waitFor();
  await page.getByText("Question 6", { exact: true }).waitFor();
  await capture(page, "desktop-hhq-draft-detail");
  await context.close();
}

async function requestResumeInSeparateContext(browser, baseUrl) {
  const requestContext = await browser.newContext({
    viewport: viewports.desktop,
    reducedMotion: "reduce",
  });
  const requestPage = await requestContext.newPage();
  watchPage(requestPage, "resume-request");
  await preparePage(requestPage);
  await requestPage.goto(`${baseUrl}/plan-your-home/resume`, {
    waitUntil: "networkidle",
  });
  await capture(requestPage, "desktop-resume-request");
  await requestPage.getByLabel("Email used to save your plan").fill(visitor.email);
  await requestPage.getByRole("button", { name: "Email my resume link" }).click();
  await requestPage.getByRole("status").filter({ hasText: "If an eligible" }).waitFor();
  await capture(requestPage, "desktop-resume-requested-sanitized");
  const mailboxResponse = await fetch(
    `${baseUrl}/api/plan-your-home/resume-mail/latest`,
  );
  assert.equal(mailboxResponse.status, 200);
  const mailbox = await mailboxResponse.json();
  assert.equal(mailbox.message.to, visitor.email);
  const resumeUrl = mailbox.message.resumeUrl;
  const rawToken = new URLSearchParams(new URL(resumeUrl).hash.slice(1)).get("token");
  assert(rawToken);
  await requestContext.close();

  const restoredContext = await browser.newContext({
    viewport: viewports.desktop,
    reducedMotion: "reduce",
  });
  const restoredPage = await restoredContext.newPage();
  watchPage(restoredPage, "resume-consume");
  await preparePage(restoredPage);
  await restoredPage.goto(resumeUrl, { waitUntil: "networkidle" });
  await restoredPage
    .getByRole("heading", { name: "Your saved boundary is ready." })
    .waitFor();
  assert.equal(restoredPage.url().includes(rawToken), false);
  assert.equal(restoredPage.url().includes(visitor.email), false);
  await capture(restoredPage, "desktop-resume-consumed-sanitized");
  await restoredContext.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true,
  });
  await restoredPage.getByRole("link", { name: "Continue Plan Your Home" }).click();
  await restoredPage.getByRole("heading", { name: planHomeQuestions[11].prompt }).waitFor();
  assert.equal(
    await restoredPage.locator('[data-reduced-motion="true"]').count() > 0,
    true,
  );
  await capture(restoredPage, "desktop-resume-separate-context");
  assert.equal(serverLogs.includes(rawToken), false, "Raw resume token reached server logs.");
  return { context: restoredContext, page: restoredPage, rawToken };
}

async function addReferences(page) {
  const fileInput = page.locator('input[type="file"]');
  const pdf = Buffer.from("%PDF-1.7\nIssue 18 private plan reference");
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const fileInputTabs = await tabTo(page, fileInput);
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.keyboard.press("Enter"),
  ]);
  await fileChooser.setFiles({
    name: "brief.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await page.getByLabel("Note for brief.pdf (optional)").waitFor();
  await page.getByLabel("Note for brief.pdf (optional)").fill("Initial plan direction");
  await fileInput.setInputFiles({
    name: "palette.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.getByLabel("Note for palette.png (optional)").waitFor();
  await page.getByLabel("Note for palette.png (optional)").fill("Material palette");
  await page.getByLabel("Website link").fill("https://example.com/inspiration");
  await page.getByRole("button", { name: "Add link" }).click();
  await page.getByLabel("Note for example.com (optional)").waitFor();
  await page.getByLabel("Note for example.com (optional)").fill("Exterior reference");
  await page.getByRole("button", { name: "Remove brief.pdf" }).click();
  await page.getByLabel("Note for brief.pdf (optional)").waitFor({ state: "detached" });
  await fileInput.setInputFiles({
    name: "brief-replaced.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await page.getByLabel("Note for brief-replaced.pdf (optional)").waitFor();
  await page
    .getByLabel("Note for brief-replaced.pdf (optional)")
    .fill("Replacement plan direction");
  evidence.references = {
    pdf: true,
    image: true,
    httpsLink: true,
    notes: 3,
    removedAndReplaced: true,
  };
  evidence.keyboard.mainFlow = {
    ...(evidence.keyboard.mainFlow ?? {}),
    fileInputActivated: true,
    fileInputTabs,
  };
}

async function tabTo(page, locator, limit = 60) {
  for (let count = 1; count <= limit; count += 1) {
    await page.keyboard.press("Tab");
    if (await locator.evaluate((element) => document.activeElement === element)) return count;
  }
  throw new Error("Keyboard focus did not reach the expected control.");
}

async function keyboardProof(browser, baseUrl, name, viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage();
  watchPage(page, `keyboard-${name}`);
  await preparePage(page);
  await page.goto(`${baseUrl}/plan-your-home`, { waitUntil: "networkidle" });
  const nameInput = page.getByLabel("Your name");
  const nameTabs = await tabTo(page, nameInput);
  await page.keyboard.type(`Keyboard ${name}`);
  const openButton = page.getByRole("button", { name: "Open the front door" });
  const openTabs = await tabTo(page, openButton);
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: planHomeQuestions[0].prompt }).waitFor();
  assert.equal(await page.locator('[data-reduced-motion="true"]').count() > 0, true);
  const radio = page.locator('input[value="fully-custom"]');
  const radioTabs = await tabTo(page, radio);
  await page.keyboard.press("Space");
  assert.equal(await radio.isChecked(), true);
  const firstPartContinue = page.getByRole("button", {
    name: "Continue",
    exact: true,
  });
  const firstPartContinueTabs = await tabTo(page, firstPartContinue);
  await page.keyboard.press("Enter");
  const checkbox = page.locator('input[value="architectural-design"]');
  const checkboxTabs = await tabTo(page, checkbox);
  await page.keyboard.press("Space");
  assert.equal(await checkbox.isChecked(), true);
  const next = page.getByRole("button", { name: "Next", exact: true });
  const nextTabs = await tabTo(page, next);
  const navigationStartedAt = Date.now();
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: planHomeQuestions[1].prompt }).waitFor();
  const navigationMilliseconds = Date.now() - navigationStartedAt;
  assert(navigationMilliseconds < 100, `Reduced-motion navigation took ${navigationMilliseconds}ms.`);
  const cameraMotion = await page.locator("[data-camera-key]").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      animationDuration: style.animationDuration,
      transitionDuration: style.transitionDuration,
      runningAnimations: element.getAnimations().length,
    };
  });
  assert.equal(cameraMotion.animationDuration, "0s");
  assert.equal(cameraMotion.transitionDuration, "0s");
  assert.equal(cameraMotion.runningAnimations, 0);
  evidence.motion.reducedMotionMaximumMilliseconds = Math.max(
    evidence.motion.reducedMotionMaximumMilliseconds,
    navigationMilliseconds,
  );
  const lotStatus = page.locator('input[value="own-it"]');
  const lotTabs = await tabTo(page, lotStatus);
  await page.keyboard.press("Space");
  const lotContinue = page.getByRole("button", {
    name: "Continue",
    exact: true,
  });
  const lotContinueTabs = await tabTo(page, lotContinue);
  await page.keyboard.press("Enter");
  const location = page.getByLabel("City, county, address, or target area");
  const locationTabs = await tabTo(page, location);
  await page.keyboard.type("Keyboard County");
  const back = page.getByRole("button", { name: "Back", exact: true });
  const backTabs = await tabTo(page, back);
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: planHomeQuestions[0].prompt }).waitFor();
  assert(
    await page
      .getByRole("group", { name: "Completed Starting point" })
      .getByText("Fully custom")
      .isVisible(),
  );
  assert.equal(await checkbox.isChecked(), true);
  const retainedNextTabs = await tabTo(page, next);
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: planHomeQuestions[1].prompt }).waitFor();
  assert.equal(await location.inputValue(), "Keyboard County");
  await page.keyboard.press("Shift+Tab");
  assert.notEqual(await page.evaluate(() => document.activeElement === document.body), true);
  await capture(page, `${name}-keyboard-reduced-motion`);
  evidence.keyboard[name] = {
    reducedMotion: true,
    questionsCompleted: 2,
    radio: true,
    checkbox: true,
    text: true,
    backAndRetain: true,
    noTrap: true,
    tabCounts: [
      nameTabs,
      openTabs,
      radioTabs,
      firstPartContinueTabs,
      checkboxTabs,
      nextTabs,
      lotTabs,
      lotContinueTabs,
      locationTabs,
      backTabs,
      retainedNextTabs,
    ],
  };
  await context.close();
}

async function assignPrioritiesByKeyboard(page) {
  const categoryPicker = page.getByRole("group", {
    name: "Priority group to edit",
  });
  const mustHaves = categoryPicker.getByRole("button", {
    name: /Edit Must-haves/,
  });
  const niceToHaves = categoryPicker.getByRole("button", {
    name: /Edit Nice-to-haves/,
  });
  const items = page.locator("button[data-assignment]");
  assert((await items.count()) >= 2, "Q33 needs at least two selected features.");
  const first = items.nth(0);
  const second = items.nth(1);

  const mustTabs = await tabTo(page, mustHaves);
  await page.keyboard.press("Enter");
  assert.equal(await mustHaves.getAttribute("aria-pressed"), "true");
  const firstTabs = await tabTo(page, first);
  await page.keyboard.press("Enter");
  assert.match(await first.getAttribute("aria-label"), /: Must-have$/);

  const niceTabs = await tabTo(page, niceToHaves);
  await page.keyboard.press("Enter");
  assert.equal(await niceToHaves.getAttribute("aria-pressed"), "true");
  const secondTabs = await tabTo(page, second);
  await page.keyboard.press("Enter");
  assert.match(await second.getAttribute("aria-label"), /: Nice-to-have$/);

  evidence.keyboard.mainFlow = {
    ...(evidence.keyboard.mainFlow ?? {}),
    priorityMenus: ["must-have", "nice-to-have"],
    priorityTabs: [mustTabs, firstTabs, niceTabs, secondTabs],
  };
}

async function proveDesktopZoom(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 720, height: 500 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  watchPage(page, "desktop-200-percent-zoom");
  await preparePage(page);
  await page.goto(`${baseUrl}/plan-your-home`, { waitUntil: "networkidle" });
  await page.getByLabel("Your name").fill("Zoom Proof");
  await page.getByRole("button", { name: "Open the front door" }).click();
  await page.getByRole("heading", { name: planHomeQuestions[0].prompt }).waitFor();
  await waitForSceneReady(page);
  assert(await page.locator('input[value="fully-custom"]').isVisible());
  assert(await page.getByRole("button", { name: "Next", exact: true }).isVisible());
  await capture(page, "desktop-200-percent-zoom-equivalent");
  evidence.zoom200 = {
    cssViewport: { width: 720, height: 500 },
    deviceScaleFactor: 2,
    equivalentDesktopPixels: { width: 1440, height: 1000 },
    contentAndControlsPreserved: true,
  };
  await context.close();
}

async function fillGenericInquiry(page) {
  const continueButton = page.locator('button[type="button"]').last();

  await page.locator('input[name="name"]').fill("Issue 18 Commercial Proof");
  await page.locator('input[name="phone"]').fill("(512) 555-0118");
  await page.locator('input[name="email"]').fill("issue-18-commercial@example.invalid");
  await activate(page.locator('input[name="preferredContactMethod"][value="email"]'));
  await continueButton.evaluate((button) => button.click());
  await page.locator('select[name="projectType"]').waitFor();

  await page.locator('select[name="projectType"]').selectOption("commercial");
  await page.locator('input[name="approxSquareFootage"]').fill("5000");
  await page.locator('select[name="finishLevel"]').selectOption("builder-plus");
  await activate(page.locator('input[name="servicesNeeded"][value="building"]'));
  await continueButton.evaluate((button) => button.click());
  await page.locator('input[name="projectLocation"]').waitFor();

  await page.locator('input[name="projectLocation"]').fill("Austin, Texas");
  await page.locator('select[name="lotStatus"]').selectOption("already-owned");
  await page.locator('select[name="timeline"]').selectOption("3-6-months");
  await page.locator('select[name="budgetRange"]').selectOption("1m-2m");
  await continueButton.evaluate((button) => button.click());
  await page.locator('textarea[name="projectDescription"]').waitFor();

  await page
    .locator('textarea[name="projectDescription"]')
    .fill("Commercial project exercising the preserved generic inquiry path.");
  await continueButton.evaluate((button) => button.click());
  await page.locator('button[type="submit"]:not([disabled])').waitFor();
  await page.locator('button[type="submit"]:not([disabled])').click();
}

async function proveGeneric(browser, baseUrl, firestore) {
  const context = await browser.newContext({ viewport: viewports.desktop });
  const page = await context.newPage();
  watchPage(page, "generic");
  await preparePage(page);
  await page.goto(`${baseUrl}/start?buildType=commercial`, { waitUntil: "networkidle" });
  const genericLink = page.getByRole("link", { name: "Start Another Project Type" });
  assert((await genericLink.getAttribute("href")).includes("buildType=commercial"));
  await genericLink.click();
  await page.waitForURL(/\/inquire/);
  await fillGenericInquiry(page);
  await page.waitForURL(`${baseUrl}/thank-you`);
  await page.getByRole("heading", { name: "Brief Received" }).waitFor();
  await page.waitForLoadState("networkidle");
  await resetLayoutShift(page);
  await capture(page, "desktop-generic-confirmation");
  const result = await firestore
    .collection("inquirySubmissions")
    .where("email", "==", "issue-18-commercial@example.invalid")
    .get();
  assert.equal(result.size, 1);
  assert.equal(result.docs[0].data().projectType, "commercial");
  evidence.generic = { submitted: true, projectType: "commercial", recordCount: 1 };
  await context.close();
}

async function inspectAndDeleteHq(browser, baseUrl, firestore, bucket, draftId) {
  const context = await browser.newContext({ viewport: viewports.desktop });
  const page = await context.newPage();
  watchPage(page, "hq-final");
  await preparePage(page);
  await loginAdmin(page, baseUrl);
  await page.getByRole("link", { name: visitor.name }).click();
  await page.getByRole("heading", { name: visitor.name }).waitFor();
  assert.equal(await page.getByText(/^Question \d+$/).count(), 35);
  assert.equal(await page.getByRole("button", { name: "Open Private File" }).count(), 2);
  const externalLink = page.getByRole("link", { name: "Open example.com" });
  assert.equal((await externalLink.getAttribute("href")).startsWith("https://"), true);
  await capture(page, "desktop-hhq-submitted-detail");
  await page.setViewportSize(viewports.phone);
  await capture(page, "phone-hhq-submitted-detail");
  await page.setViewportSize(viewports.desktop);
  await page.getByRole("button", { name: "Mark Reviewed" }).click();
  await page.getByRole("button", { name: "Marked Reviewed" }).waitFor();
  await page.getByRole("button", { name: "Mark Spam" }).click();
  await page.getByRole("button", { name: "Marked Spam" }).waitFor();
  await page.getByRole("button", { name: "Delete Inquiry" }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Cancel" }).click();
  assert.equal(await page.getByRole("dialog").isVisible(), false);
  await page.getByRole("button", { name: "Delete Inquiry" }).click();
  await page.getByRole("button", { name: "Delete Inquiry and Files" }).click();
  await page.waitForURL(/\/admin\/inquiries\?deleted=1/);
  assert.equal(
    (await firestore.collection("inquirySubmissions").doc(draftId).get()).exists,
    false,
  );
  const [files] = await bucket.getFiles({ prefix: `inquiryReferences/${draftId}/` });
  assert.equal(files.length, 0);
  const tokens = await firestore
    .collection("planHomeResumeTokens")
    .where("draftId", "==", draftId)
    .get();
  assert.equal(tokens.empty, true);
  evidence.hq = {
    answers: 35,
    files: 2,
    links: 1,
    statuses: ["submitted", "reviewed", "spam"],
    deleteCancelledThenConfirmed: true,
    recordDeleted: true,
    filesDeleted: true,
    tokensDeleted: true,
  };
  await context.close();
}

async function seedAdmin(projectId) {
  const app = initializeApp(
    { projectId, storageBucket: `${projectId}.firebasestorage.app` },
    `issue-18-final-${Date.now()}`,
  );
  const auth = getAuth(app);
  try {
    await auth.deleteUser(admin.uid);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
  }
  await auth.createUser({
    uid: admin.uid,
    email: admin.email,
    emailVerified: true,
    password: admin.password,
  });
  await auth.setCustomUserClaims(admin.uid, { role: "admin" });
  return app;
}

async function writeReport() {
  await writeFile(
    path.join(outputDirectory, "summary.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  const steps = Object.entries(evidence.tenSteps)
    .map(([step, passed]) => `<li>Step ${step}: ${passed ? "PASS" : "FAIL"}</li>`)
    .join("");
  await writeFile(
    path.join(outputDirectory, "report.html"),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Issue 18 final proof</title><body><h1>Plan Your Home final proof</h1><ol>${steps}</ol><p>Questions exercised: ${evidence.questionsExercised.length}. Zones: ${evidence.zonesExercised.length}. Browser errors: ${evidence.browserErrors.length}. Failed requests: ${evidence.failedRequests.length}.</p></body></html>\n`,
  );
}

async function auditRetainedArtifacts(rawResumeToken) {
  const summaryPath = path.join(outputDirectory, "summary.json");
  const reportPath = path.join(outputDirectory, "report.html");
  const tracePaths = [
    path.join(outputDirectory, "trace-before-resume.zip"),
    path.join(outputDirectory, "trace.zip"),
  ];
  const textArtifacts = [
    serverLogs,
    await readFile(summaryPath, "utf8"),
    await readFile(reportPath, "utf8"),
    ...tracePaths.map((tracePath) =>
      execFileSync(
        "unzip",
        ["-p", tracePath, "trace.trace", "trace.network"],
        {
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
        },
      ).replace(/page@[a-f0-9]+-\d+\.jpe?g/gi, ""),
    ),
  ];
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
  const emails = new Set(
    textArtifacts.flatMap((artifact) => artifact.match(emailPattern) ?? []),
  );
  const unexpectedPrivateEmails = [...emails].filter((email) => {
    const normalized = email.toLowerCase();
    return normalized !== "hello@howethandharp.com" && !normalized.endsWith(".invalid");
  });
  assert.deepEqual(
    unexpectedPrivateEmails,
    [],
    "Retained proof contains a non-public email outside the reserved .invalid fixture domain.",
  );
  assert(
    textArtifacts.every((artifact) => !artifact.includes(rawResumeToken)),
    "Raw resume token reached a retained artifact or server log.",
  );
  evidence.retainedArtifactAudit = {
    traceCount: tracePaths.length,
    reservedFixtureEmailsOnly: true,
    publicContactAllowlisted: true,
    rawResumeTokenAbsent: true,
  };
}

async function main() {
  const projectId =
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID;
  assert(projectId?.startsWith("demo-"), "Final proof requires a demo Firebase project.");
  assert(process.env.FIRESTORE_EMULATOR_HOST, "Firestore emulator is required.");
  assert(process.env.FIREBASE_AUTH_EMULATOR_HOST, "Auth emulator is required.");
  assert(process.env.FIREBASE_STORAGE_EMULATOR_HOST, "Storage emulator is required.");
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const app = await seedAdmin(projectId);
  const firestore = getFirestore(app);
  const bucket = getStorage(app).bucket(`${projectId}.firebasestorage.app`);
  const server = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        FIREBASE_PROJECT_ID: projectId,
        FIREBASE_STORAGE_BUCKET: `${projectId}.firebasestorage.app`,
        NEXT_PUBLIC_SITE_URL: baseUrl,
        NEXT_PUBLIC_FIREBASE_API_KEY: "firebase-emulator-api-key",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${projectId}.firebasestorage.app`,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789012",
        NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456789012:web:issue18final",
        NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST:
          process.env.FIREBASE_AUTH_EMULATOR_HOST,
        PLAN_HOME_DRAFT_SESSION_SECRET:
          "issue-18-final-draft-session-secret-value",
        PLAN_HOME_RESUME_SECRET: "issue-18-final-resume-link-secret-value",
        PLAN_HOME_PUBLIC_ORIGIN: baseUrl,
        PLAN_HOME_RESUME_MAIL_TRANSPORT: "fake",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stdout.on("data", (chunk) => (serverLogs += chunk.toString()));
  server.stderr.on("data", (chunk) => (serverLogs += chunk.toString()));
  let browser;
  let mainContext;
  let rawResumeToken;

  try {
    await waitForServer(baseUrl, server);
    browser = await chromium.launch();
    mainContext = await browser.newContext({ viewport: viewports.phone });
    await mainContext.tracing.start({ screenshots: true, snapshots: true, sources: true });
    let page = await mainContext.newPage();
    watchPage(page, "main-tour");
    await preparePage(page);
    proofStage = "opening phone welcome";
    await page.goto(`${baseUrl}/plan-your-home`, { waitUntil: "networkidle" });
    await page.getByLabel("Your name").fill(visitor.name);
    assert.equal(
      await page.getByText(visitor.name).evaluate((element) =>
        Boolean(element.closest('[aria-hidden="true"]')),
      ),
      true,
    );
    assert.deepEqual(page.viewportSize(), viewports.phone);
    const plaqueNameBox = await page.getByText(visitor.name).boundingBox();
    assert(plaqueNameBox);
    assert(plaqueNameBox.y >= 0 && plaqueNameBox.y + plaqueNameBox.height <= viewports.phone.height);
    await captureViewport(page, "phone-name-on-house-plaque");
    evidence.tenSteps[1] = true;
    await page.getByRole("button", { name: "Open the front door" }).click();

    let draftId;
    for (const question of planHomeQuestions) {
      proofStage = `question ${question.number}`;
      await answerRegistryQuestion(page, question);
      if (question.number === 32) {
        await addReferences(page);
        await capture(page, "phone-references-remove-replace");
        evidence.tenSteps[6] = true;
      }
      if (question.number === 33) {
        await assignPrioritiesByKeyboard(page);
      }
      if (question.number === 8) {
        await advanceQuestion(page, question);
        await page.reload({ waitUntil: "networkidle" });
        await page.getByRole("heading", { name: planHomeQuestions[8].prompt }).waitFor();
        assert.equal(await page.getByRole("progressbar").getAttribute("value"), "9");
        await capture(page, "phone-mid-zone-refresh-exact-q9");
        evidence.tenSteps[3] = true;
        continue;
      }
      if (question.number === 6) {
        await page.getByRole("button", { name: "Next", exact: true }).click();
        await page.getByRole("heading", { name: "Save your progress and resume later." }).waitFor();
        await page.getByLabel("Email").fill(visitor.email);
        await page.getByLabel("Phone").fill(visitor.phone);
        await activate(page.getByRole("checkbox", { name: /Save my progress/ }));
        await page.getByRole("button", { name: "Save and continue" }).click();
        await page.getByRole("heading", { name: planHomeQuestions[6].prompt }).waitFor();
        const draft = await waitForDraft(firestore, visitor.email, 6);
        draftId = draft.id;
        assert.equal(draft.data.status, "draft");
        await proveDraftInHq(browser, baseUrl, visitor.name);
        continue;
      }
      await advanceQuestion(page, question);
      if (question.number === 11) {
        const checkpoint = await waitForDraft(firestore, visitor.email, 11);
        assert(checkpoint.data.progress.completedZoneIds.includes("project-and-living"));
        evidence.tenSteps[4] = true;
        await mainContext.tracing.stop({
          path: path.join(outputDirectory, "trace-before-resume.zip"),
        });
        await mainContext.close();
        const resumed = await requestResumeInSeparateContext(browser, baseUrl);
        mainContext = resumed.context;
        page = resumed.page;
        rawResumeToken = resumed.rawToken;
        evidence.tenSteps[5] = true;
        await page.setViewportSize(viewports.phone);
      }
    }

    assert.equal(evidence.questionsExercised.length, 35);
    assert.equal(new Set(evidence.questionsExercised).size, 35);
    assert.deepEqual(evidence.zonesExercised, planHomeZones.map((zone) => zone.id));
    evidence.tenSteps[2] = true;
    proofStage = "review edit and submission";
    await capture(page, "phone-complete-review");
    const retainedFollowUp = page.getByText("Email", { exact: true }).last();
    assert(await retainedFollowUp.isVisible());
    assert.equal(
      await page.getByRole("button", { name: /^Edit Q\d+:/ }).count(),
      35,
    );
    const editButton = page.getByRole("button", {
      name: `Edit Q1: ${planHomeQuestions[0].prompt}`,
    });
    const editTabs = await tabTo(page, editButton);
    await page.keyboard.press("Enter");
    await page.getByRole("heading", { name: planHomeQuestions[0].prompt }).waitFor();
    const editStartingPoint = page.getByRole("button", {
      name: "Edit Starting point",
    });
    const editStartingPointTabs = await tabTo(page, editStartingPoint);
    await page.keyboard.press("Enter");
    const currentAnswer = page.locator('input[value="fully-custom"]');
    const editedAnswer = page.locator('input[value="adapt-existing-plan"]');
    const editedAnswerTabs = await tabTo(page, currentAnswer);
    await page.keyboard.press("ArrowDown");
    assert.equal(await editedAnswer.isChecked(), true);
    const editSave = page.getByRole("button", { name: "Save", exact: true });
    const editSaveTabs = await tabTo(page, editSave);
    await page.keyboard.press("Enter");
    await page
      .getByRole("heading", { name: "One walkthrough, ready for a real conversation." })
      .waitFor();
    assert(await page.getByText("Replacement plan direction").isVisible());
    assert(await retainedFollowUp.isVisible());
    evidence.tenSteps[7] = true;
    await page.setViewportSize(viewports.desktop);
    await capture(page, "desktop-review-after-early-edit");
    const consent = page.getByRole("checkbox", { name: /I am submitting an inquiry/ });
    const consentTabs = await tabTo(page, consent);
    await page.keyboard.press("Space");
    const submit = page.getByRole("button", { name: "Submit project brief" });
    const submitTabs = await tabTo(page, submit);
    await page.keyboard.press("Enter");
    await page.getByRole("heading", { name: `Thank you, ${visitor.name}.` }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Submit project brief" }).count(), 0);
    await capture(page, "desktop-single-submit-confirmation");
    await page.setViewportSize(viewports.phone);
    await capture(page, "phone-single-submit-confirmation");
    const submitted = await waitForDraft(firestore, visitor.email, 35);
    assert.equal(submitted.id, draftId);
    assert.equal(submitted.data.status, "submitted");
    assert.equal(submitted.data.references.length, 3);
    evidence.tenSteps[8] = true;
    evidence.keyboard.mainFlow = {
      ...(evidence.keyboard.mainFlow ?? {}),
      reviewEditReturn: true,
      consentAndSubmit: true,
      reviewTabs: [
        editTabs,
        editStartingPointTabs,
        editedAnswerTabs,
        editSaveTabs,
        consentTabs,
        submitTabs,
      ],
    };
    assert(draftId);

    proofStage = "keyboard and reduced motion";
    await keyboardProof(browser, baseUrl, "phone", viewports.phone);
    await keyboardProof(browser, baseUrl, "desktop", viewports.desktop);
    proofStage = "200 percent zoom";
    await proveDesktopZoom(browser, baseUrl);
    evidence.tenSteps[9] = true;
    proofStage = "generic commercial inquiry";
    await proveGeneric(browser, baseUrl, firestore);
    evidence.tenSteps[10] = true;
    proofStage = "HHQ submitted inquiry";
    await inspectAndDeleteHq(browser, baseUrl, firestore, bucket, draftId);

    assert.deepEqual(evidence.browserErrors, []);
    assert.deepEqual(evidence.failedRequests, []);
    assert.deepEqual(evidence.accessibilityViolations, []);
    assert.deepEqual(evidence.inaccessibleControls, []);
    assert.deepEqual(evidence.undersizedTargets, []);
    assert.deepEqual(evidence.horizontalOverflow, []);
    assert(Object.values(evidence.tenSteps).every(Boolean));
    assert(rawResumeToken);
    await mainContext.tracing.stop({ path: path.join(outputDirectory, "trace.zip") });
    await writeReport();
    proofStage = "retained artifact audit";
    await auditRetainedArtifacts(rawResumeToken);
    await writeReport();
    log(
      `Plan Home final proof passed: steps=10/10, questions=35, zones=7, screenshots=${evidence.screenshots.length}, browserErrors=0, failedRequests=0, axeFindings=0, undersizedTargets=0, overflow=0, trace=output/playwright/issue-18/final/trace.zip`,
    );
  } catch (error) {
    if (mainContext) {
      await mainContext.tracing
        .stop({ path: path.join(outputDirectory, "trace-failure.zip") })
        .catch(() => undefined);
    }
    await writeReport().catch(() => undefined);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Final proof failed during ${proofStage}: ${message}`);
  } finally {
    if (browser) await browser.close();
    stopServer(server);
    await deleteApp(app);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
