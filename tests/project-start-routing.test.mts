import assert from "node:assert/strict";
import test from "node:test";

import { getBuildTypeInquiryHref } from "../lib/content/build-types.ts";
import { getFinishLevelInquiryHref } from "../lib/content/finish-levels.ts";
import { getLegacyInquiryRedirectHref } from "../lib/project-start.ts";

test("public project paths guide single-family visitors to the hero and other work to the short inquiry", () => {
  assert.equal(
    getBuildTypeInquiryHref("single-family"),
    "/start?buildType=single-family",
  );
  assert.equal(
    getBuildTypeInquiryHref("multifamily"),
    "/start?buildType=multifamily#general-inquiry",
  );
  assert.equal(
    getBuildTypeInquiryHref("townhomes"),
    "/start?buildType=townhomes#general-inquiry",
  );
  assert.equal(
    getBuildTypeInquiryHref("commercial"),
    "/start?buildType=commercial#general-inquiry",
  );
});

test("legacy inquiry links redirect to the embedded form with safe attribution", () => {
  assert.equal(
    getFinishLevelInquiryHref("builder-plus"),
    "/start?finish=builder-plus",
  );
  assert.equal(
    getLegacyInquiryRedirectHref({
      buildType: "townhomes",
      utm_source: "catalog",
      utm_medium: "website",
      email: "must-not-forward@example.com",
      name: "Must Not Forward",
    }),
    "/start?buildType=townhomes&utm_source=catalog&utm_medium=website#general-inquiry",
  );
});
