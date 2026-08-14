"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { BrandMark } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { trackPlanHomeEvent } from "@/lib/analytics/plan-home-events";
import {
  createPlanHomeClientDraftAdapter,
  type PlanHomeClientDraftState,
} from "@/features/plan-your-home/client-draft-state";
import {
  reconcilePlanHomeDraft,
  safeAnonymousLocalState,
  type PlanHomeServerBoundary,
} from "@/features/plan-your-home/draft-resume-contract";
import {
  BlueprintDesignDeskThresholdScene,
  BedroomHallThresholdScene,
  BedroomsSharedBathroomsScene,
  DesignDeskScene,
  EntryScene,
  ExteriorBackDoorThresholdScene,
  ExteriorSiteScene,
  KitchenDiningScene,
  LivingRoomScene,
  PlanHomeSceneSuspense,
  PrimarySuiteScene,
  ReviewBriefThresholdScene,
  UtilityHallThresholdScene,
  UtilitySystemsScene,
  WelcomeExteriorScene,
  preloadNextPlanHomeScene,
} from "@/features/plan-your-home/scene-loader";
import { createPlanHomeLocalSnapshotAdapter } from "@/features/plan-your-home/local-snapshot";
import {
  ChoicePrompt,
  CountPrompt,
  ExteriorStylePrompt,
  GroupedChoicePrompt,
  MultiChoicePrompt,
  PriorityPrompt,
  PromptStack,
  ReferencesPrompt,
  ShortTextPrompt,
  type GroupedChoiceValue,
  type PriorityPromptValue,
  type ReferencePromptItem,
} from "@/features/plan-your-home/prompt-renderers";
import {
  getPlanHomeQuestion,
  planHomeQuestions,
  planHomeZones,
  summarizePlanHomeAnswer,
  type PlanHomeOptionGroup,
  type PlanHomeQuestionDefinition,
  type PlanHomeQuestionId,
} from "@/features/plan-your-home/registry";
import { PLAN_HOME_INQUIRY_CONSENT_VERSION } from "@/features/plan-your-home/server-draft-contract";
import type { PlanHomeReferenceMetadata } from "@/features/plan-your-home/references";
import type {
  PlanHomeReferenceMutationResult,
  PlanHomeUploadCapability,
} from "@/features/plan-your-home/reference-upload-contract";
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
import type { PlanHomeRefinementFixture } from "@/features/plan-your-home/refinement-fixture";

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

export type PlanHomeSubmitActionState =
  | Readonly<{
      status: "success";
      result: Readonly<{
        draftId: string;
        revision: number;
        submittedAt: string;
        applied: boolean;
        notificationIntentCount: 0;
      }>;
    }>
  | Exclude<PlanHomeDraftActionState, { status: "success" }>;

export type PlanHomeSubmitAction = (
  input: unknown,
) => Promise<PlanHomeSubmitActionState>;

export type PlanHomeRestoreAction = () => Promise<
  | Readonly<{ status: "success"; result: PlanHomeServerBoundary }>
  | Readonly<{ status: "no-session" | "unavailable" | "skipped" }>
>;

export type PlanHomeReferenceAction<Result> = (
  input: unknown,
) => Promise<
  | Readonly<{ status: "success"; result: Result }>
  | Readonly<{
      status:
        | "validation-error"
        | "authorization-error"
        | "conflict"
        | "server-error";
      message: string;
      currentRevision?: number;
    }>
>;

export type PlanHomeDirectUploader = (
  capability: PlanHomeUploadCapability,
  file: File,
  onProgress: (percent: number) => void,
) => Promise<void>;

type PlanYourHomeShellProps = Readonly<{
  createDraft?: PlanHomeDraftAction;
  restoreDraft?: PlanHomeRestoreAction;
  checkpointDraft?: PlanHomeDraftAction;
  submitDraft?: PlanHomeSubmitAction;
  issueReferenceUpload?: PlanHomeReferenceAction<PlanHomeUploadCapability>;
  finalizeReferenceUpload?: PlanHomeReferenceAction<PlanHomeReferenceMutationResult>;
  abandonReferenceUpload?: PlanHomeReferenceAction<Readonly<{ applied: boolean }>>;
  addReferenceLink?: PlanHomeReferenceAction<PlanHomeReferenceMutationResult>;
  removeReference?: PlanHomeReferenceAction<PlanHomeReferenceMutationResult>;
  syncReferenceNotes?: PlanHomeReferenceAction<PlanHomeReferenceMutationResult>;
  directUploader?: PlanHomeDirectUploader;
  reducedMotion?: boolean;
  refinementFixture?: PlanHomeRefinementFixture;
}>;

type ContactFields = Readonly<{
  email: string;
  phone: string;
  disclosureAccepted: boolean;
}>;

type AnswerPersistence = "immediate" | "debounced";

const LOCAL_TEXT_SAVE_DEBOUNCE_MS = 300;

const unavailableDraftAction: PlanHomeDraftAction = async () => ({
  status: "server-error",
  message: "Draft saving is temporarily unavailable.",
});

const unavailableSubmitAction: PlanHomeSubmitAction = async () => ({
  status: "server-error",
  message: "Your project brief could not be submitted right now.",
});

const skippedRestoreAction: PlanHomeRestoreAction = async () => ({
  status: "skipped",
});

const PROJECT_AND_LIVING_LAST_QUESTION = 11;
const KITCHEN_AND_DINING_LAST_QUESTION = 15;
const PRIMARY_SUITE_LAST_QUESTION = 19;
const BEDROOMS_AND_SHARED_BATHROOMS_LAST_QUESTION = 21;
const UTILITY_AND_SYSTEMS_LAST_QUESTION = 25;
const EXTERIOR_AND_SITE_LAST_QUESTION = 30;
const DESIGN_DESK_LAST_QUESTION = 34;
const PROJECT_AND_LIVING_ZONE = planHomeZones[0];
const KITCHEN_AND_DINING_ZONE = planHomeZones[1];
const PRIMARY_SUITE_ZONE = planHomeZones[2];
const BEDROOMS_AND_SHARED_BATHROOMS_ZONE = planHomeZones[3];
const UTILITY_AND_SYSTEMS_ZONE = planHomeZones[4];
const EXTERIOR_AND_SITE_ZONE = planHomeZones[5];
const DESIGN_DESK_ZONE = planHomeZones[6];

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
  "secondary-bedrooms": { xPercent: 2.8, yPercent: -0.4, scale: 1.12 },
  "secondary-bathrooms": { xPercent: -3.4, yPercent: 0.4, scale: 1.14 },
  "utility-laundry": { xPercent: 4.2, yPercent: -0.3, scale: 1.13 },
  "utility-mudroom": { xPercent: 1.2, yPercent: -0.8, scale: 1.11 },
  "utility-storage": { xPercent: -2.8, yPercent: -0.3, scale: 1.13 },
  "home-systems": { xPercent: -4.4, yPercent: 0.2, scale: 1.15 },
  "exterior-garage": { xPercent: -3.8, yPercent: 0.1, scale: 1.12 },
  "exterior-style": { xPercent: 4.5, yPercent: -1.4, scale: 1.14 },
  "site-context": { xPercent: -4.3, yPercent: 0.2, scale: 1.12 },
  "outdoor-living": { xPercent: 0.2, yPercent: -2.8, scale: 1.14 },
  "specialty-spaces": { xPercent: -4.4, yPercent: -2.8, scale: 1.15 },
  "design-feeling": { xPercent: 4.2, yPercent: -1.1, scale: 1.13 },
  "design-references": { xPercent: -4.5, yPercent: -0.5, scale: 1.14 },
  "design-priorities": { xPercent: 3.8, yPercent: -15.5, scale: 1.14 },
  "budget-timing": { xPercent: -3.9, yPercent: -14, scale: 1.15 },
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
    | "zone:primary-suite"
    | "zone:bedrooms-and-shared-bathrooms"
    | "zone:utility-and-systems"
    | "zone:exterior-and-site"
    | "zone:design-desk-and-review"
    | "submission",
) {
  return `local-${randomUuidV4()}:plan-home-v1:${boundary}`;
}

function initialDraftAnswers() {
  return Object.fromEntries(
    planHomeQuestions
      .map((question) => [
        question.id,
        structuredClone(question.response.defaultAnswer),
      ]),
  ) as Record<string, unknown>;
}

function sceneForQuestion(question: PlanHomeQuestionDefinition) {
  let scene: ReactNode;
  if (question.number <= 3) {
    scene = <EntryScene activeAnchor={question.sceneAnchor} />;
  } else if (question.number <= PROJECT_AND_LIVING_LAST_QUESTION) {
    scene = <LivingRoomScene activeAnchor={question.sceneAnchor} />;
  } else if (question.number <= KITCHEN_AND_DINING_LAST_QUESTION) {
    scene = <KitchenDiningScene activeAnchor={question.sceneAnchor} />;
  } else if (question.number <= PRIMARY_SUITE_LAST_QUESTION) {
    scene = <PrimarySuiteScene activeAnchor={question.sceneAnchor} />;
  } else if (question.number <= BEDROOMS_AND_SHARED_BATHROOMS_LAST_QUESTION) {
    scene = <BedroomsSharedBathroomsScene activeAnchor={question.sceneAnchor} />;
  } else if (question.number <= UTILITY_AND_SYSTEMS_LAST_QUESTION) {
    scene = <UtilitySystemsScene activeAnchor={question.sceneAnchor} />;
  } else if (question.number <= EXTERIOR_AND_SITE_LAST_QUESTION) {
    scene = <ExteriorSiteScene activeAnchor={question.sceneAnchor} />;
  } else {
    scene = question.number === planHomeQuestions.length ? (
      <ReviewBriefThresholdScene />
    ) : (
      <DesignDeskScene activeAnchor={question.sceneAnchor} />
    );
  }
  return <PlanHomeSceneSuspense>{scene}</PlanHomeSceneSuspense>;
}

