import http from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const inquiryQueueOutputDirectory = path.join(
  process.cwd(),
  "output",
  "playwright",
  "issue-15",
);
const inquiryDetailOutputDirectory = path.join(
  process.cwd(),
  "output",
  "playwright",
  "issue-16",
);

const smokeAdmin = {
  email: "firebase-admin-smoke@example.com",
  password: "FirebaseSmokePassword123!",
  uid: "firebase-admin-smoke",
};

const revisionConflictProject = {
  id: "revision-conflict-smoke",
  originalImageId: "revision-conflict-original-image",
  slug: "revision-conflict-smoke",
};

const publicationFixtures = [
  {
    id: "published-project-smoke",
    slug: "published-project-smoke",
    title: "Published Project Smoke",
    published: true,
  },
  {
    id: "draft-project-smoke",
    slug: "draft-project-smoke",
    title: "Draft Project Smoke",
    published: false,
  },
  {
    id: "legacy-project-smoke",
    slug: "legacy-project-smoke",
    title: "Legacy Project Smoke",
  },
];

const inquiryQueueFixtures = [
  {
    id: "queue-draft-smoke",
    name: "Queue Draft Smoke",
    status: "draft",
    activity: "2026-08-11T15:05:00.000Z",
    location: "Denton County",
  },
  {
    id: "queue-reviewed-smoke",
    name: "Queue Reviewed Smoke",
    status: "reviewed",
    activity: "2026-08-11T15:04:00.000Z",
    location: "Cooke County",
  },
  {
    id: "queue-submitted-smoke",
    name: "Queue Submitted Smoke",
    status: "submitted",
    activity: "2026-08-11T15:03:00.000Z",
    location: "Grayson County",
  },
  {
    id: "queue-spam-smoke",
    name: "Queue Spam Smoke",
    status: "spam",
    activity: "2026-08-11T15:02:00.000Z",
    location: "Tarrant County",
  },
  {
    id: "queue-legacy-smoke",
    name: "Queue Legacy Smoke",
    status: "new",
    activity: "2026-08-11T15:01:00.000Z",
    location: "Wise County",
  },
];

function log(message) {
  process.stdout.write(`${message}\n`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function captureInquiryQueue(page, name) {
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: path.join(inquiryQueueOutputDirectory, `${name}.png`),
  });
}

async function captureInquiryDetail(page, name) {
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: path.join(inquiryDetailOutputDirectory, `${name}.png`),
  });
}

