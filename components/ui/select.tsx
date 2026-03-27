import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export function Select({
  className,
  label,
  helperText,
  error,
  id,
  options,
  placeholder,
  defaultValue = "",
  ...props
}: SelectProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <label className="flex flex-col gap-2">
      {label ? (
        <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted">
          {label}
        </span>
      ) : null}
      <div className="relative">
        <select
          id={fieldId}
          defaultValue={defaultValue}
          className={cn(
            "min-h-12 w-full appearance-none rounded-[var(--hh-radius-input)] border border-line-strong bg-surface-raised px-4 pr-12 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft",
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-mono text-xs text-muted">
          v
        </span>
      </div>
      {error ? (
        <span className="text-xs text-accent-strong">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-muted">{helperText}</span>
      ) : null}
    </label>
  );
}
