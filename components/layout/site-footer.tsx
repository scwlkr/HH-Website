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

export function SiteFooter() {
  const year = new Date().getFullYear();
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
    <footer className="border-t border-line-strong pt-8 sm:pt-10">
      <Container size="wide">
        <div className="hh-page-frame px-6 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,0.45fr))]">
            <div className="space-y-6">
              <DividerFrame label="Footer" detail="Howeth & Harp" />
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl">
                  Quiet structure. Clear routes. A disciplined path into inquiry.
                </h2>
                <p className="max-w-xl text-sm leading-7 text-muted">
                  Direct navigation, direct contact, and the project brief stay
                  visible here without turning the footer into a second homepage.
                </p>
              </div>
              <ActionLink
                href={siteConfig.primaryCta.href}
                label={siteConfig.primaryCta.label}
                variant="secondary"
                trackingLocation="site-footer"
              />
            </div>

            <div>
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
                Contact
              </p>
              <ul className="mt-5 space-y-3">
                {contactLinks.map((item) => (
                  <li key={item.title}>
                    <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted">
                      {item.title}
                    </p>
                    <FooterLink href={item.href} label={item.label} />
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-6 text-muted">
                {siteConfig.contact.note}
              </p>
            </div>

            <div>
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
                Navigate
              </p>
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
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
                Legal
              </p>
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
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-line pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>{year} {siteConfig.name}</p>
            <p className="font-mono uppercase tracking-[0.2em]">
              {siteConfig.descriptor}
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
