import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import {
  PLAN_HOME_REFINEMENT_STATES,
  createPlanHomeRefinementFixture,
  normalizePlanHomeRefinementState,
} from "../features/plan-your-home/refinement-fixture.ts";
import {
  PLAN_HOME_REVIEW_SNAPSHOT_KEY,
  createPlanHomeLocalSnapshotAdapter,
} from "../features/plan-your-home/local-snapshot.ts";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const outputDirectory = path.join(process.cwd(), "output", "plan-home-refinement", "latest");
const pilotOriginalDirectory = path.join(process.cwd(), "output", "plan-home-refinement", "pilot-original");
const viewports = {
  phone: { width: 390, height: 844 },
  "short-phone": { width: 375, height: 667 },
  desktop: { width: 1440, height: 1000 },
};
const routeTargets = {
  walkthrough: "/plan-your-home",
  "owner-review": "/plan-your-home/review",
};
const baseMatrix = [
  ["welcome", "phone"],
  ["contact", "phone"],
  ["q1", "phone"],
  ["q2", "phone"],
  ["q3", "phone"],
  ["q4", "phone"],
  ["q5", "phone"],
  ["q6", "phone"],
  ["q7", "phone"],
  ["q8", "phone"],
  ["q9", "phone"],
  ["q10", "phone"],
  ["q11", "phone"],
  ["q12", "phone"],
  ["q14", "phone"],
  ["q18", "phone"],
  ["q20", "phone"],
  ["q23", "phone"],
  ["q27", "phone"],
  ["q28", "phone"],
  ["q29", "phone"],
  ["q31", "phone"],
  ["review", "phone"],
  ["confirmation", "phone"],
  ["welcome", "desktop"],
  ["q1", "desktop"],
  ["q4", "desktop"],
  ["q12", "desktop"],
  ["q29", "desktop"],
  ["q31", "desktop"],
  ["review", "desktop"],
  ["confirmation", "desktop"],
];
const noScrollQuestionStates = new Set(["q2", "q6", "q12", "q27", "q30"]);
const stagedQuestionStates = new Set(["q2", "q12", "q27", "q30"]);
const noScrollMatrix = [...noScrollQuestionStates].flatMap((state) =>
  Object.keys(routeTargets).flatMap((routeTarget) =>
    ["phone", "short-phone"].map((viewport) => [state, viewport, routeTarget]),
  ),
);
const defaultMatrix = [
  ...baseMatrix.map(([state, viewport]) => [state, viewport, "walkthrough"]),
  ...noScrollMatrix,
].filter(
  ([state, viewport, routeTarget], index, matrix) =>
    matrix.findIndex(
      (candidate) =>
        candidate[0] === state &&
        candidate[1] === viewport &&
        candidate[2] === routeTarget,
    ) === index,
);

function parseInput() {
  const values = process.argv.slice(2).filter((value) => value !== "--");
  if (values.length > 1) throw new Error("Use one named state: welcome, contact, q1-q31, review, or confirmation.");
  if (values.length === 0) return { focused: false, captures: defaultMatrix };
  const state = normalizePlanHomeRefinementState(values[0]);
  if (!state) {
    throw new Error(`Unknown state '${values[0]}'. Choose: ${PLAN_HOME_REFINEMENT_STATES.join(", ")}.`);
  }
  return {
    focused: true,
    captures: [
      [state, "phone", "walkthrough"],
      [state, "desktop", "walkthrough"],
    ],
  };
}

function createReviewSnapshot(state) {
  const fixture = createPlanHomeRefinementFixture(state);
  let serialized = null;
  const adapter = createPlanHomeLocalSnapshotAdapter({
    key: PLAN_HOME_REVIEW_SNAPSHOT_KEY,
    storage: {
      getItem: () => serialized,
      setItem: (_key, value) => {
        serialized = value;
      },
      removeItem: () => {
        serialized = null;
      },
    },
  });
  assert.equal(adapter.save(fixture.state), true, `${state} owner-review fixture saves`);
  assert(serialized, `${state} owner-review fixture serializes`);
  return { fixture, serialized };
}

