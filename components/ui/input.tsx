import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

export function Input({
  className,
  label,
  helperText,
  error,
  id,
  "aria-describedby": externalDescribedBy,
  ...props
}: InputProps) {
  const fieldId =
    id ??
    props.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ??
    label?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const describedById = error
    ? `${fieldId}-error`
    : helperText
      ? `${fieldId}-help`
      : undefined;
  const combinedDescribedBy = [externalDescribedBy, describedById]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <label className="flex flex-col gap-2">
      {label ? (
        <span className="font-mono text-[0.8125rem] uppercase tracking-[0.12em] text-muted">
          {label}
        </span>
      ) : null}
      <input
        id={fieldId}
        aria-describedby={combinedDescribedBy}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-12 rounded-[var(--hh-radius-input)] border border-muted bg-surface-raised px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent",
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
