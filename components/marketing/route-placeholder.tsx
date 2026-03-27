import type { Route } from "next";
import type { ReactNode } from "react";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { CardShell } from "@/components/ui/card-shell";

type RoutePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: {
    href: Route;
    label: string;
  };
  secondaryAction?: {
    href: Route;
    label: string;
  };
  readyNow: ReactNode[];
  nextUp: ReactNode[];
};

export function RoutePlaceholder({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  readyNow,
  nextUp,
}: RoutePlaceholderProps) {
  return (
    <>
      <PageIntro
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            {primaryAction ? (
              <ActionLink
                href={primaryAction.href}
                label={primaryAction.label}
                trackingLocation="legal-placeholder"
              />
            ) : null}
            {secondaryAction ? (
              <ActionLink
                href={secondaryAction.href}
                label={secondaryAction.label}
                variant="secondary"
                trackingLocation="legal-placeholder"
              />
            ) : null}
          </>
        }
      />

      <Section
        eyebrow="Route Shell"
        title="The shared frame is active here already."
        description="This placeholder keeps navigation, footer links, and page-level composition live while final legal copy is still being prepared."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <CardShell>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
              Ready Now
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
              {readyNow.map((item, index) => (
                <li key={index} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                  {item}
                </li>
              ))}
            </ul>
          </CardShell>

          <CardShell tone="muted">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
              Next Up
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
              {nextUp.map((item, index) => (
                <li key={index} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                  {item}
                </li>
              ))}
            </ul>
          </CardShell>
        </div>
      </Section>
    </>
  );
}