async function inspectInquiryQueuePage(page, evidence) {
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const audit = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"] },
    });
    return audit.violations
      .filter((violation) => ["serious", "critical"].includes(violation.impact))
      .map((violation) => violation.id);
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  evidence.axeSeriousOrCritical.push(...violations);
  evidence.overflow ||= overflow;
  assert(
    violations.length === 0,
    `The HHQ inquiry queue has serious or critical axe findings: ${violations.join(", ")}.`,
  );
  assert(!overflow, "The HHQ inquiry queue must not overflow the viewport.");
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
  const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST?.trim();

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
  assert(
    storageHost,
    "Firebase smoke QA requires the Storage emulator.",
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

async function seedRevisionConflictProject(firestore) {
  log("Seeding the optimistic project revision fixture...");

  const now = new Date();
  const project = {
    id: revisionConflictProject.id,
    slug: revisionConflictProject.slug,
    title: "Revision Conflict Smoke Project",
    published: false,
    status: "for-sale",
    buildTypeSlug: "single-family",
    finishLevelSlug: "builder-plus",
    squareFootage: 2400,
    bedrooms: 4,
    bathrooms: 3,
    location: "Austin, Texas",
    shortDescription:
      "A seeded project used to verify optimistic revision conflict handling.",
    fullDescription:
      "This project fixture proves that two authenticated edit forms cannot overwrite one another or corrupt the persisted Firebase image references.",
    featured: false,
    createdAt: now,
    updatedAt: now,
    revision: 0,
    images: [
      {
        id: revisionConflictProject.originalImageId,
        storagePath: `projects/${revisionConflictProject.id}/original.jpg`,
        publicUrl: "/images/build-types/single-family/front-elevation.jpg",
        altText: "Original revision conflict project image",
        sortOrder: 0,
        isCover: true,
      },
    ],
  };
  const batch = firestore.batch();

  batch.set(
    firestore.collection("projects").doc(revisionConflictProject.id),
    project,
  );
  batch.set(
    firestore.collection("projectSlugs").doc(revisionConflictProject.slug),
    { projectId: revisionConflictProject.id },
  );
  await batch.commit();
}

async function seedPublicationFixtures(firestore) {
  log("Seeding project publication fixtures...");

  const now = new Date();
  const batch = firestore.batch();

  for (const fixture of publicationFixtures) {
    const project = {
      id: fixture.id,
      slug: fixture.slug,
      title: fixture.title,
      status: "sold",
      buildTypeSlug: "single-family",
      finishLevelSlug: "builder-plus",
      squareFootage: 2400,
      bedrooms: 4,
      bathrooms: 3,
      location: "Austin, Texas",
      shortDescription:
        "A smoke-test project used to verify public publication boundaries.",
      fullDescription:
        "This project fixture verifies that only explicitly published project records can appear on public project routes and in the sitemap.",
      featured: false,
      createdAt: now,
      updatedAt: now,
      revision: 0,
      images: [],
      ...(Object.hasOwn(fixture, "published")
        ? { published: fixture.published }
        : {}),
    };

    batch.set(firestore.collection("projects").doc(fixture.id), project);
    batch.set(firestore.collection("projectSlugs").doc(fixture.slug), {
      projectId: fixture.id,
    });
  }

  await batch.commit();
}

async function seedInquiryQueueFixtures(firestore) {
  log("Seeding HHQ inquiry queue fixtures...");
  const batch = firestore.batch();

  for (const fixture of inquiryQueueFixtures) {
    const reference = firestore
      .collection("inquirySubmissions")
      .doc(fixture.id);
    const activity = new Date(fixture.activity);

    if (fixture.status === "new") {
      batch.set(reference, {
        status: "new",
        name: fixture.name,
        email: "queue-legacy@example.com",
        phone: "+1 214 555 0199",
        projectLocation: fixture.location,
        projectDescription: "Private legacy description for queue smoke proof.",
        preferredContactMethod: "phone",
        projectType: "single-family",
        approxSquareFootage: 2400,
        finishLevel: "builder-plus",
        servicesNeeded: ["architectural-design", "building"],
        lotStatus: "already-owned",
        timeline: "3-6-months",
        budgetRange: "500k-1m",
        createdAt: activity,
      });
      continue;
    }

    batch.set(reference, {
      schemaVersion: 2,
      experience: "plan-your-home",
      status: fixture.status,
      contact: {
        name: fixture.name,
        email: `queue-${fixture.status}@example.com`,
        phone: "+1 214 555 0188",
        preferredFollowUp: "email",
        manualFollowUpDisclosureAccepted: true,
      },
      derived: {
        name: fixture.name,
        email: `queue-${fixture.status}@example.com`,
        phone: "+1 214 555 0188",
        targetLocation: fixture.location,
        lastActivityAt: activity,
      },
      progress: {
        currentPromptId:
          fixture.status === "draft" ? "kitchen.use" : "review",
        currentZoneId:
          fixture.status === "draft"
            ? "kitchen-and-dining"
            : "design-desk-and-review",
        completedZoneIds:
          fixture.status === "draft"
            ? ["project-and-living"]
            : [
                "project-and-living",
                "kitchen-and-dining",
                "primary-suite",
                "bedrooms-and-shared-bathrooms",
                "utility-and-systems",
                "exterior-and-site",
                "design-desk-and-review",
              ],
      },
      answers: { private: `${fixture.status}-answer-must-not-render` },
      references:
        fixture.status === "submitted"
          ? [
              {
                id: "file-66666666-6666-4666-8666-666666666666",
                kind: "file",
                originalName: "private-direction.pdf",
                objectPath: `inquiryReferences/${fixture.id}/private-direction`,
                extension: "pdf",
                mimeType: "application/pdf",
                sizeBytes: 24,
                note: "Private direction reference",
                createdAt: activity.toISOString(),
              },
              {
                id: "link-77777777-7777-4777-8777-777777777777",
                kind: "link",
                url: "https://example.com/inspiration",
                hostname: "example.com",
                note: "Exterior direction",
                createdAt: activity.toISOString(),
              },
            ]
          : [],
      acceptedConsentVersion:
        fixture.status === "draft" ? null : "plan-home-inquiry-contact-v1",
      acceptedConsentAt: fixture.status === "draft" ? null : activity,
      submittedAt: fixture.status === "draft" ? null : activity,
      expiresAt: new Date("2028-08-10T15:00:00.000Z"),
      referenceUploadProtectionVersion: 1,
      createdAt: activity,
      updatedAt: activity,
    });
  }

  await batch.commit();
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
    "/start",
    "/inquire",
    "/plan-your-home",
    "/plan-your-home/resume",
    "/projects",
    "/projects/published-project-smoke",
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

  for (const route of [
    "/pricing/not-a-finish",
    "/catalog/not-a-type",
    "/projects/draft-project-smoke",
    "/projects/legacy-project-smoke",
  ]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert(response.status === 404, `Expected ${route} to return 404, received ${response.status}.`);
  }

  for (const method of ["GET", "POST"]) {
    const response = await fetch(
      `${baseUrl}/api/internal/plan-your-home/cleanup`,
      { method },
    );
    assert(
      response.status === 401 && response.headers.get("cache-control") === "no-store",
      `Expected unauthorized cleanup ${method} to fail closed with an uncached 401.`,
    );
  }
}

async function verifyProjectPublicationBoundary(baseUrl) {
  log("Checking project publication boundaries...");

  const [projectsResponse, sitemapResponse] = await Promise.all([
    fetch(`${baseUrl}/projects`),
    fetch(`${baseUrl}/sitemap.xml`),
  ]);
  const [projectsHtml, sitemapXml] = await Promise.all([
    projectsResponse.text(),
    sitemapResponse.text(),
  ]);
  const [publishedFixture, draftFixture, legacyFixture] = publicationFixtures;

  assert(
    projectsHtml.includes(publishedFixture.title),
    "The public projects page must include explicitly published projects.",
  );
  assert(
    !projectsHtml.includes(draftFixture.title) &&
      !projectsHtml.includes(legacyFixture.title),
    "The public projects page must hide draft and legacy projects.",
  );
  assert(
    sitemapXml.includes(`/projects/${publishedFixture.slug}`),
    "The sitemap must include explicitly published projects.",
  );
  assert(
    !sitemapXml.includes(`/projects/${draftFixture.slug}`) &&
      !sitemapXml.includes(`/projects/${legacyFixture.slug}`),
    "The sitemap must hide draft and legacy projects.",
  );
}

async function verifyLinkCoverage(page, baseUrl) {
  log("Checking header, footer, legal, and direct-contact links...");

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const selectors = [
    'header a[href="/"]',
    'header a[href="/projects"]',
    'header a[href="/pricing"]',
    'header a[href="/faq"]',
    'header a[href="/start"]',
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
  assert(
    (await page.locator('a[href^="/plan-your-home"]').count()) === 0 &&
      (await page.locator('main a[href="/inquire"]').count()) > 0,
    "The home page must keep Plan Your Home unlinked and expose the generic inquiry.",
  );
}

async function verifyProjectEntryAndPrivacy(page, baseUrl) {
  log("Checking project entry, pre-collection disclosures, and Plan Home analytics...");

  await page.goto(
    `${baseUrl}/start?buildType=townhomes&utm_source=smoke&email=private%40example.com`,
    { waitUntil: "networkidle" },
  );
  const newHomeLink = page.getByRole("link", {
    name: "Start A Project Brief",
    exact: true,
  });
  const genericLink = page.getByRole("link", {
    name: "Start Another Project Type",
  });
  for (const entryLink of [newHomeLink, genericLink]) {
    const target = await entryLink.boundingBox();
    assert(
      target && target.width >= 44 && target.height >= 44,
      "Each project-start action must provide at least a 44 by 44 pixel target.",
    );
  }
  assert(
    (await newHomeLink.getAttribute("href")) ===
      "/inquire?buildType=single-family",
    "The public new-home path must use the generic brief while Plan Your Home is private.",
  );
  const genericHref = new URL(
    await genericLink.getAttribute("href"),
    baseUrl,
  );
  assert(
    genericHref.pathname === "/inquire" &&
      genericHref.searchParams.get("buildType") === "townhomes" &&
      genericHref.searchParams.get("utm_source") === "smoke" &&
      !genericHref.searchParams.has("email"),
    "The generic path must preserve only approved non-contact prefill parameters.",
  );

  await Promise.all([
    page.waitForURL((url) => url.pathname === "/inquire"),
    genericLink.click(),
  ]);
  assert(
    new URL(page.url()).searchParams.get("buildType") === "townhomes",
    "The generic project-start action must navigate to the working prefilled inquiry.",
  );
  await page.goBack({ waitUntil: "networkidle" });

  assert(
    (await page.locator('a[href^="/plan-your-home"]').count()) === 0,
    "The project-start page must not link to private Plan Your Home routes.",
  );

  await page.goto(`${baseUrl}/plan-your-home`, { waitUntil: "networkidle" });
  assert(
    (await page.locator('meta[name="robots"]').getAttribute("content")) ===
      "noindex, nofollow",
    "Direct Plan Your Home access must remain excluded from indexing.",
  );
  const planPrivacyLink = page.getByRole("link", {
    name: "privacy and retention policy",
  });
  const planNameInput = page.getByLabel("Your name");
  const planStartButton = page.getByRole("button", {
    name: "Open the front door",
  });
  const planResumeLink = page.getByRole("link", {
    name: "Resume a saved plan",
  });
  assert(
    await page.evaluate(
      ([input, start, privacy, resume]) =>
        Boolean(
          (input.compareDocumentPosition(start) &
            Node.DOCUMENT_POSITION_FOLLOWING) &&
            (start.compareDocumentPosition(privacy) &
              Node.DOCUMENT_POSITION_FOLLOWING) &&
            privacy.closest("[data-plan-home-welcome-footer]")?.contains(resume),
        ),
      [
        await planNameInput.elementHandle(),
        await planStartButton.elementHandle(),
        await planPrivacyLink.elementHandle(),
        await planResumeLink.elementHandle(),
      ],
    ),
    "Plan Your Home privacy and resume links must remain secondary to the start action.",
  );
  assert(
    (await planNameInput.getAttribute("aria-describedby")) ===
      "plan-home-welcome-privacy" &&
      (await page.locator("#plan-home-welcome-privacy").textContent())?.trim() ===
        "Progress saves in this browser.",
    "The Welcome name field must retain its concise browser-save description.",
  );
  assert(
    (await planPrivacyLink.getAttribute("href")) === "/privacy" &&
      (await planResumeLink.getAttribute("href")) === "/plan-your-home/resume",
    "The Welcome footer must keep working privacy and resume destinations.",
  );
  let planPrivacyKeyboardFocused = false;
  for (let press = 0; press < 20 && !planPrivacyKeyboardFocused; press += 1) {
    await page.keyboard.press("Tab");
    planPrivacyKeyboardFocused = await planPrivacyLink.evaluate(
      (link) => document.activeElement === link,
    );
  }
  assert(
    planPrivacyKeyboardFocused,
    "The inline Plan Home privacy link must be keyboard focusable.",
  );
  await planNameInput.fill("Browser Proof Visitor");
  await page.getByRole("button", { name: "Open the front door" }).click();
  await page.locator('[data-tour-beat="front-door"]').waitFor();
  const startEvent = await page.evaluate(() =>
    window.dataLayer?.find((entry) => entry.event === "plan_home_start"),
  );
  assert(startEvent, "Opening the Plan Home tour must emit plan_home_start.");
  assert(
    Object.keys(startEvent).every((key) =>
      [
        "event",
        "anonymous_session_id",
        "prompt_index",
        "device_category",
        "source_tag",
      ].includes(key),
    ) && !JSON.stringify(startEvent).includes("Browser Proof Visitor"),
    "The browser-emitted Plan Home start event must contain only allowlisted non-PII fields.",
  );

  await page.goto(`${baseUrl}/inquire`, { waitUntil: "networkidle" });
  const genericPrivacyLink = page.getByRole("link", {
    name: "privacy and retention policy",
  });
  const genericNameInput = page.getByLabel("Name");
  assert(
    await page.evaluate(
      ([privacy, input]) =>
        Boolean(
          privacy.compareDocumentPosition(input) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      [await genericPrivacyLink.elementHandle(), await genericNameInput.elementHandle()],
    ),
    "Generic inquiry privacy and retention disclosure must precede the first contact field.",
  );
  let genericPrivacyKeyboardFocused = false;
  for (let press = 0; press < 20 && !genericPrivacyKeyboardFocused; press += 1) {
    await page.keyboard.press("Tab");
    genericPrivacyKeyboardFocused = await genericPrivacyLink.evaluate(
      (link) => document.activeElement === link,
    );
  }
  assert(
    genericPrivacyKeyboardFocused,
    "The inline generic-inquiry privacy link must be keyboard focusable.",
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

  const routes = [
    "/",
    "/pricing",
    "/catalog",
    "/faq",
    "/start",
    "/plan-your-home",
    "/inquire",
    "/privacy",
  ];

  for (const viewportTest of viewportTests) {
    const context = await browser.newContext({
      viewport: viewportTest.viewport,
      isMobile: viewportTest.isMobile,
    });
    const page = await context.newPage();

    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

      if (route === "/plan-your-home") {
        assert(
          (await page.locator('nav[aria-label="Primary"]').count()) === 0 &&
            (await page.locator("footer").count()) === 0 &&
            (await page.getByRole("link", { name: "Save and exit" }).count()) === 1,
          `Expected focused Plan Your Home chrome for ${viewportTest.name}.`,
        );
      } else {
        assert(
          await page.getByRole("banner").first().isVisible(),
          `Expected header to be visible for ${route} at ${viewportTest.name}.`,
        );
        assert(
          await page.locator("footer").isVisible(),
          `Expected footer to be visible for ${route} at ${viewportTest.name}.`,
        );
      }

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      assert(
        !hasHorizontalOverflow,
        `Detected horizontal overflow for ${route} at ${viewportTest.name}.`,
      );

      if (["/start", "/plan-your-home", "/inquire", "/privacy"].includes(route)) {
        await page.addScriptTag({ path: axePath });
        const violations = await page.evaluate(async () => {
          const audit = await window.axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"] },
          });
          return audit.violations
            .filter((violation) => ["serious", "critical"].includes(violation.impact))
            .map((violation) => violation.id);
        });
        assert(
          violations.length === 0,
          `${route} has serious or critical axe findings at ${viewportTest.name}: ${violations.join(", ")}.`,
        );
      }
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
        "The project brief could not be sent right now. Please try again in a moment or email h and h directly.",
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

async function verifyAdminInquiryFailureState(browser, baseUrl) {
  log("Checking the HHQ inquiry queue recoverable error state...");
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/admin/inquiries`, { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(smokeAdmin.email);
    await page.getByLabel("Password").fill(smokeAdmin.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${baseUrl}/admin/inquiries`);
    await page.getByRole("heading", { name: "Project Inquiries" }).waitFor();
    await page
      .getByRole("alert")
      .getByText(
        "Inquiries could not be loaded right now. Refresh this page to try again.",
      )
      .waitFor();
    await captureInquiryQueue(page, "desktop-error-state");
  } finally {
    await context.close();
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

function normalizeProjectImageRefs(images) {
  assert(Array.isArray(images), "Expected the project image refs to be an array.");

  return images
    .map((image) => ({
      id: image.id,
      storagePath: image.storagePath,
      publicUrl: image.publicUrl ?? null,
      downloadToken: image.downloadToken ?? null,
      altText: image.altText,
      sortOrder: image.sortOrder,
      isCover: image.isCover,
    }))
    .sort((leftImage, rightImage) => leftImage.id.localeCompare(rightImage.id));
}

async function readRevisionConflictProject(firestore) {
  const snapshot = await firestore
    .collection("projects")
    .doc(revisionConflictProject.id)
    .get();

  assert(snapshot.exists, "Expected the revision conflict project to exist.");
  return snapshot.data();
}

async function verifyProjectRevisionConflict(browser, baseUrl, firestore) {
  log("Checking optimistic project revision conflict handling...");

  await seedRevisionConflictProject(firestore);

  const context = await browser.newContext();
  const firstPage = await context.newPage();
  const editPath = `/admin/projects/${revisionConflictProject.id}`;
  const editUrl = `${baseUrl}${editPath}`;

  try {
    await firstPage.goto(
      `${baseUrl}/admin/login?next=${encodeURIComponent(editPath)}`,
      { waitUntil: "networkidle" },
    );
    await firstPage.getByLabel("Email").fill(smokeAdmin.email);
    await firstPage.getByLabel("Password").fill(smokeAdmin.password);
    await firstPage.getByRole("button", { name: "Sign In" }).click();
    await firstPage.waitForURL(editUrl);

    assert(
      !(await firstPage.locator('input[name="published"]').isChecked()),
      "Unpublished projects must load as drafts in the admin form.",
    );

    const stalePage = await context.newPage();
    await stalePage.goto(editUrl, { waitUntil: "networkidle" });

    for (const [label, page] of [
      ["first", firstPage],
      ["stale", stalePage],
    ]) {
      assert(
        await page.locator('input[name="projectRevision"]').inputValue() === "0",
        `Expected the ${label} edit form to load project revision 0.`,
      );
    }

    await firstPage.locator('input[name="galleryImages"]').setInputFiles({
      name: "over-upload-limit.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(4 * 1024 * 1024 + 1),
    });
    await firstPage.getByRole("button", { name: "Save Project" }).click();
    await firstPage
      .getByText(
        "All gallery uploads must be JPG, PNG, WebP, or AVIF and at most 4 MB.",
        { exact: true },
      )
      .waitFor();
    assert(
      (await readRevisionConflictProject(firestore)).revision === 0,
      "An oversized project upload must not persist changes.",
    );

    await firstPage
      .locator('input[name="title"]')
      .fill("Revision Conflict First Save");
    await firstPage
      .locator(
        `input[name="existingImageAltText:${revisionConflictProject.originalImageId}"]`,
      )
      .fill("Original image retained by the first save");
    await firstPage
      .locator('input[name="galleryImages"]')
      .setInputFiles(
        "public/images/build-types/single-family/living-space.jpg",
      );

    await Promise.all([
      firstPage.waitForURL(`${editUrl}?saved=1`),
      firstPage.getByRole("button", { name: "Save Project" }).click(),
    ]);

    const firstSavedProject = await readRevisionConflictProject(firestore);
    const firstSavedImages = normalizeProjectImageRefs(firstSavedProject.images);

    assert(
      firstSavedProject.revision === 1,
      "Expected the first project save to increment the revision to 1.",
    );
    assert(
      firstSavedProject.title === "Revision Conflict First Save",
      "Expected the first project save to persist its title.",
    );
    assert(
      firstSavedProject.published === false,
      "Expected an unchecked publication control to persist the project as a draft.",
    );
    assert(
      firstSavedImages.length === 2,
      "Expected the first project save to retain one image and add one image.",
    );
    assert(
      firstSavedImages.some(
        (image) => image.id === revisionConflictProject.originalImageId,
      ),
      "Expected the first project save to retain the original image ref.",
    );

    await stalePage
      .locator('input[name="title"]')
      .fill("Stale Revision Conflict Attempt");
    await stalePage
      .locator(
        `input[name="existingImageAltText:${revisionConflictProject.originalImageId}"]`,
      )
      .fill("Stale image metadata must not persist");
    await stalePage.getByRole("button", { name: "Save Project" }).click();
    await stalePage
      .getByText(
        "This project changed after you opened it. Reload the page and review the latest version before saving again.",
      )
      .waitFor();

    assert(
      new URL(stalePage.url()).pathname === editPath,
      "Expected the stale project save to stay on its edit form.",
    );

    const projectAfterConflict = await readRevisionConflictProject(firestore);
    const imagesAfterConflict = normalizeProjectImageRefs(
      projectAfterConflict.images,
    );

    assert(
      projectAfterConflict.revision === 1,
      "A stale project save must not increment the persisted revision.",
    );
    assert(
      projectAfterConflict.title === "Revision Conflict First Save",
      "A stale project save must not overwrite the first save.",
    );
    assert(
      JSON.stringify(imagesAfterConflict) === JSON.stringify(firstSavedImages),
      "A stale project save must not alter, reintroduce, or delete image refs.",
    );
  } finally {
    await context.close();
  }
}

async function verifyAdminAuth(browser, baseUrl, firestore) {
  log("Checking Firebase admin login, protected routes, and logout...");
  await mkdir(inquiryQueueOutputDirectory, { recursive: true });
  await mkdir(inquiryDetailOutputDirectory, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const evidence = {
    axeSeriousOrCritical: [],
    browserErrors: [],
    overflow: false,
    unauthorizedRedirect: false,
  };
  const detailEvidence = {
    axeSeriousOrCritical: [],
    browserErrors: evidence.browserErrors,
    overflow: false,
    planHomeQuestionsInOrder: false,
    legacyReadable: false,
    safeFileAction: false,
    safeHttpsLink: false,
    completeAnswerSummaries: false,
    reviewedAndSpam: false,
    deleteCancel: false,
    deleteComplete: false,
  };
  page.on("pageerror", (error) => evidence.browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") evidence.browserErrors.push(message.text());
  });

  try {
    await page.goto(`${baseUrl}/admin/inquiries`, { waitUntil: "networkidle" });

    const loginUrl = new URL(page.url());
    assert(
      loginUrl.pathname === "/admin/login",
      "Unauthenticated admin access must redirect to the login page.",
    );
    assert(
      loginUrl.searchParams.get("next") === "/admin/inquiries",
      "Protected-route redirect must preserve the requested admin path.",
    );
    evidence.unauthorizedRedirect = true;
    await captureInquiryQueue(page, "desktop-unauthorized-login");

    await page.getByLabel("Email").fill(smokeAdmin.email);
    await page.getByLabel("Password").fill(smokeAdmin.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${baseUrl}/admin/inquiries`);
    await page.getByText(smokeAdmin.email).waitFor();
    await page.getByRole("heading", { name: "Project Inquiries" }).waitFor();

    const queueRows = page.getByRole("list", { name: "Inquiries" }).getByRole("listitem");
    const queueNames = await queueRows.evaluateAll((rows) =>
      rows.map((row) => row.textContent ?? ""),
    );
    const fixturePositions = inquiryQueueFixtures.map((fixture) =>
      queueNames.findIndex((row) => row.includes(fixture.name)),
    );
    assert(
      fixturePositions.every((position) => position >= 0),
      "Every seeded legacy and Plan Your Home queue status must be visible.",
    );
    assert(
      fixturePositions.every(
        (position, index) => index === 0 || position > fixturePositions[index - 1],
      ),
      "Seeded inquiries must remain in newest-first activity order.",
    );
    assert(
      (await page.getByText("Legacy inquiry", { exact: true }).count()) >= 1,
      "Legacy new inquiries must be labeled explicitly.",
    );
    assert(
      (await page.getByText("draft-answer-must-not-render").count()) === 0 &&
        (await page.getByText("private/draft.pdf").count()) === 0,
      "Private answers and reference paths must not render in the queue.",
    );
    await inspectInquiryQueuePage(page, evidence);
    await captureInquiryQueue(page, "desktop-all-statuses");

    await page.getByRole("combobox", { name: "Status" }).selectOption("submitted");
    await page.getByRole("button", { name: "Apply Filter" }).click();
    await page.waitForURL(`${baseUrl}/admin/inquiries?status=submitted`);
    await page.getByText("Queue Submitted Smoke", { exact: true }).waitFor();
    await page.getByText("Queue Legacy Smoke", { exact: true }).waitFor();
    assert(
      (await page.getByText("Queue Draft Smoke", { exact: true }).count()) === 0 &&
        (await page.getByText("Queue Reviewed Smoke", { exact: true }).count()) === 0 &&
        (await page.getByText("Queue Spam Smoke", { exact: true }).count()) === 0,
      "Submitted filter must exclude draft, reviewed, and spam inquiries.",
    );
    await captureInquiryQueue(page, "desktop-submitted-filter");

    await page.getByRole("link", { name: "Clear" }).click();
    await page.waitForURL(`${baseUrl}/admin/inquiries`);
    await page.setViewportSize({ width: 820, height: 1180 });
    await inspectInquiryQueuePage(page, evidence);
    await captureInquiryQueue(page, "tablet-all-statuses");
    await page.setViewportSize({ width: 390, height: 844 });
    await inspectInquiryQueuePage(page, evidence);
    await captureInquiryQueue(page, "phone-all-statuses");
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.getByRole("link", { name: "Taylor Homeowner" }).click();
    await page.waitForURL((url) =>
      url.pathname.startsWith("/admin/inquiries/draft-"),
    );
    await page.getByRole("heading", { name: "Taylor Homeowner" }).waitFor();
    assert(
      (await page.getByText(/^Question \d+$/).count()) === 35 &&
        (await page.getByText("Not saved yet").count()) === 0 &&
        (await page.getByText("Saved answer could not be read.").count()) === 0,
      "Plan Your Home detail must render all 35 readable answer summaries in tour order.",
    );
    detailEvidence.planHomeQuestionsInOrder = true;
    detailEvidence.completeAnswerSummaries = true;
    await inspectInquiryQueuePage(page, detailEvidence);
    await captureInquiryDetail(page, "desktop-plan-home-detail");
    await page.setViewportSize({ width: 390, height: 844 });
    await inspectInquiryQueuePage(page, detailEvidence);
    await captureInquiryDetail(page, "phone-plan-home-detail");

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("link", { name: "Back to Inquiries" }).click();
    await page.waitForURL(`${baseUrl}/admin/inquiries`);
    await page.getByRole("link", { name: "Queue Legacy Smoke" }).click();
    await page.waitForURL(`${baseUrl}/admin/inquiries/queue-legacy-smoke`);
    await page.getByText("Private legacy description for queue smoke proof.").waitFor();
    detailEvidence.legacyReadable = true;
    await inspectInquiryQueuePage(page, detailEvidence);
    await captureInquiryDetail(page, "desktop-legacy-detail");
    await page.setViewportSize({ width: 390, height: 844 });
    await inspectInquiryQueuePage(page, detailEvidence);
    await captureInquiryDetail(page, "phone-legacy-detail");

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("link", { name: "Back to Inquiries" }).click();
    await page.waitForURL(`${baseUrl}/admin/inquiries`);
    await page.getByRole("link", { name: "Queue Submitted Smoke" }).click();
    await page.waitForURL(`${baseUrl}/admin/inquiries/queue-submitted-smoke`);
    const privateFileForm = page.locator(
      'form[action="/admin/inquiries/file"]',
    );
    await privateFileForm.waitFor();
    assert(
      (await privateFileForm.getAttribute("method"))?.toLowerCase() === "post" &&
        (await privateFileForm.getAttribute("target")) === "_blank" &&
        (await page.locator("body").textContent())?.includes(
          "inquiryReferences/queue-submitted-smoke",
        ) === false,
      "Private file action must use an authenticated POST without rendering its object path.",
    );
    detailEvidence.safeFileAction = true;
    const safeLink = page.getByRole("link", { name: "Open example.com" });
    assert(
      (await safeLink.getAttribute("href")) ===
        "https://example.com/inspiration" &&
        (await safeLink.getAttribute("target")) === "_blank" &&
        (await safeLink.getAttribute("rel")) === "noopener noreferrer",
      "HTTPS references must use a safe external-link contract.",
    );
    detailEvidence.safeHttpsLink = true;
    await page.getByRole("button", { name: "Mark Reviewed" }).click();
    await page.waitForURL(
      `${baseUrl}/admin/inquiries/queue-submitted-smoke?updated=reviewed`,
    );
    await page.getByText("Inquiry marked Reviewed.").waitFor();
    await page.getByRole("button", { name: "Mark Spam" }).click();
    await page.waitForURL(
      `${baseUrl}/admin/inquiries/queue-submitted-smoke?updated=spam`,
    );
    await page.getByText("Inquiry marked Spam.").waitFor();
    detailEvidence.reviewedAndSpam = true;

    await page.getByRole("button", { name: "Delete Inquiry" }).click();
    const deleteDialog = page.getByRole("dialog", {
      name: "Delete this inquiry?",
    });
    await deleteDialog.waitFor();
    await deleteDialog.getByRole("button", { name: "Cancel" }).click();
    assert(
      (await deleteDialog.count()) === 0 || !(await deleteDialog.isVisible()),
      "Cancel must close the destructive confirmation without deleting.",
    );
    assert(
      (
        await firestore
          .collection("inquirySubmissions")
          .doc("queue-submitted-smoke")
          .get()
      ).exists,
      "Cancel must preserve the inquiry record.",
    );
    detailEvidence.deleteCancel = true;

    await page.getByRole("button", { name: "Delete Inquiry" }).click();
    await page
      .getByRole("dialog", { name: "Delete this inquiry?" })
      .getByRole("button", { name: "Delete Inquiry and Files" })
      .click();
    await page.waitForURL(`${baseUrl}/admin/inquiries?deleted=1`);
    await page
      .getByText("Inquiry, resume links, and private files were deleted.")
      .waitFor();
    assert(
      !(await firestore
        .collection("inquirySubmissions")
        .doc("queue-submitted-smoke")
        .get()).exists,
      "Confirmed deletion must remove the inquiry record.",
    );
    detailEvidence.deleteComplete = true;
    await captureInquiryDetail(page, "desktop-return-after-delete");
    await writeFile(
      path.join(inquiryDetailOutputDirectory, "summary.json"),
      `${JSON.stringify(detailEvidence, null, 2)}\n`,
    );

    assert(
      evidence.browserErrors.length === 0,
      `HHQ inquiry queue browser errors: ${evidence.browserErrors.join(" | ")}.`,
    );
    await writeFile(
      path.join(inquiryQueueOutputDirectory, "summary.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
    );

    await page.getByRole("link", { name: "Projects" }).click();
    await page.waitForURL(`${baseUrl}/admin/projects`);
    await page.getByRole("heading", { name: "Completed Homes" }).waitFor();

    for (const fixture of publicationFixtures) {
      const projectRow = page.getByRole("row").filter({
        hasText: fixture.title,
      });
      await projectRow.waitFor();
      assert(
        (await projectRow.textContent())?.includes(
          fixture.published === true ? "Published" : "Draft",
        ),
        `Expected ${fixture.title} to show the correct publication state in HHQ.`,
      );
    }

    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.waitForURL(`${baseUrl}/admin/login?signed_out=1`);
    await page.getByText("You have been signed out.").waitFor();

    await page.goto(`${baseUrl}/admin/inquiries`, { waitUntil: "networkidle" });
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
    PLAN_HOME_DRAFT_SESSION_SECRET:
      "qa-smoke-plan-home-draft-session-secret-only",
    PLAN_HOME_RESUME_SECRET: "qa-smoke-plan-home-resume-secret-only",
    PLAN_HOME_PUBLIC_ORIGIN: `http://127.0.0.1:${appPort}`,
    PLAN_HOME_RESUME_MAIL_TRANSPORT: "fake",
    HH_CONTACT_PHONE_HREF: "tel:+15125550199",
    HH_CONTACT_PHONE_LABEL: "(512) 555-0199",
  };

  let nextServer;
  let failureServer;
  let browser;
  let adminApp;

  try {
    adminApp = await seedAdminUser(firebaseEmulators.projectId);
    const firestore = getFirestore(adminApp);
    await seedPublicationFixtures(firestore);
    await seedInquiryQueueFixtures(firestore);

    log("Running focused Plan Your Home draft emulator tests...");
    const draftTestResult = await runNpmScript({
      script: "test:plan-home-drafts:emulator",
      env: qaEnv,
    });
    if (draftTestResult.stdout.trim()) {
      log(draftTestResult.stdout.trim());
    }

    log("Running focused Plan Your Home resume emulator tests...");
    const resumeTestResult = await runNpmScript({
      script: "test:plan-home-resume:emulator",
      env: qaEnv,
    });
    if (resumeTestResult.stdout.trim()) {
      log(resumeTestResult.stdout.trim());
    }

    log("Running focused HHQ inquiry queue emulator tests...");
    const inquiryQueueTestResult = await runNpmScript({
      script: "test:admin-inquiries:emulator",
      env: qaEnv,
    });
    if (inquiryQueueTestResult.stdout.trim()) {
      log(inquiryQueueTestResult.stdout.trim());
    }

    log("Running focused HHQ inquiry detail emulator tests...");
    const inquiryDetailTestResult = await runNpmScript({
      script: "test:admin-inquiry-detail:emulator",
      env: qaEnv,
    });
    if (inquiryDetailTestResult.stdout.trim()) {
      log(inquiryDetailTestResult.stdout.trim());
    }

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
    await verifyProjectPublicationBoundary(nextServer.baseUrl);

    browser = await chromium.launch();
    const page = await browser.newPage();

    await verifyLinkCoverage(page, nextServer.baseUrl);
    await verifyProjectEntryAndPrivacy(page, nextServer.baseUrl);
    await verifyPrefillBehavior(page, nextServer.baseUrl);
    await verifyResponsiveLayouts(browser, nextServer.baseUrl);
    await page.close();
    await verifyInquirySuccess(
      browser,
      nextServer.baseUrl,
      firestore,
    );
    await verifyProjectRevisionConflict(
      browser,
      nextServer.baseUrl,
      firestore,
    );
    await verifyAdminAuth(browser, nextServer.baseUrl, firestore);

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
    await verifyAdminInquiryFailureState(browser, failureServer.baseUrl);

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