async function availablePort() {
  const server = http.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  const port = address.port;
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
      // Development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`The refinement server did not start at ${baseUrl}.`);
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  try {
    if (process.platform !== "win32" && server.pid) {
      process.kill(-server.pid, "SIGINT");
    } else {
      server.kill("SIGINT");
    }
  } catch {
    server.kill("SIGINT");
  }
  await Promise.race([
    once(server, "exit"),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
}

function watchPage(page, result) {
  page.on("pageerror", (error) => result.errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") result.errors.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    result.errors.push(`request: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? "failed"}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      result.errors.push(`response: ${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
}

async function quality(page) {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    const axeResults = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"] },
    });
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rectangle = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rectangle.width > 0 && rectangle.height > 0;
    };
    const controls = Array.from(document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, summary, textarea')).filter(visible);
    const labelTargets = Array.from(
      document.querySelectorAll(
        "[data-plan-home-zone-label], [data-plan-home-actions] button, [data-plan-home-prompt-scroll] label",
      ),
    ).filter(visible);
    const accessibleName = (element) => {
      const labelledBy = element.getAttribute("aria-labelledby");
      const labelledText = labelledBy
        ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ")
        : "";
      const labels = "labels" in element
        ? Array.from(element.labels ?? []).map((label) => label.textContent ?? "").join(" ")
        : "";
      return [element.getAttribute("aria-label"), labelledText, labels, element.textContent, element.getAttribute("title"), element.getAttribute("alt")]
        .some((value) => String(value ?? "").trim().length > 0);
    };
    const interactiveTarget = (element) => {
      const wrappingLabel = "labels" in element
        ? Array.from(element.labels ?? []).find((label) => label.contains(element))
        : undefined;
      return wrappingLabel ?? element;
    };
    const targetSize = (element) => {
      return interactiveTarget(element).getBoundingClientRect();
    };
    const isClippedAtPoint = (element, x, y) => {
      for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        const clipsX = ["auto", "scroll", "hidden", "clip"].includes(style.overflowX);
        const clipsY = ["auto", "scroll", "hidden", "clip"].includes(style.overflowY);
        if (!clipsX && !clipsY) continue;
        const rectangle = ancestor.getBoundingClientRect();
        if (
          (clipsX && (x < rectangle.left || x > rectangle.right)) ||
          (clipsY && (y < rectangle.top || y > rectangle.bottom))
        ) {
          return true;
        }
      }
      return false;
    };
    const isObscuredInViewport = (element) => {
      const target = interactiveTarget(element);
      const rectangle = target.getBoundingClientRect();
      const centerX = rectangle.left + rectangle.width / 2;
      const centerY = rectangle.top + rectangle.height / 2;
      if (
        centerX < 0 ||
        centerX > window.innerWidth ||
        centerY < 0 ||
        centerY > window.innerHeight
      ) {
        return false;
      }
      if (isClippedAtPoint(target, centerX, centerY)) return false;
      const topElement = document.elementFromPoint(centerX, centerY);
      return Boolean(
        topElement &&
        topElement !== target &&
        !target.contains(topElement) &&
        !topElement.contains(target),
      );
    };
    return {
      violations: axeResults.violations.map((violation) => violation.id),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      unnamedControls: controls.filter((element) => !accessibleName(element)).map((element) => element.outerHTML.slice(0, 160)),
      undersizedTargets: controls.map((element) => ({ element: element.outerHTML.slice(0, 120), ...targetSize(element).toJSON() })).filter(({ width, height }) => width < 44 || height < 44),
      obscuredTargets: controls.filter(isObscuredInViewport).map((element) => element.outerHTML.slice(0, 160)),
      truncatedLabels: labelTargets
        .filter(
          (element) =>
            element.scrollWidth > element.clientWidth + 1 ||
            element.scrollHeight > element.clientHeight + 1,
        )
        .map((element) => element.outerHTML.slice(0, 160)),
    };
  });
}

async function activateByKeyboard(page, control) {
  await control.focus();
  await page.keyboard.press("Enter");
}

async function assertNavigation(page, state, viewportName) {
  if (state === "welcome") {
    const nameInput = page.getByLabel("Your name");
    await nameInput.fill("Refinement Homeowner");
    await activateByKeyboard(page, page.getByRole("button", { name: "Open the front door" }));
    await page.locator('[data-plan-home-refinement-state="q1"]').waitFor();
    await activateByKeyboard(page, page.getByRole("button", { name: "Back" }));
    await page.locator('[data-plan-home-refinement-state="welcome"]').waitFor();
    await nameInput.fill("");
    return;
  }
  if (state === "contact") {
    await activateByKeyboard(page, page.getByRole("button", { name: "Back" }));
    await page.locator('[data-plan-home-refinement-state="q6"]').waitFor();
    await activateByKeyboard(page, page.getByRole("button", { name: "Next", exact: true }));
    await page.locator('[data-plan-home-refinement-state="contact"]').waitFor();
    return;
  }
  if (state === "review") {
    if (viewportName !== "desktop") {
      await activateByKeyboard(page, page.getByRole("button", { name: "Next" }));
    }
    await activateByKeyboard(page, page.getByRole("button", { name: /Edit/ }).first());
    await page.locator('[data-plan-home-refinement-state^="q"]').waitFor();
    await activateByKeyboard(page, page.getByRole("button", { name: "Cancel" }));
    await page.locator('[data-plan-home-refinement-state="review"]').waitFor();
    return;
  }
  if (!state.startsWith("q")) return;
  const number = Number(state.slice(1));
  const back = page.getByRole("button", { name: "Back" });
  await activateByKeyboard(page, back);
  const previousState = number === 1 ? "welcome" : number === 7 ? "contact" : `q${number - 1}`;
  await page.locator(`[data-plan-home-refinement-state="${previousState}"]`).waitFor();
  const forward =
    number === 1
      ? page.getByRole("button", { name: "Open the front door" })
      : number === 7
        ? page.getByRole("button", { name: "Save and continue" })
        : page.getByRole("button", { name: "Next", exact: true });
  await activateByKeyboard(page, forward);
  await page.locator(`[data-plan-home-refinement-state="q${number}"]`).waitFor();
}

