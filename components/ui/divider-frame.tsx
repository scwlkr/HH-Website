import { cn } from "@/lib/utils/cn";

type DividerFrameProps = {
  label: string;
  detail?: string;
  className?: string;
};

export function DividerFrame({
  label,
  detail,
  className,
}: DividerFrameProps) {
  return (
    <div
      className={cn(
        "hh-drafted-rule flex items-center gap-4 font-mono text-[0.7rem] uppercase tracking-[0.26em] text-muted",
        className,
      )}
    >
      <span className="shrink-0 text-accent">{label}</span>
      <span className="hh-drafted-rule-line h-px flex-1" />
      {detail ? <span className="shrink-0">{detail}</span> : null}
    </div>
  );
}
