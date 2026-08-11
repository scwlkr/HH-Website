import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import {
  deleteApp,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import { createPlanHomeReferenceRepository } from "../features/plan-your-home/reference-repository.ts";
import { PlanHomeReferenceValidationError } from "../features/plan-your-home/reference-upload-contract.ts";
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

function answersThrough(questionNumber: number) {
  return Object.fromEntries(
    planHomeQuestions.slice(0, questionNumber).map((question) => [
      question.id,
      structuredClone(question.response.exampleAnswer),
    ]),
  );
}

test(
  "private reference objects finalize, mismatch-delete, remove, and orphan-clean in Firebase emulators",
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
      `plan-home-references-${randomUUID()}`,
    );
    const firestore = getFirestore(app);
    const bucket = getStorage(app).bucket(bucketName);
    const sessionHash = hashPlanHomeDraftSessionSecret(`session-${randomUUID()}`);
    const draftRepository = createPlanHomeDraftRepository(firestore);
    const created = await draftRepository.createDraft(
      {
        idempotencyKey: `local-${randomUUID()}:plan-home-v1:contact-gate`,
        welcomeName: "Reference Test",
        contact: {
          email: "references@example.com",
          phone: "+12145550100",
          manualFollowUpDisclosureAccepted: true,
        },
        answers: answersThrough(6),
        sourcePath: "/plan-your-home",
      },
      sessionHash,
    );
    let currentTime = new Date("2026-08-11T15:00:00.000Z");
    const signed: Array<{ objectPath: string; headers: Readonly<Record<string, string>> }> = [];
    const repository = createPlanHomeReferenceRepository(firestore, bucket, {
      now: () => currentTime,
      signUpload: async (objectPath, { headers }) => {
        signed.push({ objectPath, headers });
        return `https://storage.googleapis.test/${encodeURIComponent(objectPath)}?signed=true`;
      },
    });

    try {
      const pdfBody = Buffer.from("%PDF-1.7\nprivate-reference");
      const capability = await repository.issueUpload(
        {
          draftId: created.draftId,
          expectedRevision: 1,
          originalName: "plan.pdf",
          mimeType: "application/pdf",
          sizeBytes: pdfBody.byteLength,
        },
        sessionHash,
      );
      assert.match(capability.uploadUrl, /signed=true/);
      assert.equal(signed[0]?.headers["content-type"], "application/pdf");
      assert.equal(
        signed[0]?.headers["x-goog-meta-plan-home-draft"],
        created.draftId,
      );
      await bucket.file(capability.objectPath).save(pdfBody, {
        metadata: {
          contentType: "application/pdf",
          metadata: {
            "plan-home-draft": created.draftId,
            "plan-home-reference": capability.referenceId,
          },
        },
      });
      const finalized = await repository.finalizeUpload(
        {
          draftId: created.draftId,
          expectedRevision: 1,
          referenceId: capability.referenceId,
          note: "Floor plan direction",
        },
        sessionHash,
      );
      assert.equal(finalized.revision, 2);
      assert.equal(finalized.references.length, 1);
      const storedAfterFinalize = (
        await firestore.collection("inquirySubmissions").doc(created.draftId).get()
      ).data();
      assert.equal(storedAfterFinalize?.references.length, 1);
      assert.equal(storedAfterFinalize?.references[0].objectPath, capability.objectPath);
      assert.equal(storedAfterFinalize?.references[0].downloadToken, undefined);
      assert.equal(
        storedAfterFinalize?.referenceUploadCapabilityExpiresAt
          .toDate()
          .toISOString(),
        capability.expiresAt,
      );
      await assert.rejects(
        repository.removeReference(
          {
            draftId: created.draftId,
            expectedRevision: 1,
            referenceId: capability.referenceId,
          },
          sessionHash,
        ),
        PlanHomeDraftConflictError,
      );
      assert.equal((await bucket.file(capability.objectPath).exists())[0], true);
      const storedAfterStaleRemove = (
        await firestore.collection("inquirySubmissions").doc(created.draftId).get()
      ).data();
      assert.equal(storedAfterStaleRemove?.references.length, 1);
      assert.equal(
        storedAfterStaleRemove?.references[0].objectPath,
        capability.objectPath,
      );

      const imageBody = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
      ]);
      const imageCapability = await repository.issueUpload(
        {
          draftId: created.draftId,
          expectedRevision: 2,
          originalName: "inspiration.png",
          mimeType: "image/png",
          sizeBytes: imageBody.byteLength,
        },
        sessionHash,
      );
      await bucket.file(imageCapability.objectPath).save(imageBody, {
        metadata: {
          contentType: "image/png",
          metadata: {
            "plan-home-draft": created.draftId,
            "plan-home-reference": imageCapability.referenceId,
          },
        },
      });
      const imageFinalized = await repository.finalizeUpload(
        {
          draftId: created.draftId,
          expectedRevision: 2,
          referenceId: imageCapability.referenceId,
          note: "Material palette",
        },
        sessionHash,
      );
      assert.equal(imageFinalized.revision, 3);
      assert.equal(imageFinalized.references.length, 2);
      assert.equal(
        imageFinalized.references[1]?.kind === "file"
          ? imageFinalized.references[1].mimeType
          : null,
        "image/png",
      );

      const mismatchBody = Buffer.from("<svg>not a png</svg>");
      const mismatch = await repository.issueUpload(
        {
          draftId: created.draftId,
          expectedRevision: 3,
          originalName: "wrong.png",
          mimeType: "image/png",
          sizeBytes: mismatchBody.byteLength,
        },
        sessionHash,
      );
      await bucket.file(mismatch.objectPath).save(mismatchBody, {
        metadata: {
          contentType: "image/png",
          metadata: {
            "plan-home-draft": created.draftId,
            "plan-home-reference": mismatch.referenceId,
          },
        },
      });
      await assert.rejects(
        repository.finalizeUpload(
          {
            draftId: created.draftId,
            expectedRevision: 3,
            referenceId: mismatch.referenceId,
            note: "",
          },
          sessionHash,
        ),
        PlanHomeReferenceValidationError,
      );
      assert.equal((await bucket.file(mismatch.objectPath).exists())[0], false);
      assert.equal(
        (
          await firestore
            .collection("inquirySubmissions")
            .doc(created.draftId)
            .collection("referenceUploads")
            .doc(mismatch.referenceId)
            .get()
        ).exists,
        false,
      );

      const linked = await repository.addLink(
        {
          draftId: created.draftId,
          expectedRevision: 3,
          url: "HTTPS://Example.com/House",
          note: "Exterior reference",
        },
        sessionHash,
      );
      assert.equal(linked.revision, 4);
      assert.equal(linked.references[2]?.kind, "link");
      assert.equal(
        linked.references[2]?.kind === "link"
          ? linked.references[2].hostname
          : null,
        "example.com",
      );

      const removed = await repository.removeReference(
        {
          draftId: created.draftId,
          expectedRevision: 4,
          referenceId: capability.referenceId,
        },
        sessionHash,
      );
      assert.equal(removed.revision, 5);
      assert.equal((await bucket.file(capability.objectPath).exists())[0], false);
      assert.equal(removed.references.length, 2);
      const storedAfterValidRemove = (
        await firestore.collection("inquirySubmissions").doc(created.draftId).get()
      ).data();
      assert.equal(storedAfterValidRemove?.references.length, 2);
      assert.equal(
        storedAfterValidRemove?.references.some(
          (reference: { id: string }) => reference.id === capability.referenceId,
        ),
        false,
      );

      const orphanBody = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
      const orphan = await repository.issueUpload(
        {
          draftId: created.draftId,
          expectedRevision: 5,
          originalName: "orphan.jpg",
          mimeType: "image/jpeg",
          sizeBytes: orphanBody.byteLength,
        },
        sessionHash,
      );
      await bucket.file(orphan.objectPath).save(orphanBody, {
        metadata: {
          contentType: "image/jpeg",
          metadata: {
            "plan-home-draft": created.draftId,
            "plan-home-reference": orphan.referenceId,
          },
        },
      });
      currentTime = new Date(currentTime.getTime() + 11 * 60 * 1000);
      const cleanup = await repository.cleanupExpiredUploadsForDraft(
        created.draftId,
        sessionHash,
      );
      assert.equal(cleanup.deleted, 1);
      assert.equal((await bucket.file(orphan.objectPath).exists())[0], false);

      process.stdout.write(
        `Plan Home reference emulator evidence: draftCreated=true, signedCapability=true, privatePathScoped=true, finalizedPdf=true, finalizedImage=true, finalizedMetadata=2, mismatchDeleted=true, staleRemovePreserved=true, removeDeleted=true, orphanDeleted=${cleanup.deleted}\n`,
      );
    } finally {
      await firestore.recursiveDelete(
        firestore.collection("inquirySubmissions").doc(created.draftId),
      );
      await deleteApp(app);
    }
  },
);
