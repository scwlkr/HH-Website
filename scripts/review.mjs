import path from "node:path";
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const defaultRoutes = ["/", "/pricing", "/projects", "/faq", "/inquire"];
const baseUrl = new URL(
  process.env.REVIEW_URL?.trim() || "http://127.0.0.1:3000",
).origin;
const outputDirectory = path.join(process.cwd(), "output", "playwright", "latest");
const viewportOptions = {
  desktop: { viewport: { width: 1440, height: 1000 } },
  mobile: {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  },
};

function parseInput() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(
      "Usage: npm run review -- [/route ...]\n" +
        "Env: REVIEW_URL=http://127.0.0.1:3000 REVIEW_VIEWPORTS=desktop,mobile\n",
    );
    process.exit(0);
  }

  const routes = args.length > 0 ? [...new Set(args)] : defaultRoutes;
  const viewports = [
    ...new Set(
      (process.env.REVIEW_VIEWPORTS || "desktop,mobile")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ];

  if (routes.some((route) => !route.startsWith("/") || route.startsWith("//"))) {
    throw new Error("Review routes must start with one forward slash.");
  }
  if (viewports.length === 0 || viewports.some((name) => !viewportOptions[name])) {
    throw new Error("REVIEW_VIEWPORTS must be desktop, mobile, or both.");
  }

  return { routes, viewports };
}

function fileNameFor(route, viewport) {
  const url = new URL(route, "http://review.local");
  const pathName = url.pathname === "/" ? "home" : url.pathname.slice(1);
  const slug = `${pathName}${url.search}`
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+$/g, "")
    .slice(0, 100);

  return `${slug}--${viewport}.png`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function isReady() {
  try {
    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok && (await response.text()).includes("Howeth and Harp");
  } catch {
    return false;
  }
}

function stopServer(server) {
  if (!server || server.exitCode !== null) return;

  try {
    process.kill(-server.pid, "SIGTERM");
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

async function startServerIfNeeded() {
  if (await isReady()) return null;
  if (process.env.REVIEW_URL) {
    throw new Error(`REVIEW_URL is not a running Howeth and Harp site: ${baseUrl}`);
  }

  const server = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"],
    {
      cwd: process.cwd(),
      detached: true,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let logs = "";

  server.stdout.on("data", (chunk) => (logs += chunk.toString()));
  server.stderr.on("data", (chunk) => (logs += chunk.toString()));

  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null || (await isReady())) break;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  if (!(await isReady())) {
    stopServer(server);
    const tail = logs.trim().split("\n").slice(-20).join("\n");
    throw new Error(`Local review server failed to start.${tail ? `\n${tail}` : ""}`);
  }

  return server;
}

async function capture(browser, route, viewport) {
  const context = await browser.newContext({
    ...viewportOptions[viewport],
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  let response;

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  try {
    try {
      response = await page.goto(new URL(route, baseUrl).href, {
        timeout: 45_000,
        waitUntil: "networkidle",
      });
      await page.evaluate(async () => document.fonts?.ready);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    const status = response?.status() ?? 0;
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    const file = fileNameFor(route, viewport);

    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: path.join(outputDirectory, file),
    });

    return {
      errors: [...new Set(errors)],
      file,
      overflow,
      passed: status >= 200 && status < 400 && !overflow && errors.length === 0,
      route,
      status,
      viewport,
    };
  } finally {
    await context.close();
  }
}

async function writeBoard(browser, results) {
  const sections = [...new Set(results.map(({ route }) => route))]
    .map((route) => {
      const shots = results
        .filter((result) => result.route === route)
        .map(
          (result) => `
          <article class="${result.passed ? "" : "fail"}">
            <h2>${escapeHtml(result.viewport)} <span>${result.status}</span></h2>
            <img src="${escapeHtml(result.file)}" alt="${escapeHtml(
              `${route} at ${result.viewport}`,
            )}">
          </article>`,
        )
        .join("");
      return `<section><h1>${escapeHtml(route)}</h1><div class="shots">${shots}</div></section>`;
    })
    .join("");
  const passed = results.every(({ passed: resultPassed }) => resultPassed);
  const columns =
    results.filter(({ route }) => route === results[0].route).length > 1
      ? "minmax(0, 2.5fr) minmax(320px, 1fr)"
      : "minmax(0, 1fr)";
  const html = `<!doctype html><html lang="en"><meta charset="utf-8">
  <title>Local review board</title><style>
  *{box-sizing:border-box}body{margin:0;padding:28px;background:#e8e6df;color:#151815;font:16px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace}
  header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:28px;border-bottom:2px solid #151815}header h1{margin:0 0 12px;font-size:28px;text-transform:uppercase}header p{margin:0;font-weight:700;color:${passed ? "#166534" : "#991b1b"}}
  section{margin:0 0 30px;break-inside:avoid}section>h1{margin:0 0 10px;font-size:19px}.shots{display:grid;grid-template-columns:${columns};gap:18px}
  article{overflow:hidden;background:white;border:2px solid #151815}article.fail{border-color:#991b1b}article h2{display:flex;justify-content:space-between;margin:0;padding:8px 10px;border-bottom:1px solid #151815;font-size:13px;text-transform:uppercase}
  article img{display:block;width:100%;height:720px;object-fit:cover;object-position:top;background:#f7f6f2}
  </style><body><header><h1>Howeth and Harp local review</h1><p>${passed ? "PASS" : "FAIL"} · ${results.length} captures</p></header>${sections}</body></html>`;
  const htmlPath = path.join(outputDirectory, "review-board.html");
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  await writeFile(htmlPath, html);
  try {
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(() =>
      Promise.all([...document.images].map((image) => image.decode())),
    );
    await page.screenshot({
      fullPage: true,
      path: path.join(outputDirectory, "review-board.png"),
    });
  } finally {
    await page.close();
  }
}

async function main() {
  const { routes, viewports } = parseInput();
  let server;
  let browser;

  await rm(outputDirectory, { force: true, recursive: true });
  await mkdir(outputDirectory, { recursive: true });

  try {
    server = await startServerIfNeeded();
    browser = await chromium.launch();
    const results = [];

    for (const route of routes) {
      for (const viewport of viewports) {
        results.push(await capture(browser, route, viewport));
      }
    }

    await writeBoard(browser, results);
    const passed = results.every((result) => result.passed);
    await writeFile(
      path.join(outputDirectory, "summary.json"),
      `${JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), passed, results }, null, 2)}\n`,
    );

    process.stdout.write(
      `${passed ? "PASS" : "FAIL"} ${results.filter((result) => result.passed).length}/${results.length} · output/playwright/latest/review-board.png\n`,
    );
    for (const result of results.filter((item) => !item.passed)) {
      const reasons = [
        result.status ? `HTTP ${result.status}` : "no response",
        result.overflow ? "horizontal overflow" : null,
        ...result.errors,
      ].filter(Boolean);
      process.stderr.write(`${result.route} ${result.viewport}: ${reasons.join("; ")}\n`);
    }
    if (!passed) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    stopServer(server);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  const installHint = message.includes("Executable doesn't exist")
    ? '\nRun "npx playwright install chromium" and try again.'
    : "";
  console.error(`${message}${installHint}`);
  process.exitCode = 1;
});
