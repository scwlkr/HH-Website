import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, within } from "@testing-library/react";
import axe from "axe-core";

import { AdminInquiryQueue } from "../components/admin/admin-inquiry-queue.tsx";
import {
  filterAndSortAdminInquiries,
  mapAdminInquiryQueueItem,
  parseAdminInquiryStatusFilter,
  type AdminInquiryQueueItem,
} from "../features/plan-your-home/admin-inquiry-queue.ts";
import { isAuthorizedAdminClaims } from "../lib/firebase/admin-access.ts";

afterEach(cleanup);

const inquiries: readonly AdminInquiryQueueItem[] = [
  {
    id: "draft-inquiry",
    name: "Jordan Draft",
    email: "jordan@example.com",
    phone: "+1 214 555 0100",
    status: "draft",
    progress: "Kitchen and Dining · 1 of 7 zones saved",
    lastActivityAt: "2026-08-11T15:00:00.000Z",
    location: "Denton County",
    source: "plan-your-home",
  },
  {
    id: "legacy-inquiry",
    name: "Morgan Legacy",
    email: "morgan@example.com",
    phone: "+1 214 555 0101",
    status: "submitted",
    progress: "Complete · legacy form",
    lastActivityAt: "2026-08-11T14:00:00.000Z",
    location: "Cooke County",
    source: "legacy",
  },
];

test("queue contracts normalize legacy records, activity order, filters, and authorization claims", () => {
  const legacy = mapAdminInquiryQueueItem("legacy", {
    status: "new",
    name: "  Morgan   Legacy ",
    email: "morgan@example.com",
    phone: "+1 214 555 0101",
    projectLocation: "Cooke County",
    createdAt: new Date("2026-08-11T14:00:00.000Z"),
    answers: { private: "must-not-reach-the-list-model" },
    references: [{ storagePath: "private/path.pdf" }],
  });
  assert(legacy);
  assert.equal(legacy.status, "submitted");
  assert.equal(legacy.source, "legacy");
  assert.equal(legacy.progress, "Complete · legacy form");
  assert.equal(JSON.stringify(legacy).includes("must-not-reach"), false);
  assert.equal(JSON.stringify(legacy).includes("private/path.pdf"), false);

  const planHome = mapAdminInquiryQueueItem("draft", {
    schemaVersion: 2,
    experience: "plan-your-home",
    status: "draft",
    contact: {
      name: "Jordan Draft",
      email: "jordan@example.com",
      phone: "+1 214 555 0100",
    },
    derived: {
      targetLocation: "Denton County",
      lastActivityAt: new Date("2026-08-11T15:00:00.000Z"),
    },
    progress: {
      currentZoneId: "kitchen-and-dining",
      completedZoneIds: ["project-and-living"],
    },
  });
  assert(planHome);
  assert.equal(
    planHome.progress,
    "Kitchen and Dining · 1 of 7 zones saved",
  );

  assert.deepEqual(
    filterAndSortAdminInquiries([legacy, planHome], "all").map(({ id }) => id),
    ["draft", "legacy"],
  );
  assert.deepEqual(
    filterAndSortAdminInquiries([legacy, planHome], "submitted").map(
      ({ id }) => id,
    ),
    ["legacy"],
  );
  assert.equal(parseAdminInquiryStatusFilter("reviewed"), "reviewed");
  assert.equal(parseAdminInquiryStatusFilter("invalid"), "all");
  assert.equal(isAuthorizedAdminClaims({ role: "admin" }), true);
  assert.equal(isAuthorizedAdminClaims({ role: "staff" }), false);
  assert.equal(isAuthorizedAdminClaims(null), false);
});

test("responsive inquiry list, empty state, and error state are semantic and accessible", async () => {
  const view = render(
    <AdminInquiryQueue inquiries={inquiries} statusFilter="all" />,
  );
  const query = within(view.container);

  assert.ok(query.getByRole("combobox", { name: "Status" }));
  assert.ok(query.getByRole("button", { name: "Apply Filter" }));
  assert.ok(query.getByRole("list", { name: "Inquiries" }));
  assert.equal(query.getAllByRole("listitem").length, 2);
  assert.ok(query.getByText("Legacy inquiry"));
  assert.ok(query.getByText("Newest activity first"));

  const results = await axe.run(view.container, {
    rules: { region: { enabled: false } },
  });
  assert.deepEqual(results.violations, []);

  view.rerender(<AdminInquiryQueue inquiries={[]} statusFilter="spam" />);
  assert.ok(query.getByText("No inquiries found."));
  assert.ok(query.getByText("No spam inquiries match this filter."));
  assert.ok(query.getByRole("link", { name: "Clear" }));

  view.rerender(
    <AdminInquiryQueue
      inquiries={[]}
      statusFilter="all"
      errorMessage="Inquiries could not be loaded right now."
    />,
  );
  assert.ok(query.getByRole("alert"));
  assert.equal(query.queryByRole("list", { name: "Inquiries" }), null);
});
