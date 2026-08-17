import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";

import { AdminInquiryDetailView } from "../components/admin/admin-inquiry-detail.tsx";
import {
  hasExactInquiryObjectPrefix,
  mapAdminInquiryDetail,
} from "../features/plan-your-home/admin-inquiry-detail.ts";
import { planHomeQuestions, planHomeZones } from "../features/plan-your-home/registry.ts";

afterEach(cleanup);

const inquiryId = "draft-detail-test";
const fileReference = {
  id: "file-11111111-1111-4111-8111-111111111111",
  kind: "file" as const,
  originalName: "sketch.pdf",
  objectPath: `inquiryReferences/${inquiryId}/private-file-object`,
  extension: "pdf" as const,
  mimeType: "application/pdf" as const,
  sizeBytes: 4096,
  note: "Kitchen circulation reference",
  createdAt: "2026-08-11T12:00:00.000Z",
};
const secureLinkReference = {
  id: "link-22222222-2222-4222-8222-222222222222",
  kind: "link" as const,
  url: "https://example.com/inspiration?view=house",
  hostname: "example.com",
  note: "Exterior material direction",
  createdAt: "2026-08-11T12:01:00.000Z",
};

function completePlanHomeRecord() {
  return {
    schemaVersion: 2,
    experience: "plan-your-home",
    definitionId: "plan-home-v1",
    status: "submitted",
    contact: {
      name: "Taylor Homeowner",
      email: "taylor@example.com",
      phone: "+12145550100",
      preferredFollowUp: "email",
      manualFollowUpDisclosureAccepted: true,
    },
    answers: Object.fromEntries(
      planHomeQuestions.map((question) => [
        question.id,
        question.response.exampleAnswer,
      ]),
    ),
    progress: {
      currentPromptId: "review",
      currentZoneId: "design-desk-and-review",
      completedZoneIds: planHomeZones.map(({ id }) => id),
    },
    references: [fileReference, secureLinkReference],
    derived: {
      name: "Taylor Homeowner",
      email: "taylor@example.com",
      phone: "+12145550100",
      lastActivityAt: new Date("2026-08-11T13:00:00.000Z"),
    },
    revision: 9,
    acceptedConsentVersion: "plan-home-inquiry-contact-v1",
    acceptedConsentAt: new Date("2026-08-11T12:59:00.000Z"),
    createdAt: new Date("2026-08-11T11:00:00.000Z"),
    updatedAt: new Date("2026-08-11T13:00:00.000Z"),
    submittedAt: new Date("2026-08-11T13:00:00.000Z"),
    expiresAt: new Date("2028-08-10T13:00:00.000Z"),
  };
}

test("detail normalization keeps all 31 Plan Your Home answers in exact tour order", () => {
  const detail = mapAdminInquiryDetail(inquiryId, completePlanHomeRecord());
  assert(detail);
  assert.equal(detail.source, "plan-your-home");
  assert.equal(detail.answerSections.length, 7);
  const answers = detail.answerSections.flatMap((section) => section.answers);
  assert.equal(answers.length, 31);
  assert.deepEqual(
    answers.map(({ id }) => id),
    planHomeQuestions.map(({ id }) => id),
  );
  assert.deepEqual(
    answers.map(({ label }) => label),
    planHomeQuestions.map(({ prompt }) => prompt),
  );
  assert.equal(answers.every(({ state }) => state === "saved"), true);
  assert.equal(detail.references.length, 2);
  assert.equal(detail.omittedReferenceCount, 0);
  assert.equal(detail.disclosure.startsWith("Accepted:"), true);
});

test("malformed answers and references fail closed while legacy records remain readable", () => {
  const malformed = completePlanHomeRecord();
  malformed.answers = {
    ...malformed.answers,
    "home.stories": "malicious-unknown-value",
  };
  delete malformed.answers["home.finish-level"];
  malformed.references = [
    fileReference,
    {
      ...fileReference,
      id: "file-cross-prefix",
      objectPath: "inquiryReferences/another-draft/private-object",
    },
    {
      ...secureLinkReference,
      id: "link-invalid-scheme",
      url: "javascript:alert(1)",
      hostname: "",
    },
  ];
  const detail = mapAdminInquiryDetail(inquiryId, malformed);
  assert(detail);
  const answers = detail.answerSections.flatMap((section) => section.answers);
  assert.equal(
    answers.find(({ id }) => id === "home.stories")?.state,
    "invalid",
  );
  assert.equal(
    answers.find(({ id }) => id === "home.finish-level")?.state,
    "missing",
  );
  assert.equal(detail.references.length, 1);
  assert.equal(detail.omittedReferenceCount, 2);
  assert.equal(JSON.stringify(detail).includes("javascript:"), false);
  assert.equal(JSON.stringify(detail).includes("another-draft"), false);

  const legacy = mapAdminInquiryDetail("legacy-detail", {
    status: "new",
    name: " Legacy   Customer ",
    email: "legacy@example.com",
    phone: "+1 214 555 0101",
    preferredContactMethod: "phone",
    projectType: "custom-home",
    approxSquareFootage: 2450,
    finishLevel: "builder-plus",
    servicesNeeded: ["architectural-design", "building"],
    projectLocation: "Cooke County",
    lotStatus: "already-owned",
    timeline: "3-6-months",
    budgetRange: "500k-1m",
    projectDescription: "A readable legacy project description.",
    createdAt: new Date("2026-08-10T12:00:00.000Z"),
  });
  assert(legacy);
  assert.equal(legacy.source, "legacy");
  assert.equal(legacy.status, "submitted");
  assert.equal(legacy.answerSections.flatMap(({ answers }) => answers).length, 9);
  assert.equal(
    JSON.stringify(legacy).includes("A readable legacy project description."),
    true,
  );
});