async function assertReviewSubmission(page, viewportName) {
  if (viewportName !== "desktop") {
    for (let pageIndex = 0; pageIndex < 10; pageIndex += 1) {
      const submission = page.locator(
        '[data-review-submission][data-review-page-active="true"]',
      );
      if ((await submission.count()) > 0) break;
      await activateByKeyboard(page, page.getByRole("button", { name: "Next" }));
    }
  }
  const consent = page.getByRole("checkbox", { name: /I am submitting an inquiry/ });
  await consent.focus();
  await page.keyboard.press("Space");
  assert.equal(await consent.isChecked(), true, "review consent is keyboard operable");
  const submit = page.getByRole("button", { name: "Submit project brief" });
  assert.equal(await submit.isEnabled(), true, "submission action is enabled after consent");
  const submissionScreenshot = `submission-${viewportName}.png`;
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, submissionScreenshot),
  });
  await activateByKeyboard(page, submit);
  await page.locator('[data-plan-home-refinement-state="confirmation"]').waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Submit project brief" }).count(),
    0,
    "submission resolves to one confirmation",
  );
  const confirmationQuality = await quality(page);
  assertQuality(confirmationQuality, "submitted confirmation");
  return {
    consentByKeyboard: true,
    confirmationReached: true,
    screenshot: submissionScreenshot,
    quality: confirmationQuality,
  };
}

function assertQuality(result, context) {
  assert.deepEqual(result.violations, [], `${context} accessibility violations`);
  assert.equal(result.overflow, false, `${context} horizontal overflow`);
  assert.deepEqual(result.unnamedControls, [], `${context} unnamed controls`);
  assert.deepEqual(result.undersizedTargets, [], `${context} undersized targets`);
  assert.deepEqual(result.obscuredTargets, [], `${context} obscured targets`);
  assert.deepEqual(result.truncatedLabels, [], `${context} truncated labels`);
}

async function assertPromptScrollReachability(page, state, requireNoScroll) {
  if (!state.startsWith("q")) return null;
  const region = page.locator("[data-plan-home-prompt-scroll]");
  const metrics = await region.evaluate((element) => {
    const regionRect = element.getBoundingClientRect();
    const actionsRect = document
      .querySelector("[data-plan-home-actions]")
      ?.getBoundingClientRect();
    const targetFor = (control) =>
      "labels" in control
        ? Array.from(control.labels ?? []).find((label) => label.contains(control)) ?? control
        : control;
    const controls = Array.from(
      element.querySelectorAll(
        'input:not([type="hidden"]), button, select, textarea, a[href]',
      ),
    )
      .filter((control) => control.getClientRects().length > 0)
      .map(targetFor);
    const hiddenControls = controls
      .filter((control) => {
        const bounds = control.getBoundingClientRect();
        return (
          bounds.top < regionRect.top - 1 ||
          bounds.bottom > regionRect.bottom + 1 ||
          bounds.left < regionRect.left - 1 ||
          bounds.right > regionRect.right + 1
        );
      })
      .map((control) => control.outerHTML.slice(0, 160));
    return {
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      documentHeight: Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      ),
      viewportHeight: window.innerHeight,
      scrollY: window.scrollY,
      actionTop: actionsRect?.top ?? null,
      actionBottom: actionsRect?.bottom ?? null,
      activeControlCount: controls.length,
      hiddenControls,
    };
  });
  if (requireNoScroll) {
    assert(
      metrics.documentHeight <= metrics.viewportHeight + 1,
      `${state} locks document scroll (${metrics.documentHeight}px document in ${metrics.viewportHeight}px viewport)`,
    );
    assert.equal(metrics.scrollY, 0, `${state} stays at the top of the locked document`);
    assert(
      metrics.scrollHeight <= metrics.clientHeight + 1,
      `${state} keeps every active prompt control visible without prompt scrolling (${metrics.scrollHeight}px content in ${metrics.clientHeight}px viewport)`,
    );
    assert(metrics.activeControlCount > 0, `${state} exposes active prompt controls`);
    assert.deepEqual(
      metrics.hiddenControls,
      [],
      `${state} keeps the complete active option set visible`,
    );
    assert(
      metrics.actionTop !== null &&
        metrics.actionBottom !== null &&
        metrics.actionTop >= 0 &&
        metrics.actionBottom <= metrics.viewportHeight + 1,
      `${state} keeps Back and Next inside the visible viewport`,
    );
    return {
      needed: false,
      reachable: true,
      clientHeight: metrics.clientHeight,
      scrollHeight: metrics.scrollHeight,
    };
  }
  if (metrics.scrollHeight <= metrics.clientHeight + 1) {
    return {
      needed: false,
      reachable: true,
      clientHeight: metrics.clientHeight,
      scrollHeight: metrics.scrollHeight,
    };
  }
  await region.evaluate((element) => {
    element.style.scrollBehavior = "auto";
    element.scrollTop = element.scrollHeight;
  });
  await page.waitForFunction(() => {
    const element = document.querySelector("[data-plan-home-prompt-scroll]");
    return Boolean(
      element &&
        element.scrollTop >= element.scrollHeight - element.clientHeight - 1,
    );
  });
  const geometry = await region.evaluate((element) => {
    const controls = Array.from(
      element.querySelectorAll(
        'input:not([type="hidden"]), button, select, textarea, a[href]',
      ),
    )
      .filter((control) => control.getClientRects().length > 0)
    const control = controls.at(-1);
    if (!control) return null;
    const target = "labels" in control
      ? Array.from(control.labels ?? []).find((label) => label.contains(control)) ?? control
      : control;
    const targetRect = target.getBoundingClientRect();
    const regionRect = element.getBoundingClientRect();
    const actionsRect = document.querySelector("[data-plan-home-actions]")?.getBoundingClientRect();
    return {
      targetTop: targetRect.top,
      targetBottom: targetRect.bottom,
      visibleTop: Math.max(regionRect?.top ?? 0, 0),
      visibleBottom: Math.min(
        regionRect?.bottom ?? innerHeight,
        actionsRect?.top ?? innerHeight,
        innerHeight,
      ),
    };
  });
  assert(geometry, `${state} exposes an active control after prompt scrolling`);
  assert(
    geometry.targetTop >= geometry.visibleTop - 1 &&
      geometry.targetBottom <= geometry.visibleBottom + 1,
    `last Prompt control scrolls fully above the action dock (${geometry.targetTop}-${geometry.targetBottom}px target in ${geometry.visibleTop}-${geometry.visibleBottom}px visible region)`,
  );
  return {
    needed: true,
    reachable: true,
    clientHeight: metrics.clientHeight,
    scrollHeight: metrics.scrollHeight,
  };
}

