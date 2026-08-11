import assert from "node:assert/strict";
import test from "node:test";

import {
  hasMatchingPlanHomeFileSignature,
  normalizePlanHomeReferenceLink,
  planHomeUploadRequestSchema,
} from "../features/plan-your-home/reference-upload-contract.ts";
import { PLAN_HOME_REFERENCE_LIMITS } from "../features/plan-your-home/references.ts";

test("upload preflight requires matching approved extension, MIME, and size", () => {
  const valid = planHomeUploadRequestSchema.parse({
    draftId: `draft-${"a".repeat(40)}`,
    expectedRevision: 8,
    originalName: "kitchen-study.PDF",
    mimeType: "application/pdf",
    sizeBytes: 2048,
  });
  assert.equal(valid.extension, "pdf");

  assert.equal(
    planHomeUploadRequestSchema.safeParse({
      ...valid,
      originalName: "kitchen-study.png",
      mimeType: "image/jpeg",
    }).success,
    false,
  );
  assert.equal(
    planHomeUploadRequestSchema.safeParse({
      ...valid,
      originalName: "kitchen-study.svg",
      mimeType: "image/svg+xml",
    }).success,
    false,
  );
  assert.equal(
    planHomeUploadRequestSchema.safeParse({
      ...valid,
      sizeBytes: PLAN_HOME_REFERENCE_LIMITS.bytesPerFile + 1,
    }).success,
    false,
  );
});

test("reference links normalize http and https without fetching unsafe schemes", () => {
  assert.deepEqual(normalizePlanHomeReferenceLink(" HTTPS://Example.com/home "), {
    url: "https://example.com/home",
    hostname: "example.com",
  });
  assert.throws(
    () => normalizePlanHomeReferenceLink("javascript:alert(1)"),
    /http or https/,
  );
  assert.throws(() => normalizePlanHomeReferenceLink("not a link"), /complete/);
});

test("finalize signature inspection recognizes every approved file family", () => {
  const bytes = (value: string) => new TextEncoder().encode(value);
  assert.equal(hasMatchingPlanHomeFileSignature("pdf", bytes("%PDF-1.7")), true);
  assert.equal(
    hasMatchingPlanHomeFileSignature("jpg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
    true,
  );
  assert.equal(
    hasMatchingPlanHomeFileSignature(
      "png",
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    true,
  );
  assert.equal(
    hasMatchingPlanHomeFileSignature("webp", bytes("RIFF0000WEBP")),
    true,
  );
  assert.equal(
    hasMatchingPlanHomeFileSignature("heic", bytes("0000ftypheic")),
    true,
  );
  assert.equal(hasMatchingPlanHomeFileSignature("pdf", bytes("<svg>")), false);
});
