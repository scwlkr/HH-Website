import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render } from "@testing-library/react";
import React from "react";

import { GeneralInquiryForm } from "../components/inquiry/general-inquiry-form.tsx";
import { createPlanHomeRefinementFixture } from "../features/plan-your-home/refinement-fixture.ts";
import { PlanYourHomeShell } from "../features/plan-your-home/plan-your-home-shell.tsx";
import { privacyDocument } from "../lib/content/legal.ts";
import { inquiryActionInitialState } from "../types/inquiry.ts";

afterEach(() => cleanup());

function assertPrecedes(first: HTMLElement, second: HTMLElement, message: string) {
  assert(
    Boolean(
      first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
    ),
    message,
  );
}

test("Plan Your Home keeps Welcome concise with quiet, accessible save options", () => {
  const rendered = render(<PlanYourHomeShell />);
  const link = rendered.getByRole("link", {
    name: /privacy and retention policy/i,
  });
  const name = rendered.getByLabelText("Your name");
  const start = rendered.getByRole("button", { name: "Open the front door" });
  const resume = rendered.getByRole("link", { name: "Resume a saved plan" });
  const footer = link.closest("[data-plan-home-welcome-footer]");

  assert.match(
    rendered.container.textContent ?? "",
    /Walk through and pick what your home needs\./,
  );
  assert.doesNotMatch(
    rendered.container.textContent ?? "",
    /fixed illustrated home|up to 30 days|keeps a private draft/i,
  );
  assert.equal(link.getAttribute("href"), "/privacy");
  assert.equal(resume.getAttribute("href"), "/plan-your-home/resume");
  assert.equal(footer?.contains(resume), true);
  assert.equal(name.getAttribute("aria-describedby"), "plan-home-welcome-privacy");
  assertPrecedes(
    name,
    start,
    "The name field must precede the primary Welcome action.",
  );
  assertPrecedes(
    start,
    link,
    "Privacy and resume links must remain secondary to the Welcome action.",
  );
});

test("the general inquiry keeps concise privacy copy beside the send action", () => {
  const rendered = render(
    <GeneralInquiryForm
      initialValues={{
        name: "",
        phone: "",
        email: "",
        projectType: "",
        projectLocation: "",
        projectDescription: "",
        sourcePage: "/start",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        company: "",
      }}
      submitAction={async () => inquiryActionInitialState}
    />,
  );
  const link = rendered.getByRole("link", {
    name: "privacy policy",
  });
  const submit = rendered.getByRole("button", { name: "Send Inquiry" });
  assert.equal(link.getAttribute("href"), "/privacy");
  assert.match(rendered.container.textContent ?? "", /not marketing consent or a contract/i);
  assert.equal(
    link.closest("div")?.contains(submit),
    true,
    "The privacy sentence and send action must share the form footer.",
  );
  assertPrecedes(
    link,
    submit,
    "The privacy link must precede the deliberate send action.",
  );
});

test("Plan Your Home links to the privacy policy without restating technical retention details", () => {
  const contact = render(
    <PlanYourHomeShell refinementFixture={createPlanHomeRefinementFixture("contact")} />,
  );
  const contactLink = contact.getByRole("link", { name: /privacy policy/i });
  assert.equal(contactLink.getAttribute("href"), "/privacy");
  assert.doesNotMatch(
    contact.container.textContent ?? "",
    /private server draft|180 days|private references|resume email/i,
  );

  cleanup();
  const review = render(
    <PlanYourHomeShell refinementFixture={createPlanHomeRefinementFixture("review")} />,
  );
  const reviewLink = review.getByRole("link", { name: /privacy policy/i });
  assert.equal(reviewLink.getAttribute("href"), "/privacy");
  assert.doesNotMatch(
    review.container.textContent ?? "",
    /proposed retention schedule|24 months|request deletion/i,
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
