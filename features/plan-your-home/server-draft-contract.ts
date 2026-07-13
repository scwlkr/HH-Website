import { z } from "zod";

import {
  planHomeContactCheckpointSchema,
  type PlanHomeContactCheckpoint,
} from "./schemas.ts";
import {
  planHomeQuestions,
  planHomeZoneIds,
  validatePlanHomeAnswer,
  type PlanHomeAnswerMap,
  type PlanHomeQuestionId,
  type PlanHomeZoneId,
} from "./registry.ts";

const contactGateAnswerCount = 6;
const uuidV4Pattern =
  /(?:^|[:_-])[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=[:_-]|$)/i;

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(16)
  .max(200)
  .regex(
    /^[A-Za-z0-9:_-]+$/,
    "Idempotency keys may only contain letters, numbers, colons, underscores, and hyphens.",
  )
  .refine(
    (value) => uuidV4Pattern.test(value),
    "Idempotency keys must include a random UUID v4 segment.",
  );

const draftIdSchema = z
  .string()
  .regex(/^draft-[a-f0-9]{40}$/, "The draft ID is invalid.");

const welcomeNameSchema = z.preprocess(
  (value) => normalizeSingleLine(value),
  z.string().min(2).max(120),
);

const sourcePathSchema = z.preprocess(
  (value) => normalizeSingleLine(value),
  z.string().regex(/^\/[^\s]*$/).max(200),
);

const createEnvelopeSchema = z
  .object({
    idempotencyKey: idempotencyKeySchema,
    welcomeName: welcomeNameSchema,
    contact: planHomeContactCheckpointSchema,
    answers: z.record(z.string(), z.unknown()),
    sourcePath: sourcePathSchema.default("/plan-your-home"),
  })
  .strict();

const checkpointEnvelopeSchema = z
  .object({
    draftId: draftIdSchema,
    expectedRevision: z.number().int().positive(),
    idempotencyKey: idempotencyKeySchema,
    completedZoneId: z.enum(planHomeZoneIds),
    answers: z.record(z.string(), z.unknown()),
  })
  .strict();

export type PlanHomeDraftProgress = Readonly<{
  currentPromptId: PlanHomeQuestionId | "review";
  currentZoneId: PlanHomeZoneId;
  completedZoneIds: readonly PlanHomeZoneId[];
}>;

export type PlanHomeDraftContact = Readonly<{
  name: string;
  email: string;
  phone: string;
  search: Readonly<{
    name: string;
    email: string;
    phone: string;
  }>;
  manualFollowUpDisclosureAccepted: true;
}>;

export type PlanHomeDraftDerived = Readonly<{
  name: string;
  email: string;
  phone: string;
  targetLocation: string | null;
  squareFootageBand: string;
  finishLevel: string | null;
}>;

export type ParsedCreatePlanHomeDraftInput = Readonly<{
  idempotencyKey: string;
  welcomeName: string;
  contact: PlanHomeContactCheckpoint;
  answers: PlanHomeAnswerMap;
  sourcePath: string;
}>;

export type ParsedCheckpointPlanHomeDraftInput = Readonly<{
  draftId: string;
  expectedRevision: number;
  idempotencyKey: string;
  completedZoneId: PlanHomeZoneId;
  answers: PlanHomeAnswerMap;
}>;

export class PlanHomeDraftValidationError extends Error {
  readonly code = "validation";
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(issues.join(" "));
    this.name = "PlanHomeDraftValidationError";
    this.issues = issues;
  }
}

