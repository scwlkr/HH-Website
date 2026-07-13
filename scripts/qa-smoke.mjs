import http from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { chromium } from "playwright";

const smokeAdmin = {
  email: "firebase-admin-smoke@example.com",
  password: "FirebaseSmokePassword123!",
  uid: "firebase-admin-smoke",
};

function log(message) {
  process.stdout.write(`${message}\n`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function getAvailablePort() {
  const server = http.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not allocate a local port for QA.");
  }

  const { port } = address;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function getFirebaseEmulatorConfig() {
  const projectId =
    process.env.GCLOUD_PROJECT?.trim() ||
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.FIREBASE_PROJECT_ID?.trim();
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST?.trim();
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();

  assert(
    projectId,
    "Firebase smoke QA requires GCLOUD_PROJECT, GOOGLE_CLOUD_PROJECT, or FIREBASE_PROJECT_ID.",
  );
  assert(
    authHost,
    "Firebase smoke QA requires the Authentication emulator.",
  );
  assert(
    firestoreHost,
    "Firebase smoke QA requires the Firestore emulator.",
  );

  return {
    authHost,
    firestoreHost,
    projectId,
  };
}

async function seedAdminUser(projectId) {
  log("Seeding an authorized admin in the Authentication emulator...");

  const app = initializeApp(
    { projectId },
    `qa-smoke-${process.pid}-${Date.now()}`,
  );
  const auth = getAuth(app);

  try {
    const existingUser = await auth.getUserByEmail(smokeAdmin.email);
    await auth.deleteUser(existingUser.uid);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      await deleteApp(app);
      throw error;
    }
  }

  await auth.createUser({
    email: smokeAdmin.email,
    emailVerified: true,
    password: smokeAdmin.password,
    uid: smokeAdmin.uid,
  });
  await auth.setCustomUserClaims(smokeAdmin.uid, { role: "admin" });

  return app;
}

async function waitForServer(baseUrl, childProcess) {
  const startedAt = Date.now();
  const timeoutMs = 45_000;

  while (Date.now() - startedAt < timeoutMs) {
    if (childProcess.exitCode !== null) {
      throw new Error(`Next server exited early with code ${childProcess.exitCode}.`);
    }

    try {
      const response = await fetch(baseUrl);

      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for the QA server at ${baseUrl}.`);
}

async function startNextServer({ port, env }) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const serverProcess = spawn(npmCommand, ["run", "start", "--", "--port", `${port}`], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  serverProcess.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  serverProcess.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForServer(baseUrl, serverProcess);

  return {
    baseUrl,
    process: serverProcess,
    getLogs() {
      return { stdout, stderr };
    },
    async close() {
      if (serverProcess.exitCode !== null) {
        return;
      }

      serverProcess.kill("SIGINT");
      await once(serverProcess, "exit");
    },
  };
}

async function runNpmScript({ script, args = [], env }) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const childProcess = spawn(npmCommand, ["run", script, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  childProcess.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  childProcess.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const [exitCode] = await once(childProcess, "exit");

  if (exitCode !== 0) {
    throw new Error(
      `npm run ${script} failed.\n${stdout.trim()}\n${stderr.trim()}`.trim(),
    );
  }

  return {
    stdout,
    stderr,
  };
}

async function verifyRouteStatuses(baseUrl) {
  log("Checking public route coverage and invalid slug behavior...");

  const routes = [
    "/",
    "/pricing",
    "/pricing/builder-grade",
    "/pricing/builder-plus",
    "/pricing/custom",
    "/catalog",
    "/catalog/single-family",
    "/catalog/multifamily",
    "/catalog/townhomes",
    "/catalog/commercial",
    "/faq",
    "/inquire",
    "/thank-you",
    "/privacy",
    "/terms",
    "/robots.txt",
    "/sitemap.xml",
    "/api/og?title=Phase%207%20Smoke",
  ];

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`);
    assert(response.ok, `Expected ${route} to return 200, received ${response.status}.`);
  }

  for (const route of ["/pricing/not-a-finish", "/catalog/not-a-type"]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert(response.status === 404, `Expected ${route} to return 404, received ${response.status}.`);
  }
}

async function verifyLinkCoverage(page, baseUrl) {
  log("Checking header, footer, legal, and direct-contact links...");

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const selectors = [
    'header a[href="/"]',
    'header a[href="/projects"]',
    'header a[href="/pricing"]',
    'header a[href="/faq"]',
    'header a[href="/inquire"]',
    'footer a[href="/privacy"]',
    'footer a[href="/terms"]',
    'footer a[href="mailto:hello@howethandharp.com"]',
    'footer a[href="tel:+15125550199"]',
  ];

  for (const selector of selectors) {
    assert(
      (await page.locator(selector).count()) > 0,
      `Expected to find ${selector} on the home page.`,
    );
  }

  assert(
    (await page.locator('header a[href="/catalog"]').count()) === 0,
    "Catalog should be hidden from the public header.",
  );
  assert(
    (await page.locator('footer a[href="/catalog"]').count()) === 0,
    "Catalog should be hidden from the public footer.",
  );

  const homeHtml = await page.content();
  assert(
    !homeHtml.includes("Open Catalog") && !homeHtml.includes("View Catalog"),
    "Catalog should be hidden from the home page.",
  );
  assert(
    !homeHtml.includes("Legal route shell is established."),
    "Home page should no longer reference legal placeholder copy.",
  );
}

async function verifyPrefillBehavior(page, baseUrl) {
  log("Checking inquiry prefill behavior...");

  await page.goto(
    `${baseUrl}/inquire?finish=builder-plus&buildType=townhomes&utm_source=smoke&utm_medium=email&utm_campaign=phase7`,
    { waitUntil: "networkidle" },
  );

  await page.getByText("Project type preselected: Townhomes").waitFor();
  await page.getByText("Finish direction preselected: Builder+").waitFor();
}

async function verifyResponsiveLayouts(browser, baseUrl) {
  log("Checking responsive layout coverage across mobile, tablet, and desktop...");

  const viewportTests = [
    {
      name: "mobile",
      viewport: { width: 390, height: 844 },
      isMobile: true,
    },
    {
      name: "tablet",
      viewport: { width: 768, height: 1024 },
      isMobile: false,
    },
    {
      name: "desktop",
      viewport: { width: 1440, height: 900 },
      isMobile: false,
    },
  ];

  const routes = ["/", "/pricing", "/catalog", "/faq", "/inquire"];

  for (const viewportTest of viewportTests) {
    const context = await browser.newContext({
      viewport: viewportTest.viewport,
      isMobile: viewportTest.isMobile,
    });
    const page = await context.newPage();

    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

      assert(
        await page.locator("header").isVisible(),
        `Expected header to be visible for ${route} at ${viewportTest.name}.`,
      );
      assert(
        await page.locator("footer").isVisible(),
        `Expected footer to be visible for ${route} at ${viewportTest.name}.`,
      );

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      assert(
        !hasHorizontalOverflow,
        `Detected horizontal overflow for ${route} at ${viewportTest.name}.`,
      );
    }

    await context.close();
  }
}

