import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import {
  ADMIN_INQUIRY_SIGNED_READ_TTL_MS,
  ADMIN_INQUIRY_UPLOAD_EXPIRY_GRACE_MS,
  AdminInquiryAuthorizationError,
  AdminInquiryReferenceUnavailableError,
  createAdminInquiryDetailRepository,
} from "../features/plan-your-home/admin-inquiry-detail.ts";
import { createPlanHomeDraftResumeRepository } from "../features/plan-your-home/draft-resume-repository.ts";
import {
  createPlanHomeReferenceRepository,
  PLAN_HOME_UPLOAD_CAPABILITY_MS,
} from "../features/plan-your-home/reference-repository.ts";
import {
  createPlanHomeDraftRepository,
  PlanHomeDraftConflictError,
} from "../features/plan-your-home/server-draft-repository.ts";
import { planHomeQuestions } from "../features/plan-your-home/registry.ts";
import { hashPlanHomeDraftSessionSecret } from "../lib/plan-your-home/draft-session-token.ts";

const hasEmulators = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST &&
    process.env.FIREBASE_STORAGE_EMULATOR_HOST,
);

const actor = { uid: "authorized-admin-test" } as const;

function answersThrough(questionNumber: number) {
  return Object.fromEntries(
    planHomeQuestions.slice(0, questionNumber).map((question) => [
      question.id,
      structuredClone(question.response.exampleAnswer),
    ]),
  );
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

test(
  "HHQ detail authorizes reads/actions, signs private reads, and deletes every associated artifact",
  { skip: !hasEmulators },
  async () => {
    const projectId =
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.FIREBASE_PROJECT_ID;
    assert(projectId);
    const bucketName = `${projectId}.firebasestorage.app`;
    const app = initializeApp(
      { projectId, storageBucket: bucketName },
      `admin-inquiry-detail-${randomUUID()}`,
    );
    const firestore = getFirestore(app);
    const bucket = getStorage(app).bucket(bucketName);
    const sessionSecret = `session-${randomUUID()}`;
    const sessionHash = hashPlanHomeDraftSessionSecret(sessionSecret);
    const draftRepository = createPlanHomeDraftRepository(firestore);
    const created = await draftRepository.createDraft(
      {
        idempotencyKey: `local-${randomUUID()}:plan-home-v1:contact-gate`,
        welcomeName: "Private Detail Test",
        contact: {
          email: `private-${randomUUID()}@example.com`,
          phone: "+12145550100",
          manualFollowUpDisclosureAccepted: true,
        },
        answers: answersThrough(6),
        sourcePath: "/plan-your-home",
      },
      sessionHash,
    );
    const inquiryId = created.draftId;
    const referenceId = "file-33333333-3333-4333-8333-333333333333";
    const objectPath = `inquiryReferences/${inquiryId}/canonical-private-file`;
    const unrelatedObjectPath =
      "inquiryReferences/unrelated-inquiry/preserved-object";
    const statusId = `legacy-status-${randomUUID()}`;
    const privateFileBody = Buffer.from("%PDF-private-test");
    let signedExpiry: Date | null = null;
    let currentTime = new Date("2026-08-11T18:00:00.000Z");
    const repository = createAdminInquiryDetailRepository(firestore, bucket, {
      now: () => currentTime,
      signRead: async (_file, expiresAt) => {
        signedExpiry = expiresAt;
        return "https://storage.googleapis.test/private-capability";
      },
    });

    try {
      await firestore.collection("inquirySubmissions").doc(inquiryId).update({
        references: [
          {
            id: referenceId,
            kind: "file",
            originalName: "private-plan.pdf",
            objectPath,
            extension: "pdf",
            mimeType: "application/pdf",
            sizeBytes: privateFileBody.byteLength,
            note: "Private test note",
            createdAt: currentTime.toISOString(),
          },
          {
            id: "link-44444444-4444-4444-8444-444444444444",
            kind: "link",
            url: "http://example.com/reference",
            hostname: "example.com",
            createdAt: currentTime.toISOString(),
          },
          {
            id: "link-55555555-5555-4555-8555-555555555555",
            kind: "link",
            url: "https://example.org/reference",
            hostname: "example.org",
            createdAt: currentTime.toISOString(),
          },
        ],
      });
      await firestore.collection("inquirySubmissions").doc(statusId).set({
        status: "new",
        name: "Legacy Status Test",
        email: "legacy-status@example.com",
        phone: "+12145550101",
        createdAt: currentTime,
      });
      await bucket.file(objectPath).save(privateFileBody, {
        metadata: {
          contentType: "application/pdf",
          metadata: {
            "plan-home-draft": inquiryId,
            "plan-home-reference": referenceId,
          },
        },
      });
      await bucket.file(unrelatedObjectPath).save(Buffer.from("preserve"));

      await assert.rejects(
        repository.read(inquiryId, null as never),
        AdminInquiryAuthorizationError,
      );
      const detail = await repository.read(inquiryId, actor);
      assert(detail);
      assert.equal(detail.references.length, 3);
      assert.equal(
        detail.references.filter(({ kind }) => kind === "link").length,
        2,
      );

      await assert.rejects(
        repository.updateStatus(statusId, "reviewed", null as never),
        AdminInquiryAuthorizationError,
      );
      await repository.updateStatus(statusId, "reviewed", actor);
      await repository.updateStatus(statusId, "spam", actor);
      assert.equal(
        (await repository.updateStatus(statusId, "spam", actor)).applied,
        false,
      );
      const statusRecord = (
        await firestore.collection("inquirySubmissions").doc(statusId).get()
      ).data();
      assert.equal(statusRecord?.status, "spam");
      assert.equal(statusRecord?.adminStatusAudit.length, 2);
      assert.equal(statusRecord?.adminStatusAudit[0].actorUid, actor.uid);

      const signedRead = await repository.issueSignedRead(
        inquiryId,
        referenceId,
        actor,
      );
      const capturedExpiry = signedExpiry as Date | null;
      assert(capturedExpiry);
      assert.equal(signedRead.expiresAt, capturedExpiry.toISOString());
      assert.equal(
        capturedExpiry.getTime() - currentTime.getTime(),
        ADMIN_INQUIRY_SIGNED_READ_TTL_MS,
      );
      await assert.rejects(
        repository.issueSignedRead(inquiryId, referenceId, null as never),
        AdminInquiryAuthorizationError,
      );
      await assert.rejects(
        repository.issueSignedRead(
          inquiryId,
          "file-99999999-9999-4999-8999-999999999999",
          actor,
        ),
        AdminInquiryReferenceUnavailableError,
      );
      await bucket.file(objectPath).setMetadata({
        contentType: "image/png",
      });
      await assert.rejects(
        repository.issueSignedRead(inquiryId, referenceId, actor),
        AdminInquiryReferenceUnavailableError,
      );
      await bucket
        .file(objectPath)
        .save(Buffer.concat([privateFileBody, Buffer.from("x")]), {
          metadata: {
            contentType: "application/pdf",
            metadata: {
              "plan-home-draft": inquiryId,
              "plan-home-reference": referenceId,
            },
          },
        });
      await assert.rejects(
        repository.issueSignedRead(inquiryId, referenceId, actor),
        AdminInquiryReferenceUnavailableError,
      );
      await bucket.file(objectPath).save(privateFileBody, {
        metadata: {
          contentType: "application/pdf",
          metadata: {
            "plan-home-draft": inquiryId,
            "plan-home-reference": referenceId,
          },
        },
      });

      const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
      assert(storageHost);
      const directResponse = await fetch(
        `http://${storageHost}/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(objectPath)}?alt=media`,
      );
      assert.equal(directResponse.status, 403);

      const orphanPaths = Array.from(
        { length: 205 },
        (_, index) => `inquiryReferences/${inquiryId}/orphan-${index}`,
      );
      for (let index = 0; index < orphanPaths.length; index += 25) {
        await Promise.all(
          orphanPaths
            .slice(index, index + 25)
            .map((path) => bucket.file(path).save(Buffer.from("orphan"))),
        );
      }
      await writeDocuments(
        firestore,
        Array.from({ length: 405 }, (_, index) => ({
          path: `planHomeResumeTokens/token-${inquiryId}-${index}`,
          value: {
            draftId: inquiryId,
            status: "rotated",
            tokenHash: `hash-${index}`,
          },
        })),
      );
      const uploadCapabilityExpiresAt = new Date(
        currentTime.getTime() + PLAN_HOME_UPLOAD_CAPABILITY_MS,
      );
      await writeDocuments(
        firestore,
        Array.from({ length: 3 }, (_, index) => ({
          path: `inquirySubmissions/${inquiryId}/referenceUploads/pending-${index}`,
          value: {
            draftId: inquiryId,
            objectPath: `inquiryReferences/${inquiryId}/orphan-${index}`,
            ...(index === 0 ? { expiresAt: uploadCapabilityExpiresAt } : {}),
          },
        })),
      );
      await firestore.collection("planHomeResumeTokens").doc("unrelated-token").set({
        draftId: "unrelated-inquiry",
        status: "active",
      });

      await assert.rejects(
        repository.deleteInquiry(inquiryId, null as never),
        AdminInquiryAuthorizationError,
      );

      const interruptedRepository = createAdminInquiryDetailRepository(
        firestore,
        bucket,
        {
          deletePrefix: async () => {
            throw new Error("simulated storage interruption");
          },
        },
      );
      await assert.rejects(
        interruptedRepository.deleteInquiry(inquiryId, actor),
        /simulated storage interruption/,
      );
      const guarded = (
        await firestore.collection("inquirySubmissions").doc(inquiryId).get()
      ).data();
      assert.equal(guarded?.status, "deleting");

      await assert.rejects(
        draftRepository.checkpointDraft(
          {
            draftId: inquiryId,
            expectedRevision: 1,
            idempotencyKey: `checkpoint-${randomUUID()}:project-and-living`,
            completedZoneId: "project-and-living",
            answers: answersThrough(11),
          },
          sessionHash,
        ),
        PlanHomeDraftConflictError,
      );
      const resumeRepository = createPlanHomeDraftResumeRepository(firestore, {
        secret: "detail-emulator-resume-secret-32-characters",
      });
      assert.equal(
        await resumeRepository.requestResumeLink({
          email: guarded?.contact.email,
          requesterIdentity: "203.0.113.20",
          publicOrigin: "http://localhost:3000",
        }),
        null,
      );
      const referenceRepository = createPlanHomeReferenceRepository(
        firestore,
        bucket,
        {
          signUpload: async () => "https://storage.googleapis.test/upload",
        },
      );
      await assert.rejects(
        referenceRepository.issueUpload(
          {
            draftId: inquiryId,
            expectedRevision: 1,
            originalName: "blocked.pdf",
            mimeType: "application/pdf",
            sizeBytes: 16,
          },
          sessionHash,
        ),
        PlanHomeDraftConflictError,
      );

      const pendingDeletion = await repository.deleteInquiry(inquiryId, actor);
      assert.equal(pendingDeletion.applied, false);
      assert.equal("pending" in pendingDeletion && pendingDeletion.pending, true);
      assert.equal(pendingDeletion.deletedObjects, 206);
      assert.equal(
        (
          await firestore.collection("inquirySubmissions").doc(inquiryId).get()
        ).data()?.status,
        "deleting",
      );

      const lateObjectPath =
        `inquiryReferences/${inquiryId}/late-capability-object`;
      await bucket.file(lateObjectPath).save(Buffer.from("late upload"));
      currentTime = new Date(
        uploadCapabilityExpiresAt.getTime() +
          ADMIN_INQUIRY_UPLOAD_EXPIRY_GRACE_MS +
          1,
      );
      const deletion = await repository.deleteInquiry(inquiryId, actor);
      assert.equal(deletion.applied, true);
      assert.equal(deletion.deletedObjects, 1);
      assert.equal(
        (
          await firestore.collection("inquirySubmissions").doc(inquiryId).get()
        ).exists,
        false,
      );
      assert.equal(
        (
          await firestore
            .collection("planHomeResumeTokens")
            .where("draftId", "==", inquiryId)
            .get()
        ).empty,
        true,
      );
      assert.equal(
        (
          await firestore
            .collection("inquirySubmissions")
            .doc(inquiryId)
            .collection("referenceUploads")
            .get()
        ).empty,
        true,
      );
      assert.equal(
        (await bucket.getFiles({ prefix: `inquiryReferences/${inquiryId}/` }))[0]
          .length,
        0,
      );
      assert.equal((await bucket.file(unrelatedObjectPath).exists())[0], true);
      assert.equal(
        (
          await firestore
            .collection("planHomeResumeTokens")
            .doc("unrelated-token")
            .get()
        ).exists,
        true,
      );
      const legacyDeletion = await repository.deleteInquiry(statusId, actor);
      assert.equal(legacyDeletion.applied, true);
      assert.equal(
        (
          await firestore.collection("inquirySubmissions").doc(statusId).get()
        ).exists,
        false,
      );

      process.stdout.write(
        "HHQ inquiry detail emulator evidence: authorizedRead=true, unauthorizedDenied=true, orderedAnswers=35, canonicalHttpHttpsLinks=2, signedReadTtlMinutes=5, directBrowserDenied=true, statusAuditEntries=2, deletionGuardBlocksDraftResumeReference=true, futureUploadExpiryPending=true, lateObjectRetryDeleted=true, legacyDeleteImmediate=true, tokenPages=2, objectPages=2, deletedPrefixObjects=207, unrelatedPreserved=true\n",
      );
    } finally {
      await firestore.recursiveDelete(
        firestore.collection("inquirySubmissions").doc(inquiryId),
      );
      await firestore.recursiveDelete(
        firestore.collection("inquirySubmissions").doc(statusId),
      );
      const tokens = await firestore.collection("planHomeResumeTokens").get();
      for (const document of tokens.docs) await document.ref.delete();
      await bucket.deleteFiles({
        prefix: `inquiryReferences/${inquiryId}/`,
        force: true,
      });
      await bucket.file(unrelatedObjectPath).delete({ ignoreNotFound: true });
      await deleteApp(app);
    }
  },
);
