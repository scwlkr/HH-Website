import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { CardShell } from "@/components/ui/card-shell";
import { siteConfig } from "@/lib/site-config";
import type { LegalDocument } from "@/lib/content/legal";

type LegalDocumentProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentProps) {
  return (
    <>
      <PageIntro
        eyebrow={document.eyebrow}
        title={document.title}
        description={document.description}
        actions={
          <>
            <ActionLink
              href="/inquire"
              label="Start A Project"
              trackingLocation="legal-page"
            />
            <ActionLink
              href="/"
              label="Back Home"
              variant="secondary"
              trackingLocation="legal-page"
            />
          </>
        }
        detail={
          <div className="space-y-4">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
              Last Updated
            </p>
            <p className="text-sm leading-7 text-muted">{document.effectiveDate}</p>
            <div className="space-y-3 border-t border-line pt-4 text-sm leading-7 text-muted">
              {document.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        }
      />

      <Section
        eyebrow="Policy Summary"
        title="The core terms are organized into short sections instead of one long legal wall."
        description="The site should keep the legal routes usable and scannable while still covering the public site and inquiry workflow."
        className="pt-0"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {document.sections.map((section) => (
            <CardShell key={section.title} tone="muted">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
                Section
              </p>
              <h2 className="mt-4 text-2xl">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-muted">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.bullets ? (
                <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="border-b border-line pb-3 last:border-b-0 last:pb-0"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardShell>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Questions"
        title="Direct contact still matters if a legal or project detail needs clarification."
        description={`The site is designed to route most project work through the brief, but questions about these pages can still go directly to ${siteConfig.shortName}.`}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.6fr)]">
          <CardShell>
            <div className="space-y-4 text-sm leading-7 text-muted">
              {document.closing.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </CardShell>

          <CardShell tone="muted">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
              Direct Contact
            </p>
            <a
              href={siteConfig.contact.email.href}
              className="hh-link mt-4 block text-base text-foreground"
            >
              {siteConfig.contact.email.label}
            </a>
            <p className="mt-4 text-sm leading-7 text-muted">
              {siteConfig.contact.note}
            </p>
          </CardShell>
        </div>
      </Section>
    </>
  );
}