async function completeActiveStagedGroup(page) {
  const action = page.locator("[data-plan-home-staged-advance]");
  if ((await action.count()) === 0) return false;

  if (!(await action.isEnabled())) {
    const panel = page.locator("[data-plan-home-stage-panel]");
    const textControl = panel.locator('textarea:not([disabled]), input[type="text"]:not([disabled])').first();
    const choiceControl = panel.locator('input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled])').first();
    if ((await textControl.count()) > 0) {
      await textControl.fill("Refinement check");
    } else if ((await choiceControl.count()) > 0) {
      await choiceControl.evaluate((control) => control.click());
    }
  }

  assert.equal(await action.isEnabled(), true, "active staged group can be completed");
  const activeId = await page.locator("[data-plan-home-stage-panel]").getAttribute("data-plan-home-stage-panel");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForFunction(
    (previousId) =>
      document
        .querySelector("[data-plan-home-stage-panel]")
        ?.getAttribute("data-plan-home-stage-panel") !== previousId,
    activeId,
  );
  return true;
}

async function assertEveryStagedGroup(page, state, screenshotStem) {
  const groups = [];
  const seen = new Set();

  while (true) {
    const panel = page.locator("[data-plan-home-stage-panel]");
    if ((await panel.count()) === 0) break;
    const groupId = await panel.getAttribute("data-plan-home-stage-panel");
    assert(groupId && !seen.has(groupId), `${state} advances through each staged group once`);
    seen.add(groupId);

    await page.screenshot({
      path: path.join(outputDirectory, `${screenshotStem}-${groupId}.png`),
    });
    const promptScroll = await assertPromptScrollReachability(page, state, true);
    const groupQuality = await quality(page);
    assertQuality(groupQuality, `${state} ${groupId} staged group`);
    groups.push({ id: groupId, ...promptScroll });

    if (!(await completeActiveStagedGroup(page))) break;
  }

  assert(groups.length > 0, `${state} exposes at least one staged group`);
  return groups;
}

