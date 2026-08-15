import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

import { chromium } from "playwright";

import {
  planHomeQuestions,
  planHomeZones,
} from "../features/plan-your-home/registry.ts";
import {
  PLAN_HOME_LOCAL_SNAPSHOT_KEY,
  PLAN_HOME_REVIEW_SNAPSHOT_KEY,
} from "../features/plan-your-home/local-snapshot.ts";

const route = "/plan-your-home/review";
const outputDirectory = path.join(
  process.cwd(),
  "output",
  "playwright",
  "issue-34",
  "owner-review",
);
const phone = { width: 390, height: 844 };
const desktop = { width: 1440, height: 1000 };
const fakeVisitor = {
  name: "Owner Review Proof",
  email: "owner-review@example.invalid",
  phone: "+1 214 555 0109",
};

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

async function waitForRoute(baseUrl, server) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}${route}`, {
        redirect: "manual",
      });
      if (response.status === 200) return;
    } catch {
      // The isolated development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Owner review route did not start at ${baseUrl}${route}.`);
}

function stopServer(server) {
  if (server && server.exitCode === null) server.kill("SIGINT");
}

async function activate(control) {
  const input = control.first();
  if (!(await input.isChecked())) await input.locator("xpath=..").click();
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

async function answerQuestion(page, question) {
  await page.getByRole("heading", { name: question.prompt }).waitFor();
  await page
    .getByRole("progressbar", {
      name: `Question ${question.number} of ${planHomeQuestions.length}`,
    })
    .waitFor();

  if (question.number === 32 || question.number === 33) return;
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
      if (
        (await continueButton.count()) > 0 &&
        (await continueButton.isVisible())
      ) {
        await continueButton.click();
      }
    }
  } else {
    for (const value of answerValues(question.response.exampleAnswer)) {
      const input = page.locator(`input[value="${value}"]`);
      if ((await input.count()) > 0) await activate(input);
    }
  }

  if (question.number === 2) {
    await page
      .getByLabel("City, county, address, or target area")
      .fill("Review County");
  }
}

async function advanceQuestion(page, question) {
  const label =
    question.number === 35
      ? "Review brief"
      : [11, 15, 19, 21, 25, 30, 34].includes(question.number)
        ? "Save room"
        : "Next";
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
    await button.click();
  }

  const nextQuestion = planHomeQuestions[question.number];
  if (nextQuestion) {
    await page.getByRole("heading", { name: nextQuestion.prompt }).waitFor();
  } else {
    await page
      .getByRole("heading", {
        name: "One walkthrough, ready for a real conversation.",
      })
      .waitFor();
  }
}

async function capture(page, name) {
  const loadingScene = page.locator("[data-plan-home-scene-loading]");
  if ((await loadingScene.count()) > 0) {
    await loadingScene.waitFor({ state: "detached" });
  }
  const firstAnchor = page.locator("[data-scene-anchor]").first();
  if ((await firstAnchor.count()) > 0) {
    await firstAnchor.waitFor({ state: "attached" });
  }
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: path.join(outputDirectory, `${name}.png`),
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  assert.equal(overflow, false, `${name} has horizontal overflow.`);
}

