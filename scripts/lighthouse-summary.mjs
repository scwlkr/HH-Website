import { readFile, stat } from "node:fs/promises";

const expectedRoutes = ["/", "/pricing", "/projects", "/faq", "/start"];
const manifest = JSON.parse(
  await readFile("output/lighthouse/manifest.json", "utf8"),
);
const runs = new Map(expectedRoutes.map((route) => [route, []]));

for (const report of manifest) {
  const url = new URL(report.url);
  const route = url.pathname.replace(/\/$/, "") || "/";
  const routeRuns = runs.get(route);

  if (url.origin !== "http://127.0.0.1:3100" || !routeRuns) {
    throw new Error(`Unexpected Lighthouse report URL: ${report.url}`);
  }

  await stat(report.htmlPath);
  const details = JSON.parse(await readFile(report.jsonPath, "utf8"));
  const score = details.categories?.performance?.score;

  if (details.runtimeError || typeof score !== "number") {
    throw new Error(`Incomplete Lighthouse report for ${route}`);
  }

  routeRuns.push(Math.round(score * 100));
}

const lines = [
  "### Mobile Lighthouse baseline (advisory)",
  "",
  "Three runs per route against the local production build. Scores are diagnostic and do not gate merging.",
  "The build uses public fallback content without Firebase or production credentials.",
  "",
  "| Audited URL | Scores | Median |",
  "| --- | --- | ---: |",
];

for (const [route, scores] of runs) {
  if (scores.length !== 3) {
    throw new Error(`Expected three Lighthouse reports for ${route}; found ${scores.length}`);
  }

  scores.sort((left, right) => left - right);
  lines.push(`| \`http://127.0.0.1:3100${route}\` | ${scores.join(", ")} | ${scores[1]} |`);
}

lines.push("", "Download the seven-day workflow artifact for the full HTML and JSON reports.");
console.log(lines.join("\n"));