async function capture(browser, baseUrl, state, viewportName, routeTarget) {
  const startedAt = Date.now();
  const routeSuffix = routeTarget === "walkthrough" ? "" : `-${routeTarget}`;
  const result = { state, viewport: viewportName, route: routeTarget, passed: false, status: 0, errors: [], shell: null, layout: null, quality: null, promptScroll: null, submission: null, durationMs: 0, screenshot: `${state}-${viewportName}${routeSuffix}.png` };
  const page = await browser.newPage({ viewport: viewports[viewportName], reducedMotion: "reduce" });
  watchPage(page, result);
  try {
    let targetUrl = `${baseUrl}${routeTargets.walkthrough}?__refine=${state}`;
    let reviewFixture = null;
    if (routeTarget === "owner-review") {
      const review = createReviewSnapshot(state);
      reviewFixture = review.fixture;
      await page.addInitScript(
        ({ key, serialized }) => window.localStorage.setItem(key, serialized),
        { key: PLAN_HOME_REVIEW_SNAPSHOT_KEY, serialized: review.serialized },
      );
      targetUrl = `${baseUrl}${routeTargets[routeTarget]}`;
    }
    const response = await page.goto(targetUrl, { waitUntil: "networkidle" });
    result.status = response?.status() ?? 0;
    assert.equal(result.status, 200, `HTTP ${result.status}`);
    if (routeTarget === "walkthrough") {
      await page.locator(`[data-plan-home-refinement-state="${state}"]`).waitFor();
    } else {
      assert.equal(reviewFixture?.state.location.kind, "question");
      await page
        .locator(`[data-question-id="${reviewFixture.state.location.questionId}"]`)
        .waitFor();
    }
    await page.locator("[data-plan-home-scene-loading]").waitFor({ state: "detached" }).catch(() => {});
    if (routeTarget === "walkthrough") {
      await assertNavigation(page, state, viewportName);
    }
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.querySelector("[data-plan-home-experience]")?.scrollTo({
        top: 0,
        behavior: "instant",
      });
      document.querySelector("[data-plan-home-moment-sheet]")?.scrollTo({
        top: 0,
        behavior: "instant",
      });
    });
    await page.screenshot({ fullPage: true, path: path.join(outputDirectory, result.screenshot) });
    result.shell = await page.evaluate(() => ({
      hasMarketingNavigation: Boolean(document.querySelector('nav[aria-label="Primary"]')),
      hasMarketingFooter: Boolean(document.querySelector("footer")),
      hasSaveAndExit: Array.from(document.querySelectorAll("a")).some(
        (link) => link.textContent?.trim() === "Save and exit",
      ),
        hasResetReview: Array.from(document.querySelectorAll("button")).some(
          (button) => button.getAttribute("aria-label") === "Reset review",
        ),
        hasReviewControls: Boolean(
          document.querySelector('nav[aria-label="Review controls"]'),
        ),
    }));
    assert.deepEqual(
      result.shell,
      {
        hasMarketingNavigation: false,
        hasMarketingFooter: false,
        hasSaveAndExit: routeTarget === "walkthrough",
        hasResetReview: routeTarget === "owner-review",
        hasReviewControls: routeTarget === "owner-review",
      },
      "focused walkthrough shell",
    );
    result.layout = await page.evaluate(() => {
      const dimensions = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const bounds = element.getBoundingClientRect();
        return {
          width: bounds.width,
          height: bounds.height,
          top: bounds.top,
          bottom: bounds.bottom,
        };
      };
      const header = document.querySelector("[data-plan-home-header]");
      const stageRail = document.querySelector("[data-plan-home-stage-rail]");
      const progress = document.querySelector("[data-plan-home-stage-rail] progress");
      return {
        header: dimensions("[data-plan-home-header]"),
        stageRail: dimensions("[data-plan-home-stage-rail]"),
        contextStrip: dimensions("[data-plan-home-context-strip]"),
        promptSheet: dimensions("[data-plan-home-prompt-sheet]"),
        momentSheet: dimensions("[data-plan-home-moment-sheet]"),
        reviewHero: dimensions("[data-review-hero]"),
        reviewWorkspace: dimensions("[data-review-workspace]"),
        visibleChrome: [header?.textContent, stageRail?.textContent]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
        progress: progress
          ? {
              label: progress.getAttribute("aria-label"),
              value: progress.getAttribute("value"),
              max: progress.getAttribute("max"),
            }
          : null,
      };
    });
    if (viewportName !== "desktop") {
      assert(result.layout.header?.height <= 53, "phone header stays within its compact 53px rail");
      const documentPosition = await page.evaluate(() => ({
        height: Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        ),
        viewportHeight: window.innerHeight,
        scrollY: window.scrollY,
      }));
      assert(
        documentPosition.height <= documentPosition.viewportHeight + 1,
        `${state} locks document scroll (${documentPosition.height}px document in ${documentPosition.viewportHeight}px viewport)`,
      );
      assert.equal(documentPosition.scrollY, 0, `${state} keeps the document at the top`);
      if (state.startsWith("q")) {
        assert(result.layout.stageRail?.height <= 46, "phone zone and progress stay within a compact 46px rail");
        assert(
          result.layout.contextStrip?.height <= viewports[viewportName].height * 0.23,
          "phone illustration stays within a supporting context strip",
        );
        assert(
          result.layout.promptSheet?.height >= viewports[viewportName].height * 0.5,
          "phone planning task owns most of the initial viewport",
        );
        assert.match(result.layout.progress?.label ?? "", /^Question \d+ of 31$/, "progress keeps its accessible count");
        assert.equal(/Question \d+ of \d+/i.test(result.layout.visibleChrome), false, "question count is not repeated visually");
      } else if (state === "welcome") {
        assert(
          result.layout.contextStrip?.height <= viewports[viewportName].height * 0.23,
          "welcome illustration stays within a supporting context strip",
        );
        assert(
          result.layout.momentSheet?.height >= viewports[viewportName].height * 0.5,
          "welcome task owns most of the initial viewport",
        );
      }
    }
    if (state.startsWith("q")) {
      const actions = await page.locator("[data-plan-home-actions]").boundingBox();
      assert(actions, "question actions are visible");
      assert(actions.y >= 0, "question actions start inside the viewport");
      assert(
        actions.y + actions.height <= viewports[viewportName].height,
        "question actions remain inside the initial viewport",
      );
    }
    if (state === "review" && viewportName === "desktop") {
      assert(
        result.layout.reviewHero?.height <= viewports.desktop.height * 0.55,
        "desktop review cover stays compact",
      );
      assert(
        result.layout.reviewWorkspace?.top < viewports.desktop.height * 0.7,
        "desktop brief index begins inside the initial viewport",
      );
      const reviewScroll = await page.evaluate(() => {
        const experience = document.querySelector("[data-plan-home-experience]");
        if (!(experience instanceof HTMLElement)) return null;
        experience.scrollTo({ top: 0, behavior: "instant" });
        return {
          before: experience.scrollTop,
          clientHeight: experience.clientHeight,
          scrollHeight: experience.scrollHeight,
        };
      });
      assert(
        reviewScroll?.scrollHeight > reviewScroll?.clientHeight,
        "desktop review has a visible scroll range",
      );
      const experienceBounds = await page
        .locator("[data-plan-home-experience]")
        .boundingBox();
      assert(experienceBounds, "desktop review app frame is visible");
      await page.mouse.move(
        experienceBounds.x + experienceBounds.width / 2,
        experienceBounds.y + experienceBounds.height / 2,
      );
      await page.mouse.wheel(0, Math.round(viewports.desktop.height * 0.75));
      await page.waitForTimeout(100);
      assert(
        (await page.locator("[data-plan-home-experience]").evaluate(
          (experience) => experience.scrollTop,
        )) > reviewScroll.before,
        "desktop review responds to ordinary wheel scrolling",
      );
      await page
        .locator('nav[aria-label="Project brief sections"] a[href="#review-submit"]')
        .click();
      await page.waitForTimeout(250);
      const submission = await page.locator("[data-review-submission]").boundingBox();
      assert(
        submission && submission.y < viewports.desktop.height,
        "desktop brief index brings the submission action into view",
      );
    }
    result.quality = await quality(page);
    assertQuality(result.quality, "focused walkthrough");
    const requireNoScroll =
      viewportName !== "desktop" && noScrollQuestionStates.has(state);
    result.promptScroll = requireNoScroll && stagedQuestionStates.has(state)
      ? await assertEveryStagedGroup(
          page,
          state,
          `${state}-${viewportName}${routeSuffix}`,
        )
      : await assertPromptScrollReachability(page, state, requireNoScroll);
    if (state === "review" && routeTarget === "walkthrough") {
      result.submission = await assertReviewSubmission(page, viewportName);
    }
    assert.deepEqual(result.errors, [], "browser, console, or request errors");
    result.passed = true;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    result.durationMs = Date.now() - startedAt;
    await page.close();
  }
  return result;
}

