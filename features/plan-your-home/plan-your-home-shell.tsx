"use client";

import { useState } from "react";

import {
  ChoicePrompt,
  CountPrompt,
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
  type PlanHomeOptionGroup,
  type PlanHomeQuestionDefinition,
} from "@/features/plan-your-home/registry";
import type { PlanHomeReferenceMetadata } from "@/features/plan-your-home/references";
import { NeutralDevelopmentScene } from "@/features/plan-your-home/neutral-development-scene";
import {
  SceneStage,
  type SceneCameraFrame,
} from "@/features/plan-your-home/scene-stage";
import type { PlanHomeTourTransition } from "@/features/plan-your-home/tour-state";

import styles from "./plan-your-home-shell.module.css";

const SAMPLE_IDS = [
  "project.lot-location",
  "home.heated-square-feet",
  "home.bed-bath-counts",
  "home.daily-life",
  "kitchen.arrangement",
  "design.references",
  "design.priorities",
] as const;

const CAMERA_FRAMES: readonly SceneCameraFrame[] = [
  { xPercent: -1.8, yPercent: 1.5, scale: 1.04 },
  { xPercent: 1.2, yPercent: -0.5, scale: 1.08 },
  { xPercent: -2.5, yPercent: -1.5, scale: 1.12 },
  { xPercent: 2.2, yPercent: 0.5, scale: 1.09 },
  { xPercent: -0.8, yPercent: -2.2, scale: 1.14 },
  { xPercent: 2.8, yPercent: 1.2, scale: 1.1 },
  { xPercent: 0, yPercent: -1.2, scale: 1.16 },
];

const PRIORITY_ITEMS = [
  "Outdoor connection",
  "Accessible clearances",
  "Flexible furniture layout",
] as const;

function sampleQuestions() {
  return SAMPLE_IDS.map((id) => {
    const question = getPlanHomeQuestion(id);
    if (!question) {
      throw new Error(`Missing Plan Your Home sample question ${id}.`);
    }
    return question;
  });
}

const SAMPLE_QUESTIONS = sampleQuestions();

function initialAnswers(questions: readonly PlanHomeQuestionDefinition[]) {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      structuredClone(question.response.defaultAnswer),
    ]),
  );
}

function referenceItem(
  reference: Readonly<{
    id: string;
    kind: "file" | "link";
    label: string;
    detail: string;
    note: string;
  }>,
): ReferencePromptItem {
  return reference;
}

