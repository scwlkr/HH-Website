import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PLAN_HOME_REFERENCE_LIMITS,
  planHomeReferenceCollectionSchema,
} from "../features/plan-your-home/references.ts";
import { planHomeV1Definition } from "../features/plan-your-home/registry.ts";
import {
  localDraftSnapshotSchema,
  submittedProjectBriefSchema,
} from "../features/plan-your-home/schemas.ts";

const now = "2026-07-13T12:00:00.000Z";

function fileReference(index: number, sizeBytes = 1024) {
  return {
    id: `file-${index}`,
    kind: "file",
    originalName: `reference-${index}.pdf`,
    objectPath: `inquiryReferences/draft-123/uuid-${index}`,
    extension: "pdf",
    mimeType: "application/pdf",
    sizeBytes,
    note: "A useful plan",
    createdAt: now,
  };
}

function linkReference(index: number) {
  return {
    id: `link-${index}`,
    kind: "link",
    url: `https://example.com/reference-${index}`,
    hostname: "example.com",
    note: "Exterior direction",
    createdAt: now,
  };
}

function completeAnswers() {
  return Object.fromEntries(
    planHomeV1Definition.questions.map((item) => [item.id, item.response.exampleAnswer]),
  );
}

describe("Plan Your Home reference metadata", () => {
  it("accepts metadata-only file and HTTPS link references", () => {
    const result = planHomeReferenceCollectionSchema.safeParse([
        fileReference(1),
        { ...linkReference(1), url: "HTTPS://EXAMPLE.COM/reference-1" },
      ]);
    assert.equal(result.success, true);
    assert.equal(result.data?.[1]?.kind, "link");
    if (result.data?.[1]?.kind === "link") {
      assert.equal(result.data[1].url, "https://example.com/reference-1");
    }
  });

  it("enforces file, link, total, and byte limits", () => {
    assert.equal(
      planHomeReferenceCollectionSchema.safeParse([
        fileReference(1, PLAN_HOME_REFERENCE_LIMITS.bytesPerFile + 1),
      ]).success,
      false,
    );
    assert.equal(
      planHomeReferenceCollectionSchema.safeParse(
        Array.from({ length: 7 }, (_, index) => fileReference(index)),
      ).success,
      false,
    );
    assert.equal(
      planHomeReferenceCollectionSchema.safeParse(
        Array.from({ length: 7 }, (_, index) => linkReference(index)),
      ).success,
      false,
    );
    assert.equal(
      planHomeReferenceCollectionSchema.safeParse([
        ...Array.from({ length: 6 }, (_, index) => fileReference(index)),
        ...Array.from({ length: 5 }, (_, index) => linkReference(index)),
      ]).success,
      false,
    );
    assert.equal(
      planHomeReferenceCollectionSchema.safeParse(
        Array.from({ length: 5 }, (_, index) =>
          fileReference(index, 9 * 1024 * 1024),
        ),
      ).success,
      false,
    );
  });

  it("rejects unsupported file metadata and non-HTTP links", () => {
    assert.equal(
      planHomeReferenceCollectionSchema.safeParse([
        { ...fileReference(1), extension: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      ]).success,
      false,
    );
    assert.equal(
      planHomeReferenceCollectionSchema.safeParse([
        { ...fileReference(1), mimeType: "image/png" },
      ]).success,
      false,
    );
    assert.equal(
      planHomeReferenceCollectionSchema.safeParse([
        { ...linkReference(1), url: "javascript:alert(1)" },
      ]).success,
      false,
    );
  });
});

describe("Plan Your Home persisted schemas", () => {
  it("accepts a versioned local snapshot with partial canonical answers", () => {
    const result = localDraftSnapshotSchema.safeParse({
      snapshotVersion: 1,
      definitionId: "plan-home-v1",
      welcomeName: "Taylor",
      answers: {
        "home.heated-square-feet": "2500-2999",
      },
      progress: {
        currentQuestionId: "home.stories",
        completedZoneIds: [],
      },
      references: [linkReference(1)],
      savedAt: now,
      expiresAt: "2026-08-12T12:00:00.000Z",
    });
    assert.equal(result.success, true);
  });

  it("rejects unknown or invalid answer keys and raw file payloads", () => {
    const base = {
      snapshotVersion: 1,
      definitionId: "plan-home-v1",
      welcomeName: "Taylor",
      progress: {
        currentQuestionId: "home.stories",
        completedZoneIds: [],
      },
      references: [],
      savedAt: now,
      expiresAt: "2026-08-12T12:00:00.000Z",
    };

    assert.equal(
      localDraftSnapshotSchema.safeParse({
        ...base,
        answers: { "unknown.question": "value" },
      }).success,
      false,
    );
    assert.equal(
      localDraftSnapshotSchema.safeParse({
        ...base,
        answers: { "home.heated-square-feet": "not-a-band" },
      }).success,
      false,
    );
    assert.equal(
      localDraftSnapshotSchema.safeParse({
        ...base,
        answers: {},
        rawFileBlobs: ["private-file-body"],
      }).success,
      false,
    );
  });

  it("accepts a complete submitted project brief matching storage version 2", () => {
    const result = submittedProjectBriefSchema.safeParse({
      schemaVersion: 2,
      experience: "plan-your-home",
      definitionId: "plan-home-v1",
      status: "submitted",
      contact: {
        name: "Taylor Homeowner",
        email: "taylor@example.com",
        phone: "+1 214 555 0100",
        preferredFollowUp: "email",
        manualFollowUpDisclosureAccepted: true,
      },
      answers: completeAnswers(),
      progress: {
        currentQuestionId: "contact.follow-up",
        currentZoneId: "design-desk-and-review",
        completedZoneIds: planHomeV1Definition.zones.map((zone) => zone.id),
      },
      references: [fileReference(1), linkReference(1)],
      source: {
        path: "/plan-your-home",
        attribution: { source: "website" },
      },
      derived: {
        name: "Taylor Homeowner",
        email: "taylor@example.com",
        phone: "+1 214 555 0100",
        targetLocation: "Denton County",
        squareFootageBand: "2500-2999",
        finishLevel: "custom",
        lastActivityAt: now,
      },
      revision: 8,
      acceptedConsentVersion: "plan-home-contact-v1",
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
      expiresAt: "2028-07-13T12:00:00.000Z",
    });
    assert.equal(result.success, true);
  });

  it("rejects incomplete submissions and draft-only statuses", () => {
    const base = {
      schemaVersion: 2,
      experience: "plan-your-home",
      definitionId: "plan-home-v1",
      status: "submitted",
      contact: {
        name: "Taylor Homeowner",
        email: "taylor@example.com",
        phone: "+1 214 555 0100",
        preferredFollowUp: "email",
        manualFollowUpDisclosureAccepted: true,
      },
      answers: completeAnswers(),
      progress: {
        currentQuestionId: "contact.follow-up",
        currentZoneId: "design-desk-and-review",
        completedZoneIds: planHomeV1Definition.zones.map((zone) => zone.id),
      },
      references: [],
      source: { path: "/plan-your-home", attribution: {} },
      derived: {
        name: "Taylor Homeowner",
        email: "taylor@example.com",
        phone: "+1 214 555 0100",
        targetLocation: null,
        squareFootageBand: "2500-2999",
        finishLevel: "custom",
        lastActivityAt: now,
      },
      revision: 8,
      acceptedConsentVersion: "plan-home-contact-v1",
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
      expiresAt: "2028-07-13T12:00:00.000Z",
    };

    const incomplete = { ...base, answers: { ...base.answers } };
    delete incomplete.answers["contact.follow-up"];

    assert.equal(submittedProjectBriefSchema.safeParse(incomplete).success, false);
    assert.equal(
      submittedProjectBriefSchema.safeParse({ ...base, status: "draft" }).success,
      false,
    );
  });
});