test("the short general inquiry remains readable in HHQ", () => {
  const detail = mapAdminInquiryDetail("general-detail", {
    schemaVersion: 1,
    experience: "general-inquiry",
    status: "new",
    name: "Avery Builder",
    email: null,
    phone: "+1 214 555 0101",
    projectType: "land-site-development",
    projectLocation: null,
    projectDescription: "We need help evaluating a development site.",
    createdAt: new Date("2026-08-17T12:00:00.000Z"),
  });

  assert(detail);
  assert.equal(detail.source, "general-inquiry");
  assert.equal(detail.status, "submitted");
  assert.equal(detail.progress.summary, "Complete · general inquiry");
  assert.deepEqual(
    detail.answerSections.flatMap(({ answers }) =>
      answers.map(({ label, summary }) => [label, summary]),
    ),
    [
      ["Project type", "Land Site Development"],
      ["Project location", "Not provided"],
      ["What are you planning?", "We need help evaluating a development site."],
    ],
  );
});

test("private object validation requires the inquiry's exact single-object prefix", () => {
  assert.equal(
    hasExactInquiryObjectPrefix(
      inquiryId,
      `inquiryReferences/${inquiryId}/private-object`,
    ),
    true,
  );
  assert.equal(
    hasExactInquiryObjectPrefix(
      inquiryId,
      `inquiryReferences/${inquiryId}/nested/private-object`,
    ),
    false,
  );
  assert.equal(
    hasExactInquiryObjectPrefix(
      inquiryId,
      "inquiryReferences/another-inquiry/private-object",
    ),
    false,
  );
});

test("an interrupted deletion remains readable at the same detail URL with a retry action", () => {
  const record = completePlanHomeRecord();
  record.status = "deleting";
  const detail = mapAdminInquiryDetail(inquiryId, record);
  assert(detail);
  assert.equal(detail.status, "deleting");
  assert.equal(detail.progress.summary, "Deletion in progress");

  const idleAction = async () => ({ status: "idle" as const });
  const view = render(
    <AdminInquiryDetailView
      inquiry={detail}
      statusAction={idleAction}
      deleteAction={idleAction}
    />,
  );
  const query = within(view.container);
  assert.ok(query.getByText("Deletion Pending"));
  assert.ok(
    query.getByText(
      "A previous deletion did not finish. Retry deletion to remove the remaining private files and records.",
    ),
  );
  assert.ok(query.getByRole("button", { name: "Delete Inquiry" }));
});

test("detail UI exposes safe file/link actions and an accessible destructive confirmation", async () => {
  const detail = mapAdminInquiryDetail(inquiryId, completePlanHomeRecord());
  assert(detail);
  const dialogPrototype = window.HTMLDialogElement.prototype as HTMLDialogElement & {
    showModal?: () => void;
    close?: () => void;
  };
  dialogPrototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  dialogPrototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };

  const idleAction = async () => ({ status: "idle" as const });
  const view = render(
    <AdminInquiryDetailView
      inquiry={detail}
      statusAction={idleAction}
      deleteAction={idleAction}
    />,
  );
  const query = within(view.container);
  assert.equal(query.getAllByText(/^Question \d+$/).length, 31);
  assert.ok(query.getByRole("button", { name: "Open Private File" }));
  const safeLink = query.getByRole("link", { name: "Open example.com" });
  assert.equal(safeLink.getAttribute("href"), secureLinkReference.url);
  assert.equal(safeLink.getAttribute("target"), "_blank");
  assert.equal(safeLink.getAttribute("rel"), "noopener noreferrer");

  const user = userEvent.setup({ document: window.document });
  await user.click(query.getByRole("button", { name: "Delete Inquiry" }));
  const dialog = query.getByRole("dialog", { name: "Delete this inquiry?" });
  assert.equal(dialog.hasAttribute("open"), true);
  assert.ok(
    within(dialog).getByRole("button", {
      name: "Delete Inquiry and Files",
    }),
  );
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  assert.equal(dialog.hasAttribute("open"), false);

  const results = await axe.run(view.container, {
    rules: { region: { enabled: false } },
  });
  assert.deepEqual(results.violations, []);
});
