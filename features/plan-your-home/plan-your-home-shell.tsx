"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import {
  createPlanHomeClientDraftAdapter,
  type PlanHomeClientDraftState,
} from "@/features/plan-your-home/client-draft-state";
import {
  EntryScene,
  LivingRoomScene,
  WelcomeExteriorScene,
} from "@/features/plan-your-home/first-zone-scenes";
import {
  KitchenDiningScene,
} from "@/features/plan-your-home/kitchen-dining-scene";
import {
  BedroomHallThresholdScene,
  PrimarySuiteScene,
} from "@/features/plan-your-home/primary-suite-scene";
import { createPlanHomeLocalSnapshotAdapter } from "@/features/plan-your-home/local-snapshot";
import {
  ChoicePrompt,
  CountPrompt,
  GroupedChoicePrompt,
  MultiChoicePrompt,
  PromptStack,
  ShortTextPrompt,
  type GroupedChoiceValue,
} from "@/features/plan-your-home/prompt-renderers";
import {
  getPlanHomeQuestion,
  planHomeQuestions,
  planHomeZones,
  type PlanHomeOptionGroup,
  type PlanHomeQuestionDefinition,
  type PlanHomeQuestionId,
} from "@/features/plan-your-home/registry";
import {
  SceneStage,
  type SceneCameraFrame,
} from "@/features/plan-your-home/scene-stage";
import {
  createInitialPlanHomeTourState,
  reducePlanHomeTour,
  type PlanHomeTourState,
  type PlanHomeTourTransition,
} from "@/features/plan-your-home/tour-state";

import styles from "./plan-your-home-shell.module.css";

export type PlanHomeDraftActionState =
  | Readonly<{
      status: "success";
      result: Readonly<{
        draftId: string;
        revision: number;
        applied: boolean;
      }>;
    }>
  | Readonly<{
      status:
        | "validation-error"
        | "authorization-error"
        | "conflict"
        | "server-error";
      message: string;
      currentRevision?: number;
    }>;

export type PlanHomeDraftAction = (
  input: unknown,
) => Promise<PlanHomeDraftActionState>;

type PlanYourHomeShellProps = Readonly<{
  createDraft?: PlanHomeDraftAction;
  checkpointDraft?: PlanHomeDraftAction;
  reducedMotion?: boolean;
}>;

type ContactFields = Readonly<{
  email: string;
  phone: string;
  disclosureAccepted: boolean;
}>;

const unavailableDraftAction: PlanHomeDraftAction = async () => ({
  status: "server-error",
  message: "Draft saving is temporarily unavailable.",
});

const PROJECT_AND_LIVING_LAST_QUESTION = 11;
const KITCHEN_AND_DINING_LAST_QUESTION = 15;
const PRIMARY_SUITE_LAST_QUESTION = 19;
const PROJECT_AND_LIVING_ZONE = planHomeZones[0];
const KITCHEN_AND_DINING_ZONE = planHomeZones[1];
const PRIMARY_SUITE_ZONE = planHomeZones[2];

const CAMERA_FRAMES: Readonly<Record<string, SceneCameraFrame>> = {
  "entry-plans": { xPercent: 1.5, yPercent: 0.4, scale: 1.08 },
  "entry-site": { xPercent: -0.6, yPercent: -1.4, scale: 1.14 },
  "entry-landscape": { xPercent: -3.8, yPercent: 0.2, scale: 1.1 },
  "living-floor-plan": { xPercent: 0.5, yPercent: -3.4, scale: 1.14 },
  "living-stair": { xPercent: -3.8, yPercent: 0.4, scale: 1.12 },
  "living-hall": { xPercent: -4.5, yPercent: 1.2, scale: 1.16 },
  "living-family": { xPercent: 0.8, yPercent: 1.2, scale: 1.12 },
  "living-seating": { xPercent: 0.3, yPercent: -0.4, scale: 1.1 },
  "living-connection": { xPercent: -4.2, yPercent: -0.2, scale: 1.13 },
  "living-features": { xPercent: 3.2, yPercent: 0.4, scale: 1.12 },
  "living-finishes": { xPercent: -0.8, yPercent: 1.8, scale: 1.15 },
  "kitchen-use": { xPercent: 2.8, yPercent: -0.8, scale: 1.12 },
  "kitchen-arrangement": { xPercent: -2.8, yPercent: -0.2, scale: 1.1 },
  "kitchen-support": { xPercent: -4.2, yPercent: 0.2, scale: 1.14 },
  "dining-use": { xPercent: -3.2, yPercent: -1.2, scale: 1.12 },
  "primary-location": { xPercent: 3.2, yPercent: -0.4, scale: 1.13 },
  "primary-bedroom": { xPercent: 0.8, yPercent: -1.6, scale: 1.11 },
  "primary-bath": { xPercent: -3.6, yPercent: -0.4, scale: 1.14 },
  "primary-closet": { xPercent: -4.2, yPercent: 0.8, scale: 1.15 },
};

