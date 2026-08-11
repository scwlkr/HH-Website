import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";

import { cleanup, render } from "@testing-library/react";
import React from "react";

import { InquiryPrivacyNotice } from "../components/inquiry/inquiry-privacy-notice.tsx";
import { PlanYourHomeShell } from "../features/plan-your-home/plan-your-home-shell.tsx";
import { privacyDocument } from "../lib/content/legal.ts";

afterEach(() => cleanup());

function assertLinkPrecedesField(link: HTMLElement, field: HTMLElement) {
  assert(
    Boolean(link.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING),
    "The privacy link must precede the first personal-data field in DOM order.",
  );
}

test("Plan Your Home shows privacy and retention before collecting the welcome name", () => {
  const rendered = render(<PlanYourHomeShell />);
  const link = rendered.getByRole("link", {
    name: "privacy and retention policy",
  });
  const name = rendered.getByLabelText("Your name");

  assertLinkPrecedesField(link, name);
  assert.match(rendered.container.textContent ?? "", /browser for up to 30 days/i);
});

test("the generic inquiry shows privacy and non-contract copy before contact fields", () => {
  const rendered = render(<InquiryPrivacyNotice placement="start" />);
  const link = rendered.getByRole("link", {
    name: "privacy and retention policy",
  });
  assert.equal(link.getAttribute("href"), "/privacy");
  assert.match(rendered.container.textContent ?? "", /not a design, price/i);

  const source = readFileSync(
    new URL("../components/inquiry/inquiry-form.tsx", import.meta.url),
    "utf8",
  );
  assert(
    source.indexOf('<InquiryPrivacyNotice placement="start" />') <
      source.indexOf('name="name"'),
    "The rendered privacy notice must precede the first contact field.",
  );
});

test("the privacy draft covers every Plan Your Home disclosure without claiming counsel approval", () => {
  const copy = JSON.stringify(privacyDocument);
  for (const required of [
    "local snapshot",
    "private server draft",
    "private storage",
    "personally follow up",
    "resume email",
    "30 days",
    "180 days",
    "24 months",
    "request deletion",
    "not a design",
  ]) {
    assert.match(copy, new RegExp(required, "i"));
  }
  assert.match(copy, /pending h and h and counsel approval/i);
  assert.doesNotMatch(copy, /counsel approved|approved by counsel/i);
});
