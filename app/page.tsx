import Link from "next/link";
import type { Route } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { Accordion } from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { DividerFrame } from "@/components/ui/divider-frame";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildTypes, getFaqPreviewItems } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";

const foundationCards = [
  {
    label: "Shared Shell",
    title: "Header, footer, and page framing now live at the root layout.",
    description:
      "Every route inherits one drafting-inspired structure instead of collecting one-off wrappers and border treatments.",
  },
  {
    label: "Section System",
    title: "Containers, page intros, dividers, and card shells are defined once.",
    description:
      "Phase 3 and Phase 4 can focus on typed content and page hierarchy rather than re-solving composition.",
  },
  {
    label: "Base Controls",
    title: "CTA, field, and accordion primitives are ready for FAQ and inquiry work.",
    description:
      "Form styling, linework, spacing, and interaction states now come from reusable components instead of ad hoc page code.",
  },
];

const routeShells: Route[] = [
  "/pricing",
  "/catalog",
  "/faq",
  "/inquire",
  "/thank-you",
  "/privacy",
  "/terms",
];

const faqPreview = getFaqPreviewItems(3).map((item) => ({
  id: item.id,
  title: item.question,
  content: item.answer,
}));

export default function Home() {
  return (
    <>
      <PageIntro
        eyebrow="Phase 2 Foundation"
        title="The HH site now has its shared architectural shell."
        description="This pass establishes the design tokens, layout wrappers, navigation frame, and reusable UI primitives that later content and inquiry work will inherit."
        actions={
          <>
            <Link href={siteConfig.primaryCta.href} className={buttonVariants()}>
              {siteConfig.primaryCta.label}
            </Link>
            <Link
              href="/pricing"
              className={buttonVariants({ variant: "secondary" })}
            >
              Review Route Shells
            </Link>
          </>
        }
        detail={
          <div className="space-y-5">
            <DividerFrame label="System Notes" detail="Shared once" />
            <ul className="space-y-3 text-sm leading-6 text-muted">
              <li>Measured spacing and linework now come from tokens.</li>
              <li>Header and footer navigation targets now resolve.</li>
              <li>FAQ and inquiry controls already share one visual language.</li>
            </ul>
          </div>
        }
      />

      <Section
        eyebrow="Shared Foundation"
        title="Phase 2 is implemented as a reusable system, not a decorative homepage pass."
        description="These primitives are the contract for later phases. Pages can now plug into a consistent shell without scattering bespoke borders, grids, or CTA styles."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {foundationCards.map((card) => (
            <CardShell key={card.title}>
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
                {card.label}
              </p>
              <h2 className="mt-4 text-2xl">{card.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                {card.description}
              </p>
            </CardShell>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Base UI"
        title="Inquiry and FAQ primitives are styled now, while the actual workflows stay in later phases."
        description="The controls below are intentionally plainspoken and structured. They exist to carry real data and interaction states later, not to force generic SaaS form styling into the site."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <CardShell tone="accent">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
                  Inquiry Preview
                </p>
                <h2 className="mt-2 text-2xl">Form controls</h2>
              </div>
              <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-accent">
                Ready For Phase 5
              </span>
            </div>
            <form className="mt-8 grid gap-5 sm:grid-cols-2">
              <Input label="Name" placeholder="Project contact" />
              <Input label="Email" placeholder="hello@howethandharp.com" />
              <Select
                label="Project Type"
                placeholder="Select one"
                options={buildTypes.map((buildType) => ({
                  value: buildType.slug,
                  label: buildType.title,
                }))}
              />
              <Input label="Approx. Square Footage" placeholder="4,200" />
              <div className="sm:col-span-2">
                <Textarea
                  label="Project Description"
                  placeholder="Site, scope, and goals."
                  rows={5}
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <Button>Submit Brief</Button>
                <Link
                  href="/inquire"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Open Route Shell
                </Link>
              </div>
            </form>
          </CardShell>

          <CardShell>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              FAQ Preview
            </p>
            <h2 className="mt-3 text-2xl">Accordion behavior</h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              The FAQ route can now inherit an accessible, keyboard-friendly
              accordion without needing client-side state just to open and close
              answers.
            </p>
            <Accordion items={faqPreview} className="mt-8" />
          </CardShell>
        </div>
      </Section>

      <Section
        eyebrow="Route Coverage"
        title="Primary navigation and legal links now resolve through shared route shells."
        description="These are intentionally lightweight placeholders so the global shell can be exercised end to end before Phase 3 content modeling and Phase 4 page builds begin."
      >
        <CardShell>
          <div className="flex flex-wrap gap-3">
            {routeShells.map((route) => (
              <Link
                key={route}
                href={route}
                className="rounded-full border border-line-strong bg-surface-raised px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {route}
              </Link>
            ))}
          </div>
        </CardShell>
      </Section>
    </>
  );
}
