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
  const fieldId = id ?? label?.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <label className="flex flex-col gap-2">
      {label ? (
        <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted">
          {label}
        </span>
      ) : null}
      <textarea
        id={fieldId}
        className={cn(
          "min-h-32 rounded-[var(--hh-radius-input)] border border-line-strong bg-surface-raised px-4 py-3 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent-soft",
          className,
        )}
        {...props}
      />
      {error ? (
        <span className="text-xs text-accent-strong">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-muted">{helperText}</span>
      ) : null}
    </label>
  );
}