async function fillInquiryForm(page, overrides = {}) {
  const submission = {
    name: "Phase Seven Smoke Test",
    phone: "(512) 555-0199",
    email: "smoke@example.com",
    projectType: "single-family",
    approxSquareFootage: "2400",
    finishLevel: "builder-plus",
    servicesNeeded: "building",
    projectLocation: "Austin, Texas",
    lotStatus: "already-owned",
    timeline: "3-6-months",
    budgetRange: "1m-2m",
    projectDescription:
      "This smoke test brief verifies the guided inquiry flow, Firebase emulator persistence, and success redirect without touching production data.",
    ...overrides,
  };

  const continueButton = page.locator('button[type="button"]').last();

  await page.locator('input[name="name"]').fill(submission.name);
  await page.locator('input[name="phone"]').fill(submission.phone);
  await page.locator('input[name="email"]').fill(submission.email);
  await page.locator('input[name="preferredContactMethod"][value="email"]').check({
    force: true,
  });
  await continueButton.evaluate((button) => button.click());
  await page.locator('select[name="projectType"]').waitFor();

  await page.locator('select[name="projectType"]').selectOption(submission.projectType);
  await page.locator('input[name="approxSquareFootage"]').fill(
    submission.approxSquareFootage,
  );
  await page
    .locator('select[name="finishLevel"]')
    .selectOption(submission.finishLevel);
  await page.locator(
    `input[name="servicesNeeded"][value="${submission.servicesNeeded}"]`,
  ).check({ force: true });
  await continueButton.evaluate((button) => button.click());
  await page.locator('input[name="projectLocation"]').waitFor();

  await page
    .locator('input[name="projectLocation"]')
    .fill(submission.projectLocation);
  await page.locator('select[name="lotStatus"]').selectOption(submission.lotStatus);
  await page.locator('select[name="timeline"]').selectOption(submission.timeline);
  await page
    .locator('select[name="budgetRange"]')
    .selectOption(submission.budgetRange);
  await continueButton.evaluate((button) => button.click());
  await page.locator('textarea[name="projectDescription"]').waitFor();

  await page
    .locator('textarea[name="projectDescription"]')
    .fill(submission.projectDescription);
  await continueButton.evaluate((button) => button.click());
  await page.locator('button[type="submit"]:not([disabled])').waitFor();

  return submission;
}

