"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import {
  exteriorStyleImageSrc,
  isExteriorStyleSlug,
} from "@/features/plan-your-home/exterior-style-catalog";
import type {
  PlanHomeOption,
  PlanHomeOptionGroup,
} from "@/features/plan-your-home/registry";

import styles from "./prompt-renderers.module.css";

type PromptFieldProps = Readonly<{
  id: string;
  legend: string;
  instructions?: string;
  error?: string | null;
}>;

type ChoicePromptProps = PromptFieldProps &
  Readonly<{
    options: readonly PlanHomeOption[];
    value: string | null;
    onChange: (value: string) => void;
    columns?: 1 | 2 | 3;
    balancedPhoneGrid?: boolean;
  }>;

type MultiChoicePromptProps = PromptFieldProps &
  Readonly<{
    options: readonly PlanHomeOption[];
    value: readonly string[];
    onChange: (value: readonly string[]) => void;
    maxSelections?: number;
    exclusiveOptionSlugs?: readonly string[];
    columns?: 1 | 2 | 3;
  }>;

type ExteriorStylePromptProps = PromptFieldProps &
  Readonly<{
    options: readonly PlanHomeOption[];
    value: readonly string[];
    onChange: (value: readonly string[]) => void;
    maxSelections: number;
    exclusiveOptionSlugs?: readonly string[];
  }>;

export type GroupedChoiceValue = Readonly<
  Record<string, string | null | readonly string[]>
>;

type GroupedChoicePromptProps = Readonly<{
  id: string;
  groups: readonly PlanHomeOptionGroup[];
  value: GroupedChoiceValue;
  onChange: (value: GroupedChoiceValue) => void;
  instructions?: string;
  errors?: Readonly<Record<string, string | null | undefined>>;
}>;

type ShortTextPromptProps = PromptFieldProps &
  Readonly<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: (value: string) => void;
    maxLength: number;
    optional?: boolean;
    multiline?: boolean;
    placeholder?: string;
    uncertainLabel?: string;
    uncertain?: boolean;
    onUncertainChange?: (value: boolean) => void;
  }>;

type CountPromptProps = Readonly<{
  id: string;
  groups: readonly PlanHomeOptionGroup[];
  value: Readonly<Record<string, string | null>>;
  onChange: (value: Readonly<Record<string, string | null>>) => void;
  instructions?: string;
  errors?: Readonly<Record<string, string | null | undefined>>;
}>;

export type StagedPromptStep = Readonly<{
  id: string;
  label: string;
  summary: string;
  complete: boolean;
  optional?: boolean;
  error?: string | null;
  content: ReactNode;
}>;

type StagedPromptProps = Readonly<{
  id: string;
  steps: readonly StagedPromptStep[];
}>;

export type PriorityCategory =
  | "must-have"
  | "nice-to-have"
  | "deal-breaker";

export type PriorityPromptValue = Readonly<{
  mustHave: readonly string[];
  niceToHave: readonly string[];
  dealBreakers: readonly string[];
  customItem: Readonly<{
    label: string;
    priority: PriorityCategory;
  }> | null;
  noStrongPrioritiesYet: boolean;
}>;

type PriorityPromptProps = PromptFieldProps &
  Readonly<{
    items: readonly string[];
    value: PriorityPromptValue;
    onChange: (value: PriorityPromptValue) => void;
    limits?: Readonly<{
      mustHave: number;
      niceToHave: number;
      dealBreaker: number;
    }>;
  }>;

export type ReferencePromptItem = Readonly<{
  id: string;
  kind: "file" | "link";
  label: string;
  detail: string;
  note: string;
  href?: string;
  sizeBytes?: number;
  status?: "ready" | "uploading" | "error";
  progress?: number;
  error?: string;
}>;

type ReferencesPromptProps = PromptFieldProps &
  Readonly<{
    items: readonly ReferencePromptItem[];
    noReferencesYet: boolean;
    onNoReferencesYetChange: (value: boolean) => void;
    onFilesSelected: (files: readonly File[]) => void;
    onLinkAdded: (url: string) => void;
    onNoteChange: (id: string, note: string) => void;
    onRemove: (id: string) => void;
    onRetry?: (id: string) => void;
    limits?: Readonly<{
      total: number;
      files: number;
      links: number;
      bytesPerFile: number;
      totalFileBytes: number;
    }>;
  }>;

