import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type CardShellProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "muted" | "accent";
};

const toneClasses = {
  default: "bg-white",
  muted: "bg-white",
  accent: "border-line-strong bg-white",
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
      <div className="relative">{children}</div>
    </div>
  );
}
