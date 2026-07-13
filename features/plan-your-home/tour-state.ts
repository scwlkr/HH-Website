import { planHomeReferenceCollectionSchema } from "./references.ts";
import {
  planHomeQuestions,
  planHomeV1Definition,
  planHomeZoneIds,
  validatePlanHomeAnswer,
  type PlanHomeAnswerMap,
  type PlanHomeQuestionId,
  type PlanHomeZoneId,
} from "./registry.ts";
import {
  planHomeContactCheckpointSchema,
  type PlanHomeContactCheckpoint,
} from "./schemas.ts";
import type { PlanHomeReferenceMetadata } from "./references.ts";

export type PlanHomeTourLocation =
  | Readonly<{ kind: "welcome" }>
  | Readonly<{
      kind: "question";
      questionId: PlanHomeQuestionId;
      editingFromReview: boolean;
    }>
  | Readonly<{ kind: "contact-gate" }>
  | Readonly<{ kind: "review" }>;

export type PlanHomeTourState = Readonly<{
  definitionId: "plan-home-v1";
  welcomeName: string;
  answers: PlanHomeAnswerMap;
  location: PlanHomeTourLocation;
  contactCheckpoint: PlanHomeContactCheckpoint | null;
  completedZoneIds: readonly PlanHomeZoneId[];
  checkpointedZoneIds: readonly PlanHomeZoneId[];
  references: readonly PlanHomeReferenceMetadata[];
}>;

export type PlanHomeTourCommand =
  | Readonly<{ type: "set-welcome-name"; name: string }>
  | Readonly<{
      type: "answer-question";
      questionId: PlanHomeQuestionId;
      answer: unknown;
    }>
  | Readonly<{ type: "next" }>
  | Readonly<{ type: "back" }>
  | Readonly<{
      type: "complete-contact-gate";
      contact: Readonly<{
        email: string;
        phone: string;
        manualFollowUpDisclosureAccepted: boolean;
      }>;
    }>
  | Readonly<{
      type: "jump-to-review-question";
      questionId: PlanHomeQuestionId;
    }>
  | Readonly<{ type: "return-to-review" }>
  | Readonly<{ type: "checkpoint-zone"; zoneId: PlanHomeZoneId }>;

export type PlanHomeTourEvent =
  | Readonly<{ type: "local-snapshot-requested" }>
  | Readonly<{
      type: "contact-gate-completed";
      checkpointKey: "plan-home-v1:contact-gate";
    }>
  | Readonly<{
      type: "zone-completed";
      zoneId: PlanHomeZoneId;
      checkpointKey: `plan-home-v1:zone:${PlanHomeZoneId}`;
    }>;

export type PlanHomeTourErrorCode =
  | "welcome-name-required"
  | "answer-required"
  | "invalid-answer"
  | "wrong-question"
  | "contact-required"
  | "invalid-contact"
  | "invalid-command"
  | "zone-not-completed";

export type PlanHomeTourTransition = Readonly<{
  state: PlanHomeTourState;
  events: readonly PlanHomeTourEvent[];
  error: Readonly<{
    code: PlanHomeTourErrorCode;
    message: string;
  }> | null;
}>;

const firstQuestion = planHomeQuestions[0];
const contactGateQuestion = planHomeQuestions[5];
const firstPostContactQuestion = planHomeQuestions[6];
const lastQuestion = planHomeQuestions.at(-1);

if (!firstQuestion || !contactGateQuestion || !firstPostContactQuestion || !lastQuestion) {
  throw new Error("The Plan Your Home registry must contain its fixed question path.");
}

function locationForQuestion(
  questionId: PlanHomeQuestionId,
  editingFromReview = false,
): PlanHomeTourLocation {
  return { kind: "question", questionId, editingFromReview };
}

function orderedZoneIds(zoneIds: readonly PlanHomeZoneId[]) {
  const selected = new Set(zoneIds);
  return planHomeZoneIds.filter((zoneId) => selected.has(zoneId));
}

function success(
  previousState: PlanHomeTourState,
  state: PlanHomeTourState,
  events: readonly PlanHomeTourEvent[] = [],
): PlanHomeTourTransition {
  if (state === previousState) {
    return { state, events, error: null };
  }

  return {
    state,
    events: [...events, { type: "local-snapshot-requested" }],
    error: null,
  };
}

