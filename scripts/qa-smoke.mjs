import http from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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

const smokeNonAdmin = {
  email: "firebase-non-admin-smoke@example.com",
  password: "FirebaseNonAdminSmokePassword123!",
  uid: "firebase-non-admin-smoke",
};

const adminSessionCookieName = "__session";
const adminSessionDurationSeconds = 60 * 60 * 24 * 5;
const adminLoginFailureMessage =
  "HHQ login could not be completed. Check your details or wait a moment and try again.";

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

async function seedAdminUsers(projectId) {
  log("Seeding authorized and non-admin users in the Authentication emulator...");

  const app = initializeApp(
    { projectId },
    `qa-smoke-${process.pid}-${Date.now()}`,
  );
  const auth = getAuth(app);

  for (const fixture of [smokeAdmin, smokeNonAdmin]) {
    try {
      const existingUser = await auth.getUserByEmail(fixture.email);
      await auth.deleteUser(existingUser.uid);
    } catch (error) {
      if (error?.code !== "auth/user-not-found") {
        await deleteApp(app);
        throw error;
      }
    }

    await auth.createUser({
      email: fixture.email,
      emailVerified: true,
      password: fixture.password,
      uid: fixture.uid,
    });
  }

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

  const [projectsResponse, sitemapResponse, markdownSitemapResponse] = await Promise.all([
    fetch(`${baseUrl}/projects`),
    fetch(`${baseUrl}/sitemap.xml`),
    fetch(`${baseUrl}/sitemap.md`),
  ]);
  const [projectsHtml, sitemapXml, markdownSitemap] = await Promise.all([
    projectsResponse.text(),
    sitemapResponse.text(),
    markdownSitemapResponse.text(),
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
  assert(
    markdownSitemap.includes(`/projects/${publishedFixture.slug}`) &&
      !markdownSitemap.includes(`/projects/${draftFixture.slug}`) &&
      !markdownSitemap.includes(`/projects/${legacyFixture.slug}`),
    "The Markdown sitemap must include only explicitly published projects.",
  );
}

async function verifyAgentDiscoveryDocuments(baseUrl) {
  log("Checking public agent discovery documents...");

  const resourcePaths = ["/llms.txt", "/sitemap.md", "/services.md"];
  const resources = new Map();

  for (const resourcePath of resourcePaths) {
    const response = await fetch(`${baseUrl}${resourcePath}`);
    const body = await response.text();

    assert(
      response.ok,
      `Expected ${resourcePath} to return 200, received ${response.status}.`,
    );
    assert(
      response.headers.get("content-type")?.startsWith(
        resourcePath === "/llms.txt" ? "text/plain" : "text/markdown",
      ),
      `${resourcePath} must use its agent-readable content type.`,
    );
    assert(
      response.headers.get("access-control-allow-origin") === "*",
      `${resourcePath} must allow public cross-origin reads.`,
    );
    assert(
      response.headers.get("cache-control") ===
        "public, s-maxage=3600, stale-while-revalidate=86400",
      `${resourcePath} must use the bounded shared-cache policy.`,
    );
    assert(
      response.headers.get("link") ===
        `<${baseUrl}${resourcePath}>; rel="canonical"`,
      `${resourcePath} must identify its canonical public document.`,
    );
    assert(body.trim().length > 200, `${resourcePath} must contain useful guidance.`);
    assert(
      resourcePaths.every((linkedPath) => body.includes(linkedPath)),
      `${resourcePath} must cross-link the complete discovery bundle.`,
    );
    assert(
      !body.includes("H & H"),
      `${resourcePath} must preserve canonical Howeth and Harp naming.`,
    );
    for (const internalTerm of ["AGENTS.md", "docs/", "Firebase", "HHQ", "npm run"]) {
      assert(
        !body.includes(internalTerm),
        `${resourcePath} must not publish internal operational guidance (${internalTerm}).`,
      );
    }

    resources.set(resourcePath, body);
  }

  const llms = resources.get("/llms.txt");
  assert(
    llms.includes("read-only") &&
      llms.includes("must not submit") &&
      llms.includes("Howeth and Harp"),
    "llms.txt must establish identity and read-only referral limits.",
  );

  const services = resources.get("/services.md");
  for (const expectedService of [
    "Architectural Design",
    "Building",
    "Remodeling",
    "Land Development",
    "Builder Grade",
    "Builder+",
    "Custom",
  ]) {
    assert(
      services.includes(expectedService),
      `services.md must include ${expectedService}.`,
    );
  }

  const markdownSitemap = resources.get("/sitemap.md");
  for (const publicPath of [
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
    "/projects",
    "/faq",
    "/start",
  ]) {
    assert(
      markdownSitemap.includes(publicPath),
      `sitemap.md must include ${publicPath}.`,
    );
  }

  const [xmlResponse, robotsResponse] = await Promise.all([
    fetch(`${baseUrl}/sitemap.xml`),
    fetch(`${baseUrl}/robots.txt`),
  ]);
  const [sitemapXml, robots] = await Promise.all([
    xmlResponse.text(),
    robotsResponse.text(),
  ]);
  const xmlPaths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => new URL(match[1]).pathname)
    .sort();
  const markdownPaths = [
    ...markdownSitemap.matchAll(/^- \[[^\]]+\]\(([^)]+)\) —/gm),
  ]
    .map((match) => new URL(match[1]).pathname)
    .sort();
  assert(
    JSON.stringify(xmlPaths) === JSON.stringify(markdownPaths),
    "The XML and Markdown sitemaps must consume the same concrete public inventory.",
  );
  for (const excludedPath of [
    "/plan-your-home",
    "/privacy",
    "/terms",
    "/thank-you",
    "/admin",
    "/api/",
  ]) {
    assert(
      !xmlPaths.some((path) => path.startsWith(excludedPath)) &&
        !markdownPaths.some((path) => path.startsWith(excludedPath)),
      `Public discovery must exclude ${excludedPath}.`,
    );
  }
  assert(
    robots.includes(`Sitemap: ${baseUrl}/sitemap.xml`) &&
      robots.includes(`Sitemap: ${baseUrl}/sitemap.md`) &&
      robots.includes("Disallow: /admin") &&
      robots.includes("Disallow: /thank-you"),
    "robots.txt must advertise both sitemap formats and preserve crawler restrictions.",
  );
}

