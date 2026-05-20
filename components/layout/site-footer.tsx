import Link from "next/link";
import type { Route } from "next";
import { BrandMark, BrandWordmark } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
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
  const contactLinks: Array<{
    title: string;
    href: string;
    label: string;
  }> = [];
  const pageLinks = [...siteConfig.nav, siteConfig.primaryCta];

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
    <footer className="relative mt-16 border-t border-line-strong bg-white/82">
      <Container size="wide" className="py-10 sm:py-12">
        <div className="grid gap-10 border-b border-line pb-9 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.55fr))] lg:gap-8">
          <div className="space-y-5 lg:pr-10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--hh-radius-pill)] border border-line-strong bg-white">
                <BrandMark decorative sizes="34px" className="h-7 w-7" />
              </div>
              <div className="min-w-0 space-y-2">
                <BrandWordmark
                  sizes="(max-width: 640px) 12rem, 15rem"
                  className="h-8 w-[12rem] sm:h-9 sm:w-[15rem]"
                />
                <p className="max-w-sm text-sm leading-7 text-muted">
                  {siteConfig.descriptor}
                </p>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted">
              {siteConfig.contact.note}
            </p>
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
            <FooterHeading label="Pages" />
            <ul className="mt-5 space-y-2">
              {pageLinks.map((item) => (
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
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{year} {siteConfig.shortName}. All rights reserved.</p>
          <p>{siteConfig.descriptor}</p>
        </div>
      </Container>
    </footer>
  );
}