function failure(
  state: PlanHomeTourState,
  code: PlanHomeTourErrorCode,
  message: string,
): PlanHomeTourTransition {
  return { state, events: [], error: { code, message } };
}

function answerIsValid(state: PlanHomeTourState, questionId: PlanHomeQuestionId) {
  return validatePlanHomeAnswer(questionId, state.answers[questionId]).success;
}

function contactMatches(
  current: PlanHomeContactCheckpoint | null,
  next: PlanHomeContactCheckpoint,
) {
  return (
    current?.email === next.email &&
    current.phone === next.phone &&
    current.manualFollowUpDisclosureAccepted ===
      next.manualFollowUpDisclosureAccepted
  );
}

function completeCurrentZone(
  state: PlanHomeTourState,
  zoneId: PlanHomeZoneId,
) {
  if (state.completedZoneIds.includes(zoneId)) {
    return { state, events: [] as PlanHomeTourEvent[] };
  }

  return {
    state: {
      ...state,
      completedZoneIds: orderedZoneIds([...state.completedZoneIds, zoneId]),
    },
    events: [
      {
        type: "zone-completed" as const,
        zoneId,
        checkpointKey: `plan-home-v1:zone:${zoneId}` as const,
      },
    ],
  };
}

export function createInitialPlanHomeTourState(): PlanHomeTourState {
  return {
    definitionId: "plan-home-v1",
    welcomeName: "",
    answers: {},
    location: { kind: "welcome" },
    contactCheckpoint: null,
    completedZoneIds: [],
    checkpointedZoneIds: [],
    references: [],
  };
}