function randomUuidV4() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function createIdempotencyKey(
  boundary:
    | "contact-gate"
    | "zone:project-and-living"
    | "zone:kitchen-and-dining"
    | "zone:primary-suite",
) {
  return `local-${randomUuidV4()}:plan-home-v1:${boundary}`;
}

function initialDraftAnswers() {
  return Object.fromEntries(
    planHomeQuestions
      .slice(0, PRIMARY_SUITE_LAST_QUESTION)
      .map((question) => [
        question.id,
        structuredClone(question.response.defaultAnswer),
      ]),
  ) as Record<string, unknown>;
}

function sceneForQuestion(question: PlanHomeQuestionDefinition) {
  if (question.number <= 3) {
    return <EntryScene activeAnchor={question.sceneAnchor} />;
  }
  if (question.number <= PROJECT_AND_LIVING_LAST_QUESTION) {
    return <LivingRoomScene activeAnchor={question.sceneAnchor} />;
  }
  if (question.number <= KITCHEN_AND_DINING_LAST_QUESTION) {
    return <KitchenDiningScene activeAnchor={question.sceneAnchor} />;
  }
  return <PrimarySuiteScene activeAnchor={question.sceneAnchor} />;
}

function actionError(result: Exclude<PlanHomeDraftActionState, { status: "success" }>) {
  if (result.status === "conflict") {
    return "Your saved draft changed. Return to this step and try saving again.";
  }
  return result.message;
}

function renderQuestionPrompt(
  question: PlanHomeQuestionDefinition,
  answer: unknown,
  updateAnswer: (answer: unknown) => void,
) {
  const firstGroup = question.response.optionGroups[0] as PlanHomeOptionGroup;

  if (question.id === "project.lot-location") {
    const value = answer as {
      lotStatus: string | null;
      location: string;
      locationUncertain: boolean;
    };
    return (
      <PromptStack>
        <ChoicePrompt
          id={`${question.id}-status`}
          legend={firstGroup.label}
          options={firstGroup.options}
          value={value.lotStatus}
          onChange={(lotStatus) => updateAnswer({ ...value, lotStatus })}
        />
        <ShortTextPrompt
          id={`${question.id}-location`}
          legend="Location"
          label="City, county, address, or target area"
          instructions="Enter at least two characters, or choose Not sure yet."
          value={value.location}
          maxLength={160}
          uncertainLabel="Not sure yet"
          uncertain={value.locationUncertain}
          onUncertainChange={(locationUncertain) =>
            updateAnswer({ ...value, locationUncertain })
          }
          onChange={(location) => updateAnswer({ ...value, location })}
        />
      </PromptStack>
    );
  }

  if (question.id === "home.bed-bath-counts") {
    return (
      <CountPrompt
        id={question.id}
        groups={question.response.optionGroups}
        value={answer as Record<string, string | null>}
        onChange={updateAnswer}
        instructions="Choose one exact range for each count."
      />
    );
  }

  if (question.response.kind === "choice") {
    return (
      <ChoicePrompt
        id={question.id}
        legend={firstGroup.label}
        options={firstGroup.options}
        value={answer as string | null}
        onChange={updateAnswer}
      />
    );
  }

  if (question.response.kind === "multi-choice") {
    return (
      <MultiChoicePrompt
        id={question.id}
        legend={firstGroup.label}
        options={firstGroup.options}
        value={answer as readonly string[]}
        maxSelections={firstGroup.maxSelections}
        exclusiveOptionSlugs={firstGroup.exclusiveOptionSlugs}
        onChange={updateAnswer}
      />
    );
  }

  if (question.response.kind === "grouped") {
    return (
      <GroupedChoicePrompt
        id={question.id}
        groups={question.response.optionGroups}
        value={answer as GroupedChoiceValue}
        onChange={updateAnswer}
        instructions="Complete each group before continuing."
      />
    );
  }

  return null;
}

