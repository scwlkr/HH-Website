import { DividerFrame } from "@/components/ui/divider-frame";
import { inquiryProgressSteps } from "@/lib/inquiry/options";

type InquiryStepperProps = {
  currentStepIndex: number;
};

export function InquiryStepper({ currentStepIndex }: InquiryStepperProps) {
  const activeStep = inquiryProgressSteps[currentStepIndex];

  return (
    <div aria-live="polite" aria-atomic="true">
      <DividerFrame
        label={`Step ${currentStepIndex + 1} / ${inquiryProgressSteps.length}`}
        detail="Project Brief"
      />
      <h2 className="mt-6 text-3xl sm:text-[2.2rem]">{activeStep.title}</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        {activeStep.description}
      </p>
    </div>
  );
}
