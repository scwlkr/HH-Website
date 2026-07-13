import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
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
      >
        <div className="border-t border-line-strong">
          {document.sections.map((section, index) => (
            <article
              key={section.title}
              className="grid gap-6 border-b border-line py-7 lg:grid-cols-[minmax(14rem,0.45fr)_minmax(0,1.55fr)] lg:gap-12 lg:py-9"
            >
              <header>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-accent">
                  Clause {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-4 text-2xl">{section.title}</h2>
              </header>
              <div className="max-w-3xl space-y-4 text-sm leading-7 text-muted">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="mt-5 border-t border-line">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="border-b border-line py-3">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Questions"
        title="Direct contact still matters if a legal or project detail needs clarification."
        description={`The site is designed to route most project work through the brief, but questions about these pages can still go directly to ${siteConfig.shortName}.`}
      >
        <div className="grid border-y border-line-strong lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.6fr)]">
          <div className="space-y-4 py-7 text-sm leading-7 text-muted lg:pr-10">
            {document.closing.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="border-t border-line py-7 lg:border-l lg:border-t-0 lg:pl-10">
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
          </div>
        </div>
      </Section>
    </>
  );
}
