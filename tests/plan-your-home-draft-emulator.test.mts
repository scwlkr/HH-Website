import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import {
  deleteApp as deleteAdminApp,
  initializeApp as initializeAdminApp,
} from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import {
  deleteApp as deleteClientApp,
  initializeApp as initializeClientApp,
} from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore as getClientFirestore,
  setDoc,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getBytes,
  getStorage,
  ref,
  uploadString,
} from "firebase/storage";

import {
  PlanHomeDraftAuthorizationError,
  PlanHomeDraftConflictError,
  createPlanHomeDraftRepository,
} from "../features/plan-your-home/server-draft-repository.ts";
import {
  planHomeQuestions,
  summarizePlanHomeAnswer,
} from "../features/plan-your-home/registry.ts";
import { hashPlanHomeDraftSessionSecret } from "../lib/plan-your-home/draft-session-token.ts";

const hasEmulators = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST &&
    process.env.FIREBASE_STORAGE_EMULATOR_HOST,
);

function parseHost(value: string) {
  const normalized = value.replace(/^https?:\/\//, "");
  const [host, portText] = normalized.split(":");
  const port = Number.parseInt(portText ?? "", 10);

  if (!host || !Number.isInteger(port)) {
    throw new Error(`Invalid emulator host: ${value}`);
  }

  return { host, port };
}

function answersThrough(questionNumber: number) {
  return Object.fromEntries(
    planHomeQuestions
      .slice(0, questionNumber)
      .map((question) => [question.id, question.response.exampleAnswer]),
  );
}

function isDenied(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "permission-denied" ||
      error.code === "storage/unauthorized")
  );
}

