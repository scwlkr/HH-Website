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
  PLAN_HOME_SUBMITTED_RETENTION_MS,
  createPlanHomeDraftRepository,
} from "../features/plan-your-home/server-draft-repository.ts";
import { PLAN_HOME_INQUIRY_CONSENT_VERSION } from "../features/plan-your-home/server-draft-contract.ts";
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
    const fixtureEmailInput = `Taylor+${randomUUID()}@Example.COM`;
    const fixtureEmail = fixtureEmailInput.toLowerCase();
    const createInput = {
      idempotencyKey,
      welcomeName: "  Taylor   Homeowner  ",
      contact: {
        email: fixtureEmailInput,
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
        await firestore
          .collection("inquirySubmissions")
          .where("contact.email", "==", fixtureEmail)
          .get()
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
        (
          await firestore
            .collection("inquirySubmissions")
            .where("contact.email", "==", fixtureEmail)
            .get()
        ).size,
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
        .where("contact.email", "==", fixtureEmail)
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
      assert.equal(createdDocument.contact.email, fixtureEmail);
      assert.equal(createdDocument.contact.phone, "+12145550100");
      assert.deepEqual(createdDocument.contact.search, {
        name: "taylor homeowner",
        email: fixtureEmail,
        phone: "12145550100",
      });
      assert.equal(createdDocument.derived.targetLocation, "Denton County");
      assert.equal(createdDocument.derived.finishLevel, null);
      assert.deepEqual(createdDocument.progress, {
        currentPromptId: "home.daily-life",
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
        answers: answersThrough(10),
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

      const changedAnswers = answersThrough(10);
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
        answers: answersThrough(13),
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

      const conflictingKitchenAnswers = answersThrough(13);
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

      const primarySuiteCheckpoint = {
        draftId: created.draftId,
        expectedRevision: 3,
        idempotencyKey: `local-${randomUUID()}:plan-home-v1:zone:primary-suite`,
        completedZoneId: "primary-suite",
        answers: answersThrough(17),
      };
      const primarySuiteCheckpointResult = await repository.checkpointDraft(
        primarySuiteCheckpoint,
        sessionTokenHash,
      );
      assert.equal(primarySuiteCheckpointResult.applied, true);
      assert.equal(primarySuiteCheckpointResult.revision, 4);
      assert.deepEqual(primarySuiteCheckpointResult.progress, {
        currentPromptId: "secondary.users-layout",
        currentZoneId: "bedrooms-and-shared-bathrooms",
        completedZoneIds: [
          "project-and-living",
          "kitchen-and-dining",
          "primary-suite",
        ],
      });
      assert.deepEqual(
        await repository.checkpointDraft(
          primarySuiteCheckpoint,
          sessionTokenHash,
        ),
        { ...primarySuiteCheckpointResult, applied: false },
      );

      const conflictingPrimaryAnswers = answersThrough(17);
      conflictingPrimaryAnswers["primary.location"] = "upper-floor";
      await assert.rejects(
        repository.checkpointDraft(
          {
            ...primarySuiteCheckpoint,
            answers: conflictingPrimaryAnswers,
          },
          sessionTokenHash,
        ),
        PlanHomeDraftConflictError,
      );

      const bedroomsCheckpoint = {
        draftId: created.draftId,
        expectedRevision: 4,
        idempotencyKey: `local-${randomUUID()}:plan-home-v1:zone:bedrooms-and-shared-bathrooms`,
        completedZoneId: "bedrooms-and-shared-bathrooms",
        answers: answersThrough(19),
      };
      const bedroomsCheckpointResult = await repository.checkpointDraft(
        bedroomsCheckpoint,
        sessionTokenHash,
      );
      assert.equal(bedroomsCheckpointResult.applied, true);
      assert.equal(bedroomsCheckpointResult.revision, 5);
      assert.deepEqual(bedroomsCheckpointResult.progress, {
        currentPromptId: "utility.laundry",
        currentZoneId: "utility-and-systems",
        completedZoneIds: [
          "project-and-living",
          "kitchen-and-dining",
          "primary-suite",
          "bedrooms-and-shared-bathrooms",
        ],
      });
      assert.deepEqual(
        await repository.checkpointDraft(
          bedroomsCheckpoint,
          sessionTokenHash,
        ),
        { ...bedroomsCheckpointResult, applied: false },
      );

      const conflictingBedroomsAnswers = answersThrough(19);
      conflictingBedroomsAnswers["secondary.bath-sharing"] = "mixed-approach";
      await assert.rejects(
        repository.checkpointDraft(
          {
            ...bedroomsCheckpoint,
            answers: conflictingBedroomsAnswers,
          },
          sessionTokenHash,
        ),
        PlanHomeDraftConflictError,
      );

      const utilityCheckpoint = {
        draftId: created.draftId,
        expectedRevision: 5,
        idempotencyKey: `local-${randomUUID()}:plan-home-v1:zone:utility-and-systems`,
        completedZoneId: "utility-and-systems",
        answers: answersThrough(21),
      };
      const utilityCheckpointResult = await repository.checkpointDraft(
        utilityCheckpoint,
        sessionTokenHash,
      );
      assert.equal(utilityCheckpointResult.applied, true);
      assert.equal(utilityCheckpointResult.revision, 6);
      assert.deepEqual(utilityCheckpointResult.progress, {
        currentPromptId: "exterior.garage",
        currentZoneId: "exterior-and-site",
        completedZoneIds: [
          "project-and-living",
          "kitchen-and-dining",
          "primary-suite",
          "bedrooms-and-shared-bathrooms",
          "utility-and-systems",
        ],
      });
      assert.deepEqual(
        await repository.checkpointDraft(utilityCheckpoint, sessionTokenHash),
        { ...utilityCheckpointResult, applied: false },
      );

      const conflictingUtilityAnswers = answersThrough(21);
      conflictingUtilityAnswers["home.systems"] = ["generator"];
      await assert.rejects(
        repository.checkpointDraft(
          {
            ...utilityCheckpoint,
            answers: conflictingUtilityAnswers,
          },
          sessionTokenHash,
        ),
        PlanHomeDraftConflictError,
      );

      const exteriorCheckpoint = {
        draftId: created.draftId,
        expectedRevision: 6,
        idempotencyKey: `local-${randomUUID()}:plan-home-v1:zone:exterior-and-site`,
        completedZoneId: "exterior-and-site",
        answers: answersThrough(26),
      };
      const exteriorCheckpointResult = await repository.checkpointDraft(
        exteriorCheckpoint,
        sessionTokenHash,
      );
      assert.equal(exteriorCheckpointResult.applied, true);
      assert.equal(exteriorCheckpointResult.revision, 7);
      assert.deepEqual(exteriorCheckpointResult.progress, {
        currentPromptId: "design.feeling",
        currentZoneId: "design-desk-and-review",
        completedZoneIds: [
          "project-and-living",
          "kitchen-and-dining",
          "primary-suite",
          "bedrooms-and-shared-bathrooms",
          "utility-and-systems",
          "exterior-and-site",
        ],
      });
      assert.deepEqual(
        await repository.checkpointDraft(exteriorCheckpoint, sessionTokenHash),
        { ...exteriorCheckpointResult, applied: false },
      );

      const conflictingExteriorAnswers = answersThrough(26);
      conflictingExteriorAnswers["home.specialty-spaces"] = ["workshop"];
      await assert.rejects(
        repository.checkpointDraft(
          {
            ...exteriorCheckpoint,
            answers: conflictingExteriorAnswers,
          },
          sessionTokenHash,
        ),
        PlanHomeDraftConflictError,
      );

      const designDeskCheckpoint = {
        draftId: created.draftId,
        expectedRevision: 7,
        idempotencyKey: `local-${randomUUID()}:plan-home-v1:zone:design-desk-and-review`,
        completedZoneId: "design-desk-and-review",
        answers: answersThrough(30),
      };
      const designDeskCheckpointResult = await repository.checkpointDraft(
        designDeskCheckpoint,
        sessionTokenHash,
      );
      assert.equal(designDeskCheckpointResult.revision, 8);
      assert.equal(designDeskCheckpointResult.applied, true);
      assert.deepEqual(designDeskCheckpointResult.progress.completedZoneIds, [
        "project-and-living",
        "kitchen-and-dining",
        "primary-suite",
        "bedrooms-and-shared-bathrooms",
        "utility-and-systems",
        "exterior-and-site",
        "design-desk-and-review",
      ]);

      const submissionKey = `local-${randomUUID()}:plan-home-v1:submission`;
      const submissionInput = {
        draftId: created.draftId,
        expectedRevision: 8,
        idempotencyKey: submissionKey,
        answers: answersThrough(31),
        references: [],
        consent: {
          version: PLAN_HOME_INQUIRY_CONSENT_VERSION,
          inquiryAndProjectContactAccepted: true,
        },
      };
      await assert.rejects(
        repository.submitDraft(submissionInput, "f".repeat(64)),
        PlanHomeDraftAuthorizationError,
      );
      await assert.rejects(
        repository.submitDraft(
          { ...submissionInput, expectedRevision: 7 },
          sessionTokenHash,
        ),
        PlanHomeDraftConflictError,
      );
      await assert.rejects(
        repository.submitDraft(
          {
            ...submissionInput,
            answers: answersThrough(30),
          },
          sessionTokenHash,
        ),
      );

      const completedDraftReference = firestore
        .collection("inquirySubmissions")
        .doc(created.draftId);
      const completedDraft = (await completedDraftReference.get()).data();
      assert(completedDraft, "The completed draft must exist before submission.");
      const completeCheckpointIdempotency = completedDraft.checkpointIdempotency;
      const checkpointKeys = Object.keys(completeCheckpointIdempotency);
      assert.equal(checkpointKeys.length, 7);
      const incompleteCheckpointIdempotency = {
        ...completeCheckpointIdempotency,
      };
      delete incompleteCheckpointIdempotency[checkpointKeys[0]!];
      await completedDraftReference.update({
        checkpointIdempotency: incompleteCheckpointIdempotency,
      });
      await assert.rejects(
        repository.submitDraft(submissionInput, sessionTokenHash),
        PlanHomeDraftConflictError,
      );
      await completedDraftReference.update({
        checkpointIdempotency: completeCheckpointIdempotency,
      });

      const submitted = await repository.submitDraft(
        submissionInput,
        sessionTokenHash,
      );
      assert.equal(submitted.applied, true);
      assert.equal(submitted.revision, 9);
      assert.equal(submitted.notificationIntentCount, 0);
      assert.deepEqual(
        await repository.submitDraft(submissionInput, sessionTokenHash),
        { ...submitted, applied: false },
      );
      await assert.rejects(
        repository.submitDraft(
          {
            ...submissionInput,
            idempotencyKey: `local-${randomUUID()}:plan-home-v1:submission`,
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
      assert.equal(finalDraft.revision, 9);
      assert.equal(finalDraft.status, "submitted");
      assert.equal(
        finalDraft.answers["home.heated-square-feet"],
        createInput.answers["home.heated-square-feet"],
      );
      assert.equal(
        finalDraft.derived.finishLevel,
        "builder-grade",
      );
      assert.equal(Object.keys(finalDraft.answers).length, 31);
      assert.deepEqual(finalDraft.progress, {
        currentPromptId: "review",
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
      });
      assert.equal("currentQuestionId" in finalDraft.progress, false);
      assert.equal(
        finalDraft.contact.preferredFollowUp,
        "email",
      );
      assert.equal(
        finalDraft.acceptedConsentVersion,
        PLAN_HOME_INQUIRY_CONSENT_VERSION,
      );
      assert.equal(
        finalDraft.acceptedConsentAt.toDate().toISOString(),
        submitted.submittedAt,
      );
      assert.equal(
        finalDraft.submittedAt.toDate().toISOString(),
        submitted.submittedAt,
      );
      assert.equal(
        finalDraft.expiresAt.toMillis() - finalDraft.submittedAt.toMillis(),
        PLAN_HOME_SUBMITTED_RETENTION_MS,
      );
      assert.deepEqual(finalDraft.notificationIntents, []);
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
        summarizePlanHomeAnswer(
          "primary.location",
          finalDraft.answers["primary.location"],
        ),
        "Main floor",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "primary.closet-access",
          finalDraft.answers["primary.closet-access"],
        ),
        "One shared walk-in",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "secondary.users-layout",
          finalDraft.answers["secondary.users-layout"],
        ),
        "Users: Children, Guests; Arrangement: Grouped",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "secondary.bath-sharing",
          finalDraft.answers["secondary.bath-sharing"],
        ),
        "Hall bath",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "utility.laundry",
          finalDraft.answers["utility.laundry"],
        ),
        "Near bedrooms",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "home.systems",
          finalDraft.answers["home.systems"],
        ),
        "Energy efficiency",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "exterior.garage",
          finalDraft.answers["exterior.garage"],
        ),
        "Garage bays: 2; Needs: Storage",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "exterior.style",
          finalDraft.answers["exterior.style"],
        ),
        "Acadian",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "site.relationships",
          finalDraft.answers["site.relationships"],
        ),
        "Important views",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "exterior.outdoor-living",
          finalDraft.answers["exterior.outdoor-living"],
        ),
        "Covered porch",
      );
      assert.equal(
        summarizePlanHomeAnswer(
          "home.specialty-spaces",
          finalDraft.answers["home.specialty-spaces"],
        ),
        "Office",
      );
      assert.equal(
        Object.keys(finalDraft.checkpointIdempotency).length,
        7,
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
          .where("contact.email", "==", fixtureEmail)
          .get()
      ).docs.filter(
        (document) => document.data().experience === "plan-your-home",
      ).length;
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
        `Plan Home emulator evidence: records=${collectionAfterCreate.size}, planHomeDrafts=${planHomeDraftCount}, draftId=${created.draftId}, status=${finalDraft.status}, answerCount=${Object.keys(finalDraft.answers).length}, revision=${finalDraft.revision}, currentPrompt=${finalDraft.progress.currentPromptId}, completedZones=${finalDraft.progress.completedZoneIds.length}, checkpointKeys=${Object.keys(finalDraft.checkpointIdempotency).length}, consentVersion=${finalDraft.acceptedConsentVersion}, submittedAt=${finalDraft.submittedAt.toDate().toISOString()}, notificationIntents=${finalDraft.notificationIntents.length}, rawSessionStored=false, browserFirestoreDenied=true, browserStorageDenied=true\n`,
      );
    } finally {
      await deleteAdminApp(adminApp);
    }
  },
);