const unavailableReferenceAction = async () => ({
  status: "server-error" as const,
  message: "References are temporarily unavailable.",
});

async function uploadDirectly(
  capability: PlanHomeUploadCapability,
  file: File,
  onProgress: (percent: number) => void,
) {
  const uploadBody = capability.emulatorMultipartBoundary
    ? new Blob([
        `--${capability.emulatorMultipartBoundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
          {
            name: capability.objectPath,
            contentType: file.type,
            metadata: {
              "plan-home-draft": capability.draftId,
              "plan-home-reference": capability.referenceId,
            },
          },
        )}\r\n--${capability.emulatorMultipartBoundary}\r\nContent-Type: ${file.type}\r\n\r\n`,
        file,
        `\r\n--${capability.emulatorMultipartBoundary}--\r\n`,
      ])
    : file;
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(capability.method, capability.uploadUrl);
    for (const [name, value] of Object.entries(capability.headers)) {
      request.setRequestHeader(name, value);
    }
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        reject(new Error(`Direct upload failed with status ${request.status}.`));
      }
    });
    request.addEventListener("error", () =>
      reject(new Error("The direct upload was interrupted.")),
    );
    request.addEventListener("abort", () =>
      reject(new Error("The direct upload was canceled.")),
    );
    request.send(uploadBody);
  });
  onProgress(100);
}

type PendingReferenceUpload = Readonly<{
  id: string;
  file: File;
  referenceId: string | null;
  status: "uploading" | "error";
  progress: number;
  error: string | null;
}>;

const PRIORITY_SOURCE_GROUPS = new Map<string, ReadonlySet<string>>([
  ["home.daily-life", new Set(["dailyLife"])],
  ["living.features", new Set(["features"])],
  ["kitchen.use", new Set(["kitchenUse"])],
  ["kitchen.arrangement", new Set(["workCenter", "connection"])],
  ["kitchen.support", new Set(["supportSpaces"])],
  ["dining.use", new Set(["diningUse"])],
  ["primary.bedroom-features", new Set(["features"])],
  ["primary.bath-features", new Set(["features"])],
  ["primary.closet-access", new Set(["closetAccess"])],
  ["secondary.bath-sharing", new Set(["bathSharing"])],
  ["utility.laundry", new Set(["laundry"])],
  ["utility.mudroom", new Set(["mudroom"])],
  ["utility.storage", new Set(["storage"])],
  ["home.systems", new Set(["systems"])],
  ["exterior.garage", new Set(["needs"])],
  ["site.relationships", new Set(["relationships"])],
  ["exterior.outdoor-living", new Set(["features"])],
  ["home.specialty-spaces", new Set(["spaces"])],
]);

function selectedPriorityItems(answers: Readonly<Record<string, unknown>>) {
  const labels: string[] = [];
  for (const question of planHomeQuestions) {
    const sourceGroups = PRIORITY_SOURCE_GROUPS.get(question.id);
    if (!sourceGroups) continue;
    const answer = answers[question.id];
    for (const group of question.response.optionGroups) {
      if (!sourceGroups.has(group.id)) continue;
      const selected =
        answer && typeof answer === "object" && group.id in answer
          ? (answer as Record<string, unknown>)[group.id]
          : answer;
      const values = Array.isArray(selected)
        ? selected
        : typeof selected === "string"
          ? [selected]
          : [];
      for (const value of values) {
        const option = group.options.find(({ slug }) => slug === value);
        if (option && !option.semantic) labels.push(option.label);
      }
    }
  }
  return [...new Set(labels)];
}

type DesignDeskPromptContext = Readonly<{
  priorityItems: readonly string[];
  referenceItems: readonly ReferencePromptItem[];
  onFilesSelected: (files: readonly File[]) => void;
  onLinkAdded: (url: string) => void;
  onReferenceNoteChange: (id: string, note: string) => void;
  onReferenceRemove: (id: string) => void;
  onReferenceRetry: (id: string) => void;
}>;

function actionError(result: Exclude<PlanHomeDraftActionState, { status: "success" }>) {
  if (result.status === "conflict") {
    return "Your saved draft changed. Return to this step and try saving again.";
  }
  return result.message;
}

const CUSTOMER_VALIDATION_GUIDANCE: Partial<
  Record<PlanHomeQuestionId, Readonly<Record<string, string>>>
> = {
  "project.starting-services": {
    startingPoint: "Choose a starting point.",
    services: "Choose at least one service.",
  },
  "project.lot-location": {
    lotStatus: "Choose a lot status.",
    location: "Enter a location or choose Not sure yet.",
  },
  "home.bed-bath-counts": {
    bedrooms: "Choose a bedroom count.",
    fullBathrooms: "Choose a full-bathroom count.",
    halfBathrooms: "Choose a half-bathroom count.",
  },
  "kitchen.arrangement": {
    workCenter: "Choose a work center.",
    connection: "Choose a kitchen connection.",
  },
  "secondary.users-layout": {
    users: "Choose at least one bedroom user.",
    arrangement: "Choose a bedroom arrangement.",
  },
  "exterior.garage": {
    bays: "Choose a garage-bay count.",
  },
  "design.feeling": {
    feelings: "Choose at least one feeling.",
  },
  "project.budget-timing": {
    budget: "Choose a budget range.",
    designStart: "Choose a design start.",
  },
};

const ROOT_VALIDATION_FIELD: Partial<Record<PlanHomeQuestionId, string>> = {
  "project.lot-location": "location",
};

function validationFieldId(question: PlanHomeQuestionDefinition, field: string) {
  if (question.id === "project.lot-location" && field === "lotStatus") {
    return `${question.id}-status`;
  }
  if (question.id === "design.feeling" && field === "likesAndDislikes") {
    return `${question.id}-current-home`;
  }
  return `${question.id}-${field}`;
}

function customerValidationFeedback(
  question: PlanHomeQuestionDefinition,
  answer: unknown,
) {
  const parsed = question.response.answerSchema.safeParse(answer);
  const questionId = question.id as PlanHomeQuestionId;
  const guidance = CUSTOMER_VALIDATION_GUIDANCE[questionId];
  const errors: Record<string, string> = {};
  let firstFieldId: string | null = null;

  if (!parsed.success && guidance) {
    for (const issue of parsed.error.issues) {
      const pathField = issue.path[0];
      const field =
        typeof pathField === "string"
          ? pathField
          : ROOT_VALIDATION_FIELD[questionId];
      const message = field ? guidance[field] : undefined;
      if (!field || !message || errors[field]) continue;
      errors[field] = message;
      firstFieldId ??= validationFieldId(question, field);
    }
  }

  return {
    errors,
    firstFieldId,
    message:
      Object.keys(errors).length === 0
        ? "Choose an answer before continuing."
        : null,
  };
}

