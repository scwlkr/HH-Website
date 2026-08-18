import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { exteriorStyleCatalog } from "../features/plan-your-home/exterior-style-catalog.ts";
import { ExteriorStyleSketch } from "../features/plan-your-home/exterior-style-sketches.tsx";

const approvedLabels = [
  "Acadian",
  "Barndominium",
  "Cape Cod",
  "Colonial Revival",
  "Contemporary",
  "Craftsman",
  "French Country",
  "Greek Revival",
  "Mediterranean",
  "Mid-century modern",
  "Modern",
  "Modern farmhouse",
  "Prairie",
  "Queen Anne",
  "Ranch",
  "Spanish Colonial",
  "Texas Hill Country",
  "Tudor Revival",
];

test("exterior elevation catalog keeps the exact approved alphabetical styles and cues", () => {
  assert.deepEqual(
    exteriorStyleCatalog.map(({ label }) => label),
    approvedLabels,
  );
  assert.equal(new Set(exteriorStyleCatalog.map(({ slug }) => slug)).size, 18);
  assert.equal(
    exteriorStyleCatalog.some(({ label }) =>
      ["Traditional", "Transitional"].includes(label),
    ),
    false,
  );

  for (const style of exteriorStyleCatalog) {
    for (const cue of [
      style.form,
      style.roof,
      style.openings,
      style.porch,
      style.materials,
      style.details,
    ]) {
      assert.ok(cue.trim().length > 0, `${style.label} has every approved cue`);
    }
  }
});

test("every approved exterior style renders one distinct decorative React SVG", () => {
  const sketches = exteriorStyleCatalog.map(({ slug }) =>
    renderToStaticMarkup(<ExteriorStyleSketch slug={slug} />),
  );

  assert.equal(new Set(sketches).size, exteriorStyleCatalog.length);
  for (const sketch of sketches) {
    assert.match(sketch, /<svg/);
    assert.match(sketch, /aria-hidden="true"/);
    assert.match(sketch, /data-exterior-style-sketch="true"/);
    assert.doesNotMatch(sketch, />\?</);
  }
});