async function assertFallbackViewport(page, context) {
  const geometry = await page.evaluate(() => {
    const actions = document
      .querySelector("[data-plan-home-actions]")
      ?.getBoundingClientRect();
    const sheet = document
      .querySelector("[data-plan-home-prompt-sheet]")
      ?.getBoundingClientRect();
    const contextStrip = document
      .querySelector("[data-plan-home-context-strip]")
      ?.getBoundingClientRect();
    return {
      documentHeight: Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      ),
      viewportHeight: window.innerHeight,
      scrollY: window.scrollY,
      actionTop: actions?.top ?? null,
      actionBottom: actions?.bottom ?? null,
      contextBottom: contextStrip?.bottom ?? null,
      contextHeight: contextStrip?.height ?? null,
      sheetTop: sheet?.top ?? null,
      sheetHeight: sheet?.height ?? null,
    };
  });
  assert(
    geometry.documentHeight <= geometry.viewportHeight + 1,
    `${context} keeps the document locked (${geometry.documentHeight}px document in ${geometry.viewportHeight}px viewport)`,
  );
  assert.equal(geometry.scrollY, 0, `${context} does not move the document`);
  assert(
    geometry.actionTop !== null &&
      geometry.actionBottom !== null &&
      geometry.actionTop >= 0 &&
      geometry.actionBottom <= geometry.viewportHeight + 1,
    `${context} keeps Back and Next visible`,
  );
  assert(
    geometry.contextHeight !== null &&
      geometry.contextHeight <= geometry.viewportHeight * 0.23 + 1,
    `${context} keeps illustration in a supporting context strip`,
  );
  assert(
    geometry.sheetTop !== null &&
      geometry.contextBottom !== null &&
      Math.abs(geometry.sheetTop - geometry.contextBottom) <= 1,
    `${context} places the question surface directly below the context strip`,
  );
  assert(
    geometry.sheetHeight !== null &&
      geometry.sheetHeight >= geometry.viewportHeight * 0.5,
    `${context} gives the planning task most of the available viewport`,
  );
  return geometry;
}