test(
  "Plan Your Home draft repository is revision-safe in Firebase emulators",
  { skip: !hasEmulators },
  async () => {
    const projectId =
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.FIREBASE_PROJECT_ID;
    assert(projectId, "A Firebase emulator project ID is required.");

    const appName = `plan-home-drafts-${process.pid}-${randomUUID()}`;
    const adminApp = initializeAdminApp({ projectId }, appName);
    const firestore = getAdminFirestore(adminApp);
    const repository = createPlanHomeDraftRepository(firestore);
    const legacyId = `legacy-inquiry-${randomUUID()}`;
    const idempotencyKey = `local-${randomUUID()}:plan-home-v1:contact-gate`;
    const rawSessionSecret = `raw-session-${randomUUID()}`;
    const sessionTokenHash = hashPlanHomeDraftSessionSecret(rawSessionSecret);
    const createInput = {
      idempotencyKey,
      welcomeName: "  Taylor   Homeowner  ",
      contact: {
        email: "Taylor@Example.COM",
        phone: "+1 (214) 555-0100",
        manualFollowUpDisclosureAccepted: true,
      },
      answers: answersThrough(6),
      sourcePath: "/plan-your-home",
    };

    try {
      await firestore.collection("inquirySubmissions").doc(legacyId).create({
        name: "Legacy Inquiry",
        email: "legacy@example.com",
        status: "new",
        createdAt: new Date("2026-07-13T12:00:00.000Z"),
      });

      const countBeforeInvalidCreate = (
        await firestore.collection("inquirySubmissions").get()
      ).size;
      const incompleteInput = {
        ...createInput,
        idempotencyKey: `invalid-${randomUUID()}`,
        answers: answersThrough(5),
      };
      await assert.rejects(
        repository.createDraft(incompleteInput, sessionTokenHash),
      );
      assert.equal(
        (await firestore.collection("inquirySubmissions").get()).size,
        countBeforeInvalidCreate,
        "Invalid pre-contact data must not create a record.",
      );

      const created = await repository.createDraft(
        createInput,
        sessionTokenHash,
      );
      assert.equal(created.applied, true);
      assert.equal(created.revision, 1);

      const retriedCreate = await repository.createDraft(
        createInput,
        sessionTokenHash,
      );
      assert.deepEqual(retriedCreate, { ...created, applied: false });

      const collectionAfterCreate = await firestore
        .collection("inquirySubmissions")
        .get();
      const draftSnapshot = await firestore
        .collection("inquirySubmissions")
        .doc(created.draftId)
        .get();
      const createdDocument = draftSnapshot.data();
      assert(createdDocument, "The created draft must exist.");
      assert.equal(collectionAfterCreate.size, countBeforeInvalidCreate + 1);
      assert.equal(createdDocument.schemaVersion, 2);
      assert.equal(createdDocument.experience, "plan-your-home");
      assert.equal(createdDocument.status, "draft");
      assert.equal(createdDocument.contact.email, "taylor@example.com");
      assert.equal(createdDocument.contact.phone, "+12145550100");
      assert.deepEqual(createdDocument.contact.search, {
        name: "taylor homeowner",
        email: "taylor@example.com",
        phone: "12145550100",
      });
      assert.equal(createdDocument.derived.targetLocation, "Denton County");
      assert.equal(createdDocument.derived.finishLevel, null);
      assert.deepEqual(createdDocument.progress, {
        currentPromptId: "home.future-support",
        currentZoneId: "project-and-living",
        completedZoneIds: [],
      });
      assert.equal(createdDocument.revision, 1);
      assert.equal(createdDocument.draftSession.tokenHash, sessionTokenHash);
      assert.equal(createdDocument.createIdempotency.resultRevision, 1);
      assert.equal(
        createdDocument.expiresAt.toMillis() -
          createdDocument.updatedAt.toMillis(),
        180 * 24 * 60 * 60 * 1000,
      );
      assert(
        !JSON.stringify(createdDocument).includes(rawSessionSecret),
        "The raw draft session secret must never be stored.",
      );

      const zoneCheckpoint = {
        draftId: created.draftId,
        expectedRevision: 1,
        idempotencyKey: `local-${randomUUID()}:plan-home-v1:zone:project-and-living`,
        completedZoneId: "project-and-living",
        answers: answersThrough(11),
      };

      await assert.rejects(
        repository.checkpointDraft(zoneCheckpoint, ""),
        PlanHomeDraftAuthorizationError,
      );
      await assert.rejects(
        repository.checkpointDraft(zoneCheckpoint, "f".repeat(64)),
        PlanHomeDraftAuthorizationError,
      );

      const checkpointed = await repository.checkpointDraft(
        zoneCheckpoint,
        sessionTokenHash,
      );
      assert.equal(checkpointed.applied, true);
      assert.equal(checkpointed.revision, 2);
      assert.deepEqual(checkpointed.progress, {
        currentPromptId: "kitchen.use",
        currentZoneId: "kitchen-and-dining",
        completedZoneIds: ["project-and-living"],
      });

      const repeatedCheckpoint = await repository.checkpointDraft(
        zoneCheckpoint,
        sessionTokenHash,
      );
      assert.deepEqual(repeatedCheckpoint, {
        ...checkpointed,
        applied: false,
      });

      const changedAnswers = answersThrough(11);
      changedAnswers["home.heated-square-feet"] = "2500-2999";
      const staleCheckpoint = {
        ...zoneCheckpoint,
        idempotencyKey: `stale-${randomUUID()}`,
        answers: changedAnswers,
      };
      await assert.rejects(
        repository.checkpointDraft(staleCheckpoint, sessionTokenHash),
        (error: unknown) =>
          error instanceof PlanHomeDraftConflictError &&
          error.currentRevision === 2,
      );

      const afterStale = (
        await firestore
          .collection("inquirySubmissions")
          .doc(created.draftId)
          .get()
      ).data();
      assert(afterStale, "The draft must remain after a stale checkpoint.");
      assert.equal(afterStale.revision, 2);
      assert.equal(
        afterStale.answers["home.heated-square-feet"],
        createInput.answers["home.heated-square-feet"],
        "A stale checkpoint must not erase or overwrite newer answers.",
      );

      const kitchenCheckpoint = {
        draftId: created.draftId,
        expectedRevision: 2,
        idempotencyKey: `local-${randomUUID()}:plan-home-v1:zone:kitchen-and-dining`,
        completedZoneId: "kitchen-and-dining",
        answers: answersThrough(15),
      };
      const kitchenCheckpointResult = await repository.checkpointDraft(
        kitchenCheckpoint,
        sessionTokenHash,
      );
      assert.equal(kitchenCheckpointResult.applied, true);
      assert.equal(kitchenCheckpointResult.revision, 3);
      assert.deepEqual(kitchenCheckpointResult.progress, {
        currentPromptId: "primary.location",
        currentZoneId: "primary-suite",
        completedZoneIds: ["project-and-living", "kitchen-and-dining"],
      });
      assert.deepEqual(
        await repository.checkpointDraft(kitchenCheckpoint, sessionTokenHash),
        { ...kitchenCheckpointResult, applied: false },
      );

      const conflictingKitchenAnswers = answersThrough(15);
      conflictingKitchenAnswers["kitchen.use"] = ["large-groups"];
      await assert.rejects(
        repository.checkpointDraft(
          {
            ...kitchenCheckpoint,
            answers: conflictingKitchenAnswers,
          },
          sessionTokenHash,
        ),
        PlanHomeDraftConflictError,
      );

      const finalDraft = (
        await firestore
          .collection("inquirySubmissions")
          .doc(created.draftId)
          .get()
      ).data();
      assert(finalDraft, "The final draft must exist.");
      assert.equal(finalDraft.revision, 3);
      assert.equal(
        finalDraft.answers["home.heated-square-feet"],
        createInput.answers["home.heated-square-feet"],
      );
      assert.equal(finalDraft.derived.finishLevel, "builder-grade");
      assert.equal(Object.keys(finalDraft.answers).length, 15);
      assert.deepEqual(finalDraft.progress, {
        currentPromptId: "primary.location",
        currentZoneId: "primary-suite",
        completedZoneIds: ["project-and-living", "kitchen-and-dining"],
      });
      assert.equal(
        summarizePlanHomeAnswer(
          "kitchen.arrangement",
          finalDraft.answers["kitchen.arrangement"],
        ),
        "Work center: Single island; Connection: Open",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "kitchen.support",
          finalDraft.answers["kitchen.support"],
        ),
        "Cabinet pantry",
      );
      assert.equal(
        Object.keys(finalDraft.checkpointIdempotency).length,
        2,
      );

      const legacyDocument = (
        await firestore.collection("inquirySubmissions").doc(legacyId).get()
      ).data();
      assert.deepEqual(
        {
          name: legacyDocument?.name,
          email: legacyDocument?.email,
          status: legacyDocument?.status,
        },
        {
          name: "Legacy Inquiry",
          email: "legacy@example.com",
          status: "new",
        },
      );

      const planHomeDraftCount = (
        await firestore
          .collection("inquirySubmissions")
          .where("experience", "==", "plan-your-home")
          .get()
      ).size;
      assert.equal(planHomeDraftCount, 1);

      const firestoreHost = parseHost(
        process.env.FIRESTORE_EMULATOR_HOST!,
      );
      const storageHost = parseHost(
        process.env.FIREBASE_STORAGE_EMULATOR_HOST!,
      );
      const clientApp = initializeClientApp(
        {
          apiKey: "firebase-emulator-api-key",
          appId: "1:123456789012:web:plan-home-draft-emulator",
          projectId,
          storageBucket: `${projectId}.firebasestorage.app`,
        },
        `plan-home-client-${randomUUID()}`,
      );

      try {
        const clientFirestore = getClientFirestore(clientApp);
        connectFirestoreEmulator(
          clientFirestore,
          firestoreHost.host,
          firestoreHost.port,
        );
        const deniedDocument = doc(
          clientFirestore,
          "inquirySubmissions",
          created.draftId,
        );
        await assert.rejects(getDoc(deniedDocument), isDenied);
        await assert.rejects(
          setDoc(doc(clientFirestore, "inquirySubmissions", "browser-write"), {
            status: "draft",
          }),
          isDenied,
        );

        const clientStorage = getStorage(clientApp);
        connectStorageEmulator(
          clientStorage,
          storageHost.host,
          storageHost.port,
        );
        const deniedObject = ref(
          clientStorage,
          `inquiryReferences/${created.draftId}/browser-write.txt`,
        );
        await assert.rejects(uploadString(deniedObject, "denied"), isDenied);
        await assert.rejects(getBytes(deniedObject), isDenied);
      } finally {
        await deleteClientApp(clientApp);
      }

      process.stdout.write(
        `Plan Home emulator evidence: records=${collectionAfterCreate.size}, planHomeDrafts=${planHomeDraftCount}, draftId=${created.draftId}, revision=${finalDraft.revision}, currentPrompt=${finalDraft.progress.currentPromptId}, completedZones=${finalDraft.progress.completedZoneIds.length}, checkpointKeys=${Object.keys(finalDraft.checkpointIdempotency).length}, rawSessionStored=false, browserFirestoreDenied=true, browserStorageDenied=true\n`,
      );
    } finally {
      await deleteAdminApp(adminApp);
    }
  },
);
