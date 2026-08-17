import {
  planHomeQuestions,
  type PlanHomeQuestionId,
} from "./registry.ts";
import {
  createInitialPlanHomeTourState,
  reducePlanHomeTour,
  type PlanHomeTourCommand,
  type PlanHomeTourState,
} from "./tour-state.ts";

export const PLAN_HOME_REFINEMENT_STATES = [
  "welcome",
  "contact",
  ...planHomeQuestions.map((question) => `q${question.number}` as const),
  "review",
  "confirmation",
] as const;

export type PlanHomeRefinementState =
  (typeof PLAN_HOME_REFINEMENT_STATES)[number];

export type PlanHomeRefinementFixture = Readonly<{
  requestedState: PlanHomeRefinementState;
  state: PlanHomeTourState;
  submitted: boolean;
}>;

const fixtureContact = {
  email: "plan-home-refinement@example.invalid",
  phone: "+1 214 555 0120",
  manualFollowUpDisclosureAccepted: true,
} as const;

function applyFixtureCommand(
  state: PlanHomeTourState,
  command: PlanHomeTourCommand,
) {
  const transition = reducePlanHomeTour(state, command);
  if (transition.error) {
    throw new Error(`Could not build refinement fixture: ${transition.error.message}`);
  }
  return transition.state;
}

function startedFixture() {
  let state = createInitialPlanHomeTourState();
  state = applyFixtureCommand(state, {
    type: "set-welcome-name",
    name: "Refinement Homeowner",
  });
  return applyFixtureCommand(state, { type: "next" });
}

function fixtureAnswer(question: (typeof planHomeQuestions)[number]) {
  if (question.id === "project.lot-location") {
    return {
      lotStatus: "own-it",
      location: "Denton County",
      locationUncertain: false,
    };
  }
  return structuredClone(question.response.exampleAnswer);
}

function advanceFixtureToQuestion(questionId: PlanHomeQuestionId) {
  let state = startedFixture();
  for (const question of planHomeQuestions) {
    if (question.id === questionId) return state;
    state = applyFixtureCommand(state, {
      type: "answer-question",
      questionId: question.id,
      answer: fixtureAnswer(question),
    });
    state = applyFixtureCommand(state, { type: "next" });
    if (question.number === 6) {
      state = applyFixtureCommand(state, {
        type: "complete-contact-gate",
        contact: fixtureContact,
      });
    }
  }
  throw new Error(`Unknown Plan Your Home fixture question: ${questionId}`);
}

function completedFixture() {
  let state = startedFixture();
  for (const question of planHomeQuestions) {
    state = applyFixtureCommand(state, {
      type: "answer-question",
      questionId: question.id,
      answer: fixtureAnswer(question),
    });
    state = applyFixtureCommand(state, { type: "next" });
    if (question.number === 6) {
      state = applyFixtureCommand(state, {
        type: "complete-contact-gate",
        contact: fixtureContact,
      });
    }
  }
  return state;
}

export function normalizePlanHomeRefinementState(value: string) {
  const normalized = value.trim().toLowerCase();
  return PLAN_HOME_REFINEMENT_STATES.find((state) => state === normalized) ?? null;
}

export function createPlanHomeRefinementFixture(
  requestedState: PlanHomeRefinementState,
): PlanHomeRefinementFixture {
  if (requestedState === "welcome") {
    return {
      requestedState,
      state: createInitialPlanHomeTourState(),
      submitted: false,
    };
  }
  if (requestedState === "contact") {
    const question = planHomeQuestions[5];
    let state = advanceFixtureToQuestion(question.id);
    state = applyFixtureCommand(state, {
      type: "answer-question",
      questionId: question.id,
      answer: fixtureAnswer(question),
    });
    state = applyFixtureCommand(state, { type: "next" });
    return { requestedState, state, submitted: false };
  }
  if (requestedState === "review" || requestedState === "confirmation") {
    return {
      requestedState,
      state: completedFixture(),
      submitted: requestedState === "confirmation",
    };
  }
  const questionNumber = Number(requestedState.slice(1));
  const question = planHomeQuestions[questionNumber - 1];
  if (!question) throw new Error(`Unknown refinement state: ${requestedState}`);
  return {
    requestedState,
    state: advanceFixtureToQuestion(question.id),
    submitted: false,
  };
}

export function isLoopbackPlanHomeRefinementRequest({
  enabled,
  environment,
  host,
}: Readonly<{
  enabled: boolean;
  environment: string | undefined;
  host: string;
}>) {
  if (!enabled || environment !== "development") return false;
  const hostname = host.startsWith("[")
    ? host.slice(1, host.indexOf("]"))
    : host.split(":")[0];
  return hostname === "127.0.0.1" || hostname === "::1" || hostname === "localhost";
}