export function reducePlanHomeTour(
  state: PlanHomeTourState,
  command: PlanHomeTourCommand,
): PlanHomeTourTransition {
  switch (command.type) {
    case "set-welcome-name": {
      if (state.location.kind !== "welcome") {
        return failure(
          state,
          "invalid-command",
          "The welcome name can only be changed at the welcome step.",
        );
      }

      const welcomeName = command.name.trim();
      if (welcomeName.length === 0 || welcomeName.length > 120) {
        return failure(
          state,
          "welcome-name-required",
          "Enter a name between 1 and 120 characters.",
        );
      }

      return success(state, { ...state, welcomeName });
    }

    case "answer-question": {
      if (
        state.location.kind !== "question" ||
        state.location.questionId !== command.questionId
      ) {
        return failure(
          state,
          "wrong-question",
          "Answers can only update the active question.",
        );
      }

      const result = validatePlanHomeAnswer(command.questionId, command.answer);
      if (!result.success) {
        return failure(state, "invalid-answer", result.issues.join(" "));
      }

      const references =
        command.questionId === "design.references" &&
        typeof result.data === "object" &&
        result.data !== null &&
        "references" in result.data &&
        Array.isArray(result.data.references)
          ? result.data.references
          : state.references;

      return success(state, {
        ...state,
        answers: { ...state.answers, [command.questionId]: result.data },
        references,
      } as PlanHomeTourState);
    }

    case "next": {
      if (state.location.kind === "welcome") {
        if (!state.welcomeName.trim()) {
          return failure(
            state,
            "welcome-name-required",
            "Enter a welcome name before starting the tour.",
          );
        }
        return success(state, {
          ...state,
          location: locationForQuestion(firstQuestion.id),
        });
      }

      if (state.location.kind === "contact-gate") {
        if (!state.contactCheckpoint) {
          return failure(
            state,
            "contact-required",
            "Complete the contact checkpoint before continuing.",
          );
        }
        return success(state, {
          ...state,
          location: locationForQuestion(firstPostContactQuestion.id),
        });
      }

      if (state.location.kind === "review") {
        return failure(
          state,
          "invalid-command",
          "The review step has no next tour prompt.",
        );
      }

      const location = state.location;
      const questionIndex = planHomeQuestions.findIndex(
        (question) => question.id === location.questionId,
      );
      const question = planHomeQuestions[questionIndex];
      if (!question || !answerIsValid(state, question.id)) {
        return failure(
          state,
          "answer-required",
          "Enter a valid answer before continuing.",
        );
      }

      if (location.editingFromReview) {
        return success(state, { ...state, location: { kind: "review" } });
      }

      if (question.id === contactGateQuestion.id) {
        return success(state, { ...state, location: { kind: "contact-gate" } });
      }

      const nextQuestion = planHomeQuestions[questionIndex + 1];
      const crossedZoneBoundary =
        !nextQuestion || nextQuestion.zoneId !== question.zoneId;
      const completion = crossedZoneBoundary
        ? completeCurrentZone(state, question.zoneId)
        : { state, events: [] as PlanHomeTourEvent[] };

      if (!nextQuestion) {
        return success(
          state,
          { ...completion.state, location: { kind: "review" } },
          completion.events,
        );
      }

      return success(
        state,
        {
          ...completion.state,
          location: locationForQuestion(nextQuestion.id),
        },
        completion.events,
      );
    }

    case "back": {
      if (state.location.kind === "welcome") {
        return failure(state, "invalid-command", "The welcome step has no previous prompt.");
      }
      if (state.location.kind === "review") {
        return success(state, {
          ...state,
          location: locationForQuestion(
            planHomeQuestions[planHomeQuestions.length - 1].id,
          ),
        });
      }
      if (state.location.kind === "contact-gate") {
        return success(state, {
          ...state,
          location: locationForQuestion(contactGateQuestion.id),
        });
      }
      if (state.location.editingFromReview) {
        return success(state, { ...state, location: { kind: "review" } });
      }

      const location = state.location;
      const questionIndex = planHomeQuestions.findIndex(
        (question) => question.id === location.questionId,
      );
      if (questionIndex === 0) {
        return success(state, { ...state, location: { kind: "welcome" } });
      }
      if (location.questionId === firstPostContactQuestion.id) {
        return success(state, { ...state, location: { kind: "contact-gate" } });
      }

      const previousQuestion = planHomeQuestions[questionIndex - 1];
      if (!previousQuestion) {
        return failure(state, "invalid-command", "The active question is not in the registry.");
      }
      return success(state, {
        ...state,
        location: locationForQuestion(previousQuestion.id),
      });
    }

    case "complete-contact-gate": {
      if (state.location.kind !== "contact-gate") {
        return failure(
          state,
          "invalid-command",
          "Contact can only be completed at the contact checkpoint.",
        );
      }

      const parsed = planHomeContactCheckpointSchema.safeParse(command.contact);
      if (!parsed.success) {
        return failure(
          state,
          "invalid-contact",
          parsed.error.issues.map((issue) => issue.message).join(" "),
        );
      }

      const events: PlanHomeTourEvent[] = contactMatches(
        state.contactCheckpoint,
        parsed.data,
      )
        ? []
        : [
            {
              type: "contact-gate-completed",
              checkpointKey: "plan-home-v1:contact-gate",
            },
          ];

      return success(
        state,
        {
          ...state,
          contactCheckpoint: parsed.data,
          location: locationForQuestion(firstPostContactQuestion.id),
        },
        events,
      );
    }

    case "jump-to-review-question": {
      if (state.location.kind !== "review") {
        return failure(
          state,
          "invalid-command",
          "Review edits can only start from the review step.",
        );
      }
      if (!answerIsValid(state, command.questionId)) {
        return failure(
          state,
          "answer-required",
          "The selected review answer is not valid.",
        );
      }
      return success(state, {
        ...state,
        location: locationForQuestion(command.questionId, true),
      });
    }

    case "return-to-review": {
      if (
        state.location.kind !== "question" ||
        !state.location.editingFromReview
      ) {
        return failure(
          state,
          "invalid-command",
          "Return to review is only available while editing a review answer.",
        );
      }
      if (!answerIsValid(state, state.location.questionId)) {
        return failure(
          state,
          "answer-required",
          "Enter a valid answer before returning to review.",
        );
      }
      return success(state, { ...state, location: { kind: "review" } });
    }

    case "checkpoint-zone": {
      if (!state.completedZoneIds.includes(command.zoneId)) {
        return failure(
          state,
          "zone-not-completed",
          "Only completed zones can be checkpointed.",
        );
      }
      if (state.checkpointedZoneIds.includes(command.zoneId)) {
        return success(state, state);
      }
      return success(state, {
        ...state,
        checkpointedZoneIds: orderedZoneIds([
          ...state.checkpointedZoneIds,
          command.zoneId,
        ]),
      });
    }
  }
}

