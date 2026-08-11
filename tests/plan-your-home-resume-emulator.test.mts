import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import {
  deleteApp,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import {
  createPlanHomeDraftResumeRepository,
  PlanHomeResumeUnavailableError,
} from "../features/plan-your-home/draft-resume-repository.ts";
import { createPlanHomeDraftRepository } from "../features/plan-your-home/server-draft-repository.ts";
import { planHomeQuestions } from "../features/plan-your-home/registry.ts";
import {
  PLAN_HOME_RESUME_RATE_LIMIT,
  PLAN_HOME_RESUME_TOKEN_TTL_MS,
  hashPlanHomeResumeValue,
} from "../lib/plan-your-home/draft-resume-token.ts";
import { hashPlanHomeDraftSessionSecret } from "../lib/plan-your-home/draft-session-token.ts";

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const secret = "resume-emulator-test-secret-with-32-characters";

function answersThrough(questionNumber: number) {
  return Object.fromEntries(
    planHomeQuestions
      .slice(0, questionNumber)
      .map((question) => [question.id, question.response.exampleAnswer]),
  );
}

async function assertUnavailable(result: Promise<unknown>) {
  await assert.rejects(
    result,
    (error) =>
      error instanceof PlanHomeResumeUnavailableError &&
      error.message === "The resume request is unavailable.",
  );
}

test(
  "Plan Your Home resume tokens are hashed, rotated, rate-limited, and consumed once",
  { skip: !hasEmulator },
  async () => {
    const projectId =
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.FIREBASE_PROJECT_ID;
    assert(projectId);
    const app = initializeApp(
      { projectId },
      `plan-home-resume-${process.pid}-${randomUUID()}`,
    );
    const firestore = getFirestore(app);
    let currentTime = new Date("2026-08-11T12:00:00.000Z");
    const rawTokens = ["A", "B", "C", "D", "E", "F", "G"].map((value) =>
      value.repeat(43),
    );
    const tokenQueue = [...rawTokens];
    const draftRepository = createPlanHomeDraftRepository(firestore, {
      now: () => currentTime,
    });
    const resumeRepository = createPlanHomeDraftResumeRepository(firestore, {
      secret,
      now: () => currentTime,
      createToken: () => {
        const token = tokenQueue.shift();
        assert(token);
        return token;
      },
      createSessionSecret: () => "S".repeat(43),
    });
    const email = `resume-${randomUUID()}@example.com`;
    const sessionHash = hashPlanHomeDraftSessionSecret("R".repeat(43));

    try {
      const created = await draftRepository.createDraft(
        {
          idempotencyKey: `local-${randomUUID()}:plan-home-v1:contact-gate`,
          welcomeName: "Resume Taylor",
          contact: {
            email,
            phone: "+12145550100",
            manualFollowUpDisclosureAccepted: true,
          },
          answers: answersThrough(6),
          sourcePath: "/plan-your-home",
        },
        sessionHash,
      );

      const request = {
        email: email.toUpperCase(),
        requesterIdentity: "203.0.113.10",
        publicOrigin: "http://localhost:3000",
      };
      const first = await resumeRepository.requestResumeLink(request);
      assert(first);
      const firstResumeUrl = new URL(first.resumeUrl);
      assert.equal(firstResumeUrl.pathname, "/plan-your-home/resume");
      assert.equal(firstResumeUrl.search, "");
      assert.equal(
        new URLSearchParams(firstResumeUrl.hash.slice(1)).get("token"),
        rawTokens[0],
      );
      assert.equal(
        first.expiresAt.getTime() - currentTime.getTime(),
        PLAN_HOME_RESUME_TOKEN_TTL_MS,
      );
      const firstHash = hashPlanHomeResumeValue("token", rawTokens[0], secret);
      const firstTokenDocument = (
        await firestore.collection("planHomeResumeTokens").doc(firstHash).get()
      ).data();
      assert(firstTokenDocument);
      assert.equal(firstTokenDocument.tokenHash, firstHash);
      assert.equal(firstTokenDocument.status, "active");
      assert.equal(
        JSON.stringify(firstTokenDocument).includes(rawTokens[0]),
        false,
      );

      const second = await resumeRepository.requestResumeLink(request);
      assert(second);
      const secondHash = hashPlanHomeResumeValue("token", rawTokens[1], secret);
      const rotatedFirst = (
        await firestore.collection("planHomeResumeTokens").doc(firstHash).get()
      ).data();
      assert.equal(rotatedFirst?.status, "rotated");
      await assertUnavailable(resumeRepository.consumeResumeToken(rawTokens[0]));

      const consumed = await resumeRepository.consumeResumeToken(rawTokens[1]);
      assert.equal(consumed.draftId, created.draftId);
      const consumedDocument = (
        await firestore.collection("planHomeResumeTokens").doc(secondHash).get()
      ).data();
      const restoredDraft = (
        await firestore.collection("inquirySubmissions").doc(created.draftId).get()
      ).data();
      assert.equal(consumedDocument?.status, "consumed");
      assert.equal(restoredDraft?.resumeAccess.activeTokenHash, null);
      assert.equal(
        restoredDraft?.draftSession.tokenHash,
        hashPlanHomeDraftSessionSecret(consumed.sessionSecret),
      );
      assert.equal(
        JSON.stringify(restoredDraft).includes(consumed.sessionSecret),
        false,
      );
      await assertUnavailable(resumeRepository.consumeResumeToken(rawTokens[1]));
      await assertUnavailable(
        resumeRepository.consumeResumeToken(`${rawTokens[1].slice(0, -1)}Z`),
      );
      await assertUnavailable(
        resumeRepository.consumeResumeToken("M".repeat(43)),
      );
      await assertUnavailable(resumeRepository.consumeResumeToken(null));

      const expiring = await resumeRepository.requestResumeLink(request);
      assert(expiring);
      const limited = await resumeRepository.requestResumeLink(request);
      assert.equal(limited, null);
      currentTime = new Date(
        currentTime.getTime() + PLAN_HOME_RESUME_TOKEN_TTL_MS,
      );
      await assertUnavailable(resumeRepository.consumeResumeToken(rawTokens[2]));

      const unknown = await resumeRepository.requestResumeLink({
        ...request,
        email: `missing-${randomUUID()}@example.com`,
      });
      assert.equal(unknown, null);

      const rateDocuments = await firestore
        .collection("planHomeResumeRateLimits")
        .get();
      assert(rateDocuments.size >= 3);
      const serializedRates = JSON.stringify(
        rateDocuments.docs.map((document) => document.data()),
      );
      assert.equal(serializedRates.includes(email), false);
      assert.equal(serializedRates.includes("203.0.113.10"), false);
      const emailRate = rateDocuments.docs
        .map((document) => document.data())
        .find((document) => document.kind === "email" && document.count > 1);
      assert.equal(emailRate?.count, PLAN_HOME_RESUME_RATE_LIMIT + 1);

      const secondEmail = `atomic-${randomUUID()}@example.com`;
      const secondDraft = await draftRepository.createDraft(
        {
          idempotencyKey: `local-${randomUUID()}:plan-home-v1:contact-gate`,
          welcomeName: "Atomic Taylor",
          contact: {
            email: secondEmail,
            phone: "+12145550101",
            manualFollowUpDisclosureAccepted: true,
          },
          answers: answersThrough(6),
          sourcePath: "/plan-your-home",
        },
        hashPlanHomeDraftSessionSecret("T".repeat(43)),
      );
      const concurrentDelivery = await resumeRepository.requestResumeLink({
        email: secondEmail,
        requesterIdentity: "203.0.113.11",
        publicOrigin: "http://localhost:3000",
      });
      assert(concurrentDelivery);
      const concurrent = await Promise.allSettled([
        resumeRepository.consumeResumeToken(rawTokens[3]),
        resumeRepository.consumeResumeToken(rawTokens[3]),
      ]);
      assert.equal(
        concurrent.filter((result) => result.status === "fulfilled").length,
        1,
      );
      assert.equal(
        concurrent.filter((result) => result.status === "rejected").length,
        1,
      );
      const repeatedFailure = concurrent.find(
        (result) => result.status === "rejected",
      );
      assert(
        repeatedFailure?.status === "rejected" &&
          repeatedFailure.reason instanceof PlanHomeResumeUnavailableError &&
          repeatedFailure.reason.message ===
            "The resume request is unavailable.",
      );

      const rateEmail = `rate-${randomUUID()}@example.com`;
      await draftRepository.createDraft(
        {
          idempotencyKey: `local-${randomUUID()}:plan-home-v1:contact-gate`,
          welcomeName: "Rate Taylor",
          contact: {
            email: rateEmail,
            phone: "+12145550102",
            manualFollowUpDisclosureAccepted: true,
          },
          answers: answersThrough(6),
          sourcePath: "/plan-your-home",
        },
        hashPlanHomeDraftSessionSecret("U".repeat(43)),
      );
      const simultaneousRequests = await Promise.all(
        Array.from({ length: 4 }, () =>
          resumeRepository.requestResumeLink({
            email: rateEmail,
            requesterIdentity: "203.0.113.12",
            publicOrigin: "http://localhost:3000",
          }),
        ),
      );
      assert.equal(
        simultaneousRequests.filter((delivery) => delivery !== null).length,
        PLAN_HOME_RESUME_RATE_LIMIT,
      );
      assert.equal(
        simultaneousRequests.filter((delivery) => delivery === null).length,
        1,
      );

      process.stdout.write(
        `Plan Home resume emulator evidence: draftIds=${created.draftId},${secondDraft.draftId}, rawTokenStored=false, tokenTtlMinutes=15, priorTokenRotated=true, singleUse=true, atomicConcurrentUse=true, sessionRotated=true, genericTokenFailures=missing-expired-used-tampered-repeated, genericMissingResult=true, concurrentEmailRateLimit=${PLAN_HOME_RESUME_RATE_LIMIT}\n`,
      );
    } finally {
      await deleteApp(app);
    }
  },
);
