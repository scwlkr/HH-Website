import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { mkdir, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import {
  PLAN_HOME_REFINEMENT_STATES,
  normalizePlanHomeRefinementState,
} from "../features/plan-your-home/refinement-fixture.ts";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const outputDirectory = path.join(process.cwd(), "output", "plan-home-refinement", "latest");
const viewports = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1440, height: 1000 },
};
const defaultMatrix = [
  ["welcome", "phone"],
  ["contact", "phone"],
  ["q4", "phone"],
  ["q12", "phone"],
  ["q16", "phone"],
  ["q20", "phone"],
  ["q22", "phone"],
  ["q27", "phone"],
  ["q31", "phone"],
  ["q32", "phone"],
  ["q33", "phone"],
  ["review", "phone"],
  ["confirmation", "phone"],
  ["welcome", "desktop"],
  ["q12", "desktop"],
  ["q33", "desktop"],
  ["review", "desktop"],
];

function parseInput() {
  const values = process.argv.slice(2).filter((value) => value !== "--");
  if (values.length > 1) throw new Error("Use one named state: welcome, contact, q1-q35, review, or confirmation.");
  if (values.length === 0) return { focused: false, captures: defaultMatrix };
  const state = normalizePlanHomeRefinementState(values[0]);
  if (!state) {
    throw new Error(`Unknown state '${values[0]}'. Choose: ${PLAN_HOME_REFINEMENT_STATES.join(", ")}.`);
  }
  return { focused: true, captures: [[state, "phone"], [state, "desktop"]] };
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

function stopServer(server) {
  if (server?.exitCode === null) server.kill("SIGINT");
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
    const targetSize = (element) => {
      const wrappingLabel = "labels" in element
        ? Array.from(element.labels ?? []).find((label) => label.contains(element))
        : undefined;
      return (wrappingLabel ?? element).getBoundingClientRect();
    };
    return {
      violations: axeResults.violations.map((violation) => violation.id),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      unnamedControls: controls.filter((element) => !accessibleName(element)).map((element) => element.outerHTML.slice(0, 160)),
      undersizedTargets: controls.map((element) => ({ element: element.outerHTML.slice(0, 120), ...targetSize(element).toJSON() })).filter(({ width, height }) => width < 44 || height < 44),
    };
  });
}

async function assertNavigation(page, state) {
  if (state === "welcome") {
    const nameInput = page.getByLabel("Your name");
    await nameInput.fill("Refinement Homeowner");
    await page.getByRole("button", { name: "Open the front door" }).click();
    await page.locator('[data-plan-home-refinement-state="q1"]').waitFor();
    await page.getByRole("button", { name: "Back" }).click();
    await page.locator('[data-plan-home-refinement-state="welcome"]').waitFor();
    await nameInput.fill("");
    return;
  }
  if (state === "contact") {
    await page.getByRole("button", { name: "Back" }).click();
    await page.locator('[data-plan-home-refinement-state="q6"]').waitFor();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.locator('[data-plan-home-refinement-state="contact"]').waitFor();
    return;
  }
  if (state === "review") {
    await page.getByRole("button", { name: /Edit/ }).first().click();
    await page.locator('[data-plan-home-refinement-state^="q"]').waitFor();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.locator('[data-plan-home-refinement-state="review"]').waitFor();
    return;
  }
  if (!state.startsWith("q")) return;
  const number = Number(state.slice(1));
  const back = page.getByRole("button", { name: "Back" });
  await back.click();
  const previousState = number === 1 ? "welcome" : number === 7 ? "contact" : `q${number - 1}`;
  await page.locator(`[data-plan-home-refinement-state="${previousState}"]`).waitFor();
  const forward =
    number === 1
      ? page.getByRole("button", { name: "Open the front door" })
      : number === 7
        ? page.getByRole("button", { name: "Save and continue" })
        : page.getByRole("button", {
            name: /^(Next|Save room|Review brief|Open the design desk)$/,
          });
  await forward.click();
  if (number === 31) {
    await page.getByRole("button", { name: "Save room" }).click();
  }
  await page.locator(`[data-plan-home-refinement-state="q${number}"]`).waitFor();
}

async function capture(browser, baseUrl, state, viewportName) {
  const startedAt = Date.now();
  const result = { state, viewport: viewportName, passed: false, status: 0, errors: [], quality: null, durationMs: 0, screenshot: `${state}-${viewportName}.png` };
  const page = await browser.newPage({ viewport: viewports[viewportName], reducedMotion: "reduce" });
  watchPage(page, result);
  try {
    const response = await page.goto(`${baseUrl}/plan-your-home?__refine=${state}`, { waitUntil: "networkidle" });
    result.status = response?.status() ?? 0;
    assert.equal(result.status, 200, `HTTP ${result.status}`);
    await page.locator(`[data-plan-home-refinement-state="${state}"]`).waitFor();
    await page.locator("[data-plan-home-scene-loading]").waitFor({ state: "detached" }).catch(() => {});
    await assertNavigation(page, state);
    result.quality = await quality(page);
    assert.deepEqual(result.quality.violations, [], "accessibility violations");
    assert.equal(result.quality.overflow, false, "horizontal overflow");
    assert.deepEqual(result.quality.unnamedControls, [], "unnamed controls");
    assert.deepEqual(result.quality.undersizedTargets, [], "undersized interactive targets");
    assert.deepEqual(result.errors, [], "browser, console, or request errors");
    await page.screenshot({ fullPage: true, path: path.join(outputDirectory, result.screenshot) });
    result.passed = true;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    result.durationMs = Date.now() - startedAt;
    await page.close();
  }
  return result;
}

async function writeBoard(browser, results) {
  const cards = results.map((result) => `<article><header><strong>${result.state}</strong><span>${result.viewport} · ${result.passed ? "PASS" : "FAIL"}</span></header>${result.passed ? `<img src="${result.screenshot}" alt="${result.state} ${result.viewport} capture">` : `<pre>${result.errors.join("\n")}</pre>`}</article>`).join("");
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

async function main() {
  const input = parseInput();
  const startedAt = Date.now();
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  const server = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, PLAN_HOME_REFINEMENT_MODE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let browser;
  try {
    await waitForServer(baseUrl, server);
    browser = await chromium.launch();
    const results = [];
    for (const [state, viewport] of input.captures) results.push(await capture(browser, baseUrl, state, viewport));
    const durationMs = Date.now() - startedAt;
    const passed = results.every((result) => result.passed) && durationMs < (input.focused ? 30_000 : 120_000);
    const summary = { generatedAt: new Date().toISOString(), focused: input.focused, passed, durationMs, targets: { focusedMs: 30_000, boardMs: 120_000 }, results };
    await writeFile(path.join(outputDirectory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await writeBoard(browser, results);
    process.stdout.write(`${passed ? "PASS" : "FAIL"} ${results.filter((result) => result.passed).length}/${results.length} · ${(durationMs / 1000).toFixed(1)}s · output/plan-home-refinement/latest/review-board.png\n`);
    for (const result of results.filter((item) => !item.passed)) process.stderr.write(`${result.state} ${result.viewport}: ${result.errors.join("; ")}\n`);
    if (!passed) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    stopServer(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