async function readInquirySubmission({ email, firestore }) {
  const snapshot = await firestore
    .collection("inquirySubmissions")
    .where("email", "==", email)
    .limit(1)
    .get();
  const document = snapshot.docs[0];

  assert(
    document,
    `Expected Firestore emulator to contain the inquiry for ${email}.`,
  );

  return document.data();
}

async function verifyInquiryFailureState(browser, baseUrl) {
  log("Checking inquiry validation and safe failure handling...");
  const page = await browser.newPage();

  try {
    await page.goto(`${baseUrl}/inquire`, { waitUntil: "networkidle" });
    await page
      .locator('button[type="button"]')
      .last()
      .evaluate((button) => button.click());
    await page.getByText("Please share your name.").waitFor();

    await page.goto(`${baseUrl}/inquire`, { waitUntil: "networkidle" });
    await fillInquiryForm(page, {
      name: "Forced Failure Smoke Test",
      email: "forced-failure@example.com",
    });
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor();
    await submitButton.click();
    await page
      .getByText(
        "The project brief could not be sent right now. Please try again in a moment or email H&H directly.",
      )
      .waitFor();
    assert(
      new URL(page.url()).pathname === "/inquire",
      "A failed Firestore write must keep the visitor on the inquiry form.",
    );
  } finally {
    await page.close();
  }
}

async function verifyInquirySuccess(
  browser,
  baseUrl,
  firestore,
) {
  log("Checking inquiry success path...");
  const page = await browser.newPage();

  try {
    await page.goto(
      `${baseUrl}/inquire?finish=custom&buildType=single-family&utm_source=smoke&utm_medium=qa&utm_campaign=phase7`,
      { waitUntil: "networkidle" },
    );

    const submission = await fillInquiryForm(page, {
      name: "Successful Smoke Test",
      email: "success@example.com",
      finishLevel: "custom",
    });
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor();

    await Promise.all([
      page.waitForURL(`${baseUrl}/thank-you`),
      submitButton.click(),
    ]);

    const fields = await readInquirySubmission({
      email: submission.email,
      firestore,
    });

    assert(
      fields.name === submission.name,
      "Submitted name did not reach Firestore.",
    );
    assert(
      fields.finishLevel === submission.finishLevel,
      "Submitted finish level did not reach Firestore.",
    );
    assert(
      fields.projectType === submission.projectType,
      "Submitted project type did not reach Firestore.",
    );
    assert(
      fields.status === "new",
      "Submitted inquiry did not receive the new status in Firestore.",
    );
  } finally {
    await page.close();
  }
}

