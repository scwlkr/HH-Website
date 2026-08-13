import assert from "node:assert/strict";
import test from "node:test";

import { getBuildTypeInquiryHref } from "../lib/content/build-types.ts";
import { getFinishLevelInquiryHref } from "../lib/content/finish-levels.ts";
import { getGenericInquiryHrefFromProjectStart } from "../lib/project-start.ts";

test("the public project paths keep every build type in the generic brief", () => {
  assert.equal(
    getBuildTypeInquiryHref("single-family"),
    "/inquire?buildType=single-family",
  );
  assert.equal(
    getBuildTypeInquiryHref("multifamily"),
    "/inquire?buildType=multifamily",
  );
  assert.equal(
    getBuildTypeInquiryHref("townhomes"),
    "/inquire?buildType=townhomes",
  );
  assert.equal(
    getBuildTypeInquiryHref("commercial"),
    "/inquire?buildType=commercial",
  );
});

test("finish CTAs keep the project choice and forward only non-contact attribution", () => {
  assert.equal(
    getFinishLevelInquiryHref("builder-plus"),
    "/start?finish=builder-plus",
  );
  assert.equal(
    getGenericInquiryHrefFromProjectStart({
      finish: "builder-plus",
      buildType: "townhomes",
      utm_source: "catalog",
      email: "must-not-forward@example.com",
      name: "Must Not Forward",
    }),
    "/inquire?buildType=townhomes&finish=builder-plus&utm_source=catalog",
  );
});