export function PlanYourHomeShell() {
  const questions = SAMPLE_QUESTIONS;
  const [sampleIndex, setSampleIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(() =>
    initialAnswers(questions),
  );
  const [error, setError] = useState<PlanHomeTourTransition["error"]>(null);
  const question = questions[sampleIndex];
  const zone = planHomeZones.find((item) => item.id === question.zoneId);

  if (!zone) {
    throw new Error(`Missing Plan Your Home zone ${question.zoneId}.`);
  }

  function updateAnswer(value: unknown) {
    setError(null);
    setAnswers((current) => ({ ...current, [question.id]: value }));
  }

  function back() {
    if (sampleIndex === 0) return false;
    setError(null);
    setSampleIndex((current) => current - 1);
    return true;
  }

  function next() {
    const result = question.response.answerSchema.safeParse(answers[question.id]);
    if (!result.success) {
      setError({
        code: "invalid-answer",
        message:
          result.error.issues[0]?.message ??
          "Complete this answer before continuing.",
      });
      return false;
    }

    setError(null);
    if (sampleIndex === questions.length - 1) {
      setSampleIndex(0);
      return true;
    }
    setSampleIndex((current) => current + 1);
    return true;
  }

  function renderPrompt() {
    const answer = answers[question.id];
    const group = question.response.optionGroups[0] as PlanHomeOptionGroup;

    switch (question.id) {
      case "project.lot-location": {
        const value = answer as {
          lotStatus: string | null;
          location: string;
          locationUncertain: boolean;
        };
        return (
          <PromptStack>
            <ChoicePrompt
              id={`${question.id}-status`}
              legend={group.label}
              options={group.options}
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

      case "home.heated-square-feet":
        return (
          <ChoicePrompt
            id={question.id}
            legend={group.label}
            options={group.options}
            value={answer as string | null}
            onChange={updateAnswer}
          />
        );

      case "home.bed-bath-counts":
        return (
          <CountPrompt
            id={question.id}
            groups={question.response.optionGroups}
            value={answer as Record<string, string | null>}
            onChange={updateAnswer}
            instructions="Choose one exact range for each count."
          />
        );

      case "home.daily-life":
        return (
          <MultiChoicePrompt
            id={question.id}
            legend={group.label}
            options={group.options}
            value={answer as readonly string[]}
            maxSelections={group.maxSelections}
            exclusiveOptionSlugs={group.exclusiveOptionSlugs}
            onChange={updateAnswer}
          />
        );

      case "kitchen.arrangement":
        return (
          <GroupedChoicePrompt
            id={question.id}
            groups={question.response.optionGroups}
            value={answer as GroupedChoiceValue}
            onChange={updateAnswer}
            instructions="Choose one response in each group."
          />
        );

      case "design.references": {
        const value = answer as {
          references: readonly PlanHomeReferenceMetadata[];
          noReferencesYet: boolean;
        };
        const items = value.references.map((reference) =>
          referenceItem(
            reference.kind === "file"
              ? {
                  id: reference.id,
                  kind: "file",
                  label: reference.originalName,
                  detail: `${Math.max(1, Math.round(reference.sizeBytes / 1024))} KB · local metadata preview`,
                  note: reference.note ?? "",
                }
              : {
                  id: reference.id,
                  kind: "link",
                  label: reference.hostname,
                  detail: reference.url,
                  note: reference.note ?? "",
                },
          ),
        );
        return (
          <ReferencesPrompt
            id={question.id}
            legend="Plans, images, and links"
            items={items}
            noReferencesYet={value.noReferencesYet}
            onNoReferencesYetChange={(noReferencesYet) => {
              updateAnswer({
                references: noReferencesYet ? [] : value.references,
                noReferencesYet,
              });
            }}
            onFilesSelected={(files) => {
              const createdAt = new Date().toISOString();
              const nextReferences = files.map((file, index) => {
                const id = `preview-file-${Date.now()}-${index}`;
                return {
                  id,
                  kind: "file",
                  originalName: file.name,
                  objectPath: `inquiryReferences/preview/${id}`,
                  extension: file.name.split(".").at(-1)?.toLowerCase(),
                  mimeType: file.type,
                  sizeBytes: Math.max(1, file.size),
                  createdAt,
                };
              });
              updateAnswer({
                references: [...value.references, ...nextReferences],
                noReferencesYet: false,
              });
            }}
            onLinkAdded={(url) => {
              const parsed = new URL(url);
              const nextReference = {
                id: `preview-link-${Date.now()}`,
                kind: "link",
                url: parsed.toString(),
                hostname: parsed.hostname,
                createdAt: new Date().toISOString(),
              };
              updateAnswer({
                references: [...value.references, nextReference],
                noReferencesYet: false,
              });
            }}
            onNoteChange={(id, note) =>
              updateAnswer({
                ...value,
                references: value.references.map((reference) =>
                  reference.id === id ? { ...reference, note } : reference,
                ),
              })
            }
            onRemove={(id) =>
              updateAnswer({
                ...value,
                references: value.references.filter(
                  (reference) => reference.id !== id,
                ),
              })
            }
          />
        );
      }

      case "design.priorities":
        return (
          <PriorityPrompt
            id={question.id}
            legend="Priority assignment"
            items={PRIORITY_ITEMS}
            value={answer as PriorityPromptValue}
            onChange={updateAnswer}
            instructions="These sample items stand in for features selected earlier in the full tour."
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className={styles.preview}>
      <header className={styles.previewHeader}>
        <p>Internal interaction preview</p>
        <h2>Plan Your Home shared scene stage</h2>
        <span>
          Seven representative registered prompts. Final rooms and customer-facing
          composition follow in later slices.
        </span>
      </header>

      <SceneStage
        question={question}
        zone={zone}
        totalQuestions={planHomeQuestions.length}
        scene={<NeutralDevelopmentScene />}
        prompt={renderPrompt()}
        cameraFrame={CAMERA_FRAMES[sampleIndex]}
        onBack={back}
        onNext={next}
        canGoBack={sampleIndex > 0}
        nextLabel={sampleIndex === questions.length - 1 ? "Restart preview" : "Next"}
        error={error}
      />
    </div>
  );
}
