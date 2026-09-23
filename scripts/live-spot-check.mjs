const configuredOrigin = process.env.LIVE_SITE_ORIGIN;

if (!configuredOrigin) {
  throw new Error("LIVE_SITE_ORIGIN is required");
}

const origin = new URL(configuredOrigin);
const isLocalHttp =
  origin.protocol === "http:" &&
  ["localhost", "127.0.0.1"].includes(origin.hostname);

if (
  (origin.protocol !== "https:" && !isLocalHttp) ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash ||
  origin.username ||
  origin.password
) {
  throw new Error("LIVE_SITE_ORIGIN must be an HTTPS origin (or local HTTP for testing)");
}

const checks = [
  { path: "/", content: "Design. Build. Develop." },
  { path: "/start", content: "Your new home." },
];

let failures = 0;

for (const { path, content } of checks) {
  const url = new URL(path, origin);

  try {
    const response = await fetch(url, {
      headers: { accept: "text/html" },
      signal: AbortSignal.timeout(15_000),
    });
    const html = await response.text();
    const visibleText = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    if (!response.headers.get("content-type")?.includes("text/html")) {
      throw new Error("response is not HTML");
    }
    if (!visibleText.includes("Howeth and Harp") || !visibleText.includes(content)) {
      throw new Error("recognizable page content is missing");
    }

    console.log(`PASS ${url} (${response.status}, expected content present)`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${url}: ${error.message}`);
  }
}

if (failures) {
  console.error(`Weekly live spot check failed: ${failures} of ${checks.length} routes`);
  process.exitCode = 1;
} else {
  console.log(`Weekly live spot check passed: ${checks.length} routes`);
}
