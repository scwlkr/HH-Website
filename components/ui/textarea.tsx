import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

export function Textarea({
  className,
  label,
  helperText,
  error,
  id,
  ...props
}: TextareaProps) {
  const fieldId =
    id ??
    props.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ??
    label?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const describedById = error
    ? `${fieldId}-error`
    : helperText
      ? `${fieldId}-help`
      : undefined;

  return (
    <label className="flex flex-col gap-2">
      {label ? (
        <span className="font-mono text-[0.8125rem] uppercase tracking-[0.12em] text-muted">
          {label}
        </span>
      ) : null}
      <textarea
        id={fieldId}
        aria-describedby={describedById}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-32 rounded-[var(--hh-radius-input)] border border-muted bg-surface-raised px-4 py-3 text-base leading-7 text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent",
          className,
        )}
        {...props}
      />
      {error ? (
        <span id={describedById} className="text-sm text-accent-strong">
          {error}
        </span>
      ) : helperText ? (
        <span id={describedById} className="text-sm text-muted">
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
