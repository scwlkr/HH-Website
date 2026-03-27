import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type CardShellProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "muted" | "accent";
};

const toneClasses = {
  default: "bg-surface",
  muted: "bg-surface-raised",
  accent: "bg-surface-raised",
} as const;

export function CardShell({
  children,
  className,
  tone = "default",
  ...props
}: CardShellProps) {
  return (
    <div
      className={cn("hh-paper-panel px-6 py-6 sm:px-7 sm:py-7", toneClasses[tone], className)}
      {...props}
    >
      {tone === "accent" ? (
        <div className="hh-accent-hatch pointer-events-none absolute inset-x-6 top-0 h-20 opacity-70" />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}