function renderQuestionPrompt(
  question: PlanHomeQuestionDefinition,
  answer: unknown,
  updateAnswer: (answer: unknown, persistence?: AnswerPersistence) => void,
  flushAnswer: (answer: unknown) => void,
  validationErrors: Readonly<Record<string, string>>,
  designDesk?: DesignDeskPromptContext,
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
          error={validationErrors.lotStatus}
          onChange={(lotStatus) => updateAnswer({ ...value, lotStatus })}
        />
        <ShortTextPrompt
          id={`${question.id}-location`}
          legend="Location"
          label="City, county, address, or target area"
          instructions="Enter at least two characters, or choose Not sure yet."
          error={validationErrors.location}
          value={value.location}
          maxLength={160}
          uncertainLabel="Not sure yet"
          uncertain={value.locationUncertain}
          onUncertainChange={(locationUncertain) =>
            updateAnswer({ ...value, locationUncertain })
          }
          onChange={(location) =>
            updateAnswer({ ...value, location }, "debounced")
          }
          onBlur={(location) => flushAnswer({ ...value, location })}
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
        errors={validationErrors}
      />
    );
  }

  if (question.id === "exterior.garage") {
    const value = answer as {
      bays: string | null;
      needs: readonly string[];
      other: string;
    };
    const needsGroup = question.response.optionGroups[1] as PlanHomeOptionGroup;
    return (
      <PromptStack>
        <ChoicePrompt
          id={`${question.id}-bays`}
          legend={firstGroup.label}
          options={firstGroup.options}
          value={value.bays}
          error={validationErrors.bays}
          onChange={(bays) => updateAnswer({ ...value, bays })}
        />
        <MultiChoicePrompt
          id={`${question.id}-needs`}
          legend={needsGroup.label}
          options={needsGroup.options}
          value={value.needs}
          error={validationErrors.needs}
          onChange={(needs) => updateAnswer({ ...value, needs })}
          instructions="Choose any needs that apply, or leave this group blank."
        />
        <ShortTextPrompt
          id={`${question.id}-other`}
          legend="Other garage need"
          label="Other"
          value={value.other}
          maxLength={120}
          optional
          instructions="Add one short garage need not listed above."
          error={validationErrors.other}
          onChange={(other) =>
            updateAnswer({ ...value, other }, "debounced")
          }
          onBlur={(other) => flushAnswer({ ...value, other })}
        />
      </PromptStack>
    );
  }

  if (question.id === "exterior.style") {
    return (
      <ExteriorStylePrompt
        id={question.id}
        legend={firstGroup.label}
        options={firstGroup.options}
        value={answer as readonly string[]}
        maxSelections={firstGroup.maxSelections ?? 2}
        exclusiveOptionSlugs={firstGroup.exclusiveOptionSlugs}
        instructions="Use these only to communicate broad exterior character, not a promised design."
        onChange={updateAnswer}
      />
    );
  }

  if (question.id === "design.feeling") {
    const value = answer as {
      feelings: readonly string[];
      likesAndDislikes: string;
    };
    return (
      <PromptStack>
        <MultiChoicePrompt
          id={`${question.id}-feelings`}
          legend={firstGroup.label}
          options={firstGroup.options}
          value={value.feelings}
          maxSelections={3}
          error={validationErrors.feelings}
          onChange={(feelings) => updateAnswer({ ...value, feelings })}
        />
        <ShortTextPrompt
          id={`${question.id}-current-home`}
          legend="Current home"
          label="What do you like or dislike now?"
          value={value.likesAndDislikes}
          maxLength={500}
          optional
          multiline
          error={validationErrors.likesAndDislikes}
          onChange={(likesAndDislikes) =>
            updateAnswer({ ...value, likesAndDislikes }, "debounced")
          }
          onBlur={(likesAndDislikes) =>
            flushAnswer({ ...value, likesAndDislikes })
          }
        />
      </PromptStack>
    );
  }

  if (question.id === "design.references" && designDesk) {
    const value = answer as {
      references: readonly PlanHomeReferenceMetadata[];
      noReferencesYet: boolean;
    };
    return (
      <ReferencesPrompt
        id={question.id}
        legend="Plans, images, and links"
        items={designDesk.referenceItems}
        noReferencesYet={value.noReferencesYet}
        onNoReferencesYetChange={(noReferencesYet) =>
          updateAnswer({
            references: noReferencesYet ? [] : value.references,
            noReferencesYet,
          })
        }
        onFilesSelected={designDesk.onFilesSelected}
        onLinkAdded={designDesk.onLinkAdded}
        onNoteChange={designDesk.onReferenceNoteChange}
        onRemove={designDesk.onReferenceRemove}
        onRetry={designDesk.onReferenceRetry}
        limits={question.response.limits as {
          total: number;
          files: number;
          links: number;
          bytesPerFile: number;
          totalFileBytes: number;
        }}
        instructions="Files upload directly to private Cloud Storage. h and h may review submitted material for this inquiry; ownership stays with you."
      />
    );
  }

  if (question.id === "design.priorities" && designDesk) {
    return (
      <PriorityPrompt
        id={question.id}
        legend="Priority groups"
        items={designDesk.priorityItems}
        value={answer as PriorityPromptValue}
        limits={{ mustHave: 5, niceToHave: 5, dealBreaker: 3 }}
        onChange={updateAnswer}
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
        columns={question.id === "contact.follow-up" ? 3 : 2}
        balancedPhoneGrid={question.id === "contact.follow-up"}
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
        errors={validationErrors}
        instructions={
          question.id === "project.budget-timing"
            ? undefined
            : "Complete each group before continuing."
        }
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
        <PlanHomeSceneSuspense>
          <WelcomeExteriorScene name={name} />
        </PlanHomeSceneSuspense>
      </div>
      <form className={styles.momentSheet} onSubmit={onSubmit}>
        <p className={styles.eyebrow}>Plan your home</p>
        <h1>Let’s put your name on the front door.</h1>
        <p className={styles.momentCopy}>
          Walk through a fixed illustrated home and tell us what your real home
          needs. Your answers shape the project brief, not the artwork.
        </p>
        <p className={styles.privacyNotice}>
          Before you enter a name, answers save in this browser for up to 30
          days. If you later save contact details, h and h keeps a private draft
          and any references under the retention schedule. Read the{" "}
          <a className="hh-touch-target" href="/privacy">
            privacy and retention policy
          </a>{"."}
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
        <a className={styles.resumeLink} href="/plan-your-home/resume">
          Resume a saved plan
        </a>
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
        <PlanHomeSceneSuspense>
          <LivingRoomScene activeAnchor="hall-doors" />
        </PlanHomeSceneSuspense>
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
        <p className={styles.privacyNotice}>
          Saving creates a private server draft kept up to 180 days after last
          activity, including private references you add later. h and h may
          follow up manually. A one-time resume email is sent only when you
          request it. See the{" "}
          <a className="hh-touch-target" href="/privacy">
            privacy policy
          </a>{"."}
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
  onContinue,
  reducedMotion,
}: Readonly<{
  onBack: () => void;
  onContinue: () => void;
  reducedMotion?: boolean;
}>) {
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
        <PlanHomeSceneSuspense>
          <BedroomHallThresholdScene />
        </PlanHomeSceneSuspense>
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
        <div className={styles.momentActions}>
          <Button type="button" variant="secondary" onClick={onBack}>
            Back to the closet
          </Button>
          <Button type="button" onClick={onContinue}>
            Continue down the hall
          </Button>
        </div>
      </div>
    </section>
  );
}

function UtilityHallBoundary({
  onBack,
  onContinue,
  reducedMotion,
}: Readonly<{
  onBack: () => void;
  onContinue: () => void;
  reducedMotion?: boolean;
}>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      className={styles.moment}
      data-reduced-motion={reducedMotion}
      data-tour-beat="utility-hall-transition"
    >
      <div className={styles.momentScene}>
        <PlanHomeSceneSuspense>
          <UtilityHallThresholdScene />
        </PlanHomeSceneSuspense>
      </div>
      <div className={styles.momentSheet}>
        <p className={styles.eyebrow}>Bedrooms and shared bathrooms saved</p>
        <h1 ref={headingRef} tabIndex={-1}>
          The utility hall is next.
        </h1>
        <p className={styles.momentCopy}>
          Bedroom users, arrangement, and bathroom sharing are checkpointed.
          Laundry, everyday entry, storage, and systems continue from here.
        </p>
        <div className={styles.momentActions}>
          <Button type="button" variant="secondary" onClick={onBack}>
            Back to shared bathrooms
          </Button>
          <Button type="button" onClick={onContinue}>
            Turn into the utility hall
          </Button>
        </div>
      </div>
    </section>
  );
}

function ExteriorBackDoorBoundary({
  onBack,
  onContinue,
  reducedMotion,
}: Readonly<{
  onBack: () => void;
  onContinue: () => void;
  reducedMotion?: boolean;
}>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      className={styles.moment}
      data-reduced-motion={reducedMotion}
      data-tour-beat="exterior-back-door-transition"
    >
      <div className={styles.momentScene}>
        <PlanHomeSceneSuspense>
          <ExteriorBackDoorThresholdScene />
        </PlanHomeSceneSuspense>
      </div>
      <div className={styles.momentSheet}>
        <p className={styles.eyebrow}>Utility priorities saved</p>
        <h1 ref={headingRef} tabIndex={-1}>
          The back door opens to the exterior.
        </h1>
        <p className={styles.momentCopy}>
          Laundry, everyday entry, storage, and broad system priorities are
          checkpointed. The exterior walkthrough begins beyond this threshold.
        </p>
        <div className={styles.momentActions}>
          <Button type="button" variant="secondary" onClick={onBack}>
            Back to home systems
          </Button>
          <Button type="button" onClick={onContinue}>
            Step through the back door
          </Button>
        </div>
      </div>
    </section>
  );
}

function BlueprintDesignDeskBoundary({
  onBack,
  onContinue,
  reducedMotion,
}: Readonly<{
  onBack: () => void;
  onContinue: () => void;
  reducedMotion?: boolean;
}>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      className={styles.moment}
      data-reduced-motion={reducedMotion}
      data-tour-beat="blueprint-design-desk-transition"
    >
      <div className={styles.momentScene}>
        <PlanHomeSceneSuspense>
          <BlueprintDesignDeskThresholdScene />
        </PlanHomeSceneSuspense>
      </div>
      <div className={styles.momentSheet}>
        <p className={styles.eyebrow}>Exterior and site priorities saved</p>
        <h1 ref={headingRef} tabIndex={-1}>
          The site sheet becomes the design desk.
        </h1>
        <p className={styles.momentCopy}>
          Garage, exterior direction, site relationships, outdoor living, and
          specialty-space priorities are checkpointed. The blueprint marks the
          threshold to inspiration and project planning.
        </p>
        <div className={styles.momentActions}>
          <Button type="button" variant="secondary" onClick={onBack}>
            Back to specialty spaces
          </Button>
          <Button type="button" onClick={onContinue}>
            Open the design desk
          </Button>
        </div>
      </div>
    </section>
  );
}

function ReviewBriefBoundary({
  onBack,
  onContinue,
  reducedMotion,
}: Readonly<{
  onBack: () => void;
  onContinue: () => void;
  reducedMotion?: boolean;
}>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      className={styles.moment}
      data-reduced-motion={reducedMotion}
      data-tour-beat="design-desk-review-transition"
    >
      <div className={styles.momentScene}>
        <PlanHomeSceneSuspense>
          <ReviewBriefThresholdScene />
        </PlanHomeSceneSuspense>
      </div>
      <div className={styles.momentSheet}>
        <p className={styles.eyebrow}>Design desk saved</p>
        <h1 ref={headingRef} tabIndex={-1}>
          Your selected sheets are bound into the project brief.
        </h1>
        <p className={styles.momentCopy}>
          Feel, references, priorities, budget context, and timing are
          checkpointed. One final follow-up choice leads to your complete brief.
        </p>
        <div className={styles.momentActions}>
          <Button type="button" variant="secondary" onClick={onBack}>
            Back to budget and timing
          </Button>
          <Button type="button" onClick={onContinue}>
            Choose follow-up
          </Button>
        </div>
      </div>
    </section>
  );
}

