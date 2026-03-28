import Link from "next/link";
import type { Route } from "next";
import { ActionLink } from "@/components/marketing/action-link";
import { Container } from "@/components/layout/container";
import { DividerFrame } from "@/components/ui/divider-frame";
import { siteConfig } from "@/lib/site-config";

function FooterLink({
  href,
  label,
}: {
  href?: string;
  label: string;
}) {
  if (!href) {
    return <span className="text-sm leading-7 text-muted">{label}</span>;
  }

  return (
    <a href={href} className="hh-link text-sm leading-7 text-muted">
      {label}
    </a>
  );
}

function FooterHeading({ label }: { label: string }) {
  return (
    <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-muted-strong">
      {label}
    </p>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const directContactHref =
    siteConfig.contact.phone.href ?? siteConfig.contact.email.href;
  const directContactLabel = siteConfig.contact.phone.href
    ? `Call ${siteConfig.shortName}`
    : `Email ${siteConfig.shortName}`;
  const contactLinks: Array<{
    title: string;
    href: string;
    label: string;
  }> = [];

  if (siteConfig.contact.phone.href) {
    contactLinks.push({
      title: siteConfig.contact.phone.title,
      href: siteConfig.contact.phone.href,
      label:
        siteConfig.contact.phone.label ??
        siteConfig.contact.phone.href.replace(/^tel:/, ""),
    });
  }

  contactLinks.push({
    title: siteConfig.contact.email.title,
    href: siteConfig.contact.email.href,
    label: siteConfig.contact.email.label,
  });

  return (
    <footer className="relative mt-16 border-t border-line-strong bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(17,17,15,0.1)_0%,rgba(17,17,15,0)_78%),repeating-linear-gradient(135deg,rgba(17,17,15,0.12)_0,rgba(17,17,15,0.12)_1px,transparent_1px,transparent_9px)] opacity-[0.16]" />
      <Container size="wide" className="relative py-12 sm:py-14">
        <div className="grid gap-10 border-b border-line pb-10 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.5fr))] lg:gap-8">
          <div className="space-y-6 lg:pr-10">
            <DividerFrame label={siteConfig.shortName} detail="Project routing" />
            <div className="space-y-4">
              <h2 className="max-w-xl text-3xl sm:text-[2.35rem] sm:leading-[1.08]">
                A cleaner route from first visit to first conversation.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-muted">
                Architectural design, building, and land development stay legible
                here through direct navigation, direct contact, and a structured
                inquiry path.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionLink
                href={siteConfig.primaryCta.href}
                label={siteConfig.primaryCta.label}
                trackingLocation="site-footer"
              />
              <ActionLink
                href={directContactHref}
                label={directContactLabel}
                variant="secondary"
                trackingLocation="site-footer"
              />
            </div>
          </div>

          <div>
            <FooterHeading label="Contact" />
            <ul className="mt-5 space-y-4">
              {contactLinks.map((item) => (
                <li key={item.title}>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                    {item.title}
                  </p>
                  <div className="mt-1">
                    <FooterLink href={item.href} label={item.label} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading label="Navigate" />
            <ul className="mt-5 space-y-2">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
                    className="hh-link text-sm leading-7 text-muted"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading label="Information" />
            <ul className="mt-5 space-y-2">
              {siteConfig.legalNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
                    className="hh-link text-sm leading-7 text-muted"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-7 text-muted">
              {siteConfig.contact.note}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{year} {siteConfig.name}. All rights reserved.</p>
          <p>{siteConfig.descriptor}</p>
          <p className="font-mono uppercase tracking-[0.2em] text-muted-strong">
            Drafted For Clear Scope
          </p>
        </div>
      </Container>
    </footer>
  );
}
