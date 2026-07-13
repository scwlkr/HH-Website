import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { CardShell } from "@/components/ui/card-shell";
import { planYourHomeFeature } from "@/features/plan-your-home/feature";

export function PlanYourHomeShell() {
  return (
    <>
      <PageIntro
        eyebrow="Internal Preview"
        title="Plan Your Home"
        lede="A dedicated starting point for detached single-family homes."
        description="This internal route establishes the foundation for a guided home-planning walkthrough."
        detail={
          <div className="space-y-4">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Build State
            </p>
            <p className="text-sm leading-7 text-muted">
              Foundation shell. The walkthrough will be added in later milestones.
            </p>
          </div>
        }
      />

      <Section
        eyebrow="Foundation"
        title="The route is ready for the walkthrough."
        description="Questions, saving, and illustrated rooms remain intentionally outside this first scaffold."
      >
        <CardShell className="max-w-3xl">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                Feature
              </dt>
              <dd className="mt-2 text-lg font-medium text-foreground">
                Plan Your Home
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                Status
              </dt>
              <dd className="mt-2 text-lg font-medium capitalize text-foreground">
                {planYourHomeFeature.stage}
              </dd>
            </div>
          </dl>
        </CardShell>
      </Section>
    </>
  );
}
