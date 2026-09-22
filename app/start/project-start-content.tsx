import { GeneralInquiryForm } from "@/components/inquiry/general-inquiry-form";
import { Container } from "@/components/layout/container";
import Link from "next/link";
import { ActionLink } from "@/components/marketing/action-link";
import { DividerFrame } from "@/components/ui/divider-frame";
import { EntryScene } from "@/features/plan-your-home/scene-families";
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
          <div className="grid gap-7 py-8 sm:py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12 lg:py-14">
            <div>
              <DividerFrame label="Plan Your Home" />
              <h1 className="mt-6 max-w-[16ch] text-[clamp(2.125rem,5vw,4.7rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-balance">
                <span className="block">Your new home.</span>{" "}
                <span className="block">One space at a time.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-strong sm:text-lg">
                Tell us what you want to build. We’ll turn your ideas,
                priorities, and timeline into a clear brief for our first
                conversation.
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                <li>Guided walkthrough</li>
                <li>Save and resume</li>
                <li>Detailed project brief</li>
              </ul>
              <div className="mt-7">
                <ActionLink
                  href="/plan-your-home"
                  label="Start planning"
                  size="xl"
                  className="w-full sm:w-auto sm:min-w-[18rem]"
                  trackingLocation="project-start-hero"
                  trackingContext="Plan Your Home"
                />
                <p className="mt-3 text-sm leading-6 text-muted">
                  Planning a different project?{" "}
                  <Link href="#general-inquiry" className="hh-link inline-flex min-h-11 items-center text-accent underline underline-offset-4">
                    Send an inquiry.
                  </Link>
                </p>
              </div>
            </div>

            <div className="h-44 overflow-hidden border-y border-line sm:h-56 lg:h-[25rem] lg:border-y-0 lg:border-l">
              <EntryScene />
            </div>
          </div>
        </Container>
      </section>

      <section
        id="general-inquiry"
        className="scroll-mt-24 border-b border-line bg-background py-14 sm:py-16 lg:py-20"
      >
        <Container size="narrow">
          <DividerFrame label="Other projects" />
          <h2 className="mt-6 text-3xl sm:text-4xl">Have something else in mind?</h2>
          <p className="mt-4 text-base leading-7 text-muted">
            For remodels, additions, multifamily, commercial projects, or land
            development, tell us a little about your project below.
          </p>
          <div className="mt-8">
            <GeneralInquiryForm
              initialValues={initialValues}
              submitAction={submitAction}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
