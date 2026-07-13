"use client";

import {
  useId,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

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
}: ChoicePromptProps) {
  const ids = useFieldIds(id);

  return (
    <fieldset
      className={styles.fieldset}
      aria-describedby={describedBy(instructions, error, ids)}
      aria-invalid={Boolean(error)}
    >
      <legend className={styles.legend}>{legend}</legend>
      <FieldSupport instructions={instructions} error={error} ids={ids} />
      <div className={styles.optionGrid} data-columns={columns}>
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

export function GroupedChoicePrompt({
  id,
  groups,
  value,
  onChange,
  instructions,
  errors = {},
}: GroupedChoicePromptProps) {
  return (
    <div className={styles.groupedPrompt}>
      {groups.map((group) => {
        const current = value[group.id];
        const groupId = `${id}-${group.id}`;

        if (Array.isArray(current)) {
          return (
            <MultiChoicePrompt
              key={group.id}
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
          );
        }

        return (
          <ChoicePrompt
            key={group.id}
            id={groupId}
            legend={group.label}
            options={group.options}
            value={typeof current === "string" ? current : null}
            instructions={instructions}
            error={errors[group.id]}
            onChange={(next) => onChange({ ...value, [group.id]: next })}
          />
        );
      })}
    </div>
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
  };

  return (
    <fieldset className={styles.fieldset}>
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
    <div className={styles.countPrompt}>
      {groups.map((group) => (
        <ChoicePrompt
          key={group.id}
          id={`${id}-${group.id}`}
          legend={group.label}
          options={group.options}
          value={value[group.id] ?? null}
          instructions={instructions}
          error={errors[group.id]}
          columns={3}
          onChange={(next) => onChange({ ...value, [group.id]: next })}
        />
      ))}
    </div>
  );
}

function priorityForItem(value: PriorityPromptValue, item: string) {
  if (value.mustHave.includes(item)) return "must-have";
  if (value.niceToHave.includes(item)) return "nice-to-have";
  if (value.dealBreakers.includes(item)) return "deal-breaker";
  return "";
}

function priorityLabel(category: PriorityCategory) {
  if (category === "must-have") return "Must-have";
  if (category === "nice-to-have") return "Nice-to-have";
  return "Deal-breaker";
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
  const displayedError = error || localError;
  const limitText = `Assign each item with its menu. Up to ${limits.mustHave} must-haves, ${limits.niceToHave} nice-to-haves, and ${limits.dealBreaker} deal-breakers. Dragging is not required.`;

  function assign(item: string, category: PriorityCategory | "") {
    const mustHave = value.mustHave.filter((entry) => entry !== item);
    const niceToHave = value.niceToHave.filter((entry) => entry !== item);
    const dealBreakers = value.dealBreakers.filter((entry) => entry !== item);
    const countWithCustom = (target: PriorityCategory, count: number) =>
      count + (value.customItem?.priority === target ? 1 : 0);

    if (
      (category === "must-have" &&
        countWithCustom(category, mustHave.length) >= limits.mustHave) ||
      (category === "nice-to-have" &&
        countWithCustom(category, niceToHave.length) >= limits.niceToHave) ||
      (category === "deal-breaker" &&
        countWithCustom(category, dealBreakers.length) >= limits.dealBreaker)
    ) {
      setLocalError(`${priorityLabel(category)} limit reached.`);
      return;
    }

    setLocalError(null);
    onChange({
      mustHave: category === "must-have" ? [...mustHave, item] : mustHave,
      niceToHave:
        category === "nice-to-have" ? [...niceToHave, item] : niceToHave,
      dealBreakers:
        category === "deal-breaker" ? [...dealBreakers, item] : dealBreakers,
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

    const limit =
      category === "must-have"
        ? limits.mustHave
        : category === "nice-to-have"
          ? limits.niceToHave
          : limits.dealBreaker;
    const count =
      category === "must-have"
        ? value.mustHave.length
        : category === "nice-to-have"
          ? value.niceToHave.length
          : value.dealBreakers.length;
    if (count >= limit) {
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

      <div className={styles.priorityList}>
        {items.map((item) => {
          const selectId = `${id}-${item.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          return (
            <div className={styles.priorityRow} key={item}>
              <label htmlFor={selectId}>{item}</label>
              <select
                id={selectId}
                value={priorityForItem(value, item)}
                onChange={(event) =>
                  assign(item, event.target.value as PriorityCategory | "")
                }
              >
                <option value="">Not assigned</option>
                <option value="must-have">Must-have</option>
                <option value="nice-to-have">Nice-to-have</option>
                <option value="deal-breaker">Deal-breaker</option>
              </select>
            </div>
          );
        })}
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
        <label htmlFor={`${id}-custom-category`}>Assign custom priority</label>
        <select
          id={`${id}-custom-category`}
          value={value.customItem?.priority ?? ""}
          onChange={(event) =>
            assignCustom(event.target.value as PriorityCategory | "")
          }
        >
          <option value="">Not assigned</option>
          <option value="must-have">Must-have</option>
          <option value="nice-to-have">Nice-to-have</option>
          <option value="deal-breaker">Deal-breaker</option>
        </select>
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
  limits = DEFAULT_REFERENCE_LIMITS,
}: ReferencesPromptProps) {
  const ids = useFieldIds(id);
  const [link, setLink] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const displayedError = error || localError;
  const fileCount = items.filter((item) => item.kind === "file").length;
  const linkCount = items.length - fileCount;
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
    if (files.some((file) => !APPROVED_REFERENCE_TYPES.has(file.type))) {
      setLocalError("Choose a PDF, JPEG, PNG, WebP, or HEIC file.");
      return;
    }
    if (files.some((file) => file.size > limits.bytesPerFile)) {
      setLocalError(`Each file must be ${megabytes(limits.bytesPerFile)} MB or smaller.`);
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
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </div>
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
          onChange={(event) => onNoReferencesYetChange(event.target.checked)}
        />
        <span>I do not have references yet</span>
      </label>
    </fieldset>
  );
}

export function PromptStack({ children }: Readonly<{ children: ReactNode }>) {
  return <div className={styles.promptStack}>{children}</div>;
}
