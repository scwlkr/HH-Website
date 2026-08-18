import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  exteriorStyleCatalog,
  exteriorStyleImageSrc,
} from "../features/plan-your-home/exterior-style-catalog.ts";

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

test("every approved exterior style has one budgeted 3:2 WebP asset", () => {
  let totalBytes = 0;

  for (const { slug } of exteriorStyleCatalog) {
    const publicPath = exteriorStyleImageSrc(slug);
    const assetPath = fileURLToPath(
      new URL(`../public${publicPath}`, import.meta.url),
    );
    const asset = readFileSync(assetPath);
    const frameMarker = asset.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));

    assert.notEqual(frameMarker, -1, `${slug} is an encoded lossy WebP`);
    assert.equal(asset.readUInt16LE(frameMarker + 3) & 0x3fff, 768);
    assert.equal(asset.readUInt16LE(frameMarker + 5) & 0x3fff, 512);
    assert.ok(statSync(assetPath).size <= 50 * 1024, `${slug} stays under 50 KB`);
    totalBytes += statSync(assetPath).size;
  }

  assert.ok(totalBytes <= 700 * 1024, "the complete catalog stays under 700 KB");
});
