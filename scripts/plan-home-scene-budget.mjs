import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const chunkDirectory = path.join(process.cwd(), ".next", "static", "chunks");
const perSceneBudgetBytes = 24 * 1024;
const currentAndNextBudgetBytes = 48 * 1024;

const sceneGroups = [
  { id: "project-and-living", module: "first-zone-scenes" },
  { id: "kitchen-and-dining", module: "kitchen-dining-scene" },
  { id: "primary-suite", module: "primary-suite-scene" },
  {
    id: "bedrooms-and-shared-bathrooms",
    module: "bedrooms-shared-bathrooms-scene",
  },
  { id: "utility-and-systems", module: "utility-systems-scene" },
  { id: "exterior-and-site", module: "exterior-site-scene" },
  { id: "design-desk-and-review", module: "design-desk-scene" },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function formatKib(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

const chunkNames = await readdir(chunkDirectory).catch(() => {
  throw new Error("Build output is missing. Run `npm run build` first.");
});
const chunkFiles = await Promise.all(
  chunkNames
    .filter((name) => name.endsWith(".js") || name.endsWith(".css"))
    .map(async (name) => ({
      name,
      bytes: await readFile(path.join(chunkDirectory, name)),
    })),
);

const measurements = sceneGroups.map((group) => {
  const moduleMarker = `${group.module}-module__`;
  const javascript = chunkFiles.filter(
    ({ name, bytes }) => name.endsWith(".js") && bytes.includes(moduleMarker),
  );
  assert(
    javascript.length === 1,
    `${group.id} must have exactly one lazy JavaScript scene chunk; found ${javascript.length}.`,
  );

  const markerMatch = javascript[0].bytes
    .toString()
    .match(new RegExp(`${group.module}-module__[A-Za-z0-9_-]+__`));
  assert(markerMatch, `${group.id} is missing its built CSS module marker.`);
  const css = chunkFiles.filter(
    ({ name, bytes }) => name.endsWith(".css") && bytes.includes(markerMatch[0]),
  );
  assert(
    css.length === 1,
    `${group.id} must have exactly one scene CSS chunk; found ${css.length}.`,
  );

  const javascriptGzipBytes = gzipSync(javascript[0].bytes).byteLength;
  const cssGzipBytes = gzipSync(css[0].bytes).byteLength;
  const gzipBytes = javascriptGzipBytes + cssGzipBytes;
  assert(
    gzipBytes <= perSceneBudgetBytes,
    `${group.id} contributes ${formatKib(gzipBytes)} compressed, above the ${formatKib(perSceneBudgetBytes)} scene budget.`,
  );

  return {
    id: group.id,
    javascript: javascript[0].name,
    css: css[0].name,
    javascriptGzipBytes,
    cssGzipBytes,
    gzipBytes,
  };
});

const adjacentMeasurements = measurements.slice(0, -1).map((current, index) => {
  const next = measurements[index + 1];
  const gzipBytes = current.gzipBytes + next.gzipBytes;
  assert(
    gzipBytes <= currentAndNextBudgetBytes,
    `${current.id} plus ${next.id} contributes ${formatKib(gzipBytes)} compressed, above the ${formatKib(currentAndNextBudgetBytes)} current-plus-next budget.`,
  );
  return { current: current.id, next: next.id, gzipBytes };
});

process.stdout.write(
  `${JSON.stringify(
    {
      target: {
        perSceneGzipBytes: perSceneBudgetBytes,
        currentAndNextGzipBytes: currentAndNextBudgetBytes,
      },
      measurements,
      adjacentMeasurements,
      exceptions: [],
    },
    null,
    2,
  )}\n`,
);
