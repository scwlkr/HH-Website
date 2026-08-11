import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { createAdminInquiryQueueRepository } from "../features/plan-your-home/admin-inquiry-queue.ts";

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

test(
  "HHQ inquiry queue reads legacy and every Plan Your Home status newest first",
  { skip: !hasEmulator },
  async () => {
    const projectId =
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.FIREBASE_PROJECT_ID;
    assert(projectId, "A Firebase emulator project ID is required.");

    const app = initializeApp(
      { projectId },
      `admin-inquiry-queue-${process.pid}-${randomUUID()}`,
    );
    const firestore = getFirestore(app);
    const repository = createAdminInquiryQueueRepository(firestore);
    const fixturePrefix = `queue-${randomUUID()}`;
    const fixtures = [
      {
        id: `${fixturePrefix}-draft`,
        value: {
          schemaVersion: 2,
          experience: "plan-your-home",
          status: "draft",
          contact: {
            name: "Draft Homeowner",
            email: "draft@example.com",
            phone: "+1 214 555 0100",
          },
          derived: {
            name: "Draft Homeowner",
            email: "draft@example.com",
            phone: "+1 214 555 0100",
            targetLocation: "Denton County",
            lastActivityAt: new Date("2026-08-11T15:05:00.000Z"),
          },
          progress: {
            currentZoneId: "kitchen-and-dining",
            completedZoneIds: ["project-and-living"],
          },
          answers: { private: "draft-answer-secret" },
          references: [{ storagePath: "private/draft.pdf" }],
          createdAt: new Date("2026-08-11T14:05:00.000Z"),
        },
      },
      ...(["reviewed", "submitted", "spam"] as const).map(
        (status, index) => ({
          id: `${fixturePrefix}-${status}`,
          value: {
            schemaVersion: 2,
            experience: "plan-your-home",
            status,
            contact: {
              name: `${status} Homeowner`,
              email: `${status}@example.com`,
              phone: `+1 214 555 010${index + 1}`,
            },
            derived: {
              name: `${status} Homeowner`,
              email: `${status}@example.com`,
              phone: `+1 214 555 010${index + 1}`,
              targetLocation: `${status} County`,
              lastActivityAt: new Date(
                `2026-08-11T15:0${4 - index}:00.000Z`,
              ),
            },
            progress: {
              currentZoneId: "design-desk-and-review",
              completedZoneIds: [
                "project-and-living",
                "kitchen-and-dining",
                "primary-suite",
                "bedrooms-and-shared-bathrooms",
                "utility-and-systems",
                "exterior-and-site",
                "design-desk-and-review",
              ],
            },
            answers: { private: `${status}-answer-secret` },
            references: [{ storagePath: `private/${status}.pdf` }],
            updatedAt: new Date(`2026-08-11T14:0${4 - index}:00.000Z`),
          },
        }),
      ),
      {
        id: `${fixturePrefix}-legacy`,
        value: {
          status: "new",
          name: "Legacy Homeowner",
          email: "legacy@example.com",
          phone: "+1 214 555 0109",
          projectLocation: "Cooke County",
          createdAt: new Date("2026-08-11T15:01:00.000Z"),
          projectDescription: "Private legacy inquiry description",
        },
      },
    ];

    try {
      const batch = firestore.batch();
      for (const fixture of fixtures) {
        batch.set(
          firestore.collection("inquirySubmissions").doc(fixture.id),
          fixture.value,
        );
      }
      await batch.commit();

      const all = (await repository.list("all")).filter(({ id }) =>
        id.startsWith(fixturePrefix),
      );
      assert.deepEqual(
        all.map(({ status }) => status),
        ["draft", "reviewed", "submitted", "spam", "submitted"],
      );
      assert.equal(all[0]?.progress.includes("Kitchen and Dining"), true);
      assert.equal(all.at(-1)?.source, "legacy");
      assert.equal(all.at(-1)?.progress, "Complete · legacy form");
      assert.equal(JSON.stringify(all).includes("answer-secret"), false);
      assert.equal(JSON.stringify(all).includes("private/"), false);
      assert.equal(
        JSON.stringify(all).includes("Private legacy inquiry description"),
        false,
      );

      const submitted = (await repository.list("submitted")).filter(({ id }) =>
        id.startsWith(fixturePrefix),
      );
      assert.deepEqual(
        submitted.map(({ source }) => source),
        ["plan-your-home", "legacy"],
      );

      const storedDraft = await firestore
        .collection("inquirySubmissions")
        .doc(`${fixturePrefix}-draft`)
        .get();
      assert.equal(storedDraft.data()?.answers.private, "draft-answer-secret");
      assert.equal(storedDraft.data()?.references[0].storagePath, "private/draft.pdf");

      process.stdout.write(
        "HHQ inquiry queue emulator evidence: records=5, statuses=draft-reviewed-submitted-spam-legacy-new, legacyNormalized=submitted, newestFirst=true, submittedFilter=2, privateFieldsProjected=false\n",
      );
    } finally {
      const cleanup = firestore.batch();
      for (const fixture of fixtures) {
        cleanup.delete(
          firestore.collection("inquirySubmissions").doc(fixture.id),
        );
      }
      await cleanup.commit();
      await deleteApp(app);
    }
  },
);
