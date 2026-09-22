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
        "hh-drafted-rule flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.18em] text-muted",
        className,
      )}
    >
      <span className="min-w-0 break-words text-accent">{label}</span>
      <span aria-hidden="true" className="hh-drafted-rule-line h-px min-w-8 flex-1" />
      {detail ? <span className="min-w-0 break-words">{detail}</span> : null}
    </div>
  );
}