async function captureFallback(
  browser,
  baseUrl,
  {
    state,
    viewport,
    pageViewport = viewports["short-phone"],
    layoutContext,
    qualityContext,
    screenshot,
    prepare,
  },
) {
  const result = {
    state,
    viewport,
    route: "walkthrough-fallback",
    passed: false,
    errors: [],
    layout: null,
    promptScroll: null,
    quality: null,
    durationMs: 0,
    screenshot,
  };
  const startedAt = Date.now();
  const page = await browser.newPage({
    viewport: pageViewport,
    reducedMotion: "reduce",
  });
  watchPage(page, result);
  try {
    const response = await page.goto(
      `${baseUrl}${routeTargets.walkthrough}?__refine=${state}`,
      { waitUntil: "networkidle" },
    );
    assert.equal(response?.status(), 200);
    await page
      .locator(`[data-plan-home-refinement-state="${state}"]`)
      .waitFor();
    await prepare?.(page);
    result.layout = await assertFallbackViewport(page, layoutContext);
    result.promptScroll = await assertPromptScrollReachability(page, state, false);
    result.quality = await quality(page);
    assertQuality(result.quality, qualityContext);
    await page.screenshot({
      path: path.join(outputDirectory, result.screenshot),
    });
    assert.deepEqual(result.errors, [], `${qualityContext} browser errors`);
    result.passed = true;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    result.durationMs = Date.now() - startedAt;
    await page.close();
  }
  return result;
}

async function captureLargeTextFallback(browser, baseUrl) {
  return captureFallback(browser, baseUrl, {
    state: "q31",
    viewport: "200%-text",
    layoutContext: "200% text",
    qualityContext: "200% text fallback",
    screenshot: "q31-200-percent-text.png",
    prepare: async (page) => {
      await page.addStyleTag({ content: ":root { font-size: 200%; }" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);
    },
  });
}

async function captureReflowFallback(browser, baseUrl) {
  return captureFallback(browser, baseUrl, {
    state: "q30",
    viewport: "200%-reflow",
    pageViewport: { width: 320, height: 640 },
    layoutContext: "200%-equivalent 320 CSS pixel reflow",
    qualityContext: "200% reflow fallback",
    screenshot: "q30-200-percent-reflow.png",
  });
}

async function captureKeyboardFallback(browser, baseUrl) {
  return captureFallback(browser, baseUrl, {
    state: "q2",
    viewport: "keyboard-open",
    layoutContext: "keyboard-height viewport",
    qualityContext: "keyboard-height fallback",
    screenshot: "q2-keyboard-open.png",
    prepare: async (page) => {
      await page
        .getByRole("radio", { name: "Own it" })
        .evaluate((control) => control.click());
      await page.getByRole("button", { name: "Next", exact: true }).click();
      const locationInput = page.getByLabel(
        "City, county, address, or target area",
      );
      await locationInput.focus();
      await page.setViewportSize({ width: 375, height: 430 });
      await page.waitForTimeout(150);
      await page.evaluate(async () => {
        window.scrollTo({ top: 0, behavior: "instant" });
        await new Promise(requestAnimationFrame);
      });
      await locationInput.evaluate((element) =>
        element.scrollIntoView({ block: "nearest" }),
      );
    },
  });
}

async function writeBoard(browser, results) {
  const cards = results.map((result) => `<article><header><strong>${result.state}</strong><span>${result.route} · ${result.viewport} · ${result.passed ? "PASS" : "FAIL"}</span></header>${result.passed ? `<img src="${result.screenshot}" alt="${result.state} ${result.route} ${result.viewport} capture">` : `<pre>${result.errors.join("\n")}</pre>`}</article>`).join("");
  const html = `<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#e9e6dc;color:#151815;font-family:system-ui}h1{font-size:24px;margin:0 0 18px}.board{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;align-items:start}article{background:white;border:1px solid #777}header{display:flex;justify-content:space-between;padding:10px;font-size:12px;text-transform:uppercase}img{display:block;width:100%;max-height:844px;object-fit:cover;object-position:top;border-top:1px solid #aaa}</style><h1>Plan Your Home refinement board</h1><section class="board">${cards}</section>`;
  const htmlPath = path.join(outputDirectory, "review-board.html");
  await writeFile(htmlPath, html);
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  try {
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
    await page.screenshot({ fullPage: true, path: path.join(outputDirectory, "review-board.png") });
  } finally {
    await page.close();
  }
}

async function writePilotBoard(browser) {
  const originalWelcome = path.join(pilotOriginalDirectory, "welcome-phone.png");
  const originalLiving = path.join(pilotOriginalDirectory, "q4-phone.png");
  try {
    await Promise.all([access(originalWelcome), access(originalLiving)]);
  } catch {
    return null;
  }
  const cards = [
    ["Phone before", originalWelcome],
    ["Phone refined", path.join(outputDirectory, "welcome-phone.png")],
    ["Living Room before", originalLiving],
    ["Living Room refined", path.join(outputDirectory, "q4-phone.png")],
    ["Entry desktop", path.join(outputDirectory, "q1-desktop.png")],
    ["Living Room desktop", path.join(outputDirectory, "q4-desktop.png")],
  ];
  const markup = cards
    .map(([label, imagePath]) => `<article><h2>${label}</h2><img src="${pathToFileURL(imagePath).href}" alt="${label}"></article>`)
    .join("");
  const html = `<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#e9e6dc;color:#151815;font-family:system-ui}header{margin-bottom:20px}h1{margin:0;font-size:28px}header p{margin:6px 0 0;color:#4d554f}.board{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:start}article{background:white;border:1px solid #777}h2{margin:0;padding:10px 12px;border-bottom:1px solid #aaa;font-size:13px;text-transform:uppercase;letter-spacing:.08em}img{display:block;width:100%;height:844px;object-fit:cover;object-position:top}.board article:nth-child(n+5) img{height:auto;max-height:760px;object-fit:contain;background:#ddd}</style><header><h1>Welcome and Living Room pilot</h1><p>Phone before and refined direction, then deliberate desktop framing.</p></header><section class="board">${markup}</section>`;
  const htmlPath = path.join(outputDirectory, "pilot-review-board.html");
  await writeFile(htmlPath, html);
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  try {
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
    await page.screenshot({ fullPage: true, path: path.join(outputDirectory, "pilot-review-board.png") });
  } finally {
    await page.close();
  }
  return "pilot-review-board.png";
}

async function capturePilotMotion(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: viewports.phone,
    reducedMotion: "no-preference",
    recordVideo: { dir: outputDirectory, size: viewports.phone },
  });
  const page = await context.newPage();
  const errors = [];
  watchPage(page, { errors });
  const video = page.video();
  try {
    const response = await page.goto(
      `${baseUrl}/plan-your-home?__refine=q3&__motion=1`,
      { waitUntil: "networkidle" },
    );
    assert.equal(response?.status(), 200, "motion capture HTTP status");
    await page.locator('[data-plan-home-refinement-state="q3"]').waitFor();
    await page.locator("[data-plan-home-scene-loading]").waitFor({ state: "detached" }).catch(() => {});
    await page
      .getByRole("checkbox", { name: "Flat or gently sloped" })
      .evaluate((control) => control.click());
    await page.waitForTimeout(550);
    await page
      .getByRole("button", { name: "Next", exact: true })
      .evaluate((control) => control.click());
    await page.locator('[data-plan-home-refinement-state="q4"]').waitFor();
    await page.waitForTimeout(1_100);
    assert.deepEqual(errors, [], "motion capture browser errors");
  } finally {
    await context.close();
  }
  assert(video, "Playwright did not create a motion capture.");
  const source = await video.path();
  const destination = path.join(outputDirectory, "pilot-motion-phone.webm");
  await rename(source, destination);
  return path.basename(destination);
}

