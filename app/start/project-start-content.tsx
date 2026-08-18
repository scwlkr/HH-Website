import { GeneralInquiryForm } from "@/components/inquiry/general-inquiry-form";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { DividerFrame } from "@/components/ui/divider-frame";
import { WelcomeExteriorScene } from "@/features/plan-your-home/scene-families";
import type {
  GeneralInquiryFormValues,
  InquiryActionState,
} from "@/types/inquiry";

type SubmitGeneralInquiryAction = (
  state: InquiryActionState,
  formData: FormData,
) => Promise<InquiryActionState>;

export function ProjectStartContent({
  initialValues,
  submitAction,
}: Readonly<{
  initialValues: GeneralInquiryFormValues;
  submitAction: SubmitGeneralInquiryAction;
}>) {
  return (
    <>
      <section className="border-b border-line-strong bg-white/55">
        <Container>
          <div className="grid gap-7 py-8 sm:py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(22rem,1.08fr)] lg:items-center lg:gap-12 lg:py-14">
            <div>
              <DividerFrame label="Plan Your Home" detail="Guided new-home planning" />
              <h1 className="mt-6 max-w-[13ch] text-[clamp(2.45rem,5vw,4.7rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
                Plan your new home, one space at a time.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-strong sm:text-lg">
                Walk through the home, site, priorities, timing, and inspiration
                so H and H has a useful project brief before the first
                conversation.
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                <li>Guided walkthrough</li>
                <li>Save and resume</li>
                <li>Detailed project brief</li>
              </ul>
              <div className="mt-7">
                <ActionLink
                  href="/plan-your-home"
                  label="Start Your Home Plan"
                  size="xl"
                  className="w-full shadow-[0_20px_38px_-24px_rgba(17,17,15,0.72)] sm:w-auto sm:min-w-[20rem]"
                  trackingLocation="project-start-hero"
                  trackingContext="Plan Your Home"
                />
              </div>
            </div>

            <div className="h-44 overflow-hidden rounded-[var(--hh-radius-panel)] border border-line-strong shadow-[0_24px_48px_-38px_rgba(17,17,15,0.48)] sm:h-56 lg:h-[25rem]">
              <WelcomeExteriorScene name="Your home" />
            </div>
          </div>
        </Container>
      </section>

      <Section
        id="general-inquiry"
        className="scroll-mt-24 bg-background"
        eyebrow="Other Projects"
        title="Have something else in mind?"
        description="For remodels, additions, multifamily, commercial work, land development, or anything that does not fit the walkthrough, send a short project inquiry."
        size="content"
      >
        <GeneralInquiryForm
          initialValues={initialValues}
          submitAction={submitAction}
        />
      </Section>
    </>
  );
}