async function verifyInternalAgentIndex() {
  log("Checking the internal task-based agent index...");

  const [rootInstructions, internalIndex, sharedContext] = await Promise.all([
    readFile(path.join(process.cwd(), "AGENTS.md"), "utf8"),
    readFile(path.join(process.cwd(), "docs", "agents", "index.md"), "utf8"),
    readFile(
      path.join(process.cwd(), "docs", "agent-guidance", "CONTEXT.md"),
      "utf8",
    ),
  ]);

  assert(
    rootInstructions.includes("Load: `./docs/agents/index.md`"),
    "Root repository instructions must require the internal agent index.",
  );
  for (const taskArea of [
    "Brand and public content",
    "Routes, metadata, and discovery",
    "Shared layouts and visuals",
    "Project inquiries and Plan Your Home",
    "HHQ, projects, Firebase, and private data",
    "Testing, screenshots, deployment, and completion",
  ]) {
    assert(
      internalIndex.includes(`## ${taskArea}`),
      `The internal agent index must route ${taskArea} work.`,
    );
  }
  for (const requiredDetail of [
    "Authoritative sources",
    "Source ownership",
    "Safeguards",
    "Verification",
    "docs/style-guide.md",
    "app/sitemap.ts",
    "components/layout/site-footer.tsx",
    "docs/plan-your-home-product-spec.md",
    "docs/architecture.md",
    "npm run qa:smoke",
  ]) {
    assert(
      internalIndex.includes(requiredDetail),
      `The internal agent index must include ${requiredDetail}.`,
    );
  }
  for (const sharedFact of [
    "Howeth and Harp",
    "Architectural Design",
    "Building",
    "Land Development",
    "Public route families",
    "read-only",
  ]) {
    assert(
      sharedContext.includes(sharedFact),
      `The shared Agent Guidance context must include ${sharedFact}.`,
    );
  }
}

