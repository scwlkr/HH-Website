import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Section } from "@/components/layout/section";
import { ActionLink } from "@/components/marketing/action-link";
import { BuildTypeCard } from "@/components/marketing/build-type-card";
import { CtaBand } from "@/components/marketing/cta-band";
import { FinishCard } from "@/components/marketing/finish-card";
import { Accordion } from "@/components/ui/accordion";
import { CardShell } from "@/components/ui/card-shell";
import { DividerFrame } from "@/components/ui/divider-frame";
import {
  buildTypes,
  finishLevels,
  getFaqPreviewItems,
  marketingPageContent,
} from "@/lib/content";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Architectural Design, Building, And Land Development",
  description:
    "Howeth and Harp provides architectural design, building, and land development with clear finish and project-type paths into inquiry.",
  path: "/",
  eyebrow: "Howeth and Harp",
});

const faqPreview = getFaqPreviewItems(3).map((item) => ({
  id: item.id,
  title: item.question,
  content: item.answer,
}));

export default function Home() {
  const directContactHref =
    siteConfig.contact.phone.href ?? siteConfig.contact.email.href;
  const directContactLabel = siteConfig.contact.phone.href
    ? `Call ${siteConfig.shortName}`
    : `Email ${siteConfig.shortName}`;

  return (
    <>
      <PageIntro
        eyebrow={marketingPageContent.home.hero.eyebrow}
        title={marketingPageContent.home.hero.title}
        description={marketingPageContent.home.hero.description}
        actions={
          <>
            <ActionLink
              href={siteConfig.primaryCta.href}
              label={siteConfig.primaryCta.label}
              trackingLocation="home-hero"
            />
            <ActionLink
              href={directContactHref}
              label={directContactLabel}
              variant="secondary"
              trackingLocation="home-hero"
            />
          </>
        }
        detail={
          <div className="space-y-5">
            <DividerFrame label="Primary Scope" detail="Current focus" />
            <ul className="space-y-3 text-sm leading-7 text-muted">
              <li>Architectural design aligned with project type and site context.</li>
              <li>Building execution grounded in finish clarity and coordination.</li>
              <li>Land development thinking introduced before scope drifts.</li>
            </ul>
          </div>
        }
      />

      <Section
        eyebrow={`What ${siteConfig.shortName} Does`}
        title="Three core capabilities, presented without extra noise."
        description="The work spans architectural design, building, and land development, with each project organized around the level of finish, coordination, and site response it actually needs."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {marketingPageContent.home.capabilities.map((capability) => (
            <CardShell key={capability.title}>
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
                Capability
              </p>
              <h2 className="mt-4 text-2xl">{capability.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                {capability.description}
              </p>
            </CardShell>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Finish Levels"
        title="Three finish paths route visitors toward the right level of specification."
        description="Finish level is a framing tool for the kind of coordination, curation, and customization a project should carry. Each path leads into a dedicated page before inquiry."
        actions={
          <ActionLink
            href="/pricing"
            label="View All Finish Levels"
            variant="secondary"
            trackingLocation="home-finish-preview"
          />
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {finishLevels.map((finish) => (
            <FinishCard key={finish.slug} finish={finish} variant="preview" />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Build Types"
        title="Project categories stay visible from the home page so scope can be identified early."
        description={`The catalog covers the major categories ${siteConfig.shortName} handles and gives each one a disciplined detail page instead of burying everything in one long overview.`}
        actions={
          <ActionLink
            href="/catalog"
            label="Open Catalog"
            variant="secondary"
            trackingLocation="home-build-preview"
          />
        }
      >
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {buildTypes.map((buildType) => (
            <BuildTypeCard
              key={buildType.slug}
              buildType={buildType}
              variant="preview"
            />
          ))}
        </div>
      </Section>

      <Section
        eyebrow={marketingPageContent.home.inquirySection.eyebrow}
        title={marketingPageContent.home.inquirySection.title}
        description={marketingPageContent.home.inquirySection.description}
      >
        <CtaBand
          eyebrow="Inquiry Flow"
          title="A guided brief creates a better starting point than a cold call with no context."
          description={`The inquiry path is where ${siteConfig.shortName} can understand project type, size, finish direction, site context, and timeline in one pass.`}
          primaryAction={{
            href: "/inquire",
            label: "Start a Project",
            trackingLocation: "home-inquiry-band",
          }}
          secondaryAction={{
            href: "/pricing",
            label: "Review Finish Levels",
            trackingLocation: "home-inquiry-band",
          }}
          notes={marketingPageContent.home.inquirySteps}
        />
      </Section>

      <Section
        eyebrow="FAQ Preview"
        title="A few common questions can be answered quickly before the conversation moves forward."
        description="The full FAQ groups the common process, pricing, category, and next-step questions into a scannable format."
        actions={
          <ActionLink
            href="/faq"
            label="Open Full FAQ"
            variant="secondary"
            trackingLocation="home-faq-preview"
          />
        }
      >
        <Accordion items={faqPreview} />
      </Section>

      <Section>
        <CtaBand
          eyebrow={marketingPageContent.home.footerCta.eyebrow}
          title={marketingPageContent.home.footerCta.title}
          description={marketingPageContent.home.footerCta.description}
          primaryAction={{
            href: "/inquire",
            label: "Start a Project",
            trackingLocation: "home-footer-band",
          }}
          secondaryAction={{
            href: directContactHref,
            label: directContactLabel,
            variant: "secondary",
            trackingLocation: "home-footer-band",
          }}
          notes={[
            "Pricing explains finish direction before budget conversations become muddy.",
            "Catalog pages separate project categories so users can self-identify quickly.",
            "Inquiry remains the main route because it captures enough scope to be useful.",
          ]}
        />
      </Section>
    </>
  );
}
