import type { Firestore } from "firebase-admin/firestore";

import { planHomeZones, type PlanHomeZoneId } from "./registry.ts";

const inquirySubmissionsCollection = "inquirySubmissions";

export const adminInquiryStatusFilters = [
  "all",
  "draft",
  "submitted",
  "reviewed",
  "spam",
] as const;

export type AdminInquiryStatus = Exclude<
  (typeof adminInquiryStatusFilters)[number],
  "all"
>;

export type AdminInquiryStatusFilter =
  (typeof adminInquiryStatusFilters)[number];

export type AdminInquiryQueueItem = Readonly<{
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: AdminInquiryStatus;
  progress: string;
  lastActivityAt: string | null;
  location: string | null;
  source: "legacy" | "plan-your-home";
}>;

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readText(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 0 ? normalized : null;
}

function readTimestamp(value: unknown): string | null {
  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  } else if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    date = value.toDate();
  }

  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function readStatus(
  value: unknown,
  source: AdminInquiryQueueItem["source"],
): AdminInquiryStatus | null {
  if (value === "new" && source === "legacy") return "submitted";
  if (
    value === "draft" ||
    value === "submitted" ||
    value === "reviewed" ||
    value === "spam"
  ) {
    return value;
  }
  return null;
}

function readPlanHomeProgress(
  record: Record<string, unknown>,
  status: AdminInquiryStatus,
) {
  if (status !== "draft") return "Complete";

  const progress = readRecord(record.progress);
  const currentZoneId = readText(progress.currentZoneId) as
    | PlanHomeZoneId
    | null;
  const zone = planHomeZones.find(({ id }) => id === currentZoneId);
  const completedZoneIds = Array.isArray(progress.completedZoneIds)
    ? progress.completedZoneIds
    : [];
  const savedCount = Math.min(completedZoneIds.length, planHomeZones.length);

  if (!zone) {
    return `${savedCount} of ${planHomeZones.length} zones saved`;
  }

  return `${zone.title} · ${savedCount} of ${planHomeZones.length} zones saved`;
}

export function parseAdminInquiryStatusFilter(
  value: string | string[] | undefined,
): AdminInquiryStatusFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  return adminInquiryStatusFilters.includes(
    candidate as AdminInquiryStatusFilter,
  )
    ? (candidate as AdminInquiryStatusFilter)
    : "all";
}

export function mapAdminInquiryQueueItem(
  id: string,
  value: unknown,
): AdminInquiryQueueItem | null {
  const record = readRecord(value);
  const source =
    record.schemaVersion === 2 && record.experience === "plan-your-home"
      ? "plan-your-home"
      : "legacy";
  const status = readStatus(record.status, source);
  if (!status) return null;

  if (source === "legacy") {
    return {
      id,
      name: readText(record.name) ?? "Unnamed inquiry",
      email: readText(record.email),
      phone: readText(record.phone),
      status,
      progress: "Complete · legacy form",
      lastActivityAt:
        readTimestamp(record.updatedAt) ?? readTimestamp(record.createdAt),
      location: readText(record.projectLocation),
      source,
    };
  }

  const contact = readRecord(record.contact);
  const derived = readRecord(record.derived);

  return {
    id,
    name:
      readText(derived.name) ??
      readText(contact.name) ??
      "Unnamed inquiry",
    email: readText(derived.email) ?? readText(contact.email),
    phone: readText(derived.phone) ?? readText(contact.phone),
    status,
    progress: readPlanHomeProgress(record, status),
    lastActivityAt:
      readTimestamp(derived.lastActivityAt) ??
      readTimestamp(record.updatedAt) ??
      readTimestamp(record.submittedAt) ??
      readTimestamp(record.createdAt),
    location: readText(derived.targetLocation),
    source,
  };
}

export function filterAndSortAdminInquiries(
  inquiries: readonly AdminInquiryQueueItem[],
  statusFilter: AdminInquiryStatusFilter,
) {
  return inquiries
    .filter(
      (inquiry) =>
        statusFilter === "all" || inquiry.status === statusFilter,
    )
    .sort((left, right) => {
      const activityDifference =
        (right.lastActivityAt
          ? new Date(right.lastActivityAt).getTime()
          : Number.NEGATIVE_INFINITY) -
        (left.lastActivityAt
          ? new Date(left.lastActivityAt).getTime()
          : Number.NEGATIVE_INFINITY);
      return activityDifference || left.id.localeCompare(right.id);
    });
}

export function createAdminInquiryQueueRepository(database: Firestore) {
  return {
    async list(statusFilter: AdminInquiryStatusFilter) {
      const snapshot = await database
        .collection(inquirySubmissionsCollection)
        .select(
          "schemaVersion",
          "experience",
          "status",
          "name",
          "email",
          "phone",
          "projectLocation",
          "createdAt",
          "updatedAt",
          "submittedAt",
          "contact.name",
          "contact.email",
          "contact.phone",
          "derived.name",
          "derived.email",
          "derived.phone",
          "derived.targetLocation",
          "derived.lastActivityAt",
          "progress.currentZoneId",
          "progress.completedZoneIds",
        )
        .get();
      const inquiries = snapshot.docs
        .map((document) =>
          mapAdminInquiryQueueItem(document.id, document.data()),
        )
        .filter((item): item is AdminInquiryQueueItem => item !== null);

      return filterAndSortAdminInquiries(inquiries, statusFilter);
    },
  };
}