async function verifyMarkdownTwins(baseUrl) {
  log("Checking public Markdown twins and content negotiation...");

  const publicPages = [
    ["/", "/index.md"],
    ["/pricing", "/pricing.md"],
    ["/pricing/builder-grade", "/pricing/builder-grade.md"],
    ["/pricing/builder-plus", "/pricing/builder-plus.md"],
    ["/pricing/custom", "/pricing/custom.md"],
    ["/catalog", "/catalog.md"],
    ["/catalog/single-family", "/catalog/single-family.md"],
    ["/catalog/multifamily", "/catalog/multifamily.md"],
    ["/catalog/townhomes", "/catalog/townhomes.md"],
    ["/catalog/commercial", "/catalog/commercial.md"],
    ["/projects", "/projects.md"],
    ["/projects/published-project-smoke", "/projects/published-project-smoke.md"],
    ["/faq", "/faq.md"],
    ["/start", "/start.md"],
  ];

  for (const [htmlPath, markdownPath] of publicPages) {
    const [directResponse, negotiatedResponse] = await Promise.all([
      fetch(`${baseUrl}${markdownPath}`),
      fetch(`${baseUrl}${htmlPath}`, {
        headers: { Accept: "text/markdown" },
      }),
    ]);
    const [directBody, negotiatedBody] = await Promise.all([
      directResponse.text(),
      negotiatedResponse.text(),
    ]);

    for (const response of [directResponse, negotiatedResponse]) {
      assert(
        response.ok,
        `Expected the Markdown representation for ${htmlPath} to return 200, received ${response.status}.`,
      );
      assert(
        response.headers.get("content-type")?.startsWith("text/markdown"),
        `The Markdown representation for ${htmlPath} must use text/markdown.`,
      );
      assert(
        response.headers.get("vary")?.split(/\s*,\s*/).includes("Accept"),
        `The Markdown representation for ${htmlPath} must vary on Accept.`,
      );
      assert(
        response.headers.get("access-control-allow-origin") === "*" &&
          response.headers.get("cache-control") ===
            "public, s-maxage=3600, stale-while-revalidate=86400",
        `The Markdown representation for ${htmlPath} must use the public agent resource policy.`,
      );
      assert(
        response.headers.get("link") ===
          `<${baseUrl}${htmlPath}>; rel="canonical"`,
        `The Markdown representation for ${htmlPath} must identify its canonical HTML response.`,
      );
    }

    assert(
      directBody === negotiatedBody,
      `Direct and negotiated Markdown for ${htmlPath} must be semantically identical.`,
    );
    assert(
      directBody.startsWith("# ") &&
        directBody.includes("Canonical HTML") &&
        directBody.length > 200,
      `The Markdown twin for ${htmlPath} must preserve useful page meaning and links.`,
    );
  }

  for (const privateMarkdownPath of [
    "/pricing/not-a-finish.md",
    "/catalog/not-a-type.md",
    "/projects/draft-project-smoke.md",
    "/projects/legacy-project-smoke.md",
    "/plan-your-home.md",
    "/plan-your-home/resume.md",
    "/plan-your-home/review.md",
    "/privacy.md",
    "/terms.md",
    "/thank-you.md",
    "/admin.md",
  ]) {
    const response = await fetch(`${baseUrl}${privateMarkdownPath}`);
    assert(
      response.status === 404,
      `Expected excluded Markdown route ${privateMarkdownPath} to return 404, received ${response.status}.`,
    );
  }

  const privateNegotiationResponse = await fetch(`${baseUrl}/plan-your-home`, {
    headers: { Accept: "text/markdown" },
  });
  assert(
    privateNegotiationResponse.headers.get("content-type")?.startsWith("text/html") &&
      privateNegotiationResponse.headers.get("access-control-allow-origin") === null,
    "Private HTML routes must not gain public agent representations or headers.",
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
    'footer a[href="/sitemap.md"]',
    'footer a[href="/llms.txt"]',
    'footer a[href="/services.md"]',
  ];

  for (const selector of selectors) {
    assert(
      (await page.locator(selector).count()) > 0,
      `Expected to find ${selector} on the home page.`,
    );
  }

  const agentResources = page.getByRole("navigation", {
    name: "Agent resources",
  });
  assert(
    (await agentResources.count()) === 1,
    "The public footer must expose one Agent resources navigation.",
  );
  for (const name of ["Markdown Sitemap", "Agent Guide", "Services Guide"]) {
    const agentLink = page.getByRole("link", { name, exact: true });
    const target = await agentLink.boundingBox();
    assert(
      target && target.width >= 44 && target.height >= 44,
      `The ${name} footer link must preserve the 44 by 44 pixel touch target.`,
    );
  }

  await page.addScriptTag({ path: axePath });
  const footerViolations = await page.evaluate(async () => {
    const audit = await window.axe.run(document.querySelector("footer"), {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"] },
    });
    return audit.violations
      .filter((violation) => ["serious", "critical"].includes(violation.impact))
      .map((violation) => violation.id);
  });
  assert(
    footerViolations.length === 0,
    `The home footer has serious or critical axe findings: ${footerViolations.join(", ")}.`,
  );

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
      (await page.locator('main a[href="/start"]').count()) > 0,
    "The home page must keep Plan Your Home unlinked and expose the project start path.",
  );
}