async function main() {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let serverOutput = "";
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  let browser;
  try {
    await waitForRoute(baseUrl, server);
    const homeResponse = await fetch(baseUrl);
    assert.equal(homeResponse.status, 200);
    assert.equal(
      (await homeResponse.text()).includes(route),
      false,
      "The owner review route must stay out of public navigation.",
    );

    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: phone,
      reducedMotion: "reduce",
    });
    await context.addInitScript(
      ({ normalKey }) => {
        if (window.localStorage.getItem(normalKey) === null) {
          window.localStorage.setItem(normalKey, "customer-draft-sentinel");
        }
        window.__ownerReviewAnalytics = [];
        window.addEventListener("hh:analytics", (event) => {
          window.__ownerReviewAnalytics.push(event.detail);
        });
      },
      { normalKey: PLAN_HOME_LOCAL_SNAPSHOT_KEY },
    );
    const page = await context.newPage();
    const browserErrors = [];
    const mutationRequests = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("request", (request) => {
      if (!new Set(["GET", "HEAD", "OPTIONS"]).has(request.method())) {
        mutationRequests.push(`${request.method()} ${request.url()}`);
      }
    });

    const response = await page.goto(`${baseUrl}${route}`, {
      waitUntil: "networkidle",
    });
    assert.equal(response?.status(), 200);
    assert.match(
      (await page.locator('meta[name="robots"]').getAttribute("content")) ?? "",
      /noindex/i,
    );
    await page
      .getByRole("heading", { name: "Let’s put your name on the front door." })
      .waitFor();
    assert.equal(await page.getByRole("button", { name: "Menu" }).count(), 0);
    assert.equal(await page.locator("footer").count(), 0);
    assert.equal(
      await page.getByRole("link", { name: "Resume a saved plan" }).count(),
      0,
    );
    await page.getByLabel("Your name").fill(fakeVisitor.name);
    await page.getByRole("button", { name: "Open the front door" }).click();

    const exercisedQuestions = [];
    const exercisedZones = new Set();
    for (const question of planHomeQuestions) {
      await answerQuestion(page, question);
      exercisedQuestions.push(question.id);
      exercisedZones.add(question.zoneId);

      if (question.number === 9) {
        await page.reload({ waitUntil: "networkidle" });
        await page.getByRole("heading", { name: question.prompt }).waitFor();
        assert.equal(
          await page.getByRole("progressbar").getAttribute("value"),
          "9",
        );
        await capture(page, "phone-q9-refresh-resume");
      }
      if (question.number === 32) {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: "review-reference.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("fake owner review reference"),
        });
        await page
          .getByRole("alert")
          .filter({ hasText: "Uploads stay disabled in owner review" })
          .waitFor();
        await page
          .getByRole("button", { name: "Remove review-reference.pdf" })
          .click();
        await activate(
          page.getByRole("checkbox", {
            name: "I do not have references yet",
          }),
        );
      }
      if (question.number === 33) {
        await activate(
          page.getByRole("checkbox", { name: "No strong priorities yet" }),
        );
      }
      if (question.number === 6) {
        await page.getByRole("button", { name: "Next", exact: true }).click();
        await page
          .getByRole("heading", { name: "Save your progress and resume later." })
          .waitFor();
        await page.getByLabel("Email").fill(fakeVisitor.email);
        await page.getByLabel("Phone").fill(fakeVisitor.phone);
        await activate(
          page.getByRole("checkbox", { name: /Save my progress/ }),
        );
        await page.getByRole("button", { name: "Save and continue" }).click();
        await page
          .getByRole("heading", { name: planHomeQuestions[6].prompt })
          .waitFor();
        continue;
      }
      await advanceQuestion(page, question);
    }

    assert.equal(exercisedQuestions.length, 35);
    assert.equal(new Set(exercisedQuestions).size, 35);
    assert.deepEqual([...exercisedZones], planHomeZones.map(({ id }) => id));
    assert.equal(
      await page.getByRole("button", { name: /^Edit Q\d+:/ }).count(),
      35,
    );
    await capture(page, "phone-complete-review");
    await page.setViewportSize(desktop);
    await capture(page, "desktop-complete-review");

    await page
      .getByRole("button", { name: `Edit Q1: ${planHomeQuestions[0].prompt}` })
      .click();
    await page
      .getByRole("button", { name: "Edit Starting point" })
      .click();
    await activate(page.locator('input[value="adapt-existing-plan"]'));
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page
      .getByRole("heading", {
        name: "One walkthrough, ready for a real conversation.",
      })
      .waitFor();
    assert.match(
      (await page
        .locator('[data-review-question="project.starting-services"]')
        .textContent()) ?? "",
      /Adapt an existing plan/,
    );

    await page.setViewportSize(phone);
    await activate(
      page.getByRole("checkbox", {
        name: /I am submitting an inquiry and permit h and h to contact me/,
      }),
    );
    await page
      .getByRole("button", { name: "Submit project brief" })
      .click();
    await page
      .getByRole("heading", { name: `Thank you, ${fakeVisitor.name}.` })
      .waitFor();
    await capture(page, "phone-fake-confirmation");

    const beforeReset = await page.evaluate(
      ({ normalKey, reviewKey }) => ({
        analytics: window.__ownerReviewAnalytics ?? [],
        dataLayer: window.dataLayer ?? [],
        normal: window.localStorage.getItem(normalKey),
        review: window.localStorage.getItem(reviewKey),
      }),
      {
        normalKey: PLAN_HOME_LOCAL_SNAPSHOT_KEY,
        reviewKey: PLAN_HOME_REVIEW_SNAPSHOT_KEY,
      },
    );
    assert.deepEqual(beforeReset.analytics, []);
    assert.deepEqual(beforeReset.dataLayer, []);
    assert.equal(beforeReset.normal, "customer-draft-sentinel");
    assert.notEqual(beforeReset.review, null);
    assert.deepEqual(mutationRequests, []);

    await page.getByRole("button", { name: "Reset review" }).click();
    await page
      .getByRole("heading", { name: "Let’s put your name on the front door." })
      .waitFor();
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    const afterReset = await page.evaluate(
      ({ normalKey, reviewKey }) => ({
        normal: window.localStorage.getItem(normalKey),
        review: window.localStorage.getItem(reviewKey),
      }),
      {
        normalKey: PLAN_HOME_LOCAL_SNAPSHOT_KEY,
        reviewKey: PLAN_HOME_REVIEW_SNAPSHOT_KEY,
      },
    );
    assert.deepEqual(afterReset, {
      normal: "customer-draft-sentinel",
      review: null,
    });
    await capture(page, "phone-reset-welcome");
    assert.deepEqual(browserErrors, []);

    const summary = {
      route,
      status: 200,
      noIndex: true,
      publicNavigationLink: false,
      questionsExercised: exercisedQuestions.length,
      zonesExercised: [...exercisedZones],
      exactRefreshPrompt: 9,
      reviewEdit: "project.starting-services",
      fakeSubmission: true,
      confirmation: true,
      resetPreservedCustomerNamespace: true,
      analyticsEvents: 0,
      mutationRequests,
      screenshots: [
        "phone-q9-refresh-resume.png",
        "phone-complete-review.png",
        "desktop-complete-review.png",
        "phone-fake-confirmation.png",
        "phone-reset-welcome.png",
      ],
    };
    await writeFile(
      path.join(outputDirectory, "summary.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    process.stdout.write(
      `Owner review proof passed: ${summary.questionsExercised} prompts, ${summary.zonesExercised.length} zones, 0 mutations.\n`,
    );
    await context.close();
  } catch (error) {
    process.stderr.write(`${serverOutput.slice(-12_000)}\n`);
    throw error;
  } finally {
    if (browser) await browser.close();
    stopServer(server);
  }
}

await main();