function WelcomeStep({
  name,
  error,
  onNameChange,
  onSubmit,
}: Readonly<{
  name: string;
  error: string | null;
  onNameChange: (name: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}>) {
  const errorId = error ? "plan-home-welcome-error" : undefined;
  return (
    <section className={styles.moment} data-tour-beat="welcome">
      <div className={styles.momentScene}>
        <WelcomeExteriorScene name={name} />
      </div>
      <form className={styles.momentSheet} onSubmit={onSubmit}>
        <p className={styles.eyebrow}>Plan your home</p>
        <h1>Let’s put your name on the front door.</h1>
        <p className={styles.momentCopy}>
          Walk through a fixed illustrated home and tell us what your real home
          needs. Your answers shape the project brief, not the artwork.
        </p>
        <label className={styles.textLabel} htmlFor="plan-home-welcome-name">
          Your name
        </label>
        <input
          id="plan-home-welcome-name"
          className={styles.textInput}
          value={name}
          maxLength={120}
          autoComplete="name"
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          onChange={(event) => onNameChange(event.target.value)}
        />
        {error ? (
          <p id={errorId} className={styles.formError} role="alert">
            {error}
          </p>
        ) : null}
        <Button className={styles.primaryAction} type="submit">
          Open the front door
        </Button>
      </form>
    </section>
  );
}

function ContactCheckpoint({
  name,
  fields,
  error,
  saving,
  onBack,
  onChange,
  onSubmit,
}: Readonly<{
  name: string;
  fields: ContactFields;
  error: string | null;
  saving: boolean;
  onBack: () => void;
  onChange: (fields: ContactFields) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorId = error ? "plan-home-contact-error" : undefined;
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section className={styles.moment} data-tour-beat="contact-checkpoint">
      <div className={styles.momentScene}>
        <LivingRoomScene activeAnchor="hall-doors" />
      </div>
      <form
        className={styles.momentSheet}
        aria-labelledby="plan-home-contact-heading"
        onSubmit={onSubmit}
      >
        <p className={styles.eyebrow}>A good place to pause</p>
        <h1 ref={headingRef} id="plan-home-contact-heading" tabIndex={-1}>
          Save your progress and resume later.
        </h1>
        <p className={styles.momentCopy}>
          We’ll attach these first six answers to {name.trim()} and keep your
          place in the walkthrough.
        </p>
        <div className={styles.contactGrid}>
          <label className={styles.textLabel} htmlFor="plan-home-contact-email">
            Email
          </label>
          <input
            id="plan-home-contact-email"
            className={styles.textInput}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={fields.email}
            onChange={(event) => onChange({ ...fields, email: event.target.value })}
          />
          <label className={styles.textLabel} htmlFor="plan-home-contact-phone">
            Phone
          </label>
          <input
            id="plan-home-contact-phone"
            className={styles.textInput}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={fields.phone}
            onChange={(event) => onChange({ ...fields, phone: event.target.value })}
          />
        </div>
        <label className={styles.disclosure}>
          <input
            type="checkbox"
            required
            checked={fields.disclosureAccepted}
            onChange={(event) =>
              onChange({ ...fields, disclosureAccepted: event.target.checked })
            }
          />
          <span>
            Save my progress. h and h may personally follow up about this
            project. No reminder is sent automatically.
          </span>
        </label>
        {error ? (
          <p id={errorId} className={styles.formError} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.momentActions}>
          <Button type="button" variant="secondary" onClick={onBack} disabled={saving}>
            Back
          </Button>
          <Button type="submit" disabled={saving} aria-describedby={errorId}>
            {saving ? "Saving…" : "Save and continue"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function BedroomHallBoundary({
  onBack,
  reducedMotion,
}: Readonly<{ onBack: () => void; reducedMotion?: boolean }>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      className={styles.moment}
      data-reduced-motion={reducedMotion}
      data-tour-beat="bedroom-hall-transition"
    >
      <div className={styles.momentScene}>
        <BedroomHallThresholdScene />
      </div>
      <div className={styles.momentSheet}>
        <p className={styles.eyebrow}>Primary suite saved</p>
        <h1 ref={headingRef} tabIndex={-1}>
          The bedroom hall continues beyond the suite.
        </h1>
        <p className={styles.momentCopy}>
          Your primary-suite priorities are checkpointed. Secondary bedrooms
          and shared bathrooms will continue from this hall.
        </p>
        <Button type="button" variant="secondary" onClick={onBack}>
          Back to the closet
        </Button>
      </div>
    </section>
  );
}

export function PlanYourHomeShell({
  createDraft = unavailableDraftAction,
  checkpointDraft = unavailableDraftAction,
  reducedMotion,
}: PlanYourHomeShellProps = {}) {
  const [tourState, setTourState] = useState<PlanHomeTourState>(() =>
    createInitialPlanHomeTourState(),
  );
  const [draftAnswers, setDraftAnswers] = useState<Record<string, unknown>>(() =>
    initialDraftAnswers(),
  );
  const [welcomeName, setWelcomeName] = useState("");
  const [contactFields, setContactFields] = useState<ContactFields>({
    email: "",
    phone: "",
    disclosureAccepted: false,
  });
  const [clientDraft, setClientDraft] = useState<PlanHomeClientDraftState | null>(
    null,
  );
  const [error, setError] = useState<PlanHomeTourTransition["error"]>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const localAdapter = createPlanHomeLocalSnapshotAdapter({
        storage: window.localStorage,
      });
      const restored = localAdapter.load();
      if (restored) {
        setTourState(restored);
        setWelcomeName(restored.welcomeName);
        setDraftAnswers({ ...initialDraftAnswers(), ...restored.answers });
        if (restored.contactCheckpoint) {
          setContactFields({
            email: restored.contactCheckpoint.email,
            phone: restored.contactCheckpoint.phone,
            disclosureAccepted:
              restored.contactCheckpoint.manualFollowUpDisclosureAccepted,
          });
        }
      }

      setClientDraft(createPlanHomeClientDraftAdapter(window.localStorage).load());
    }, 0);

    return () => window.clearTimeout(restore);
  }, []);

  function saveLocal(state: PlanHomeTourState) {
    createPlanHomeLocalSnapshotAdapter({ storage: window.localStorage }).save(state);
  }

  function commitState(state: PlanHomeTourState) {
    setTourState(state);
    saveLocal(state);
  }

  function submitWelcome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (welcomeName.trim().length < 2) {
      setFormError("Enter a name between 2 and 120 characters.");
      return;
    }
    const named = reducePlanHomeTour(tourState, {
      type: "set-welcome-name",
      name: welcomeName,
    });
    if (named.error) {
      setFormError(named.error.message);
      return;
    }
    const opened = reducePlanHomeTour(named.state, { type: "next" });
    if (opened.error) {
      setFormError(opened.error.message);
      return;
    }
    setFormError(null);
    commitState(opened.state);
  }

  function backFromQuestion() {
    const transition = reducePlanHomeTour(tourState, { type: "back" });
    if (transition.error) {
      setError(transition.error);
      return false;
    }
    setError(null);
    commitState(transition.state);
    return true;
  }

  async function nextFromQuestion(question: PlanHomeQuestionDefinition) {
    const answered = reducePlanHomeTour(tourState, {
      type: "answer-question",
      questionId: question.id as PlanHomeQuestionId,
      answer: draftAnswers[question.id],
    });
    if (answered.error) {
      setError(answered.error);
      return false;
    }

    const advanced = reducePlanHomeTour(answered.state, { type: "next" });
    if (advanced.error) {
      setError(advanced.error);
      return false;
    }

    const checkpointBoundary =
      question.number === PROJECT_AND_LIVING_LAST_QUESTION
        ? ({
            zoneId: "project-and-living",
            answerCount: PROJECT_AND_LIVING_LAST_QUESTION,
            keyField: "projectAndLivingCheckpointKey",
          } as const)
          : question.number === KITCHEN_AND_DINING_LAST_QUESTION
          ? ({
              zoneId: "kitchen-and-dining",
              answerCount: KITCHEN_AND_DINING_LAST_QUESTION,
              keyField: "kitchenAndDiningCheckpointKey",
            } as const)
          : question.number === PRIMARY_SUITE_LAST_QUESTION
            ? ({
                zoneId: "primary-suite",
                answerCount: PRIMARY_SUITE_LAST_QUESTION,
                keyField: "primarySuiteCheckpointKey",
              } as const)
          : null;

    if (checkpointBoundary) {
      commitState(answered.state);
      if (!clientDraft?.draftId || !clientDraft.revision) {
        setError({
          code: "contact-required",
          message: "Return to the contact checkpoint before saving this room.",
        });
        return false;
      }

      if (saving) return false;
      const checkpointKey =
        clientDraft[checkpointBoundary.keyField] ??
        createIdempotencyKey(`zone:${checkpointBoundary.zoneId}`);
      const checkpointingDraft = {
        ...clientDraft,
        [checkpointBoundary.keyField]: checkpointKey,
      };
      createPlanHomeClientDraftAdapter(window.localStorage).save(
        checkpointingDraft,
      );
      setClientDraft(checkpointingDraft);
      setSaving(true);
      const result = await checkpointDraft({
        draftId: clientDraft.draftId,
        expectedRevision: clientDraft.revision,
        idempotencyKey: checkpointKey,
        completedZoneId: checkpointBoundary.zoneId,
        answers: Object.fromEntries(
          planHomeQuestions
            .slice(0, checkpointBoundary.answerCount)
            .map((item) => [item.id, answered.state.answers[item.id]]),
        ),
      });
      setSaving(false);
      if (result.status !== "success") {
        setError({ code: "invalid-command", message: actionError(result) });
        return false;
      }

      const checkpointed = reducePlanHomeTour(advanced.state, {
        type: "checkpoint-zone",
        zoneId: checkpointBoundary.zoneId,
      });
      const nextClientDraft = {
        ...checkpointingDraft,
        revision: result.result.revision,
      };
      createPlanHomeClientDraftAdapter(window.localStorage).save(nextClientDraft);
      setClientDraft(nextClientDraft);
      setError(null);
      commitState(checkpointed.state);
      return true;
    }

    setError(null);
    commitState(advanced.state);
    return true;
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const completed = reducePlanHomeTour(tourState, {
      type: "complete-contact-gate",
      contact: {
        email: contactFields.email,
        phone: contactFields.phone,
        manualFollowUpDisclosureAccepted: contactFields.disclosureAccepted,
      },
    });
    if (completed.error) {
      setFormError(completed.error.message);
      return;
    }

    const pendingDraft =
      clientDraft ??
      ({
        createIdempotencyKey: createIdempotencyKey("contact-gate"),
        projectAndLivingCheckpointKey: null,
        kitchenAndDiningCheckpointKey: null,
        primarySuiteCheckpointKey: null,
        draftId: null,
        revision: null,
      } satisfies PlanHomeClientDraftState);
    createPlanHomeClientDraftAdapter(window.localStorage).save(pendingDraft);
    setClientDraft(pendingDraft);
    setSaving(true);

    const result = await createDraft({
      idempotencyKey: pendingDraft.createIdempotencyKey,
      welcomeName: tourState.welcomeName,
      contact: completed.state.contactCheckpoint,
      answers: Object.fromEntries(
        planHomeQuestions
          .slice(0, 6)
          .map((question) => [question.id, tourState.answers[question.id]]),
      ),
      sourcePath: "/plan-your-home",
    });
    setSaving(false);

    if (result.status !== "success") {
      setFormError(actionError(result));
      return;
    }

    const identifiedDraft = {
      createIdempotencyKey: pendingDraft.createIdempotencyKey,
      projectAndLivingCheckpointKey:
        pendingDraft.projectAndLivingCheckpointKey,
      kitchenAndDiningCheckpointKey:
        pendingDraft.kitchenAndDiningCheckpointKey ?? null,
      primarySuiteCheckpointKey:
        pendingDraft.primarySuiteCheckpointKey ?? null,
      draftId: result.result.draftId,
      revision: result.result.revision,
    } satisfies PlanHomeClientDraftState;
    createPlanHomeClientDraftAdapter(window.localStorage).save(identifiedDraft);
    setClientDraft(identifiedDraft);
    setFormError(null);
    commitState(completed.state);
  }

  function backFromContact() {
    const transition = reducePlanHomeTour(tourState, { type: "back" });
    if (!transition.error) {
      setFormError(null);
      commitState(transition.state);
    }
  }

  function backFromBoundary() {
    const transition = reducePlanHomeTour(tourState, { type: "back" });
    if (!transition.error) commitState(transition.state);
  }

  const activeQuestion =
    tourState.location.kind === "question"
      ? getPlanHomeQuestion(tourState.location.questionId)
      : undefined;
  let content: ReactNode;
  if (tourState.location.kind === "welcome") {
    content = (
      <WelcomeStep
        name={welcomeName}
        error={formError}
        onNameChange={(name) => {
          setWelcomeName(name);
          setFormError(null);
        }}
        onSubmit={submitWelcome}
      />
    );
  } else if (tourState.location.kind === "contact-gate") {
    content = (
      <ContactCheckpoint
        name={tourState.welcomeName}
        fields={contactFields}
        error={formError}
        saving={saving}
        onBack={backFromContact}
        onChange={(fields) => {
          setContactFields(fields);
          setFormError(null);
        }}
        onSubmit={submitContact}
      />
    );
  } else if (
    activeQuestion &&
    activeQuestion.number > PRIMARY_SUITE_LAST_QUESTION
  ) {
    content = (
      <BedroomHallBoundary
        onBack={backFromBoundary}
        reducedMotion={reducedMotion}
      />
    );
  } else if (tourState.location.kind === "question") {
    const question = activeQuestion;
    if (!question) throw new Error("The active Plan Your Home question is missing.");
    content = (
      <div
        className={styles.sceneBeat}
        data-reduced-motion={reducedMotion}
        data-tour-beat={
          question.number === 1
            ? "front-door"
            : question.number === 12
              ? "living-to-kitchen"
              : question.number === 16
                ? "kitchen-hall-to-primary"
              : "in-room"
        }
      >
        <SceneStage
          question={question}
          zone={
            question.number <= PROJECT_AND_LIVING_LAST_QUESTION
              ? PROJECT_AND_LIVING_ZONE
              : question.number <= KITCHEN_AND_DINING_LAST_QUESTION
                ? KITCHEN_AND_DINING_ZONE
                : PRIMARY_SUITE_ZONE
          }
          totalQuestions={planHomeQuestions.length}
          scene={sceneForQuestion(question)}
          prompt={renderQuestionPrompt(
            question,
            draftAnswers[question.id],
            (answer) => {
              setDraftAnswers((current) => ({
                ...current,
                [question.id]: answer,
              }));
              setError(null);
            },
          )}
          cameraFrame={CAMERA_FRAMES[question.cameraKey] ?? {
            xPercent: 0,
            yPercent: 0,
            scale: 1,
          }}
          onBack={backFromQuestion}
          onNext={() => nextFromQuestion(question)}
          canGoBack
          nextLabel={
            question.number === PROJECT_AND_LIVING_LAST_QUESTION ||
            question.number === KITCHEN_AND_DINING_LAST_QUESTION ||
            question.number === PRIMARY_SUITE_LAST_QUESTION
              ? "Save room"
              : "Next"
          }
          error={error}
          reducedMotion={reducedMotion}
        />
      </div>
    );
  } else {
    content = (
      <BedroomHallBoundary
        onBack={backFromBoundary}
        reducedMotion={reducedMotion}
      />
    );
  }

  return (
    <div className={styles.experience}>
      <header className={styles.experienceHeader}>
        <p>Plan Your Home</p>
        <span>Howeth and Harp · guided project brief</span>
      </header>
      {content}
    </div>
  );
}
