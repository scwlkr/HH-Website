import { getProjectStatusLabel } from "@/lib/operations/format";
import { cn } from "@/lib/utils/cn";
import type { ProjectStatus } from "@/types/operations";

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
  className?: string;
};

export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  const toneClasses =
    status === "for-sale"
      ? "border-accent/35 bg-accent-soft text-accent-strong"
      : "border-line-strong bg-surface-raised text-muted-strong";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--hh-radius-tight)] border px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em]",
        toneClasses,
        className,
      )}
    >
      {getProjectStatusLabel(status)}
    </span>
  );
}