function ProjectBriefReview({
  state,
  consentAccepted,
  error,
  submitting,
  onConsentChange,
  onEdit,
  onSubmit,
}: Readonly<{
  state: PlanHomeTourState;
  consentAccepted: boolean;
  error: string | null;
  submitting: boolean;
  onConsentChange: (accepted: boolean) => void;
  onEdit: (questionId: PlanHomeQuestionId) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <main className={styles.review} data-tour-beat="project-brief-review">
      <section className={styles.reviewHero}>
        <div className={styles.reviewHeroScene} aria-hidden="true">
          <PlanHomeSceneSuspense>
            <ReviewBriefThresholdScene />
          </PlanHomeSceneSuspense>
        </div>
        <header className={styles.reviewHeader}>
          <p className={styles.eyebrow}>Review your project brief</p>
          <h1 ref={headingRef} tabIndex={-1}>
            One walkthrough, ready for a real conversation.
          </h1>
          <p>
            Check every answer and reference. Editing opens that Prompt and
            returns directly to this brief without replaying the rest.
          </p>
          <dl className={styles.reviewSummary} aria-label="Project brief summary">
            <div><dt>Prompts</dt><dd>35</dd></div>
            <div><dt>Zones</dt><dd>7</dd></div>
            <div><dt>References</dt><dd>{state.references.length}</dd></div>
          </dl>
        </header>
      </section>

      <div className={styles.reviewWorkspace} data-review-workspace>
        <nav className={styles.reviewNavigator} aria-label="Project brief sections">
          <p>Brief index</p>
          <a data-index="00" href="#review-contact">Contact</a>
          {planHomeZones.map((zone) => (
            <a
              data-index={String(zone.order).padStart(2, "0")}
              href={`#review-zone-${zone.id}`}
              key={zone.id}
              aria-label={`Zone ${zone.order}: ${zone.title}`}
            >
              Zone {zone.order}
            </a>
          ))}
          <a data-index="08" href="#review-references">References</a>
          <a data-index="09" href="#review-submit">Submit</a>
        </nav>

        <div className={styles.reviewFolio}>
          <section
            className={styles.reviewContact}
            id="review-contact"
            aria-labelledby="review-contact-heading"
          >
            <div>
              <p className={styles.reviewIndex}>Cover sheet</p>
              <h2 id="review-contact-heading">Contact details</h2>
            </div>
            <dl>
              <div><dt>Name</dt><dd>{state.welcomeName}</dd></div>
              <div><dt>Email</dt><dd>{state.contactCheckpoint?.email}</dd></div>
              <div><dt>Phone</dt><dd>{state.contactCheckpoint?.phone}</dd></div>
            </dl>
          </section>

          <div className={styles.reviewGroups}>
            {planHomeZones.map((zone) => {
              const questions = planHomeQuestions.filter(
                (question) => question.zoneId === zone.id,
              );
              return (
                <section
                  className={styles.reviewGroup}
                  id={`review-zone-${zone.id}`}
                  key={zone.id}
                  data-review-zone={zone.id}
                  data-review-sheet
                  aria-labelledby={`review-zone-heading-${zone.id}`}
                >
                  <div className={styles.reviewGroupHeading}>
                    <div>
                      <p className={styles.reviewIndex}>Zone {zone.order} of 7</p>
                      <h2 id={`review-zone-heading-${zone.id}`}>{zone.title}</h2>
                    </div>
                    <span aria-hidden="true">{String(zone.order).padStart(2, "0")}</span>
                  </div>
                  <dl className={styles.reviewAnswers}>
                    {questions.map((question) => (
                      <div key={question.id} data-review-question={question.id}>
                        <dt>
                          <span>Q{question.number}</span>
                          {question.prompt}
                        </dt>
                        <dd>
                          <span>
                            {summarizePlanHomeAnswer(
                              question.id,
                              state.answers[question.id],
                            )}
                          </span>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onEdit(question.id)}
                            aria-label={`Edit Q${question.number}: ${question.prompt}`}
                          >
                            Edit
                          </Button>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              );
            })}
          </div>

          <section
            className={styles.reviewReferences}
            id="review-references"
            data-review-references
            aria-labelledby="review-references-heading"
          >
            <div>
              <p className={styles.reviewIndex}>Reference sleeve</p>
              <h2 id="review-references-heading">Files and links</h2>
            </div>
            {state.references.length > 0 ? (
              <ul>
                {state.references.map((reference) => (
                  <li key={reference.id}>
                    <strong>
                      {reference.kind === "file"
                        ? reference.originalName
                        : reference.hostname}
                    </strong>
                    <span>
                      {reference.kind === "file"
                        ? `${reference.extension.toUpperCase()} · private file`
                        : reference.url}
                    </span>
                    {reference.note ? <span>Note: {reference.note}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No files or links were added to this project brief.</p>
            )}
          </section>

          <form
            className={styles.submitPanel}
            id="review-submit"
            data-review-submission
            onSubmit={onSubmit}
          >
            <p className={styles.eyebrow}>Final inquiry consent</p>
            <h2>Start the conversation.</h2>
            <p>
              This brief starts a conversation. It is not a design, price,
              feasibility decision, or contract.
            </p>
            <p>
              Under the proposed retention schedule, a submitted brief and private
              references are kept up to 24 months unless h and h retains or deletes
              them sooner. You may request deletion. Review the{" "}
              <a className="hh-touch-target" href="/privacy">
                privacy and retention policy
              </a>{" "}
              before submitting.
            </p>
            <label className={styles.disclosure}>
              <input
                type="checkbox"
                required
                checked={consentAccepted}
                onChange={(event) => onConsentChange(event.target.checked)}
              />
              <span>
                I am submitting an inquiry and permit h and h to contact me about
                this project. This is not marketing consent.
              </span>
            </label>
            {error ? <p className={styles.formError} role="alert">{error}</p> : null}
            <Button type="submit" disabled={submitting || !consentAccepted}>
              {submitting ? "Submitting…" : "Submit project brief"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

function PlanHomeConfirmation({
  name,
  followUp,
}: Readonly<{ name: string; followUp: string }>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <main className={styles.confirmation} data-tour-beat="plan-home-confirmation">
      <div className={styles.confirmationScene} data-confirmation-brief-scene aria-hidden="true">
        <PlanHomeSceneSuspense>
          <ReviewBriefThresholdScene />
        </PlanHomeSceneSuspense>
      </div>
      <section className={styles.confirmationSheet}>
        <div className={styles.confirmationMark} aria-hidden="true">✓</div>
        <p className={styles.eyebrow}>Project brief received</p>
        <h1 ref={headingRef} tabIndex={-1}>Thank you, {name}.</h1>
        <p>
          Your seven-zone project brief is with h and h. The answers and
          references you submitted stay together for review.
        </p>
        <h2>What happens next</h2>
        <ol className={styles.confirmationSteps} aria-label="What happens next">
          <li data-confirmation-step>
            <span>01</span>
            <div><strong>Brief received</strong><p>Your inquiry is recorded once.</p></div>
          </li>
          <li data-confirmation-step>
            <span>02</span>
            <div><strong>Personal review</strong><p>h and h reviews the project context.</p></div>
          </li>
          <li data-confirmation-step>
            <span>03</span>
            <div><strong>Project follow-up</strong><p>We use your selected method.</p></div>
          </li>
        </ol>
        <p className={styles.confirmationFollowUp} data-confirmation-follow-up>
          <strong>{followUp} is your selected project follow-up.</strong>{" "}
          This is not marketing consent.
        </p>
        <p className={styles.confirmationNote}>
          Your brief begins a conversation; it is not a design, price,
          feasibility decision, or contract.
        </p>
      </section>
    </main>
  );
}

function DraftRestoreBoundary({
  unavailable,
  onRetry,
}: Readonly<{ unavailable: boolean; onRetry: () => void }>) {
  return (
    <main className={styles.restoreBoundary} aria-labelledby="draft-restore-title">
      <div className={styles.restoreRail} aria-hidden="true">
        <span />
        <span />
      </div>
      <div className={styles.restoreScene} aria-hidden="true" />
      <section className={styles.restoreSheet}>
        <p className={styles.eyebrow}>Plan Your Home</p>
        <h1 id="draft-restore-title" tabIndex={-1}>
          {unavailable
            ? "Your saved plan is still protected."
            : "Checking this browser’s saved plan…"}
        </h1>
        <p role="status">
          {unavailable
            ? "We could not safely verify the saved boundary right now. Nothing stored in this browser was removed. Try again when the connection is available."
            : "We’re matching this browser with the latest trusted room checkpoint before opening the tour."}
        </p>
        {unavailable ? (
          <Button type="button" onClick={onRetry}>
            Try verification again
          </Button>
        ) : null}
      </section>
    </main>
  );
}

export function PlanYourHomeShell({
  createDraft = unavailableDraftAction,
  restoreDraft = skippedRestoreAction,
  checkpointDraft = unavailableDraftAction,
  submitDraft = unavailableSubmitAction,
  issueReferenceUpload = unavailableReferenceAction,
  finalizeReferenceUpload = unavailableReferenceAction,
  abandonReferenceUpload = unavailableReferenceAction,
  addReferenceLink = unavailableReferenceAction,
  removeReference = unavailableReferenceAction,
  syncReferenceNotes = unavailableReferenceAction,
  directUploader = uploadDirectly,
  reducedMotion,
  refinementFixture,
}: PlanYourHomeShellProps = {}) {
  const [tourState, setTourState] = useState<PlanHomeTourState>(() =>
    refinementFixture?.state ?? createInitialPlanHomeTourState(),
  );
  const [draftAnswers, setDraftAnswers] = useState<Record<string, unknown>>(() =>
    ({ ...initialDraftAnswers(), ...refinementFixture?.state.answers }),
  );
  const [welcomeName, setWelcomeName] = useState(
    refinementFixture?.state.welcomeName ?? "",
  );
  const [contactFields, setContactFields] = useState<ContactFields>({
    email: refinementFixture?.state.contactCheckpoint?.email ?? "",
    phone: refinementFixture?.state.contactCheckpoint?.phone ?? "",
    disclosureAccepted:
      refinementFixture?.state.contactCheckpoint
        ?.manualFollowUpDisclosureAccepted ?? false,
  });
  const [clientDraft, setClientDraft] = useState<PlanHomeClientDraftState | null>(
    null,
  );
  const [error, setError] = useState<PlanHomeTourTransition["error"]>(null);
  const [validationErrors, setValidationErrors] = useState<
    Readonly<Record<string, string>>
  >({});
  const [validationFocus, setValidationFocus] = useState({
    fieldId: "",
    attempt: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBedroomHallBoundary, setShowBedroomHallBoundary] = useState(false);
  const [showUtilityHallBoundary, setShowUtilityHallBoundary] = useState(false);
  const [showExteriorBackDoorBoundary, setShowExteriorBackDoorBoundary] =
    useState(false);
  const [showBlueprintDesignDeskBoundary, setShowBlueprintDesignDeskBoundary] =
    useState(false);
  const [showReviewBriefBoundary, setShowReviewBriefBoundary] = useState(false);
  const [submissionConsentAccepted, setSubmissionConsentAccepted] =
    useState(false);
  const [submitted, setSubmitted] = useState(refinementFixture?.submitted ?? false);
  const [restoreStatus, setRestoreStatus] = useState<
    "pending" | "ready" | "unavailable"
  >(
    refinementFixture || restoreDraft === skippedRestoreAction
      ? "ready"
      : "pending",
  );
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<
    readonly PendingReferenceUpload[]
  >([]);
  const utilityCheckpointAnswers = useRef<Record<string, unknown> | null>(null);
  const exteriorCheckpointAnswers = useRef<Record<string, unknown> | null>(null);
  const designCheckpointAnswers = useRef<Record<string, unknown> | null>(null);
  const submissionInFlight = useRef(false);
  const resumeAnalyticsTracked = useRef(false);
  const tourStateRef = useRef(tourState);
  const textSaveTimer = useRef<number | null>(null);
  const experienceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tourStateRef.current = tourState;
  }, [tourState]);

  useEffect(() => {
    if (!validationFocus.fieldId) return;
    const field = experienceRef.current?.querySelector<HTMLElement>(
      `[data-plan-home-field="${CSS.escape(validationFocus.fieldId)}"]`,
    );
    const firstControl = field?.querySelector<HTMLElement>(
      "input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
    );
    firstControl?.focus({ preventScroll: true });
    field?.scrollIntoView?.({ block: "center" });
  }, [validationFocus]);

  useEffect(
    () => () => {
      if (textSaveTimer.current !== null) {
        window.clearTimeout(textSaveTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    const questionNumber =
      tourState.location.kind === "question"
        ? (getPlanHomeQuestion(tourState.location.questionId)?.number ?? null)
        : tourState.location.kind === "welcome"
          ? null
          : planHomeQuestions.length;
    preloadNextPlanHomeScene(questionNumber);
  }, [tourState.location]);

  useEffect(() => {
    if (refinementFixture) return;
    let cancelled = false;
    if (restoreDraft !== skippedRestoreAction) setRestoreStatus("pending");
    const restore = window.setTimeout(() => {
      void (async () => {
      const localAdapter = createPlanHomeLocalSnapshotAdapter({
        storage: window.localStorage,
      });
      const clientAdapter = createPlanHomeClientDraftAdapter(window.localStorage);
      const local = localAdapter.load();
      const storedClientDraft = clientAdapter.load();
      const serverRestore = await restoreDraft().catch(
        () => ({ status: "unavailable" as const }),
      );
      if (cancelled) return;

      let restored = local;
      let nextClientDraft = storedClientDraft;
      if (serverRestore.status === "success") {
        const reconciled = reconcilePlanHomeDraft({
          local,
          localDraftId: storedClientDraft?.draftId ?? null,
          localRevision: storedClientDraft?.revision ?? null,
          boundary: serverRestore.result,
        });
        restored = reconciled.state;
        const canReuseLocalKeys =
          storedClientDraft?.draftId === serverRestore.result.draftId &&
          storedClientDraft.revision === serverRestore.result.revision;
        nextClientDraft = canReuseLocalKeys
          ? { ...storedClientDraft, revision: serverRestore.result.revision }
          : {
              createIdempotencyKey: createIdempotencyKey("contact-gate"),
              projectAndLivingCheckpointKey: null,
              kitchenAndDiningCheckpointKey: null,
              primarySuiteCheckpointKey: null,
              bedroomsAndSharedBathroomsCheckpointKey: null,
              utilityAndSystemsCheckpointKey: null,
              exteriorAndSiteCheckpointKey: null,
              designDeskCheckpointKey: null,
              submissionIdempotencyKey: null,
              draftId: serverRestore.result.draftId,
              revision: serverRestore.result.revision,
            } satisfies PlanHomeClientDraftState;
        localAdapter.save(restored);
        clientAdapter.save(nextClientDraft);
      } else if (serverRestore.status === "no-session") {
        restored = safeAnonymousLocalState(local);
        nextClientDraft = null;
        if (restored.contactCheckpoint === null && restored.location.kind === "welcome") {
          localAdapter.clear();
        } else {
          localAdapter.save(restored);
        }
        clientAdapter.clear();
      } else if (serverRestore.status === "unavailable") {
        setClientDraft(null);
        setRestoreStatus("unavailable");
        return;
      }

      if (restored) {
        tourStateRef.current = restored;
        setTourState(restored);
        setWelcomeName(restored.welcomeName);
        setDraftAnswers({ ...initialDraftAnswers(), ...restored.answers });
        if (restored.checkpointedZoneIds.includes("utility-and-systems")) {
          utilityCheckpointAnswers.current = Object.fromEntries(
            planHomeQuestions
              .slice(0, UTILITY_AND_SYSTEMS_LAST_QUESTION)
              .map((question) => [question.id, restored.answers[question.id]]),
          );
        }
        if (restored.checkpointedZoneIds.includes("exterior-and-site")) {
          exteriorCheckpointAnswers.current = Object.fromEntries(
            planHomeQuestions
              .slice(0, EXTERIOR_AND_SITE_LAST_QUESTION)
              .map((question) => [question.id, restored.answers[question.id]]),
          );
        }
        if (restored.checkpointedZoneIds.includes("design-desk-and-review")) {
          designCheckpointAnswers.current = Object.fromEntries(
            planHomeQuestions
              .slice(0, DESIGN_DESK_LAST_QUESTION)
              .map((question) => [question.id, restored.answers[question.id]]),
          );
        }
        if (restored.contactCheckpoint) {
          setContactFields({
            email: restored.contactCheckpoint.email,
            phone: restored.contactCheckpoint.phone,
            disclosureAccepted:
              restored.contactCheckpoint.manualFollowUpDisclosureAccepted,
          });
        }
        if (
          restored.location.kind !== "welcome" &&
          !resumeAnalyticsTracked.current
        ) {
          const activeQuestion =
            restored.location.kind === "question"
              ? getPlanHomeQuestion(restored.location.questionId)
              : null;
          resumeAnalyticsTracked.current = true;
          trackPlanHomeEvent("draft_resumed", {
            prompt_index: activeQuestion?.number ?? 35,
          });
        }
      }
      setClientDraft(nextClientDraft);
      setRestoreStatus("ready");
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(restore);
    };
  }, [refinementFixture, restoreAttempt, restoreDraft]);

  function saveLocal(state: PlanHomeTourState) {
    createPlanHomeLocalSnapshotAdapter({ storage: window.localStorage }).save(state);
  }

  function commitState(state: PlanHomeTourState) {
    tourStateRef.current = state;
    setTourState(state);
    saveLocal(state);
  }

  function cancelPendingTextSave() {
    if (textSaveTimer.current === null) return;
    window.clearTimeout(textSaveTimer.current);
    textSaveTimer.current = null;
  }

  function persistLocalAnswer(questionId: PlanHomeQuestionId, answer: unknown) {
    const state = tourStateRef.current;
    if (
      state.location.kind !== "question" ||
      state.location.questionId !== questionId ||
      state.location.editingFromReview
    ) {
      return false;
    }

    const transition = reducePlanHomeTour(state, {
      type: "answer-question",
      questionId,
      answer,
    });
    if (transition.error) return false;
    commitState(transition.state);
    return true;
  }

  function scheduleLocalAnswerSave(
    questionId: PlanHomeQuestionId,
    answer: unknown,
  ) {
    cancelPendingTextSave();
    textSaveTimer.current = window.setTimeout(() => {
      textSaveTimer.current = null;
      persistLocalAnswer(questionId, answer);
    }, LOCAL_TEXT_SAVE_DEBOUNCE_MS);
  }

  function updateDraftAnswer(
    questionId: PlanHomeQuestionId,
    answer: unknown,
    persistence: AnswerPersistence = "immediate",
  ) {
    setDraftAnswers((current) => ({ ...current, [questionId]: answer }));
    setError(null);
    setValidationErrors({});

    if (tourStateRef.current.location.kind !== "question") return;
    if (tourStateRef.current.location.editingFromReview) return;
    if (persistence === "debounced") {
      scheduleLocalAnswerSave(questionId, answer);
      return;
    }
    cancelPendingTextSave();
    persistLocalAnswer(questionId, answer);
  }

  function flushDraftAnswer(questionId: PlanHomeQuestionId, answer: unknown) {
    cancelPendingTextSave();
    persistLocalAnswer(questionId, answer);
  }

  function currentClientDraft() {
    return createPlanHomeClientDraftAdapter(window.localStorage).load();
  }

  function updateClientDraftRevision(revision: number) {
    const current = currentClientDraft();
    if (!current) return;
    const updated = { ...current, revision } satisfies PlanHomeClientDraftState;
    createPlanHomeClientDraftAdapter(window.localStorage).save(updated);
    setClientDraft(updated);
  }

  function referenceAnswer() {
    return draftAnswers["design.references"] as {
      references: readonly PlanHomeReferenceMetadata[];
      noReferencesYet: boolean;
    };
  }

  function setCanonicalReferences(
    references: readonly PlanHomeReferenceMetadata[],
    noReferencesYet = false,
  ) {
    const answer = { references, noReferencesYet };
    setDraftAnswers((current) => ({
      ...current,
      "design.references": answer,
    }));
    if (
      tourState.location.kind === "question" &&
      tourState.location.questionId === "design.references"
    ) {
      const transition = reducePlanHomeTour(tourState, {
        type: "answer-question",
        questionId: "design.references",
        answer,
      });
      if (!transition.error) commitState(transition.state);
    }
  }

  async function uploadReferenceFile(file: File, pendingId: string) {
    const draft = currentClientDraft();
    if (!draft?.draftId || !draft.revision) {
      setPendingUploads((current) =>
        current.map((upload) =>
          upload.id === pendingId
            ? {
                ...upload,
                status: "error",
                error: "Return to the contact checkpoint before adding files.",
              }
            : upload,
        ),
      );
      return;
    }

    const issued = await issueReferenceUpload({
      draftId: draft.draftId,
      expectedRevision: draft.revision,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (issued.status !== "success") {
      setPendingUploads((current) =>
        current.map((upload) =>
          upload.id === pendingId
            ? { ...upload, status: "error", error: issued.message }
            : upload,
        ),
      );
      return;
    }

    const capability = issued.result;
    setPendingUploads((current) =>
      current.map((upload) =>
        upload.id === pendingId
          ? { ...upload, referenceId: capability.referenceId, progress: 0 }
          : upload,
      ),
    );

    try {
      await directUploader(capability, file, (progress) =>
        setPendingUploads((current) =>
          current.map((upload) =>
            upload.id === pendingId ? { ...upload, progress } : upload,
          ),
        ),
      );
      const latestDraft = currentClientDraft();
      if (!latestDraft?.draftId || !latestDraft.revision) {
        throw new Error("The draft session changed during upload.");
      }
      const finalized = await finalizeReferenceUpload({
        draftId: latestDraft.draftId,
        expectedRevision: latestDraft.revision,
        referenceId: capability.referenceId,
        note: "",
      });
      if (finalized.status !== "success") {
        throw new Error(finalized.message);
      }
      updateClientDraftRevision(finalized.result.revision);
      setCanonicalReferences(finalized.result.references);
      setPendingUploads((current) =>
        current.filter((upload) => upload.id !== pendingId),
      );
      setError(null);
      trackPlanHomeEvent("reference_added", {
        zone_id: "design-desk-and-review",
        prompt_index: 32,
        reference_kind: "file",
      });
    } catch (uploadError) {
      await abandonReferenceUpload({
        draftId: capability.draftId,
        referenceId: capability.referenceId,
      });
      setPendingUploads((current) =>
        current.map((upload) =>
          upload.id === pendingId
            ? {
                ...upload,
                referenceId: null,
                status: "error",
                error:
                  uploadError instanceof Error
                    ? uploadError.message
                    : "The upload failed. Try again.",
              }
            : upload,
        ),
      );
    }
  }

  async function addFiles(files: readonly File[]) {
    for (const file of files) {
      const pendingId = `pending-${randomUuidV4()}`;
      setPendingUploads((current) => [
        ...current,
        {
          id: pendingId,
          file,
          referenceId: null,
          status: "uploading",
          progress: 0,
          error: null,
        },
      ]);
      await uploadReferenceFile(file, pendingId);
    }
  }

  async function addLink(url: string) {
    const draft = currentClientDraft();
    if (!draft?.draftId || !draft.revision) return;
    const result = await addReferenceLink({
      draftId: draft.draftId,
      expectedRevision: draft.revision,
      url,
      note: "",
    });
    if (result.status !== "success") {
      setError({ code: "invalid-answer", message: result.message });
      return;
    }
    updateClientDraftRevision(result.result.revision);
    setCanonicalReferences(result.result.references);
    setError(null);
    trackPlanHomeEvent("reference_added", {
      zone_id: "design-desk-and-review",
      prompt_index: 32,
      reference_kind: "link",
    });
  }

  function changeReferenceNote(id: string, note: string) {
    const answer = referenceAnswer();
    setCanonicalReferences(
      answer.references.map((reference) => {
        if (reference.id !== id) return reference;
        const withoutNote = { ...reference };
        delete withoutNote.note;
        return note ? { ...withoutNote, note } : withoutNote;
      }),
      false,
    );
  }

  async function removeReferenceItem(id: string) {
    const pending = pendingUploads.find((upload) => upload.id === id);
    if (pending) {
      const draft = currentClientDraft();
      if (draft?.draftId && pending.referenceId) {
        await abandonReferenceUpload({
          draftId: draft.draftId,
          referenceId: pending.referenceId,
        });
      }
      setPendingUploads((current) =>
        current.filter((upload) => upload.id !== id),
      );
      return;
    }
    const draft = currentClientDraft();
    if (!draft?.draftId || !draft.revision) return;
    const result = await removeReference({
      draftId: draft.draftId,
      expectedRevision: draft.revision,
      referenceId: id,
    });
    if (result.status !== "success") {
      setError({ code: "invalid-answer", message: result.message });
      return;
    }
    updateClientDraftRevision(result.result.revision);
    setCanonicalReferences(result.result.references);
    setError(null);
  }

  async function retryReferenceUpload(id: string) {
    const pending = pendingUploads.find((upload) => upload.id === id);
    if (!pending) return;
    setPendingUploads((current) =>
      current.map((upload) =>
        upload.id === id
          ? { ...upload, status: "uploading", progress: 0, error: null }
          : upload,
      ),
    );
    await uploadReferenceFile(pending.file, id);
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
    trackPlanHomeEvent("plan_home_start", { prompt_index: 1 });
  }

  function saveBeforeExit() {
    const current = tourStateRef.current;
    if (persistCurrentQuestionDraft()) return;
    if (current.location.kind === "welcome" && welcomeName.trim().length >= 2) {
      const named = reducePlanHomeTour(current, {
        type: "set-welcome-name",
        name: welcomeName,
      });
      if (!named.error) saveLocal(named.state);
    }
  }

  function persistCurrentQuestionDraft() {
    const location = tourStateRef.current.location;
    if (location.kind !== "question") return false;
    persistLocalAnswer(location.questionId, draftAnswers[location.questionId]);
    return true;
  }

  function backFromQuestion() {
    cancelPendingTextSave();
    const location = tourStateRef.current.location;
    if (location.kind === "question" && location.editingFromReview) {
      setDraftAnswers((current) => ({
        ...current,
        [location.questionId]: tourStateRef.current.answers[location.questionId],
      }));
      const cancelled = reducePlanHomeTour(tourStateRef.current, {
        type: "return-to-review",
      });
      if (cancelled.error) {
        setError(cancelled.error);
        return false;
      }
      setError(null);
      commitState(cancelled.state);
      return true;
    }

    persistCurrentQuestionDraft();
    const transition = reducePlanHomeTour(tourStateRef.current, { type: "back" });
    if (transition.error) {
      setError(transition.error);
      return false;
    }
    setError(null);
    commitState(transition.state);
    return true;
  }

  async function nextFromQuestion(question: PlanHomeQuestionDefinition) {
    cancelPendingTextSave();
    let activeAnswer = draftAnswers[question.id];
    if (question.id === "design.references") {
      if (pendingUploads.length > 0) {
        setError({
          code: "invalid-answer",
          message: "Finish, retry, or remove each upload before continuing.",
        });
        return false;
      }
      const draft = currentClientDraft();
      const value = activeAnswer as {
        references: readonly PlanHomeReferenceMetadata[];
        noReferencesYet: boolean;
      };
      if (draft?.draftId && draft.revision && value.references.length > 0) {
        const result = await syncReferenceNotes({
          draftId: draft.draftId,
          expectedRevision: draft.revision,
          notes: value.references.map((reference) => ({
            referenceId: reference.id,
            note: reference.note ?? "",
          })),
        });
        if (result.status !== "success") {
          setError({ code: "invalid-answer", message: result.message });
          return false;
        }
        updateClientDraftRevision(result.result.revision);
        activeAnswer = {
          references: result.result.references,
          noReferencesYet: false,
        };
        setDraftAnswers((current) => ({
          ...current,
          "design.references": activeAnswer,
        }));
      }
    }
    const answered = reducePlanHomeTour(tourStateRef.current, {
      type: "answer-question",
      questionId: question.id as PlanHomeQuestionId,
      answer: activeAnswer,
    });
    if (answered.error) {
      const feedback = customerValidationFeedback(question, activeAnswer);
      setValidationErrors(feedback.errors);
      setError(
        feedback.message
          ? { code: "invalid-answer", message: feedback.message }
          : null,
      );
      if (feedback.firstFieldId) {
        setValidationFocus((current) => ({
          fieldId: feedback.firstFieldId ?? "",
          attempt: current.attempt + 1,
        }));
      }
      return false;
    }

    const advanced = reducePlanHomeTour(answered.state, { type: "next" });
    if (advanced.error) {
      setError(advanced.error);
      return false;
    }

    if (
      tourStateRef.current.location.kind === "question" &&
      tourStateRef.current.location.editingFromReview
    ) {
      setError(null);
      commitState(advanced.state);
      return true;
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
              : question.number === BEDROOMS_AND_SHARED_BATHROOMS_LAST_QUESTION
                ? ({
                    zoneId: "bedrooms-and-shared-bathrooms",
                    answerCount: BEDROOMS_AND_SHARED_BATHROOMS_LAST_QUESTION,
                    keyField: "bedroomsAndSharedBathroomsCheckpointKey",
                  } as const)
                : question.number === UTILITY_AND_SYSTEMS_LAST_QUESTION
                  ? ({
                      zoneId: "utility-and-systems",
                      answerCount: UTILITY_AND_SYSTEMS_LAST_QUESTION,
                      keyField: "utilityAndSystemsCheckpointKey",
                    } as const)
                  : question.number === EXTERIOR_AND_SITE_LAST_QUESTION
                    ? ({
                        zoneId: "exterior-and-site",
                        answerCount: EXTERIOR_AND_SITE_LAST_QUESTION,
                        keyField: "exteriorAndSiteCheckpointKey",
                      } as const)
                    : question.number === DESIGN_DESK_LAST_QUESTION
                      ? ({
                          zoneId: "design-desk-and-review",
                          answerCount: DESIGN_DESK_LAST_QUESTION,
                          keyField: "designDeskCheckpointKey",
                        } as const)
                      : null;

    if (checkpointBoundary) {
      if (refinementFixture) {
        setError(null);
        commitState(advanced.state);
        return true;
      }
      commitState(answered.state);
      if (!clientDraft?.draftId || !clientDraft.revision) {
        setError({
          code: "contact-required",
          message: "Return to the contact checkpoint before saving this room.",
        });
        return false;
      }

      if (saving) return false;
      const checkpointAnswers = Object.fromEntries(
        planHomeQuestions
          .slice(0, checkpointBoundary.answerCount)
          .map((item) => [item.id, answered.state.answers[item.id]]),
      );
      if (
        checkpointBoundary.zoneId === "utility-and-systems" &&
        utilityCheckpointAnswers.current &&
        JSON.stringify(utilityCheckpointAnswers.current) ===
          JSON.stringify(checkpointAnswers)
      ) {
        setError(null);
        commitState(advanced.state);
        setShowExteriorBackDoorBoundary(true);
        return true;
      }
      if (
        checkpointBoundary.zoneId === "exterior-and-site" &&
        exteriorCheckpointAnswers.current &&
        JSON.stringify(exteriorCheckpointAnswers.current) ===
          JSON.stringify(checkpointAnswers)
      ) {
        setError(null);
        commitState(advanced.state);
        setShowBlueprintDesignDeskBoundary(true);
        return true;
      }
      if (
        checkpointBoundary.zoneId === "design-desk-and-review" &&
        designCheckpointAnswers.current &&
        JSON.stringify(designCheckpointAnswers.current) ===
          JSON.stringify(checkpointAnswers)
      ) {
        setError(null);
        commitState(advanced.state);
        setShowReviewBriefBoundary(true);
        return true;
      }
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
        answers: checkpointAnswers,
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
      if (checkpointBoundary.zoneId === "utility-and-systems") {
        utilityCheckpointAnswers.current = structuredClone(checkpointAnswers);
      }
      if (checkpointBoundary.zoneId === "exterior-and-site") {
        exteriorCheckpointAnswers.current = structuredClone(checkpointAnswers);
      }
      if (checkpointBoundary.zoneId === "design-desk-and-review") {
        designCheckpointAnswers.current = structuredClone(checkpointAnswers);
      }
      setError(null);
      commitState(checkpointed.state);
      trackPlanHomeEvent("zone_complete", {
        zone_id: checkpointBoundary.zoneId,
        prompt_index: checkpointBoundary.answerCount,
      });
      if (question.number === PRIMARY_SUITE_LAST_QUESTION) {
        setShowBedroomHallBoundary(true);
      }
      if (question.number === BEDROOMS_AND_SHARED_BATHROOMS_LAST_QUESTION) {
        setShowUtilityHallBoundary(true);
      }
      if (question.number === UTILITY_AND_SYSTEMS_LAST_QUESTION) {
        setShowExteriorBackDoorBoundary(true);
      }
      if (question.number === EXTERIOR_AND_SITE_LAST_QUESTION) {
        setShowBlueprintDesignDeskBoundary(true);
      }
      if (question.number === DESIGN_DESK_LAST_QUESTION) {
        setShowReviewBriefBoundary(true);
      }
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

    if (refinementFixture) {
      setFormError(null);
      commitState(completed.state);
      return;
    }

    const pendingDraft =
      clientDraft ??
      ({
        createIdempotencyKey: createIdempotencyKey("contact-gate"),
        projectAndLivingCheckpointKey: null,
        kitchenAndDiningCheckpointKey: null,
        primarySuiteCheckpointKey: null,
        bedroomsAndSharedBathroomsCheckpointKey: null,
        utilityAndSystemsCheckpointKey: null,
        exteriorAndSiteCheckpointKey: null,
        designDeskCheckpointKey: null,
        submissionIdempotencyKey: null,
        draftId: null,
        revision: null,
      } satisfies PlanHomeClientDraftState);
    createPlanHomeClientDraftAdapter(window.localStorage).save(pendingDraft);
    setClientDraft(pendingDraft);
    document
      .getElementById("plan-home-contact-heading")
      ?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
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
      bedroomsAndSharedBathroomsCheckpointKey:
        pendingDraft.bedroomsAndSharedBathroomsCheckpointKey ?? null,
      utilityAndSystemsCheckpointKey:
        pendingDraft.utilityAndSystemsCheckpointKey ?? null,
      exteriorAndSiteCheckpointKey:
        pendingDraft.exteriorAndSiteCheckpointKey ?? null,
      designDeskCheckpointKey:
        pendingDraft.designDeskCheckpointKey ?? null,
      submissionIdempotencyKey:
        pendingDraft.submissionIdempotencyKey ?? null,
      draftId: result.result.draftId,
      revision: result.result.revision,
    } satisfies PlanHomeClientDraftState;
    createPlanHomeClientDraftAdapter(window.localStorage).save(identifiedDraft);
    setClientDraft(identifiedDraft);
    setFormError(null);
    commitState(completed.state);
    trackPlanHomeEvent("contact_checkpoint_saved", { prompt_index: 6 });
  }

  function backFromContact() {
    const transition = reducePlanHomeTour(tourState, { type: "back" });
    if (!transition.error) {
      setFormError(null);
      commitState(transition.state);
    }
  }

  function backFromBoundary() {
    setShowBedroomHallBoundary(false);
    setShowUtilityHallBoundary(false);
    setShowExteriorBackDoorBoundary(false);
    setShowBlueprintDesignDeskBoundary(false);
    setShowReviewBriefBoundary(false);
    const transition = reducePlanHomeTour(tourState, { type: "back" });
    if (transition.error) return false;
    commitState(transition.state);
    return true;
  }

  function backFromExteriorBoundary() {
    if (clientDraft) {
      const editableDraft = {
        ...clientDraft,
        utilityAndSystemsCheckpointKey: null,
      } satisfies PlanHomeClientDraftState;
      createPlanHomeClientDraftAdapter(window.localStorage).save(editableDraft);
      setClientDraft(editableDraft);
    }
    return backFromBoundary();
  }

  function backFromBlueprintBoundary() {
    setShowBlueprintDesignDeskBoundary(false);
    if (clientDraft) {
      const editableDraft = {
        ...clientDraft,
        exteriorAndSiteCheckpointKey: null,
      } satisfies PlanHomeClientDraftState;
      createPlanHomeClientDraftAdapter(window.localStorage).save(editableDraft);
      setClientDraft(editableDraft);
    }
    return backFromBoundary();
  }

  function backFromReviewBriefBoundary() {
    setShowReviewBriefBoundary(false);
    if (clientDraft) {
      const editableDraft = {
        ...clientDraft,
        designDeskCheckpointKey: null,
      } satisfies PlanHomeClientDraftState;
      createPlanHomeClientDraftAdapter(window.localStorage).save(editableDraft);
      setClientDraft(editableDraft);
    }
    return backFromBoundary();
  }

  function editReviewQuestion(questionId: PlanHomeQuestionId) {
    cancelPendingTextSave();
    const transition = reducePlanHomeTour(tourState, {
      type: "jump-to-review-question",
      questionId,
    });
    if (transition.error) {
      setFormError(transition.error.message);
      return;
    }
    setDraftAnswers((current) => ({
      ...current,
      [questionId]: tourState.answers[questionId],
    }));
    setFormError(null);
    commitState(transition.state);
  }

  async function submitProjectBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || submissionInFlight.current) return;
    if (!submissionConsentAccepted) {
      setFormError("Confirm that you are submitting an inquiry and permit project-related contact.");
      return;
    }

    if (refinementFixture) {
      submissionInFlight.current = true;
      setSaving(true);
      setFormError(null);
      await Promise.resolve();
      setSaving(false);
      setSubmitted(true);
      trackPlanHomeEvent("plan_home_submitted", {
        zone_id: "design-desk-and-review",
        prompt_index: 35,
      });
      return;
    }

    const latestDraft = currentClientDraft();
    if (!latestDraft?.draftId || !latestDraft.revision) {
      setFormError("This saved draft session is missing. Return to the contact checkpoint and try again.");
      return;
    }
    const submissionIdempotencyKey =
      latestDraft.submissionIdempotencyKey ?? createIdempotencyKey("submission");
    const preparedDraft = {
      ...latestDraft,
      submissionIdempotencyKey,
    } satisfies PlanHomeClientDraftState;
    createPlanHomeClientDraftAdapter(window.localStorage).save(preparedDraft);
    setClientDraft(preparedDraft);
    submissionInFlight.current = true;
    setSaving(true);
    setFormError(null);

    const result = await submitDraft({
      draftId: preparedDraft.draftId,
      expectedRevision: preparedDraft.revision,
      idempotencyKey: submissionIdempotencyKey,
      answers: tourState.answers,
      references: tourState.references,
      consent: {
        version: PLAN_HOME_INQUIRY_CONSENT_VERSION,
        inquiryAndProjectContactAccepted: true,
      },
    }).catch(() => ({
      status: "server-error" as const,
      message: "Your project brief could not be submitted right now.",
    }));
    setSaving(false);
    if (result.status !== "success") {
      submissionInFlight.current = false;
      setFormError(actionError(result));
      return;
    }

    updateClientDraftRevision(result.result.revision);
    setSubmitted(true);
    trackPlanHomeEvent("plan_home_submitted", {
      zone_id: "design-desk-and-review",
      prompt_index: 35,
    });
  }

  function backFromDesignDeskQuestion() {
    const moved = backFromQuestion();
    if (moved) setShowBlueprintDesignDeskBoundary(true);
    return moved;
  }

  const activeQuestion =
    tourState.location.kind === "question"
      ? getPlanHomeQuestion(tourState.location.questionId)
      : undefined;
  const referencesValue = draftAnswers["design.references"] as {
    references: readonly PlanHomeReferenceMetadata[];
    noReferencesYet: boolean;
  };
  const referenceItems: readonly ReferencePromptItem[] = [
    ...referencesValue.references.map((reference) =>
      reference.kind === "file"
        ? {
            id: reference.id,
            kind: "file" as const,
            label: reference.originalName,
            detail: `${reference.extension.toUpperCase()} · ${Math.max(1, Math.round(reference.sizeBytes / 1024))} KB · private`,
            note: reference.note ?? "",
            sizeBytes: reference.sizeBytes,
            status: "ready" as const,
          }
        : {
            id: reference.id,
            kind: "link" as const,
            label: reference.hostname,
            detail: reference.url,
            note: reference.note ?? "",
            href: reference.url,
            status: "ready" as const,
          },
    ),
    ...pendingUploads.map((upload) => ({
      id: upload.id,
      kind: "file" as const,
      label: upload.file.name,
      detail:
        upload.status === "uploading"
          ? `Uploading directly · ${upload.progress}%`
          : "Upload needs attention",
      note: "",
      sizeBytes: upload.file.size,
      status: upload.status,
      progress: upload.progress,
      error: upload.error ?? undefined,
    })),
  ];
  let content: ReactNode;
  if (restoreStatus !== "ready") {
    content = (
      <DraftRestoreBoundary
        unavailable={restoreStatus === "unavailable"}
        onRetry={() => setRestoreAttempt((attempt) => attempt + 1)}
      />
    );
  } else if (submitted) {
    content = (
      <PlanHomeConfirmation
        name={tourState.welcomeName}
        followUp={summarizePlanHomeAnswer(
          "contact.follow-up",
          tourState.answers["contact.follow-up"],
        )}
      />
    );
  } else if (tourState.location.kind === "welcome") {
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
  } else if (showBedroomHallBoundary) {
    content = (
      <BedroomHallBoundary
        onBack={backFromBoundary}
        onContinue={() => setShowBedroomHallBoundary(false)}
        reducedMotion={reducedMotion}
      />
    );
  } else if (showUtilityHallBoundary) {
    content = (
      <UtilityHallBoundary
        onBack={backFromBoundary}
        onContinue={() => setShowUtilityHallBoundary(false)}
        reducedMotion={reducedMotion}
      />
    );
  } else if (showExteriorBackDoorBoundary) {
    content = (
      <ExteriorBackDoorBoundary
        onBack={backFromExteriorBoundary}
        onContinue={() => setShowExteriorBackDoorBoundary(false)}
        reducedMotion={reducedMotion}
      />
    );
  } else if (showBlueprintDesignDeskBoundary) {
    content = (
      <BlueprintDesignDeskBoundary
        onBack={backFromBlueprintBoundary}
        onContinue={() => setShowBlueprintDesignDeskBoundary(false)}
        reducedMotion={reducedMotion}
      />
    );
  } else if (showReviewBriefBoundary) {
    content = (
      <ReviewBriefBoundary
        onBack={backFromReviewBriefBoundary}
        onContinue={() => setShowReviewBriefBoundary(false)}
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
                : question.number === 20
                  ? "bedroom-hall-entrance"
                  : question.number === 22
                    ? "utility-hall-entrance"
                    : question.number === 26
                      ? "exterior-back-door-entrance"
                      : question.number === 31
                        ? "design-desk-entrance"
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
                : question.number <= PRIMARY_SUITE_LAST_QUESTION
                  ? PRIMARY_SUITE_ZONE
                  : question.number <= BEDROOMS_AND_SHARED_BATHROOMS_LAST_QUESTION
                    ? BEDROOMS_AND_SHARED_BATHROOMS_ZONE
                    : question.number <= UTILITY_AND_SYSTEMS_LAST_QUESTION
                      ? UTILITY_AND_SYSTEMS_ZONE
                      : question.number <= EXTERIOR_AND_SITE_LAST_QUESTION
                        ? EXTERIOR_AND_SITE_ZONE
                        : DESIGN_DESK_ZONE
          }
          totalQuestions={planHomeQuestions.length}
          scene={sceneForQuestion(question)}
          prompt={renderQuestionPrompt(
            question,
            draftAnswers[question.id],
            (answer, persistence) =>
              updateDraftAnswer(question.id, answer, persistence),
            (answer) => flushDraftAnswer(question.id, answer),
            validationErrors,
            {
              priorityItems: selectedPriorityItems(draftAnswers),
              referenceItems,
              onFilesSelected: addFiles,
              onLinkAdded: addLink,
              onReferenceNoteChange: changeReferenceNote,
              onReferenceRemove: removeReferenceItem,
              onReferenceRetry: retryReferenceUpload,
            },
          )}
          cameraFrame={CAMERA_FRAMES[question.cameraKey] ?? {
            xPercent: 0,
            yPercent: 0,
            scale: 1,
          }}
          onBack={
            tourState.location.editingFromReview
              ? backFromQuestion
              : question.number === UTILITY_AND_SYSTEMS_LAST_QUESTION + 1
              ? backFromExteriorBoundary
              : question.number === EXTERIOR_AND_SITE_LAST_QUESTION + 1
                ? backFromDesignDeskQuestion
              : backFromQuestion
          }
          onNext={() => nextFromQuestion(question)}
          canGoBack
          backLabel={tourState.location.editingFromReview ? "Cancel" : "Back"}
          nextLabel={
            tourState.location.editingFromReview
              ? "Save"
              : question.number === planHomeQuestions.length
              ? "Review brief"
              :
            question.number === PROJECT_AND_LIVING_LAST_QUESTION ||
            question.number === KITCHEN_AND_DINING_LAST_QUESTION ||
            question.number === PRIMARY_SUITE_LAST_QUESTION ||
            question.number === BEDROOMS_AND_SHARED_BATHROOMS_LAST_QUESTION ||
            question.number === UTILITY_AND_SYSTEMS_LAST_QUESTION ||
            question.number === EXTERIOR_AND_SITE_LAST_QUESTION
            || question.number === DESIGN_DESK_LAST_QUESTION
              ? "Save room"
              : "Next"
          }
          error={error}
          reducedMotion={reducedMotion}
        />
      </div>
    );
  } else if (tourState.location.kind === "review") {
    content = (
      <ProjectBriefReview
        state={tourState}
        consentAccepted={submissionConsentAccepted}
        error={formError}
        submitting={saving}
        onConsentChange={(accepted) => {
          setSubmissionConsentAccepted(accepted);
          setFormError(null);
        }}
        onEdit={editReviewQuestion}
        onSubmit={submitProjectBrief}
      />
    );
  } else {
    content = null;
  }

  const shellProgress = submitted
    ? "Project brief complete"
    : restoreStatus !== "ready"
      ? "Restoring your place"
      : tourState.location.kind === "question"
        ? `Question ${activeQuestion?.number ?? 1} of ${planHomeQuestions.length}`
        : tourState.location.kind === "contact-gate"
          ? "Contact checkpoint"
          : tourState.location.kind === "review"
            ? "Review your brief"
            : "Welcome";

  return (
    <div
      ref={experienceRef}
      className={styles.experience}
      data-plan-home-refinement-state={
        refinementFixture
          ? submitted
            ? "confirmation"
            : tourState.location.kind === "question"
              ? `q${getPlanHomeQuestion(tourState.location.questionId)?.number}`
              : tourState.location.kind === "contact-gate"
                ? "contact"
                : tourState.location.kind
          : undefined
      }
    >
      <header className={styles.experienceHeader}>
        <Link
          className={styles.experienceBrand}
          href="/"
          aria-label="Howeth and Harp home"
          onClick={saveBeforeExit}
        >
          <BrandMark decorative priority sizes="30px" className={styles.brandMark} />
        </Link>
        <div className={styles.experienceTitle}>
          <strong>Plan Your Home</strong>
          <span>{shellProgress}</span>
        </div>
        <Link className={styles.saveExit} href="/" onClick={saveBeforeExit}>
          Save and exit
        </Link>
      </header>
      {content}
    </div>
  );
}
