import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { Bucket } from "@google-cloud/storage";

import {
  createPlanHomeCleanupRepository,
  PLAN_HOME_ORPHAN_MIN_AGE_MS,
} from "../features/plan-your-home/cleanup-repository.ts";

const hasEmulators = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST &&
    process.env.FIREBASE_STORAGE_EMULATOR_HOST,
);

function draftId(index: number, digit = "a") {
  const suffix = index.toString(16).padStart(8, "0");
  return `draft-${digit.repeat(32)}${suffix}`;
}

async function writeDocuments(
  firestore: ReturnType<typeof getFirestore>,
  writes: readonly Readonly<{
    path: string;
    value: Record<string, unknown>;
  }>[],
) {
  for (let index = 0; index < writes.length; index += 400) {
    const batch = firestore.batch();
    for (const write of writes.slice(index, index + 400)) {
      batch.set(firestore.doc(write.path), write.value);
    }
    await batch.commit();
  }
}

async function writeObjects(
  bucket: Bucket,
  writes: readonly Readonly<{
    path: string;
    referenceId?: string;
  }>[],
) {
  for (let index = 0; index < writes.length; index += 50) {
    await Promise.all(
      writes.slice(index, index + 50).map((write) =>
        bucket.file(write.path).save(Buffer.from("private-reference"), {
          resumable: false,
          metadata: {
            contentType: "application/pdf",
            metadata: {
              ...(write.referenceId
                ? { "plan-home-reference": write.referenceId }
                : {}),
            },
          },
        }),
      ),
    );
  }
}

