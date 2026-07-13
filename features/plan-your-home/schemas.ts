import { z } from "zod";

import { planHomeReferenceCollectionSchema } from "./references.ts";
import {
  planHomeQuestionIds,
  planHomeZoneIds,
  validatePlanHomeAnswer,
} from "./registry.ts";

const timestampSchema = z.string().datetime({ offset: true });
const questionIdSchema = z.enum(planHomeQuestionIds);
const zoneIdSchema = z.enum(planHomeZoneIds);
const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(160));
const normalizedPhoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(32)
  .refine((value) => value.replace(/\D/g, "").length >= 10)
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    return value.startsWith("+") ? `+${digits}` : digits;
  });

function addAnswerIssues(
  answers: Record<string, unknown>,
  context: z.RefinementCtx,
) {
  for (const [id, answer] of Object.entries(answers)) {
    const result = validatePlanHomeAnswer(id, answer);
    if (!result.success) {
      for (const message of result.issues) {
        context.addIssue({ code: "custom", path: [id], message });
      }
    }
  }
}

export const partialPlanHomeAnswerMapSchema = z
  .partialRecord(questionIdSchema, z.unknown())
  .superRefine(addAnswerIssues);

export const completePlanHomeAnswerMapSchema = z
  .record(questionIdSchema, z.unknown())
  .superRefine((answers, context) => {
    addAnswerIssues(answers, context);

    for (const id of planHomeQuestionIds) {
      if (!(id in answers)) {
        context.addIssue({
          code: "custom",
          path: [id],
          message: "A submitted project brief requires this answer.",
        });
      }
    }

    if (Object.keys(answers).length !== planHomeQuestionIds.length) {
      context.addIssue({
        code: "custom",
        message: "A submitted project brief must contain exactly 35 canonical answers.",
      });
    }
  });

const completedZoneIdsSchema = z
  .array(zoneIdSchema)
  .max(planHomeZoneIds.length)
  .refine((values) => new Set(values).size === values.length, "Completed zones must be unique.");

const localProgressSchema = z
  .object({
    currentQuestionId: questionIdSchema,
    completedZoneIds: completedZoneIdsSchema,
  })
  .strict();

export const localDraftSnapshotSchema = z
  .object({
    snapshotVersion: z.literal(1),
    definitionId: z.literal("plan-home-v1"),
    welcomeName: z.string().trim().min(1).max(120),
    answers: partialPlanHomeAnswerMapSchema,
    progress: localProgressSchema,
    references: planHomeReferenceCollectionSchema,
    savedAt: timestampSchema,
    expiresAt: timestampSchema,
  })
  .strict();

const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: normalizedEmailSchema,
    phone: normalizedPhoneSchema,
    preferredFollowUp: z.enum(["email", "phone-call", "text-message"]),
    manualFollowUpDisclosureAccepted: z.literal(true),
  })
  .strict();

const submittedProgressSchema = z
  .object({
    currentQuestionId: questionIdSchema,
    currentZoneId: zoneIdSchema,
    completedZoneIds: completedZoneIdsSchema,
  })
  .strict()
  .refine(
    (progress) => progress.completedZoneIds.length === planHomeZoneIds.length,
    "Submitted project briefs must have all seven zones completed.",
  );

const sourceSchema = z
  .object({
    path: z.string().trim().regex(/^\/[^\s]*$/).max(200),
    attribution: z.record(z.string().max(80), z.string().max(120)),
  })
  .strict();

const derivedSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: normalizedEmailSchema,
    phone: normalizedPhoneSchema,
    targetLocation: z.string().trim().min(2).max(160).nullable(),
    squareFootageBand: z.string().refine(
      (value) => validatePlanHomeAnswer("home.heated-square-feet", value).success,
      "Derived square-footage band must be canonical.",
    ),
    finishLevel: z.string().refine(
      (value) => validatePlanHomeAnswer("home.finish-level", value).success,
      "Derived finish level must be canonical.",
    ),
    lastActivityAt: timestampSchema,
  })
  .strict();

export const submittedProjectBriefSchema = z
  .object({
    schemaVersion: z.literal(2),
    experience: z.literal("plan-your-home"),
    definitionId: z.literal("plan-home-v1"),
    status: z.enum(["submitted", "reviewed", "spam"]),
    contact: contactSchema,
    answers: completePlanHomeAnswerMapSchema,
    progress: submittedProgressSchema,
    references: planHomeReferenceCollectionSchema,
    source: sourceSchema,
    derived: derivedSchema,
    revision: z.number().int().nonnegative(),
    acceptedConsentVersion: z.string().trim().min(1).max(80),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    submittedAt: timestampSchema,
    expiresAt: timestampSchema,
  })
  .strict();

export type LocalDraftSnapshot = z.infer<typeof localDraftSnapshotSchema>;
export type SubmittedProjectBrief = z.infer<typeof submittedProjectBriefSchema>;
export type PartialPlanHomeAnswerMap = z.infer<
  typeof partialPlanHomeAnswerMapSchema
>;