const DEFAULT_PRIORITY_LIMITS = {
  mustHave: 5,
  niceToHave: 5,
  dealBreaker: 3,
} as const;

const DEFAULT_REFERENCE_LIMITS = {
  total: 10,
  files: 6,
  links: 6,
  bytesPerFile: 10 * 1024 * 1024,
  totalFileBytes: 40 * 1024 * 1024,
} as const;

const APPROVED_REFERENCE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const APPROVED_REFERENCE_EXTENSIONS = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
]);

function useFieldIds(id: string) {
  const suffix = useId().replaceAll(":", "");
  const base = `${id}-${suffix}`;
  return {
    instructions: `${base}-instructions`,
    error: `${base}-error`,
  };
}

function describedBy(
  instructions: string | undefined,
  error: string | null | undefined,
  ids: ReturnType<typeof useFieldIds>,
) {
  return [instructions ? ids.instructions : null, error ? ids.error : null]
    .filter(Boolean)
    .join(" ") || undefined;
}

function FieldSupport({
  instructions,
  error,
  ids,
}: Readonly<{
  instructions?: string;
  error?: string | null;
  ids: ReturnType<typeof useFieldIds>;
}>) {
  return (
    <>
      {instructions ? (
        <p id={ids.instructions} className={styles.instructions}>
          {instructions}
        </p>
      ) : null}
      {error ? (
        <p id={ids.error} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

function OptionMark({ multiple }: Readonly<{ multiple: boolean }>) {
  return (
    <span
      className={multiple ? styles.checkboxMark : styles.radioMark}
      aria-hidden="true"
    />
  );
}

export function ChoicePrompt({
  id,
  legend,
  instructions,
  error,
  options,
  value,
  onChange,
  columns = 2,
  balancedPhoneGrid = false,
}: ChoicePromptProps) {
  const ids = useFieldIds(id);

  return (
    <fieldset
      className={styles.fieldset}
      data-plan-home-field={id}
      aria-describedby={describedBy(instructions, error, ids)}
      aria-invalid={Boolean(error)}
    >
      <legend className={styles.legend}>{legend}</legend>
      <FieldSupport instructions={instructions} error={error} ids={ids} />
      <div
        className={styles.optionGrid}
        data-columns={columns}
        data-balanced-phone-grid={balancedPhoneGrid}
      >
        {options.map((option) => (
          <label className={styles.option} key={option.slug}>
            <input
              className={styles.nativeControl}
              type="radio"
              name={`${id}-${ids.instructions}`}
              value={option.slug}
              aria-label={option.label}
              aria-describedby={
                option.description ? `${id}-${option.slug}-description` : undefined
              }
              checked={value === option.slug}
              onChange={() => onChange(option.slug)}
            />
            <OptionMark multiple={false} />
            {option.description ? (
              <span className={styles.optionCopy}>
                <strong>{option.label}</strong>
                <span id={`${id}-${option.slug}-description`}>
                  {option.description}
                </span>
              </span>
            ) : (
              <span>{option.label}</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function MultiChoicePrompt({
  id,
  legend,
  instructions,
  error,
  options,
  value,
  onChange,
  maxSelections,
  exclusiveOptionSlugs = [],
  columns = 2,
}: MultiChoicePromptProps) {
  const ids = useFieldIds(id);
  const [limitError, setLimitError] = useState<string | null>(null);
  const displayedError = error || limitError;
  const limitInstruction = maxSelections
    ? `Choose up to ${maxSelections}. ${instructions ?? ""}`.trim()
    : instructions;
  const currentSlugs = new Set(options.map(({ slug }) => slug));
  const currentValue = value.filter((slug) => currentSlugs.has(slug));

  function toggle(slug: string) {
    if (currentValue.includes(slug)) {
      setLimitError(null);
      onChange(currentValue.filter((item) => item !== slug));
      return;
    }

    if (exclusiveOptionSlugs.includes(slug)) {
      setLimitError(null);
      onChange([slug]);
      return;
    }

    const withoutExclusive = currentValue.filter(
      (item) => !exclusiveOptionSlugs.includes(item),
    );
    if (maxSelections !== undefined && withoutExclusive.length >= maxSelections) {
      setLimitError(`Choose no more than ${maxSelections} options.`);
      return;
    }

    setLimitError(null);
    onChange([...withoutExclusive, slug]);
  }

  return (
    <fieldset
      className={styles.fieldset}
      data-plan-home-field={id}
      aria-describedby={describedBy(limitInstruction, displayedError, ids)}
      aria-invalid={Boolean(displayedError)}
    >
      <legend className={styles.legend}>{legend}</legend>
      <FieldSupport
        instructions={limitInstruction}
        error={displayedError}
        ids={ids}
      />
      <div
        className={styles.optionGrid}
        data-columns={columns}
      >
        {options.map((option) => (
          <label className={styles.option} key={option.slug}>
            <input
              className={styles.nativeControl}
              type="checkbox"
              value={option.slug}
              checked={value.includes(option.slug)}
              onChange={() => toggle(option.slug)}
            />
            <OptionMark multiple />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ExteriorStylePrompt({
  id,
  legend,
  instructions,
  error,
  options,
  value,
  onChange,
  maxSelections,
  exclusiveOptionSlugs = [],
}: ExteriorStylePromptProps) {
  const ids = useFieldIds(id);
  const [limitError, setLimitError] = useState<string | null>(null);
  const displayedError = error || limitError;
  const limitInstruction = `Choose up to ${maxSelections} direction samples. ${instructions ?? ""}`.trim();

  function toggle(slug: string) {
    if (value.includes(slug)) {
      setLimitError(null);
      onChange(value.filter((item) => item !== slug));
      return;
    }

    if (exclusiveOptionSlugs.includes(slug)) {
      setLimitError(null);
      onChange([slug]);
      return;
    }

    const withoutExclusive = value.filter(
      (item) => !exclusiveOptionSlugs.includes(item),
    );
    if (withoutExclusive.length >= maxSelections) {
      setLimitError(`Choose no more than ${maxSelections} style directions.`);
      return;
    }

    setLimitError(null);
    onChange([...withoutExclusive, slug]);
  }

  return (
    <fieldset
      className={styles.fieldset}
      aria-describedby={describedBy(limitInstruction, displayedError, ids)}
      aria-invalid={Boolean(displayedError)}
    >
      <legend className={styles.legend}>{legend}</legend>
      <FieldSupport
        instructions={limitInstruction}
        error={displayedError}
        ids={ids}
      />
      <div className={styles.visualCardGrid}>
        {options.map((option) => {
          const imageSrc = isExteriorStyleSlug(option.slug)
            ? exteriorStyleImageSrc(option.slug)
            : null;

          return (
            <label
              className={styles.visualCard}
              data-style-card={option.slug}
              key={option.slug}
            >
              <input
                className={styles.nativeControl}
                type="checkbox"
                value={option.slug}
                checked={value.includes(option.slug)}
                onChange={() => toggle(option.slug)}
              />
              {imageSrc ? (
                <span
                  className={styles.visualCardArt}
                  data-style-card-art={option.slug}
                  aria-hidden="true"
                >
                  <Image
                    alt=""
                    className={styles.visualCardImage}
                    height={512}
                    sizes="(max-width: 640px) 44vw, 20rem"
                    src={imageSrc}
                    unoptimized
                    width={768}
                  />
                </span>
              ) : null}
              <span className={styles.visualCardLabel}>
                <OptionMark multiple />
                <span>{option.label}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function initiallyCompletedSteps(steps: readonly StagedPromptStep[]) {
  return new Set(
    steps
      .slice(0, -1)
      .filter((step) => step.complete)
      .map((step) => step.id),
  );
}

export function StagedPrompt({ id, steps }: StagedPromptProps) {
  const [completedStepIds, setCompletedStepIds] = useState(() =>
    initiallyCompletedSteps(steps),
  );
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const focusActiveStep = useRef(false);

  const errorIndex = steps.findIndex((step) => Boolean(step.error));
  const editingIndex = steps.findIndex((step) => step.id === editingStepId);
  const firstUncompletedIndex = steps
    .slice(0, -1)
    .findIndex(
      (step, index) =>
        !completedStepIds.has(step.id) &&
        !(
          step.complete &&
          steps.slice(index + 1).some((laterStep) =>
            Boolean(laterStep.complete || laterStep.error),
          )
        ),
    );
  const activeIndex =
    errorIndex >= 0
      ? errorIndex
      : editingIndex >= 0
        ? editingIndex
        : firstUncompletedIndex >= 0
          ? firstUncompletedIndex
          : Math.max(steps.length - 1, 0);
  const activeStep = steps[activeIndex];

  useEffect(() => {
    if (!focusActiveStep.current || !activeStep) return;
    focusActiveStep.current = false;
    promptRef.current
      ?.querySelector<HTMLElement>(
        `[data-plan-home-stage-panel="${CSS.escape(activeStep.id)}"] input:not([disabled]), ` +
          `[data-plan-home-stage-panel="${CSS.escape(activeStep.id)}"] textarea:not([disabled]), ` +
          `[data-plan-home-stage-panel="${CSS.escape(activeStep.id)}"] button:not([disabled])`,
      )
      ?.focus({ preventScroll: true });
  }, [activeStep]);

  function editStep(stepId: string) {
    focusActiveStep.current = true;
    setEditingStepId(stepId);
  }

  function finishActiveStep() {
    if (!activeStep || (!activeStep.complete && !activeStep.optional)) return;
    focusActiveStep.current = true;
    setCompletedStepIds((current) => new Set(current).add(activeStep.id));
    setEditingStepId(null);
  }

  if (!activeStep) return null;

  return (
    <div className={styles.stagedPrompt} ref={promptRef} data-staged-prompt={id}>
      {activeIndex > 0 ? (
        <div className={styles.stagedHistory}>
          <div
            className={styles.stagedSummaryList}
            aria-label="Completed question parts"
          >
            {steps.slice(0, activeIndex).map((step) => (
              <div
                className={styles.stagedSummary}
                role="group"
                aria-label={`Completed ${step.label}`}
                key={step.id}
              >
                <span>
                  <strong>{step.label}</strong>
                  <span>{step.summary}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Edit ${step.label}`}
                  onClick={() => editStep(step.id)}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
          <select
            className={styles.stagedEditSelect}
            aria-label="Edit a completed question part"
            value=""
            onChange={(event) => editStep(event.currentTarget.value)}
          >
            <option value="">Edit prior part</option>
            {steps.slice(0, activeIndex).map((step) => (
              <option value={step.id} key={step.id}>
                {step.label}: {step.summary}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div
        className={styles.stagedPanel}
        data-plan-home-stage-panel={activeStep.id}
      >
        <p className={styles.stagedProgress}>
          Part {activeIndex + 1} of {steps.length}
        </p>
        {activeStep.content}
        {activeIndex < steps.length - 1 || editingStepId ? (
          <button
            type="button"
            hidden
            tabIndex={-1}
            data-plan-home-staged-advance
            disabled={!activeStep.complete && !activeStep.optional}
            onClick={finishActiveStep}
          >
            Advance question section
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function summarizeOptionSelection(
  group: PlanHomeOptionGroup,
  value: string | null | readonly string[] | undefined,
) {
  const slugs = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  return slugs
    .map((slug) => group.options.find((option) => option.slug === slug)?.label)
    .filter(Boolean)
    .join(", ");
}

export function GroupedChoicePrompt({
  id,
  groups,
  value,
  onChange,
  instructions,
  errors = {},
}: GroupedChoicePromptProps) {
  return (
    <StagedPrompt
      id={id}
      steps={groups.map((group) => {
        const current = value[group.id];
        const groupId = `${id}-${group.id}`;

        if (Array.isArray(current)) {
          return {
            id: group.id,
            label: group.label,
            summary: summarizeOptionSelection(group, current),
            complete: current.length > 0,
            error: errors[group.id],
            content: (
            <MultiChoicePrompt
              id={groupId}
              legend={group.label}
              options={group.options}
              value={current}
              maxSelections={group.maxSelections}
              exclusiveOptionSlugs={group.exclusiveOptionSlugs}
              instructions={instructions}
              error={errors[group.id]}
              onChange={(next) => onChange({ ...value, [group.id]: next })}
            />
            ),
          };
        }

        return {
          id: group.id,
          label: group.label,
          summary: summarizeOptionSelection(group, current),
          complete: typeof current === "string",
          error: errors[group.id],
          content: (
          <ChoicePrompt
            id={groupId}
            legend={group.label}
            options={group.options}
            value={typeof current === "string" ? current : null}
            instructions={instructions}
            error={errors[group.id]}
            onChange={(next) => onChange({ ...value, [group.id]: next })}
          />
          ),
        };
      })}
    />
  );
}

export function ShortTextPrompt({
  id,
  legend,
  label,
  instructions,
  error,
  value,
  onChange,
  onBlur,
  maxLength,
  optional = false,
  multiline = false,
  placeholder,
  uncertainLabel,
  uncertain = false,
  onUncertainChange,
}: ShortTextPromptProps) {
  const ids = useFieldIds(id);
  const inputId = `${id}-${ids.instructions}-input`;
  const inputProps = {
    id: inputId,
    className: styles.textControl,
    value,
    maxLength,
    placeholder,
    disabled: uncertain,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy(instructions, error, ids),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onBlur?.(event.currentTarget.value),
  };

  return (
    <fieldset className={styles.fieldset} data-plan-home-field={id}>
      <legend className={styles.legend}>{legend}</legend>
      <FieldSupport instructions={instructions} error={error} ids={ids} />
      <label className={styles.textLabel} htmlFor={inputId}>
        {label} {optional ? <span>(optional)</span> : null}
      </label>
      {multiline ? (
        <textarea {...inputProps} rows={4} />
      ) : (
        <input {...inputProps} type="text" />
      )}
      <p className={styles.characterCount} aria-live="polite">
        {value.length} of {maxLength} characters
      </p>
      {uncertainLabel && onUncertainChange ? (
        <label className={styles.standaloneCheck}>
          <input
            type="checkbox"
            checked={uncertain}
            onChange={(event) => {
              if (event.target.checked) {
                onChange("");
              }
              onUncertainChange(event.target.checked);
            }}
          />
          <span>{uncertainLabel}</span>
        </label>
      ) : null}
    </fieldset>
  );
}

export function CountPrompt({
  id,
  groups,
  value,
  onChange,
  instructions,
  errors = {},
}: CountPromptProps) {
  return (
    <StagedPrompt
      id={id}
      steps={groups.map((group) => ({
        id: group.id,
        label: group.label,
        summary: summarizeOptionSelection(group, value[group.id]),
        complete: typeof value[group.id] === "string",
        error: errors[group.id],
        content: (
          <ChoicePrompt
            id={`${id}-${group.id}`}
            legend={group.label}
            options={group.options}
            value={value[group.id] ?? null}
            instructions={instructions}
            error={errors[group.id]}
            columns={3}
            onChange={(next) => onChange({ ...value, [group.id]: next })}
          />
        ),
      }))}
    />
  );
}

const PRIORITY_CATEGORIES = [
  "nice-to-have",
  "must-have",
  "deal-breaker",
] as const satisfies readonly PriorityCategory[];

const PRIORITY_CATEGORY_CONFIG = {
  "must-have": {
    label: "Must-have",
    groupLabel: "Must-haves",
    valueKey: "mustHave",
    limitKey: "mustHave",
  },
  "nice-to-have": {
    label: "Nice-to-have",
    groupLabel: "Nice-to-haves",
    valueKey: "niceToHave",
    limitKey: "niceToHave",
  },
  "deal-breaker": {
    label: "Deal-breaker",
    groupLabel: "Deal-breakers",
    valueKey: "dealBreakers",
    limitKey: "dealBreaker",
  },
} as const satisfies Record<
  PriorityCategory,
  {
    label: string;
    groupLabel: string;
    valueKey: "mustHave" | "niceToHave" | "dealBreakers";
    limitKey: "mustHave" | "niceToHave" | "dealBreaker";
  }
>;

function priorityForItem(value: PriorityPromptValue, item: string) {
  return (
    PRIORITY_CATEGORIES.find((category) =>
      value[PRIORITY_CATEGORY_CONFIG[category].valueKey].includes(item),
    ) ?? ""
  );
}

function priorityLabel(category: PriorityCategory) {
  return PRIORITY_CATEGORY_CONFIG[category].label;
}

function priorityGroupLabel(category: PriorityCategory) {
  return PRIORITY_CATEGORY_CONFIG[category].groupLabel;
}

export function PriorityPrompt({
  id,
  legend,
  instructions,
  error,
  items,
  value,
  onChange,
  limits = DEFAULT_PRIORITY_LIMITS,
}: PriorityPromptProps) {
  const ids = useFieldIds(id);
  const [localError, setLocalError] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState(value.customItem?.label ?? "");
  const [activeCategory, setActiveCategory] =
    useState<PriorityCategory>("nice-to-have");
  const displayedError = error || localError;
  const limitText = `Choose a group, then choose features with keyboard or touch. Up to ${limits.niceToHave} nice-to-haves, ${limits.mustHave} must-haves, and ${limits.dealBreaker} deal-breakers.`;

  function categoryLimit(category: PriorityCategory) {
    return limits[PRIORITY_CATEGORY_CONFIG[category].limitKey];
  }

  function categoryCount(category: PriorityCategory) {
    const assigned =
      value[PRIORITY_CATEGORY_CONFIG[category].valueKey].length;
    return assigned + (value.customItem?.priority === category ? 1 : 0);
  }

  function assign(item: string, category: PriorityCategory | "") {
    const assignments = {
      "must-have": value.mustHave.filter((entry) => entry !== item),
      "nice-to-have": value.niceToHave.filter((entry) => entry !== item),
      "deal-breaker": value.dealBreakers.filter((entry) => entry !== item),
    } satisfies Record<PriorityCategory, string[]>;
    const countWithCustom = (target: PriorityCategory, count: number) =>
      count + (value.customItem?.priority === target ? 1 : 0);

    if (
      category &&
      countWithCustom(category, assignments[category].length) >=
        categoryLimit(category)
    ) {
      setLocalError(`${priorityLabel(category)} limit reached.`);
      return;
    }

    if (category) assignments[category].push(item);

    setLocalError(null);
    onChange({
      mustHave: assignments["must-have"],
      niceToHave: assignments["nice-to-have"],
      dealBreakers: assignments["deal-breaker"],
      customItem: value.customItem,
      noStrongPrioritiesYet: false,
    });
  }

  function assignCustom(category: PriorityCategory | "") {
    if (!category) {
      setLocalError(null);
      onChange({ ...value, customItem: null, noStrongPrioritiesYet: false });
      return;
    }
    if (!customLabel.trim()) {
      setLocalError("Name the custom priority before assigning it.");
      return;
    }

    const count = value[PRIORITY_CATEGORY_CONFIG[category].valueKey].length;
    if (count >= categoryLimit(category)) {
      setLocalError(`${priorityLabel(category)} limit reached.`);
      return;
    }

    setLocalError(null);
    onChange({
      ...value,
      customItem: { label: customLabel.trim(), priority: category },
      noStrongPrioritiesYet: false,
    });
  }

  return (
    <fieldset
      className={styles.fieldset}
      aria-describedby={describedBy(limitText, displayedError, ids)}
      aria-invalid={Boolean(displayedError)}
    >
      <legend className={styles.legend}>{legend}</legend>
      <FieldSupport
        instructions={`${limitText} ${instructions ?? ""}`.trim()}
        error={displayedError}
        ids={ids}
      />

      <div className={styles.priorityComposer}>
        <div
          className={styles.priorityCategoryPicker}
          role="group"
          aria-label="Priority group to edit"
        >
          {PRIORITY_CATEGORIES.map((category) => {
            const count = categoryCount(category);
            const limit = categoryLimit(category);
            return (
              <button
                key={category}
                type="button"
                className={styles.priorityCategory}
                aria-label={`Edit ${priorityGroupLabel(category)}, ${count} of ${limit}`}
                aria-pressed={activeCategory === category}
                onClick={() => {
                  setActiveCategory(category);
                  setLocalError(null);
                }}
              >
                <span>{priorityGroupLabel(category)}</span>
                <small>{count} / {limit}</small>
              </button>
            );
          })}
        </div>

        <section
          className={styles.priorityAssignments}
          aria-labelledby={`${id}-active-category`}
        >
          <div className={styles.priorityAssignmentHeading}>
            <strong id={`${id}-active-category`}>
              Choose {priorityGroupLabel(activeCategory).toLowerCase()}
            </strong>
            <span>Choose again to remove</span>
          </div>
          {items.length > 0 ? (
            <div className={styles.priorityItemGrid}>
              {items.map((item) => {
                const assignedCategory = priorityForItem(value, item);
                const isActive = assignedCategory === activeCategory;
                return (
                  <button
                    key={item}
                    type="button"
                    className={styles.priorityItem}
                    aria-label={`${item}: ${assignedCategory ? priorityLabel(assignedCategory) : "Not assigned"}`}
                    aria-pressed={isActive}
                    data-assignment={assignedCategory || "unassigned"}
                    onClick={() => assign(item, isActive ? "" : activeCategory)}
                  >
                    <span>{item}</span>
                    <small>
                      {assignedCategory
                        ? priorityLabel(assignedCategory)
                        : "Not assigned"}
                    </small>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className={styles.priorityEmpty}>
              No earlier selections to sort. Add one below or choose no strong
              priorities yet.
            </p>
          )}
        </section>
      </div>

      <div className={styles.customPriority}>
        <label htmlFor={`${id}-custom`}>Custom priority (optional)</label>
        <input
          id={`${id}-custom`}
          type="text"
          maxLength={120}
          value={customLabel}
          onChange={(event) => setCustomLabel(event.target.value)}
        />
        <div className={styles.customPriorityActions}>
          <button
            type="button"
            onClick={() => assignCustom(activeCategory)}
          >
            Assign custom to {priorityGroupLabel(activeCategory)}
          </button>
          {value.customItem ? (
            <button type="button" onClick={() => assignCustom("")}>
              Remove custom priority
            </button>
          ) : null}
        </div>
        {value.customItem ? (
          <p>
            Assigned to {priorityGroupLabel(value.customItem.priority)}
          </p>
        ) : null}
      </div>

      <label className={styles.standaloneCheck}>
        <input
          type="checkbox"
          checked={value.noStrongPrioritiesYet}
          onChange={(event) =>
            onChange(
              event.target.checked
                ? {
                    mustHave: [],
                    niceToHave: [],
                    dealBreakers: [],
                    customItem: null,
                    noStrongPrioritiesYet: true,
                  }
                : { ...value, noStrongPrioritiesYet: false },
            )
          }
        />
        <span>No strong priorities yet</span>
      </label>
    </fieldset>
  );
}

function megabytes(bytes: number) {
  return Math.round(bytes / (1024 * 1024));
}

export function ReferencesPrompt({
  id,
  legend,
  instructions,
  error,
  items,
  noReferencesYet,
  onNoReferencesYetChange,
  onFilesSelected,
  onLinkAdded,
  onNoteChange,
  onRemove,
  onRetry,
  limits = DEFAULT_REFERENCE_LIMITS,
}: ReferencesPromptProps) {
  const ids = useFieldIds(id);
  const [link, setLink] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const displayedError = error || localError;
  const fileCount = items.filter((item) => item.kind === "file").length;
  const linkCount = items.length - fileCount;
  const fileBytes = items.reduce(
    (total, item) => total + (item.kind === "file" ? item.sizeBytes ?? 0 : 0),
    0,
  );
  const limitsText = `Up to ${limits.total} references total: ${limits.files} files and ${limits.links} links. Files may be PDF, JPEG, PNG, WebP, or HEIC, up to ${megabytes(limits.bytesPerFile)} MB each and ${megabytes(limits.totalFileBytes)} MB total. Notes are optional.`;

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (items.length + files.length > limits.total) {
      setLocalError(`Add no more than ${limits.total} references total.`);
      return;
    }
    if (fileCount + files.length > limits.files) {
      setLocalError(`Add no more than ${limits.files} files.`);
      return;
    }
    if (
      files.some((file) => {
        const extension = file.name.split(".").at(-1)?.toLowerCase();
        return (
          !APPROVED_REFERENCE_TYPES.has(file.type) ||
          !extension ||
          !APPROVED_REFERENCE_EXTENSIONS.has(extension)
        );
      })
    ) {
      setLocalError("Choose a PDF, JPEG, PNG, WebP, or HEIC file.");
      return;
    }
    if (files.some((file) => file.size > limits.bytesPerFile)) {
      setLocalError(`Each file must be ${megabytes(limits.bytesPerFile)} MB or smaller.`);
      return;
    }
    if (
      fileBytes + files.reduce((total, file) => total + file.size, 0) >
      limits.totalFileBytes
    ) {
      setLocalError(
        `Reference files may total no more than ${megabytes(limits.totalFileBytes)} MB.`,
      );
      return;
    }

    setLocalError(null);
    onNoReferencesYetChange(false);
    onFilesSelected(files);
    event.target.value = "";
  }

  function addLink() {
    if (items.length >= limits.total || linkCount >= limits.links) {
      setLocalError(
        linkCount >= limits.links
          ? `Add no more than ${limits.links} links.`
          : `Add no more than ${limits.total} references total.`,
      );
      return;
    }

    try {
      const normalized = new URL(link);
      if (normalized.protocol !== "http:" && normalized.protocol !== "https:") {
        throw new Error("scheme");
      }
      setLocalError(null);
      onNoReferencesYetChange(false);
      onLinkAdded(normalized.toString());
      setLink("");
    } catch {
      setLocalError("Enter a complete http or https link.");
    }
  }

  return (
    <fieldset
      className={styles.fieldset}
      aria-describedby={describedBy(limitsText, displayedError, ids)}
      aria-invalid={Boolean(displayedError)}
    >
      <legend className={styles.legend}>{legend}</legend>
      <FieldSupport
        instructions={`${limitsText} ${instructions ?? ""}`.trim()}
        error={displayedError}
        ids={ids}
      />

      <div className={styles.referenceActions}>
        <label className={styles.fileButton}>
          <span>Add files</span>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={addFiles}
          />
        </label>
        <div className={styles.linkAdder}>
          <label htmlFor={`${id}-link`}>Website link</label>
          <div>
            <input
              id={`${id}-link`}
              type="url"
              inputMode="url"
              placeholder="https://example.com/inspiration"
              value={link}
              onChange={(event) => setLink(event.target.value)}
            />
            <button type="button" onClick={addLink}>
              Add link
            </button>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <ul className={styles.referenceList} aria-label="Added references">
          {items.map((item) => (
            <li key={item.id}>
              <div className={styles.referenceHeading}>
                <div>
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <strong>{item.label}</strong>
                  )}
                  <span>{item.detail}</span>
                  {item.status === "uploading" ? (
                    <progress
                      aria-label={`Uploading ${item.label}`}
                      max={100}
                      value={item.progress ?? 0}
                    />
                  ) : null}
                  {item.status === "error" ? (
                    <span className={styles.referenceError} role="alert">
                      {item.error || "Upload failed."}
                    </span>
                  ) : null}
                </div>
                {item.status === "error" && onRetry ? (
                  <button type="button" onClick={() => onRetry(item.id)}>
                    Retry <span className={styles.srOnly}>{item.label}</span>
                  </button>
                ) : null}
                <button type="button" onClick={() => onRemove(item.id)}>
                  Remove <span className={styles.srOnly}>{item.label}</span>
                </button>
              </div>
              <label htmlFor={`${id}-${item.id}-note`}>
                Note for {item.label} (optional)
              </label>
              <textarea
                id={`${id}-${item.id}-note`}
                rows={2}
                maxLength={500}
                value={item.note}
                disabled={item.status === "uploading"}
                onChange={(event) => onNoteChange(item.id, event.target.value)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <label className={styles.standaloneCheck}>
        <input
          type="checkbox"
          checked={noReferencesYet}
          disabled={items.length > 0}
          onChange={(event) => onNoReferencesYetChange(event.target.checked)}
        />
        <span>
          I do not have references yet
          {items.length > 0 ? " (remove added references first)" : ""}
        </span>
      </label>
    </fieldset>
  );
}