test(
  "scheduled cleanup paginates records, tokens, and objects while preserving live capabilities and unrelated data",
  { skip: !hasEmulators, timeout: 120_000 },
  async () => {
    const projectId =
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.FIREBASE_PROJECT_ID;
    assert(projectId);
    const bucketName = `${projectId}.firebasestorage.app`;
    const app = initializeApp(
      { projectId, storageBucket: bucketName },
      `plan-home-cleanup-${randomUUID()}`,
    );
    const firestore = getFirestore(app);
    const bucket = getStorage(app).bucket(bucketName);
    let currentTime = new Date(
      Date.now() + PLAN_HOME_ORPHAN_MIN_AGE_MS + 5 * 60 * 1000,
    );
    const expiredAt = new Date(currentTime.getTime() - 1);
    const futureAt = new Date(currentTime.getTime() + 5 * 60 * 1000);
    const longFutureAt = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
    const expiredIds = Array.from({ length: 101 }, (_, index) =>
      draftId(index + 1),
    );
    const pendingId = draftId(1, "f");
    const liveId = draftId(1, "e");
    const bulkOrphanId = draftId(1, "b");
    const activeOrphanId = draftId(1, "d");
    const expiredOrphanId = draftId(1, "c");
    const unreadableOrphanId = draftId(1, "9");
    const pendingReferenceId = `file-${randomUUID()}`;
    const liveReferenceId = `file-${randomUUID()}`;
    const activeOrphanReferenceId = `file-${randomUUID()}`;
    const expiredOrphanReferenceId = `file-${randomUUID()}`;
    const unreadableOrphanReferenceId = `file-${randomUUID()}`;
    const objectlessOrphanReferenceId = `file-${randomUUID()}`;
    const activeObjectlessReferenceId = `file-${randomUUID()}`;
    const liveExpiredReferenceId = `file-${randomUUID()}`;
    const pagedObjectlessOrphanTickets = Array.from(
      { length: 105 },
      (_, index) => {
        const parentId = draftId(index + 10, "8");
        const referenceId = `file-objectless-${index.toString().padStart(3, "0")}`;
        return {
          parentId,
          referenceId,
          path: `inquirySubmissions/${parentId}/referenceUploads/${referenceId}`,
          value: {
            draftId: parentId,
            referenceId,
            objectPath: `inquiryReferences/${parentId}/already-missing-${index}`,
            uploadProtection: "generation-bound-v1",
            objectGeneration: "1",
            expiresAt: expiredAt,
          },
        };
      },
    );

    try {
      await writeDocuments(firestore, [
        ...expiredIds.map((id) => ({
          path: `inquirySubmissions/${id}`,
          value: {
            schemaVersion: 2,
            experience: "plan-your-home",
            status: "draft",
            expiresAt: expiredAt,
            updatedAt: expiredAt,
            references: [],
            referenceUploadProtectionVersion: 1,
          },
        })),
        {
          path: `inquirySubmissions/${pendingId}`,
          value: {
            schemaVersion: 2,
            experience: "plan-your-home",
            status: "deleting",
            expiresAt: expiredAt,
            updatedAt: expiredAt,
            references: [],
            referenceUploadProtectionVersion: 1,
            adminDeletion: {
              previousStatus: "draft",
              requestedAt: expiredAt,
              uploadCapabilitiesExpireAt: futureAt,
              actorUid: "authorized-admin-test",
            },
          },
        },
        {
          path: `inquirySubmissions/${pendingId}/referenceUploads/${pendingReferenceId}`,
          value: {
            draftId: pendingId,
            referenceId: pendingReferenceId,
            objectPath: `inquiryReferences/${pendingId}/pending-capability`,
            uploadProtection: "reserving-generation-v1",
            expiresAt: futureAt,
          },
        },
        {
          path: `inquirySubmissions/${liveId}`,
          value: {
            schemaVersion: 2,
            experience: "plan-your-home",
            status: "draft",
            expiresAt: longFutureAt,
            updatedAt: expiredAt,
            references: [],
            referenceUploadProtectionVersion: 1,
          },
        },
        {
          path: `inquirySubmissions/${liveId}/referenceUploads/${liveReferenceId}`,
          value: {
            draftId: liveId,
            referenceId: liveReferenceId,
            objectPath: `inquiryReferences/${liveId}/live-parent-object`,
            uploadProtection: "reserving-generation-v1",
            expiresAt: futureAt,
          },
        },
        {
          path: `inquirySubmissions/${liveId}/referenceUploads/${liveExpiredReferenceId}`,
          value: {
            draftId: liveId,
            referenceId: liveExpiredReferenceId,
            objectPath: `inquiryReferences/${liveId}/missing-live-object`,
            uploadProtection: "generation-bound-v1",
            objectGeneration: "1",
            expiresAt: expiredAt,
          },
        },
        {
          path: "inquirySubmissions/unrelated-legacy-record",
          value: {
            status: "new",
            expiresAt: expiredAt,
            email: "unrelated@example.com",
          },
        },
        {
          path: `inquirySubmissions/${activeOrphanId}/referenceUploads/${activeOrphanReferenceId}`,
          value: {
            draftId: activeOrphanId,
            referenceId: activeOrphanReferenceId,
            objectPath: `inquiryReferences/${activeOrphanId}/active-ticket-object`,
            uploadProtection: "reserving-generation-v1",
            expiresAt: futureAt,
          },
        },
        {
          path: `inquirySubmissions/${expiredOrphanId}/referenceUploads/${expiredOrphanReferenceId}`,
          value: {
            draftId: expiredOrphanId,
            referenceId: expiredOrphanReferenceId,
            objectPath: `inquiryReferences/${expiredOrphanId}/expired-ticket-object`,
            uploadProtection: "generation-bound-v1",
            objectGeneration: "1",
            expiresAt: expiredAt,
          },
        },
        {
          path: `inquirySubmissions/${unreadableOrphanId}/referenceUploads/${unreadableOrphanReferenceId}`,
          value: {
            draftId: unreadableOrphanId,
            referenceId: unreadableOrphanReferenceId,
            objectPath: `inquiryReferences/${unreadableOrphanId}/unreadable-expiry-object`,
            uploadProtection: "reserving-generation-v1",
            expiresAt: "not-a-timestamp",
          },
        },
        {
          path: `inquirySubmissions/${draftId(2, "c")}/referenceUploads/${objectlessOrphanReferenceId}`,
          value: {
            draftId: draftId(2, "c"),
            referenceId: objectlessOrphanReferenceId,
            objectPath: `inquiryReferences/${draftId(2, "c")}/already-missing-object`,
            uploadProtection: "generation-bound-v1",
            objectGeneration: "1",
            expiresAt: expiredAt,
          },
        },
        {
          path: `inquirySubmissions/${draftId(3, "c")}/referenceUploads/${activeObjectlessReferenceId}`,
          value: {
            draftId: draftId(3, "c"),
            referenceId: activeObjectlessReferenceId,
            objectPath: `inquiryReferences/${draftId(3, "c")}/active-missing-object`,
            uploadProtection: "reserving-generation-v1",
            expiresAt: futureAt,
          },
        },
        {
          path: `inquirySubmissions/${draftId(4, "c")}/referenceUploads/malformed-ticket`,
          value: {
            draftId: "unrelated-draft",
            referenceId: "malformed-ticket",
            objectPath: "unrelated/prefix",
            expiresAt: expiredAt,
          },
        },
        ...pagedObjectlessOrphanTickets,
        ...Array.from({ length: 405 }, (_, index) => ({
          path: `planHomeResumeTokens/expired-${index.toString().padStart(3, "0")}`,
          value: {
            draftId: `standalone-expired-${index}`,
            status: "active",
            expiresAt: expiredAt,
          },
        })),
        {
          path: "planHomeResumeTokens/active-token",
          value: { draftId: liveId, status: "active", expiresAt: longFutureAt },
        },
      ]);

      const expiredPrefixObjects = Array.from({ length: 206 }, (_, index) => ({
        path: `inquiryReferences/${expiredIds[0]}/record-${index
          .toString()
          .padStart(3, "0")}`,
      }));
      const bulkOrphanObjects = Array.from({ length: 205 }, (_, index) => ({
        path: `inquiryReferences/${bulkOrphanId}/orphan-${index
          .toString()
          .padStart(3, "0")}`,
      }));
      await writeObjects(bucket, [
        ...expiredPrefixObjects,
        ...bulkOrphanObjects,
        {
          path: `inquiryReferences/${pendingId}/pending-capability`,
          referenceId: pendingReferenceId,
        },
        {
          path: `inquiryReferences/${liveId}/live-parent-object`,
          referenceId: liveReferenceId,
        },
        {
          path: `inquiryReferences/${activeOrphanId}/active-ticket-object`,
          referenceId: activeOrphanReferenceId,
        },
        {
          path: `inquiryReferences/${expiredOrphanId}/expired-ticket-object`,
          referenceId: expiredOrphanReferenceId,
        },
        {
          path: `inquiryReferences/${unreadableOrphanId}/unreadable-expiry-object`,
          referenceId: unreadableOrphanReferenceId,
        },
        { path: "inquiryReferences/unrelated-prefix/preserved-object" },
        { path: "otherPrivateObjects/preserved-object" },
      ]);

      const repository = createPlanHomeCleanupRepository(firestore, bucket, {
        now: () => currentTime,
      });
      const first = await repository.run();
      assert.equal(first.recordsDeleted, 101);
      assert.equal(first.recordsPending, 1);
      assert.equal(first.resumeTokensDeleted, 405);
      assert.equal(first.orphanObjectsDeleted, 206);
      assert.equal(first.orphanTicketsDeleted, 107);
      assert(first.protectedObjects >= 3);

      assert.equal(
        (await firestore.collection("inquirySubmissions").doc(liveId).get()).exists,
        true,
      );
      assert.equal(
        (await firestore.collection("inquirySubmissions").doc(pendingId).get()).exists,
        true,
      );
      assert.equal(
        (
          await firestore
            .collection("inquirySubmissions")
            .doc(pendingId)
            .get()
        ).data()?.status,
        "deleting",
      );
      assert.equal(
        (
          await firestore
            .collection("inquirySubmissions")
            .doc("unrelated-legacy-record")
            .get()
        ).exists,
        true,
      );
      assert.equal(
        (
          await bucket
            .file(
              `inquiryReferences/${unreadableOrphanId}/unreadable-expiry-object`,
            )
            .exists()
        )[0],
        true,
      );
      assert.equal(
        (
          await firestore
            .doc(
              `inquirySubmissions/${unreadableOrphanId}/referenceUploads/${unreadableOrphanReferenceId}`,
            )
            .get()
        ).exists,
        true,
      );
      for (const ticket of [
        pagedObjectlessOrphanTickets[0],
        pagedObjectlessOrphanTickets.at(-1),
      ]) {
        assert(ticket);
        assert.equal((await firestore.doc(ticket.path).get()).exists, false);
      }
      assert.equal(
        (
          await firestore
            .doc(
              `inquirySubmissions/${liveId}/referenceUploads/${liveExpiredReferenceId}`,
            )
            .get()
        ).exists,
        true,
      );
      assert.equal(
        (
          await firestore
            .doc(
              `inquirySubmissions/${draftId(2, "c")}/referenceUploads/${objectlessOrphanReferenceId}`,
            )
            .get()
        ).exists,
        false,
      );
      assert.equal(
        (
          await firestore
            .doc(
              `inquirySubmissions/${draftId(3, "c")}/referenceUploads/${activeObjectlessReferenceId}`,
            )
            .get()
        ).exists,
        true,
      );
      assert.equal(
        (
          await firestore
            .doc(
              `inquirySubmissions/${draftId(4, "c")}/referenceUploads/malformed-ticket`,
            )
            .get()
        ).exists,
        true,
      );
      assert.equal(
        (await firestore.collection("planHomeResumeTokens").doc("active-token").get())
          .exists,
        true,
      );
      assert.equal(
        (await bucket.file(`inquiryReferences/${liveId}/live-parent-object`).exists())[0],
        true,
      );
      assert.equal(
        (
          await bucket
            .file(`inquiryReferences/${activeOrphanId}/active-ticket-object`)
            .exists()
        )[0],
        true,
      );
      assert.equal(
        (
          await firestore
            .doc(
              `inquirySubmissions/${activeOrphanId}/referenceUploads/${activeOrphanReferenceId}`,
            )
            .get()
        ).exists,
        true,
      );
      assert.equal(
        (await bucket.file("inquiryReferences/unrelated-prefix/preserved-object").exists())[0],
        true,
      );
      assert.equal(
        (await bucket.file("otherPrivateObjects/preserved-object").exists())[0],
        true,
      );

      await bucket
        .file(`inquiryReferences/${pendingId}/late-capability-recreation`)
        .save(Buffer.from("late-private-reference"), { resumable: false });
      currentTime = new Date(futureAt.getTime() + 1);
      const second = await repository.run();
      assert.equal(second.recordsDeleted, 1);
      assert.equal(second.recordsPending, 0);
      assert.equal(
        (await firestore.collection("inquirySubmissions").doc(pendingId).get()).exists,
        false,
      );
      assert.equal(
        (
          await bucket
            .file(`inquiryReferences/${pendingId}/late-capability-recreation`)
            .exists()
        )[0],
        false,
      );

      const third = await repository.run();
      assert.equal(third.recordsDeleted, 0);
      assert.equal(third.recordsPending, 0);
      assert.equal(third.resumeTokensDeleted, 0);
      assert.equal(third.orphanObjectsDeleted, 0);
      assert.equal(third.orphanTicketsDeleted, 0);
      process.stdout.write(
        `Plan Home cleanup evidence: expiredRecordPages=2, recordsDeleted=${first.recordsDeleted + second.recordsDeleted}, pendingTombstoneRetained=true, lateCapabilityRecreationDeleted=true, expiredTokenBatches=2, resumeTokensDeleted=${first.resumeTokensDeleted}, parentPrefixObjectsDeleted=${expiredPrefixObjects.length}, orphanTicketPages=2, orphanTicketsDeleted=${first.orphanTicketsDeleted}, orphanObjectPages=2, orphanObjectsDeleted=${first.orphanObjectsDeleted}, objectlessOrphanTicketDeleted=true, activeOrphanCapabilityPreserved=true, unreadableTicketPreserved=true, liveParentPreserved=true, unrelatedPreserved=true, idempotent=true\n`,
      );
    } finally {
      await firestore.recursiveDelete(firestore.collection("inquirySubmissions"));
      await firestore.recursiveDelete(firestore.collection("planHomeResumeTokens"));
      await bucket.deleteFiles({ prefix: "inquiryReferences/", force: true });
      await bucket.deleteFiles({ prefix: "otherPrivateObjects/", force: true });
      await deleteApp(app);
    }
  },
);
