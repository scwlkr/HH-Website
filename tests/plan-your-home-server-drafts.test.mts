import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PlanHomeDraftValidationError,
  createCompletedZoneProgress,
  createPlanHomeDraftContact,
  createPlanHomeDraftDerived,
  parseCreatePlanHomeDraftInput,
} from "../features/plan-your-home/server-draft-contract.ts";
import { createPlanHomeDraftRepository } from "../features/plan-your-home/server-draft-repository.ts";
import { planHomeQuestions } from "../features/plan-your-home/registry.ts";
import {
  derivePlanHomeDraftSessionSecret,
  hashPlanHomeDraftSessionSecret,
  parsePlanHomeDraftSession,
  serializePlanHomeDraftSession,
} from "../lib/plan-your-home/draft-session-token.ts";

const signingSecret = "a-test-only-signing-secret-with-32-characters";
const sessionHash = "a".repeat(64);
const localDraftId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

function answersThrough(questionNumber: number) {
  return Object.fromEntries(
    planHomeQuestions
      .slice(0, questionNumber)
      .map((question) => [question.id, question.response.exampleAnswer]),
  );
}

function validCreateInput() {
  return {
    idempotencyKey: `${localDraftId}:plan-home-v1:contact-gate`,
    welcomeName: "  Taylor   Homeowner  ",
    contact: {
      email: "Taylor@Example.COM",
      phone: "+1 (214) 555-0100",
      manualFollowUpDisclosureAccepted: true,
    },
    answers: answersThrough(6),
    sourcePath: "/plan-your-home",
  };
}

describe("Plan Your Home server draft contract", () => {
  it("rejects pre-contact and incomplete question 1-6 payloads before any repository write", async () => {
    let transactionCount = 0;
    const database = {
      collection() {
        return {
          doc() {
            return {};
          },
        };
      },
      async runTransaction() {
        transactionCount += 1;
        throw new Error("A validation failure must not reach Firestore.");
      },
    };
    const repository = createPlanHomeDraftRepository(database as never);
    const missingContact = { ...validCreateInput() };
    delete (missingContact as { contact?: unknown }).contact;
    const incompleteAnswers = validCreateInput();
    delete incompleteAnswers.answers["home.bed-bath-counts"];

    await assert.rejects(
      repository.createDraft(missingContact, sessionHash),
      PlanHomeDraftValidationError,
    );
    await assert.rejects(
      repository.createDraft(incompleteAnswers, sessionHash),
      PlanHomeDraftValidationError,
    );
    await assert.rejects(
      repository.createDraft(
        {
          ...validCreateInput(),
          contact: {
            ...validCreateInput().contact,
            manualFollowUpDisclosureAccepted: false,
          },
        },
        sessionHash,
      ),
      PlanHomeDraftValidationError,
    );
    await assert.rejects(
      repository.createDraft(
        {
          ...validCreateInput(),
          idempotencyKey: "plan-home-v1:contact-gate",
        },
        sessionHash,
      ),
      PlanHomeDraftValidationError,
    );
    assert.equal(transactionCount, 0);
  });

  it("normalizes contact and derives canonical searchable summary fields", () => {
    const parsed = parseCreatePlanHomeDraftInput(validCreateInput());
    const contact = createPlanHomeDraftContact(
      parsed.welcomeName,
      parsed.contact,
    );
    const derived = createPlanHomeDraftDerived(contact, parsed.answers);

    assert.equal(parsed.welcomeName, "Taylor Homeowner");
    assert.equal(parsed.contact.email, "taylor@example.com");
    assert.equal(parsed.contact.phone, "+12145550100");
    assert.deepEqual(contact.search, {
      name: "taylor homeowner",
      email: "taylor@example.com",
      phone: "12145550100",
    });
    assert.deepEqual(derived, {
      name: "Taylor Homeowner",
      email: "taylor@example.com",
      phone: "+12145550100",
      targetLocation: "Denton County",
      squareFootageBand: "under-1000",
      finishLevel: null,
    });
  });

  it("derives ordered progress for completed-zone checkpoints", () => {
    assert.deepEqual(createCompletedZoneProgress("project-and-living"), {
      currentPromptId: "kitchen.use",
      currentZoneId: "kitchen-and-dining",
      completedZoneIds: ["project-and-living"],
    });
    assert.deepEqual(createCompletedZoneProgress("design-desk-and-review"), {
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
  });
});

describe("Plan Your Home draft session token", () => {
  it("creates a stable opaque cookie while exposing only its hash to persistence", () => {
    const firstSecret = derivePlanHomeDraftSessionSecret(
      validCreateInput().idempotencyKey,
      signingSecret,
    );
    const retrySecret = derivePlanHomeDraftSessionSecret(
      validCreateInput().idempotencyKey,
      signingSecret,
    );
    const draftId = `draft-${"b".repeat(40)}`;
    const cookie = serializePlanHomeDraftSession({
      draftId,
      sessionSecret: firstSecret,
    });
    const parsed = parsePlanHomeDraftSession(cookie);

    assert.equal(firstSecret, retrySecret);
    assert.equal(parsed?.draftId, draftId);
    assert.equal(
      parsed?.sessionTokenHash,
      hashPlanHomeDraftSessionSecret(firstSecret),
    );
    assert(!parsed?.sessionTokenHash.includes(firstSecret));
    assert.equal(parsePlanHomeDraftSession("v1.invalid.secret"), null);
  });
});
