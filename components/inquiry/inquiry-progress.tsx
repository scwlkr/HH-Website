import { inquiryProgressSteps } from "@/lib/inquiry/options";
import { cn } from "@/lib/utils/cn";

type InquiryProgressProps = {
  currentStepIndex: number;
};

export function InquiryProgress({ currentStepIndex }: InquiryProgressProps) {
  const activeStep = inquiryProgressSteps[currentStepIndex];

  return (
    <div className="border-y border-line-strong py-6">
      <nav aria-labelledby="inquiry-progress-title" aria-describedby="inquiry-progress-status">
        <p
          id="inquiry-progress-title"
          className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent"
        >
          Your Progress
        </p>
        <p id="inquiry-progress-status" className="sr-only" aria-live="polite">
          Current step: {activeStep.title}. Step {currentStepIndex + 1} of{" "}
          {inquiryProgressSteps.length}.
        </p>
        <ol className="mt-5 border-t border-line">
          {inquiryProgressSteps.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <li
                key={step.id}
                className={cn(
                  "border-b border-line py-4 transition-colors",
                  isCurrent
                    ? "border-l-2 border-l-accent pl-4"
                    : isComplete
                      ? "text-foreground"
                      : "text-muted",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center border-r border-line font-mono text-[0.68rem] uppercase tracking-[0.18em]",
                      isCurrent
                        ? "border-accent text-accent"
                        : isComplete
                          ? "border-line-strong text-foreground"
                          : "border-line text-muted",
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
      </nav>
    </div>
  );
}