function normalizeSingleLine(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEnvelope<Output>(result: z.ZodSafeParseResult<Output>) {
  if (!result.success) {
    throw new PlanHomeDraftValidationError(
      result.error.issues.map((issue) => issue.message),
    );
  }

  return result.data;
}

function parseCanonicalAnswerPrefix(
  answers: Record<string, unknown>,
  answerCount: number,
): PlanHomeAnswerMap {
  const requiredQuestions = planHomeQuestions.slice(0, answerCount);
  const requiredIds = new Set(requiredQuestions.map((question) => question.id));
  const receivedIds = Object.keys(answers);
  const issues: string[] = [];

  for (const id of receivedIds) {
    if (!requiredIds.has(id as PlanHomeQuestionId)) {
      issues.push(`Answer ${id} is not valid at this checkpoint.`);
    }
  }

  const canonicalAnswers: Record<string, unknown> = {};
  for (const question of requiredQuestions) {
    if (!(question.id in answers)) {
      issues.push(`Answer ${question.id} is required at this checkpoint.`);
      continue;
    }

    const result = validatePlanHomeAnswer(question.id, answers[question.id]);
    if (!result.success) {
      issues.push(
        ...result.issues.map((issue) => `${question.id}: ${issue}`),
      );
      continue;
    }

    canonicalAnswers[question.id] = result.data;
  }

  if (receivedIds.length !== requiredQuestions.length) {
    issues.push(
      `This checkpoint requires exactly ${requiredQuestions.length} canonical answers.`,
    );
  }

  if (issues.length > 0) {
    throw new PlanHomeDraftValidationError([...new Set(issues)]);
  }

  return canonicalAnswers as PlanHomeAnswerMap;
}

function questionCountThroughZone(zoneId: PlanHomeZoneId) {
  const lastQuestionIndex = planHomeQuestions.findLastIndex(
    (question) => question.zoneId === zoneId,
  );

  if (lastQuestionIndex < 0) {
    throw new PlanHomeDraftValidationError(["The completed zone is unknown."]);
  }

  return lastQuestionIndex + 1;
}

export function parseCreatePlanHomeDraftInput(
  input: unknown,
): ParsedCreatePlanHomeDraftInput {
  const parsed = parseEnvelope(createEnvelopeSchema.safeParse(input));

  return {
    ...parsed,
    answers: parseCanonicalAnswerPrefix(
      parsed.answers,
      contactGateAnswerCount,
    ),
  };
}

export function parseCheckpointPlanHomeDraftInput(
  input: unknown,
): ParsedCheckpointPlanHomeDraftInput {
  const parsed = parseEnvelope(checkpointEnvelopeSchema.safeParse(input));

  return {
    ...parsed,
    answers: parseCanonicalAnswerPrefix(
      parsed.answers,
      questionCountThroughZone(parsed.completedZoneId),
    ),
  };
}

export function createContactGateProgress(): PlanHomeDraftProgress {
  const nextQuestion = planHomeQuestions[contactGateAnswerCount];
  if (!nextQuestion) {
    throw new Error("Question 7 is required for the contact-gate checkpoint.");
  }

  return {
    currentPromptId: nextQuestion.id,
    currentZoneId: nextQuestion.zoneId,
    completedZoneIds: [],
  };
}

export function createCompletedZoneProgress(
  completedZoneId: PlanHomeZoneId,
): PlanHomeDraftProgress {
  const completedZoneIndex = planHomeZoneIds.indexOf(completedZoneId);
  const answerCount = questionCountThroughZone(completedZoneId);
  const nextQuestion = planHomeQuestions[answerCount];

  return {
    currentPromptId: nextQuestion?.id ?? "review",
    currentZoneId: nextQuestion?.zoneId ?? completedZoneId,
    completedZoneIds: planHomeZoneIds.slice(0, completedZoneIndex + 1),
  };
}

export function createPlanHomeDraftContact(
  welcomeName: string,
  contact: PlanHomeContactCheckpoint,
): PlanHomeDraftContact {
  const normalizedName = String(normalizeSingleLine(welcomeName));
  const phoneSearch = contact.phone.replace(/\D/g, "");

  return {
    name: normalizedName,
    email: contact.email,
    phone: contact.phone,
    search: {
      name: normalizedName.toLocaleLowerCase("en-US"),
      email: contact.email,
      phone: phoneSearch,
    },
    manualFollowUpDisclosureAccepted: true,
  };
}

export function createPlanHomeDraftDerived(
  contact: PlanHomeDraftContact,
  answers: PlanHomeAnswerMap,
): PlanHomeDraftDerived {
  const lotLocation = answers["project.lot-location"];
  const targetLocation =
    lotLocation &&
    typeof lotLocation === "object" &&
    "locationUncertain" in lotLocation &&
    lotLocation.locationUncertain === false &&
    "location" in lotLocation &&
    typeof lotLocation.location === "string"
      ? lotLocation.location
      : null;
  const squareFootageBand = answers["home.heated-square-feet"];
  const finishLevel = answers["home.finish-level"];

  if (typeof squareFootageBand !== "string") {
    throw new PlanHomeDraftValidationError([
      "A canonical heated-square-footage answer is required.",
    ]);
  }

  return {
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    targetLocation,
    squareFootageBand,
    finishLevel: typeof finishLevel === "string" ? finishLevel : null,
  };
}
