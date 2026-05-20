import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent text-[#f9f6ef] hover:border-accent-strong hover:bg-accent-strong",
  secondary:
    "border-line-strong bg-white text-foreground hover:border-accent hover:bg-background hover:text-accent",
  ghost:
    "border-transparent bg-transparent text-foreground hover:border-line-strong hover:bg-background hover:text-accent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3.5 text-[0.68rem]",
  md: "min-h-11 px-4.5 text-[0.72rem]",
  lg: "min-h-12 px-5.5 text-[0.76rem]",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} = {}) {
  return cn(
    "hh-drafted-button inline-flex items-center justify-center gap-2 rounded-[var(--hh-radius-pill)] border font-mono uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  type = "button",
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