async function verifyProjectEntryAndPrivacy(page, baseUrl) {
  log("Checking project entry, pre-collection disclosures, and Plan Home analytics...");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    `${baseUrl}/start?buildType=townhomes&utm_source=smoke&email=private%40example.com`,
    { waitUntil: "networkidle" },
  );
  const planHomeLink = page.getByRole("link", {
    name: "Start Plan Your Home",
    exact: true,
  });
  const planHomeTarget = await planHomeLink.boundingBox();
  assert(
    planHomeTarget &&
      planHomeTarget.width >= 44 &&
      planHomeTarget.height >= 44 &&
      planHomeTarget.y + planHomeTarget.height <= 844,
    "The Plan Your Home action must be a 44-pixel target in the first phone viewport.",
  );
  assert(
    (await planHomeLink.getAttribute("href")) === "/plan-your-home",
    "The primary project-start action must open Plan Your Home directly.",
  );
  assert(
    (await page.getByRole("link", { name: "Resume a saved plan" }).count()) === 0,
    "The project-start page must not add a secondary Plan Your Home resume action.",
  );
  assert(
    (await page.getByRole("form", { name: "General project inquiry" }).count()) === 1 &&
      (await page.locator('select[name="projectType"]').inputValue()) ===
        "multifamily-townhomes",
    "The subordinate general inquiry must be embedded and use safe project-type prefill.",
  );

  await page.goto(
    `${baseUrl}/inquire?buildType=townhomes&utm_source=smoke&email=private%40example.com&name=Private`,
    { waitUntil: "networkidle" },
  );
  const legacyUrl = new URL(page.url());
  assert(
    legacyUrl.pathname === "/start" &&
      legacyUrl.hash === "#general-inquiry" &&
      legacyUrl.searchParams.get("buildType") === "townhomes" &&
      legacyUrl.searchParams.get("utm_source") === "smoke" &&
      !legacyUrl.searchParams.has("email") &&
      !legacyUrl.searchParams.has("name"),
    "Legacy inquiry links must redirect to the embedded form with safe attribution only.",
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

  await page.goto(`${baseUrl}/start#general-inquiry`, { waitUntil: "networkidle" });
  const genericPrivacyLink = page.getByRole("link", {
    name: "privacy policy",
  });
  const genericSubmitButton = page.getByRole("button", { name: "Send Inquiry" });
  assert(
    await page.evaluate(
      ([privacy, submit]) =>
        Boolean(
          privacy.closest("div")?.contains(submit) &&
            privacy.compareDocumentPosition(submit) &
              Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      [
        await genericPrivacyLink.elementHandle(),
        await genericSubmitButton.elementHandle(),
      ],
    ),
    "The general inquiry privacy link must remain beside and before its send action.",
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
    `${baseUrl}/inquire?finish=builder-plus&buildType=townhomes&utm_source=smoke&utm_medium=email&utm_campaign=phase7&phone=private`,
    { waitUntil: "networkidle" },
  );

  const redirectedUrl = new URL(page.url());
  assert(
    redirectedUrl.pathname === "/start" &&
      redirectedUrl.hash === "#general-inquiry" &&
      !redirectedUrl.searchParams.has("finish") &&
      !redirectedUrl.searchParams.has("phone"),
    "The legacy redirect must discard finish and contact parameters.",
  );
  assert(
    (await page.locator('select[name="projectType"]').inputValue()) ===
      "multifamily-townhomes" &&
      (await page.locator('input[name="utmSource"]').inputValue()) === "smoke" &&
      (await page.locator('input[name="utmMedium"]').inputValue()) === "email" &&
      (await page.locator('input[name="utmCampaign"]').inputValue()) === "phase7",
    "The embedded form must retain allowlisted project type and UTM attribution.",
  );
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

      if (["/start", "/plan-your-home", "/privacy"].includes(route)) {
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
    projectLocation: "Austin, Texas",
    projectDescription:
      "This smoke test verifies the short general inquiry, Firebase emulator persistence, and success redirect without touching production data.",
    ...overrides,
  };

  await page.locator('input[name="name"]').fill(submission.name);
  await page.locator('input[name="phone"]').fill(submission.phone);
  await page.locator('input[name="email"]').fill(submission.email);
  await page.locator('select[name="projectType"]').selectOption(submission.projectType);
  await page
    .locator('input[name="projectLocation"]')
    .fill(submission.projectLocation);
  await page
    .locator('textarea[name="projectDescription"]')
    .fill(submission.projectDescription);
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
    await page.goto(`${baseUrl}/start#general-inquiry`, { waitUntil: "networkidle" });
    const invalidSubmission = await fillInquiryForm(page, {
      name: "Validation Retention Smoke Test",
      phone: "",
      email: "",
    });
    await page.getByRole("button", { name: "Send Inquiry" }).click();
    await page
      .getByText("Share an email address or phone number.", { exact: true })
      .waitFor();
    assert(
      (await page.locator('input[name="name"]').inputValue()) ===
        invalidSubmission.name &&
        (await page.locator('select[name="projectType"]').inputValue()) ===
          invalidSubmission.projectType &&
        (await page.locator('textarea[name="projectDescription"]').inputValue()) ===
          invalidSubmission.projectDescription,
      "Validation feedback must retain the visitor's entered project inquiry.",
    );

    await page.goto(`${baseUrl}/start#general-inquiry`, { waitUntil: "networkidle" });
    const failedSubmission = await fillInquiryForm(page, {
      name: "Forced Failure Smoke Test",
      email: "forced-failure@example.com",
    });
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor();
    await submitButton.click();
    await page
      .getByText(
        "The project inquiry could not be sent right now. Please try again in a moment or email h and h directly.",
      )
      .waitFor();
    assert(
      new URL(page.url()).pathname === "/start",
      "A failed Firestore write must keep the visitor on the inquiry form.",
    );
    assert(
      (await page.locator('input[name="name"]').inputValue()) ===
        failedSubmission.name &&
        (await page.locator('input[name="email"]').inputValue()) ===
          failedSubmission.email &&
        (await page.locator('textarea[name="projectDescription"]').inputValue()) ===
          failedSubmission.projectDescription,
      "A failed Firestore write must retain the visitor's entered project inquiry.",
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
      `${baseUrl}/start?buildType=single-family&utm_source=smoke&utm_medium=qa&utm_campaign=phase7#general-inquiry`,
      { waitUntil: "networkidle" },
    );

    const submission = await fillInquiryForm(page, {
      name: "Successful Smoke Test",
      email: "success@example.com",
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
      fields.schemaVersion === 1 && fields.experience === "general-inquiry",
      "Submitted general inquiry did not retain its versioned experience shape.",
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

async function verifySecurityHeaders(baseUrl) {
  log("Checking public and HHQ response security headers...");

  for (const { path: routePath, admin } of [
    { path: "/", admin: false },
    { path: "/admin/login", admin: true },
    { path: "/admin/inquiries", admin: true },
  ]) {
    const response = await fetch(`${baseUrl}${routePath}`, {
      redirect: "manual",
    });
    const contentSecurityPolicy =
      response.headers.get("content-security-policy") ?? "";

    assert(
      contentSecurityPolicy.includes("frame-ancestors 'none'") &&
        contentSecurityPolicy.includes("object-src 'none'") &&
        contentSecurityPolicy.includes("https://identitytoolkit.googleapis.com"),
      `Expected ${routePath} to receive the compatible content security policy.`,
    );
    assert(
      response.headers.get("x-frame-options") === "DENY" &&
        response.headers.get("x-content-type-options") === "nosniff" &&
        response.headers.get("referrer-policy") ===
          "strict-origin-when-cross-origin" &&
        response.headers.get("permissions-policy")?.includes("camera=()") &&
        response.headers.get("strict-transport-security")?.includes(
          "max-age=63072000",
        ),
      `Expected ${routePath} to receive framing, MIME, referrer, capability, and transport protections.`,
    );
    assert(
      response.headers.get("x-powered-by") === null,
      `Expected ${routePath} not to disclose the framework header.`,
    );

    if (admin) {
      assert(
        response.headers.get("cache-control") ===
            "private, no-store, max-age=0" &&
          response.headers.get("x-robots-tag") ===
            "noindex, nofollow, noarchive",
        `Expected ${routePath} to remain private and non-indexable.`,
      );
    }
  }
}

async function verifyNonAdminDenied(browser, baseUrl) {
  log("Checking rendered non-admin denial with generic login feedback...");
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/admin/login?next=/admin/inquiries`, {
      waitUntil: "networkidle",
    });
    await page.getByLabel("Email").fill(smokeNonAdmin.email);
    await page.getByLabel("Password").fill(smokeNonAdmin.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByText(adminLoginFailureMessage, { exact: true }).waitFor();
    assert(
      new URL(page.url()).pathname === "/admin/login",
      "A valid Firebase user without the HHQ claim must remain on login.",
    );
    assert(
      (await context.cookies(`${baseUrl}/admin/inquiries`)).every(
        (cookie) => cookie.name !== adminSessionCookieName,
      ),
      "A valid non-admin Firebase user must not receive an HHQ session.",
    );
    assert(
      !(await page.locator("body").textContent())?.includes(
        "Private legacy description for queue smoke proof.",
      ),
      "Non-admin denial must not render protected inquiry content.",
    );
  } finally {
    await context.close();
  }
}

async function verifyAdminAuthFailureState(browser, baseUrl) {
  log("Checking Firebase Admin authentication failure closes HHQ...");
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/admin/login?next=/admin/inquiries`, {
      waitUntil: "networkidle",
    });
    await page.getByLabel("Email").fill(smokeAdmin.email);
    await page.getByLabel("Password").fill(smokeAdmin.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByText(adminLoginFailureMessage, { exact: true }).waitFor();
    assert(
      new URL(page.url()).pathname === "/admin/login" &&
        (await context.cookies(`${baseUrl}/admin/inquiries`)).every(
          (cookie) => cookie.name !== adminSessionCookieName,
        ),
      "Firebase Admin authentication failure must not issue or enter an HHQ session.",
    );
  } finally {
    await context.close();
  }
}

async function verifyAdminAuth(browser, baseUrl, firestore, auth) {
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
    cookiePolicy: false,
    overflow: false,
    revocationDenied: false,
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
    const anonymousResponse = await fetch(`${baseUrl}/admin/inquiries`, {
      redirect: "manual",
    });
    const anonymousBody = await anonymousResponse.text();
    assert(
      [307, 308].includes(anonymousResponse.status) &&
        anonymousResponse.headers.get("location")?.includes(
          "/admin/login?next=%2Fadmin%2Finquiries",
        ) &&
        !anonymousBody.includes("Private legacy description for queue smoke proof."),
      "Anonymous HHQ requests must redirect without returning protected content.",
    );

    const anonymousFileResponse = await fetch(
      `${baseUrl}/admin/inquiries/file`,
      {
        body: new URLSearchParams({
          inquiryId: "queue-submitted-smoke",
          referenceId: "file-66666666-6666-4666-8666-666666666666",
        }),
        method: "POST",
        redirect: "manual",
      },
    );
    assert(
      [303, 307, 308].includes(anonymousFileResponse.status) &&
        anonymousFileResponse.headers.get("location")?.includes("/admin/login"),
      "Anonymous private-file requests must be denied at the server boundary.",
    );

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

    const adminCookies = await context.cookies();
    const sessionCookie = adminCookies.find(
      (cookie) => cookie.name === adminSessionCookieName,
    );
    const publicCookies = await context.cookies(`${baseUrl}/`);
    assert(sessionCookie, "Authorized HHQ login must issue a session cookie.");
    assert(
      sessionCookie.path === "/admin" &&
        sessionCookie.httpOnly &&
        sessionCookie.secure &&
        sessionCookie.sameSite === "Lax" &&
        Math.abs(
          sessionCookie.expires -
            (Date.now() / 1000 + adminSessionDurationSeconds),
        ) < 30 &&
        publicCookies.every((cookie) => cookie.name !== adminSessionCookieName) &&
        !(await page.evaluate(() => document.cookie)).includes(
          `${adminSessionCookieName}=`,
        ),
      "The HHQ cookie must be HttpOnly, production Secure, SameSite=Lax, five days, and scoped to /admin.",
    );
    evidence.cookiePolicy = true;

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
      (await page.getByText(/^Question \d+$/).count()) === 31 &&
        (await page.getByText("Not saved yet").count()) === 0 &&
        (await page.getByText("Saved answer could not be read.").count()) === 0,
      "Plan Your Home detail must render all 31 readable answer summaries in tour order.",
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
    await deleteDialog
      .getByText(
        "This permanently removes the inquiry, resume material (including resume links and pending uploads), and every private file saved for this inquiry. None of it can be recovered.",
        { exact: true },
      )
      .waitFor();
    await captureInquiryDetail(page, "desktop-delete-warning");
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

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Delete Inquiry" }).click();
    await page.getByRole("dialog", { name: "Delete this inquiry?" }).waitFor();
    await captureInquiryDetail(page, "phone-delete-warning");
    await page
      .getByRole("dialog", { name: "Delete this inquiry?" })
      .getByRole("button", { name: "Cancel" })
      .click();
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.getByRole("button", { name: "Delete Inquiry" }).click();
    await page
      .getByRole("dialog", { name: "Delete this inquiry?" })
      .getByRole("button", { name: "Delete Inquiry and Files" })
      .click();
    await page.waitForURL(`${baseUrl}/admin/inquiries?deleted=1`);
    await page
      .getByText(
        "Inquiry, resume material, and private files were permanently deleted.",
      )
      .waitFor();
    assert(
      !(await firestore
        .collection("inquirySubmissions")
        .doc("queue-submitted-smoke")
        .get()).exists,
      "Confirmed deletion must remove the inquiry record.",
    );
    assert(
      (await page.getByRole("button", { name: /undo|restore/i }).count()) === 0,
      "Permanent deletion must not offer undo or restore controls.",
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
    assert(
      (await context.cookies(`${baseUrl}/admin/inquiries`)).every(
        (cookie) => cookie.name !== adminSessionCookieName,
      ),
      "Sign out must explicitly expire the HHQ session cookie.",
    );

    await page.goto(`${baseUrl}/admin/inquiries`, { waitUntil: "networkidle" });
    assert(
      new URL(page.url()).pathname === "/admin/login",
      "Logged-out admin access must return to the login page.",
    );

    await page.getByLabel("Email").fill(smokeAdmin.email);
    await page.getByLabel("Password").fill(smokeAdmin.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(`${baseUrl}/admin/inquiries`);
    await new Promise((resolve) => setTimeout(resolve, 1_100));
    await auth.revokeRefreshTokens(smokeAdmin.uid);
    await page.goto(`${baseUrl}/admin/inquiries`, { waitUntil: "networkidle" });
    assert(
      new URL(page.url()).pathname === "/admin/login" &&
        (await context.cookies(`${baseUrl}/admin/inquiries`)).every(
          (cookie) => cookie.name !== adminSessionCookieName,
        ),
      "Revoking the shared account must invalidate and clear an existing HHQ session.",
    );
    evidence.revocationDenied = true;
    await writeFile(
      path.join(inquiryQueueOutputDirectory, "summary.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
    );
  } finally {
    await context.close();
  }
}

async function main() {
  const firebaseEmulators = getFirebaseEmulatorConfig();
  const appPort = await getAvailablePort();
  const failureAppPort = await getAvailablePort();
  const authFailureAppPort = await getAvailablePort();
  const unavailableFirestorePort = await getAvailablePort();
  const unavailableAuthPort = await getAvailablePort();
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
  let authFailureServer;
  let browser;
  let adminApp;

  try {
    adminApp = await seedAdminUsers(firebaseEmulators.projectId);
    const auth = getAuth(adminApp);
    const firestore = getFirestore(adminApp);
    await seedPublicationFixtures(firestore);
    await seedInquiryQueueFixtures(firestore);
    await verifyInternalAgentIndex();

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
    await verifySecurityHeaders(nextServer.baseUrl);
    await verifyProjectPublicationBoundary(nextServer.baseUrl);
    await verifyAgentDiscoveryDocuments(nextServer.baseUrl);
    await verifyMarkdownTwins(nextServer.baseUrl);

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
    await verifyNonAdminDenied(browser, nextServer.baseUrl);
    await verifyAdminAuth(browser, nextServer.baseUrl, firestore, auth);

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

    log("Starting a third app instance against an unavailable Auth port...");
    authFailureServer = await startNextServer({
      port: authFailureAppPort,
      env: {
        ...qaEnv,
        FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${unavailableAuthPort}`,
      },
    });
    await verifyAdminAuthFailureState(browser, authFailureServer.baseUrl);

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
      ["Auth-failure Next server", authFailureServer],
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

    if (authFailureServer) {
      await authFailureServer.close();
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
