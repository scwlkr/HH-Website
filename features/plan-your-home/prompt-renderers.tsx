"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
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
              checked={value === option.slug}
              onChange={() => onChange(option.slug)}
            />
            <OptionMark multiple={false} />
            <span>{option.label}</span>
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
      <div className={styles.optionGrid} data-columns={columns}>
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

function StyleSketchFrame({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <svg viewBox="0 0 240 112" preserveAspectRatio="xMidYMid meet">
      <path className={styles.styleGround} d="M13 92H227M25 99H214" />
      {children}
    </svg>
  );
}

function ExteriorStyleSketch({ slug }: Readonly<{ slug: string }>) {
  if (slug === "hill-country-or-ranch") {
    return (
      <StyleSketchFrame>
        <path className={styles.styleStone} d="M34 57L83 30L136 55V91H34Z" />
        <path className={styles.styleWood} d="M130 62L173 41L215 63V91H130Z" />
        <g className={styles.styleInk}>
          <path d="M24 59L82 25L145 57M121 62L172 36L223 64" />
          <path d="M34 91V57M136 91V55M130 91V62M215 91V63" />
          <path d="M47 91V65H78V91M92 91V60H120V91M151 91V65H194V91" />
        </g>
        <path
          className={styles.styleDetail}
          d="M21 76H136M139 74H219M159 65V91M180 65V91"
        />
      </StyleSketchFrame>
    );
  }

  if (slug === "modern-farmhouse") {
    return (
      <StyleSketchFrame>
        <path
          className={styles.stylePaper}
          d="M27 91V47L70 17L113 47V91ZM111 91V54L155 24L202 55V91Z"
        />
        <path className={styles.styleGreen} d="M109 72H204V91H109Z" />
        <g className={styles.styleInk}>
          <path d="M19 51L70 12L120 51M103 57L155 18L211 58" />
          <path d="M27 91V47M113 91V47M111 91V54M202 91V55" />
          <path d="M57 91V55H83V91M133 91V60H151V91M166 60H190V84H166Z" />
        </g>
        <path
          className={styles.styleDetail}
          d="M38 51V89M49 43V89M92 42V89M103 51V89M124 52V89M194 51V89"
        />
      </StyleSketchFrame>
    );
  }

  if (slug === "traditional") {
    return (
      <StyleSketchFrame>
        <path
          className={styles.stylePaper}
          d="M31 91V51L71 31H173L211 51V91Z"
        />
        <path className={styles.styleStone} d="M95 91V43L121 27L147 43V91Z" />
        <g className={styles.styleInk}>
          <path d="M23 53L68 26H176L219 53M88 46L121 22L154 46" />
          <path d="M31 91V51M211 91V51M95 91V43M147 91V43" />
          <path d="M42 91V59H72V91M105 91V52H137V91M169 91V59H199V91" />
        </g>
        <path
          className={styles.styleDetail}
          d="M36 58H78M164 58H205M57 59V91M184 59V91M109 66H133"
        />
      </StyleSketchFrame>
    );
  }

  if (slug === "transitional") {
    return (
      <StyleSketchFrame>
        <path
          className={styles.stylePaper}
          d="M25 91V53L81 25L135 52V91ZM134 91V59H215V91Z"
        />
        <path
          className={styles.styleGlass}
          d="M45 57H75V83H45ZM151 64H199V84H151Z"
        />
        <g className={styles.styleInk}>
          <path d="M16 56L81 19L144 55M124 61L163 38H220" />
          <path d="M25 91V53M135 91V52M134 91V59H215V91" />
          <path d="M45 91V57H75V91M91 91V51H119V91M151 91V64H199V91" />
        </g>
        <path
          className={styles.styleDetail}
          d="M60 57V83M151 74H199M175 64V84"
        />
      </StyleSketchFrame>
    );
  }

  if (slug === "modern-or-contemporary") {
    return (
      <StyleSketchFrame>
        <path className={styles.stylePaper} d="M25 91V39H124V53H213V91Z" />
        <path
          className={styles.styleGlass}
          d="M40 53H105V85H40ZM139 60H198V85H139Z"
        />
        <path className={styles.styleGreen} d="M113 53H139V91H113Z" />
        <g className={styles.styleInk}>
          <path d="M17 38H131V51H220M25 91V39M124 53V39M213 91V53" />
          <path d="M40 91V53H105V91M113 91V53H139V91M139 91V60H198V91" />
        </g>
        <path
          className={styles.styleDetail}
          d="M61 53V85M84 53V85M158 60V85M179 60V85M21 46H123"
        />
      </StyleSketchFrame>
    );
  }

  if (slug === "barndominium") {
    return (
      <StyleSketchFrame>
        <path
          className={styles.stylePaper}
          d="M37 91V43L89 16L143 43V91ZM143 91V57H213V91Z"
        />
        <path className={styles.styleWood} d="M58 91V50H120V91Z" />
        <g className={styles.styleInk}>
          <path d="M27 47L89 10L151 47M134 59L171 39L221 59" />
          <path d="M37 91V43M143 91V43M143 91V57M213 91V57" />
          <path d="M58 91V50H120V91M89 50V91M162 91V64H198V91" />
        </g>
        <path
          className={styles.styleDetail}
          d="M45 43V89M53 38V89M128 37V89M136 43V89M152 58V89M205 58V89"
        />
      </StyleSketchFrame>
    );
  }

  if (slug === "spanish-or-mediterranean") {
    return (
      <StyleSketchFrame>
        <path
          className={styles.stylePaper}
          d="M25 91V49H89V40H147V50H215V91Z"
        />
        <path
          className={styles.styleWood}
          d="M98 91V57C98 38 138 38 138 57V91Z"
        />
        <g className={styles.styleInk}>
          <path d="M18 50C42 41 67 41 94 48C111 34 134 34 153 49C174 43 196 44 222 52" />
          <path d="M25 91V49M89 49V40M147 40V50M215 91V50" />
          <path d="M42 91V62H76V91M98 91V57C98 38 138 38 138 57V91M164 91V62H199V91" />
        </g>
        <path
          className={styles.styleDetail}
          d="M30 53C49 48 69 48 88 53M151 54C172 49 193 49 211 54M59 62V91M181 62V91"
        />
      </StyleSketchFrame>
    );
  }

  return <span className={styles.visualUnknown}>?</span>;
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
        {options.map((option) => (
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
            <span
              className={styles.visualCardArt}
              data-style-card-art={option.slug}
              aria-hidden="true"
            >
              <ExteriorStyleSketch slug={option.slug} />
            </span>
            <span className={styles.visualCardLabel}>
              <OptionMark multiple />
              <span>{option.label}</span>
            </span>
          </label>
        ))}
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
                size="sm"
                aria-label={`Edit ${step.label}`}
                onClick={() => editStep(step.id)}
              >
                Edit
              </Button>
            </div>
          ))}
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
          <div className={styles.stagedControls}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!activeStep.complete && !activeStep.optional}
              onClick={finishActiveStep}
            >
              {editingStepId
                ? "Done"
                : activeStep.optional && !activeStep.complete
                  ? "Skip"
                  : "Continue"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function summarizeGroupValue(
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
            summary: summarizeGroupValue(group, current),
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
          summary: summarizeGroupValue(group, current),
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
        summary: summarizeGroupValue(group, value[group.id]),
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
  "must-have",
  "nice-to-have",
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
    useState<PriorityCategory>("must-have");
  const displayedError = error || localError;
  const limitText = `Choose a group, then choose features with keyboard or touch. Up to ${limits.mustHave} must-haves, ${limits.niceToHave} nice-to-haves, and ${limits.dealBreaker} deal-breakers.`;

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

export function PromptStack({ children }: Readonly<{ children: ReactNode }>) {
  return <div className={styles.promptStack}>{children}</div>;
}
