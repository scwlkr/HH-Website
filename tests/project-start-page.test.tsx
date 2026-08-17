import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, within } from "@testing-library/react";

import { ProjectStartContent } from "../app/start/project-start-content.tsx";
import { inquiryActionInitialState } from "../types/inquiry.ts";

afterEach(cleanup);

test("project start leads with Plan Your Home and keeps the short inquiry subordinate", () => {
  const view = render(
    <ProjectStartContent
      initialValues={{
        name: "",
        phone: "",
        email: "",
        projectType: "commercial",
        projectLocation: "",
        projectDescription: "",
        sourcePage: "/start",
        utmSource: "catalog",
        utmMedium: "",
        utmCampaign: "",
        company: "",
      }}
      submitAction={async () => inquiryActionInitialState}
    />,
  );
  const query = within(view.container);

  assert.ok(
    query.getByRole("heading", {
      level: 1,
      name: "Plan your new home, one space at a time.",
    }),
  );
  assert.equal(
    query.getByRole("link", { name: "Start Plan Your Home" }).getAttribute("href"),
    "/plan-your-home",
  );
  assert.equal(query.queryByRole("link", { name: /Resume a saved plan/i }), null);
  assert.ok(
    query.getByRole("heading", { level: 2, name: "Have something else in mind?" }),
  );
  assert.equal(
    (query.getByRole("combobox", { name: "Project type" }) as HTMLSelectElement)
      .value,
    "commercial",
  );
});