async function main() {
  const input = parseInput();
  const startedAt = Date.now();
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  const server = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(),
    detached: process.platform !== "win32",
    env: { ...process.env, PLAN_HOME_REFINEMENT_MODE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let browser;
  try {
    await waitForServer(baseUrl, server);
    browser = await chromium.launch();
    const results = [];
    for (const [state, viewport, routeTarget] of input.captures) {
      results.push(await capture(browser, baseUrl, state, viewport, routeTarget));
    }
    if (!input.focused) {
      results.push(await captureLargeTextFallback(browser, baseUrl));
      results.push(await captureReflowFallback(browser, baseUrl));
      results.push(await captureKeyboardFallback(browser, baseUrl));
    }
    const motionCapture = input.focused
      ? null
      : await capturePilotMotion(browser, baseUrl);
    const pilotReviewBoard = input.focused
      ? null
      : await writePilotBoard(browser);
    const durationMs = Date.now() - startedAt;
    const passed = results.every((result) => result.passed) && durationMs < (input.focused ? 30_000 : 120_000);
    const summary = { generatedAt: new Date().toISOString(), focused: input.focused, passed, durationMs, targets: { focusedMs: 30_000, boardMs: 120_000 }, pilotReviewBoard, motionCapture, results };
    await writeFile(path.join(outputDirectory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await writeBoard(browser, results);
    process.stdout.write(`${passed ? "PASS" : "FAIL"} ${results.filter((result) => result.passed).length}/${results.length} · ${(durationMs / 1000).toFixed(1)}s · output/plan-home-refinement/latest/review-board.png\n`);
    for (const result of results.filter((item) => !item.passed)) process.stderr.write(`${result.state} ${result.route} ${result.viewport}: ${result.errors.join("; ")}\n`);
    if (!passed) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
