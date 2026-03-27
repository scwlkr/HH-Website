import { CardShell } from "@/components/ui/card-shell";
import { inquiryProgressSteps } from "@/lib/inquiry/options";
import { cn } from "@/lib/utils/cn";

type InquiryProgressProps = {
  currentStepIndex: number;
};

export function InquiryProgress({ currentStepIndex }: InquiryProgressProps) {
  return (
    <CardShell tone="muted">
      <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
        Intake Progress
      </p>
      <ol className="mt-5 space-y-4" aria-label="Inquiry progress">
        {inquiryProgressSteps.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <li
              key={step.id}
              className={cn(
                "rounded-[calc(var(--hh-radius-panel)-0.3rem)] border px-4 py-4 transition-colors",
                isCurrent
                  ? "border-accent bg-accent-soft/50"
                  : isComplete
                    ? "border-line-strong bg-surface"
                    : "border-line bg-surface",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[0.68rem] uppercase tracking-[0.18em]",
                    isCurrent
                      ? "border-accent bg-accent text-background"
                      : isComplete
                        ? "border-line-strong bg-surface-raised text-foreground"
                        : "border-line bg-background text-muted",
                  )}
                >
                  {step.label}
                </span>
                <div>
                  <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted">
                    {step.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </CardShell>
  );
}
