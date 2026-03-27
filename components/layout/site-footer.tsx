import Link from "next/link";
import type { Route } from "next";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
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

  return (
    <footer className="border-t border-line-strong pt-8 sm:pt-10">
      <Container size="wide">
        <div className="hh-page-frame px-6 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,0.45fr))]">
            <div className="space-y-6">
              <DividerFrame label="Footer" detail="Site shell" />
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl">
                  Quiet structure. Clear routes. Guided inquiry.
                </h2>
                <p className="max-w-xl text-sm leading-7 text-muted">
                  The footer stays lean by design: direct navigation, direct
                  contact routing, and legal access without adding noise to the
                  conversion path.
                </p>
              </div>
              <Link
                href={siteConfig.primaryCta.href}
                className={buttonVariants({ variant: "secondary" })}
              >
                {siteConfig.primaryCta.label}
              </Link>
            </div>

            <div>
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
                Contact
              </p>
              <ul className="mt-5 space-y-3">
                <li>
                  <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted">
                    {siteConfig.contact.phone.title}
                  </p>
                  <FooterLink
                    href={siteConfig.contact.phone.href}
                    label={siteConfig.contact.phone.label}
                  />
                </li>
                <li>
                  <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted">
                    {siteConfig.contact.email.title}
                  </p>
                  <FooterLink
                    href={siteConfig.contact.email.href}
                    label={siteConfig.contact.email.label}
                  />
                </li>
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
              Drafting-inspired foundation established
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
