import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, within } from "@testing-library/react";
import axe from "axe-core";

import { GeneralInquiryForm } from "../components/inquiry/general-inquiry-form.tsx";
import { inquiryActionInitialState } from "../types/inquiry.ts";

afterEach(cleanup);

test("the general project inquiry is a minimal accessible single-screen form", async () => {
  const view = render(
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
  const query = within(view.container);

  assert.ok(query.getByRole("form", { name: "General project inquiry" }));
  assert.ok(query.getByRole("textbox", { name: "Name" }));
  assert.ok(query.getByRole("textbox", { name: "Email" }));
  assert.ok(query.getByRole("textbox", { name: "Phone" }));
  assert.ok(query.getByRole("combobox", { name: "Project type" }));
  assert.ok(query.getByRole("textbox", { name: "Project location (optional)" }));
  assert.ok(query.getByRole("textbox", { name: "What are you planning?" }));
  assert.ok(query.getByRole("button", { name: "Send Inquiry" }));
  assert.equal(
    query.getByRole("textbox", { name: "Email" }).getAttribute("aria-describedby"),
    "general-inquiry-contact-help",
  );
  assert.equal(
    query.getByRole("textbox", { name: "Phone" }).getAttribute("aria-describedby"),
    "general-inquiry-contact-help",
  );
  assert.equal(query.queryByText(/Step \d/i), null);
  assert.equal(query.queryByText(/Finish Direction/i), null);
  assert.equal(query.queryByText(/Budget Range/i), null);

  const results = await axe.run(view.container, {
    rules: { region: { enabled: false } },
  });
  assert.deepEqual(results.violations, []);
});
