import assert from "node:assert/strict";
import test from "node:test";
import { filterOverview, recentActivity, searchOverview, type HHQOverview } from "../lib/admin/overview-model.ts";

const data: HHQOverview = {
  asOf: "2026-09-22T12:00:00.000Z",
  projectsAvailable: true,
  inquiriesAvailable: true,
  projects: [
    { id: "draft", title: "Oak House", location: "Denton", published: false, status: "for-sale", updatedAt: "2026-09-21T12:00:00.000Z" },
    { id: "older", title: "Lake House", location: "Dallas", published: true, status: "sold", updatedAt: "2026-07-01T12:00:00.000Z" },
  ],
  inquiries: [
    { id: "new", name: "Fixture Person", status: "submitted", location: "Fort Worth", lastActivityAt: "2026-09-22T11:00:00.000Z" },
    { id: "unknown", name: "Undated Inquiry", status: "draft", location: null, lastActivityAt: null },
    { id: "future", name: "Future Inquiry", status: "draft", location: null, lastActivityAt: "2026-09-24T12:00:00.000Z" },
  ],
};

test("date filtering uses last updates and excludes unknown and future activity in a bounded period", () => {
  const filtered = filterOverview(data, 7);
  assert.deepEqual(filtered.projects.map(({ id }) => id), ["draft"]);
  assert.deepEqual(filtered.inquiries.map(({ id }) => id), ["new"]);
  assert.equal(filterOverview(data, 0).inquiries.length, 3);
  assert.equal(filterOverview(data, 0).projects.length, 2);
});

test("workspace search handles case, whitespace and missing locations without matching blank input", () => {
  assert.deepEqual(searchOverview(data, "  OAK ").projects.map(({ id }) => id), ["draft"]);
  assert.deepEqual(searchOverview(data, "fort worth").inquiries.map(({ id }) => id), ["new"]);
  assert.deepEqual(searchOverview(data, "missing"), { projects: [], inquiries: [] });
  assert.deepEqual(searchOverview(data, "  "), { projects: [], inquiries: [] });
});

test("activity represents each record's latest update, preserves private edit links and does not invent staff actions", () => {
  const activity = recentActivity(filterOverview(data, 30));
  assert.deepEqual(activity.map(({ id }) => id), ["inquiry-new", "project-draft"]);
  assert.equal(activity[1].href, "/admin/projects/draft");
  assert.equal(activity[1].description, "Draft project updated");
});