export function validatePlanHomeTourState(state: PlanHomeTourState) {
  const issues: string[] = [];
  const welcomeName = state.welcomeName.trim();
  if (welcomeName.length === 0 || welcomeName.length > 120) {
    issues.push("The tour state requires a valid welcome name.");
  }

  if (state.definitionId !== planHomeV1Definition.id) {
    issues.push("The tour state has an unknown definition ID.");
  }

  const answerIds = new Set(planHomeQuestions.map((question) => question.id));
  for (const [questionId, answer] of Object.entries(state.answers)) {
    if (!answerIds.has(questionId as PlanHomeQuestionId)) {
      issues.push(`The tour state contains unknown answer ${questionId}.`);
      continue;
    }
    if (!validatePlanHomeAnswer(questionId, answer).success) {
      issues.push(`The tour state contains an invalid answer for ${questionId}.`);
    }
  }

  if (!planHomeReferenceCollectionSchema.safeParse(state.references).success) {
    issues.push("The tour state contains invalid reference metadata.");
  }

  const expectedCompleted = planHomeZoneIds.slice(
    0,
    state.completedZoneIds.length,
  );
  if (
    expectedCompleted.length !== state.completedZoneIds.length ||
    expectedCompleted.some((zoneId, index) => zoneId !== state.completedZoneIds[index])
  ) {
    issues.push("Completed zones must form a contiguous registry prefix.");
  }
  const expectedCheckpointed = orderedZoneIds(state.checkpointedZoneIds);
  if (
    expectedCheckpointed.length !== state.checkpointedZoneIds.length ||
    expectedCheckpointed.some(
      (zoneId, index) => zoneId !== state.checkpointedZoneIds[index],
    )
  ) {
    issues.push("Checkpointed zones must be unique and in registry order.");
  }
  if (
    state.checkpointedZoneIds.some(
      (zoneId) => !state.completedZoneIds.includes(zoneId),
    )
  ) {
    issues.push("Checkpointed zones must already be completed.");
  }

  for (const zoneId of state.completedZoneIds) {
    const zoneQuestions = planHomeQuestions.filter(
      (question) => question.zoneId === zoneId,
    );
    if (zoneQuestions.some((question) => !answerIsValid(state, question.id))) {
      issues.push(`Completed zone ${zoneId} contains an invalid answer.`);
    }
  }

  if (
    state.contactCheckpoint !== null &&
    !planHomeContactCheckpointSchema.safeParse(state.contactCheckpoint).success
  ) {
    issues.push("The tour state contains an invalid contact checkpoint.");
  }

  const referenceAnswer = state.answers["design.references"];
  if (
    referenceAnswer &&
    JSON.stringify(referenceAnswer.references) !== JSON.stringify(state.references)
  ) {
    issues.push("Reference metadata must match the canonical reference answer.");
  }

  function requireAnswersThrough(questionIndex: number) {
    for (const question of planHomeQuestions.slice(0, questionIndex)) {
      if (!answerIsValid(state, question.id)) {
        issues.push(`Progress skips required answer ${question.id}.`);
      }
    }
  }

  if (state.location.kind === "question") {
    const location = state.location;
    const questionIndex = planHomeQuestions.findIndex(
      (question) => question.id === location.questionId,
    );
    if (questionIndex < 0) {
      issues.push("The current question is not in the registry.");
    } else if (location.editingFromReview) {
      requireAnswersThrough(planHomeQuestions.length);
      if (state.completedZoneIds.length !== planHomeZoneIds.length) {
        issues.push("Review editing requires all zones to be completed.");
      }
    } else {
      requireAnswersThrough(questionIndex);
    }

    if (questionIndex >= 6 && state.contactCheckpoint === null) {
      issues.push("Progress after question 6 requires the contact checkpoint.");
    }
  } else if (state.location.kind === "contact-gate") {
    requireAnswersThrough(6);
  } else if (state.location.kind === "review") {
    requireAnswersThrough(planHomeQuestions.length);
    if (state.completedZoneIds.length !== planHomeZoneIds.length) {
      issues.push("Review requires all seven zones to be completed.");
    }
    if (state.contactCheckpoint === null) {
      issues.push("Review requires the contact checkpoint.");
    }
  }

  return [...new Set(issues)];
}

export function isPlanHomeSubmissionReady(state: PlanHomeTourState) {
  return (
    state.location.kind === "review" &&
    state.completedZoneIds.length === planHomeZoneIds.length &&
    planHomeQuestions.every((question) => answerIsValid(state, question.id)) &&
    state.contactCheckpoint !== null &&
    validatePlanHomeTourState(state).length === 0
  );
}
