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
  ...props
}: InputProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <label className="flex flex-col gap-2">
      {label ? (
        <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted">
          {label}
        </span>
      ) : null}
      <input
        id={fieldId}
        className={cn(
          "min-h-12 rounded-[var(--hh-radius-input)] border border-line-strong bg-surface-raised px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent-soft",
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