async function verifyAdminAuth(browser, baseUrl) {
  log("Checking Firebase admin login, protected routes, and logout...");
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/admin/projects`, { waitUntil: "networkidle" });

    const loginUrl = new URL(page.url());
    assert(
      loginUrl.pathname === "/admin/login",
      "Unauthenticated admin access must redirect to the login page.",
    );
    assert(
      loginUrl.searchParams.get("next") === "/admin/projects",
      "Protected-route redirect must preserve the requested admin path.",
    );

    await page.getByLabel("Email").fill(smokeAdmin.email);
    await page.getByLabel("Password").fill(smokeAdmin.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${baseUrl}/admin/projects`);
    await page.getByText(smokeAdmin.email).waitFor();
    await page.getByRole("heading", { name: "Completed Homes" }).waitFor();

    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.waitForURL(`${baseUrl}/admin/login?signed_out=1`);
    await page.getByText("You have been signed out.").waitFor();

    await page.goto(`${baseUrl}/admin/projects`, { waitUntil: "networkidle" });
    assert(
      new URL(page.url()).pathname === "/admin/login",
      "Logged-out admin access must return to the login page.",
    );
  } finally {
    await context.close();
  }
}

async function main() {
  const firebaseEmulators = getFirebaseEmulatorConfig();
  const appPort = await getAvailablePort();
  const failureAppPort = await getAvailablePort();
  const unavailableFirestorePort = await getAvailablePort();
  const qaEnv = {
    FIREBASE_PROJECT_ID: firebaseEmulators.projectId,
    NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${appPort}`,
    NEXT_PUBLIC_FIREBASE_API_KEY: "firebase-emulator-api-key",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${firebaseEmulators.projectId}.firebaseapp.com`,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseEmulators.projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${firebaseEmulators.projectId}.firebasestorage.app`,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789012",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456789012:web:firebase-emulator-smoke",
    NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: firebaseEmulators.authHost,
    HH_CONTACT_PHONE_HREF: "tel:+15125550199",
    HH_CONTACT_PHONE_LABEL: "(512) 555-0199",
  };

  let nextServer;
  let failureServer;
  let browser;
  let adminApp;

  try {
    adminApp = await seedAdminUser(firebaseEmulators.projectId);

    log("Building the production app under smoke-test env...");
    await runNpmScript({
      script: "build",
      env: qaEnv,
    });

    nextServer = await startNextServer({
      port: appPort,
      env: qaEnv,
    });

    await verifyRouteStatuses(nextServer.baseUrl);

    browser = await chromium.launch();
    const page = await browser.newPage();

    await verifyLinkCoverage(page, nextServer.baseUrl);
    await verifyPrefillBehavior(page, nextServer.baseUrl);
    await verifyResponsiveLayouts(browser, nextServer.baseUrl);
    await page.close();
    await verifyInquirySuccess(
      browser,
      nextServer.baseUrl,
      getFirestore(adminApp),
    );
    await verifyAdminAuth(browser, nextServer.baseUrl);

    log("Starting a second app instance against an unavailable Firestore port...");
    failureServer = await startNextServer({
      port: failureAppPort,
      env: {
        ...qaEnv,
        FIRESTORE_PREFER_REST: "true",
        FIRESTORE_EMULATOR_HOST: `127.0.0.1:${unavailableFirestorePort}`,
      },
    });
    await verifyInquiryFailureState(browser, failureServer.baseUrl);

    log("Firebase emulator smoke QA passed.");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Executable doesn't exist")
    ) {
      throw new Error(
        `${error.message}\nRun "npx playwright install chromium" and try again.`,
      );
    }

    for (const [label, server] of [
      ["Next server", nextServer],
      ["Failure-path Next server", failureServer],
    ]) {
      if (!server) {
        continue;
      }

      const { stdout, stderr } = server.getLogs();
      if (stdout.trim()) {
        log(`\n${label} stdout:`);
        log(stdout.trim());
      }
      if (stderr.trim()) {
        log(`\n${label} stderr:`);
        log(stderr.trim());
      }
    }

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }

    if (nextServer) {
      await nextServer.close();
    }

    if (failureServer) {
      await failureServer.close();
    }

    if (adminApp) {
      await deleteApp(adminApp);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
