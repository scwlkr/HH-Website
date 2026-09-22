import Link from "next/link";
import type { Route } from "next";
import { BrandWordmark } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { agentDiscoveryResources } from "@/lib/agent-guidance/resources";
import { siteConfig } from "@/lib/site-config";

function FooterHeading({ label }: { label: string }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-strong">
      {label}
    </p>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const pageLinks = siteConfig.nav.filter((item) => item.href !== "/");
  const agentLinks = [
    agentDiscoveryResources.sitemap,
    agentDiscoveryResources.llms,
    agentDiscoveryResources.services,
  ] as const;

  return (
    <footer className="relative border-t border-line-strong bg-white/82">
      <Container size="wide" className="py-6 sm:py-7 lg:py-8">
        <div className="grid gap-6 border-b border-line pb-5 lg:grid-cols-[minmax(17rem,1.15fr)_minmax(0,2fr)] lg:gap-16 lg:pb-7">
          <div className="self-start">
            <Link
              href="/"
              className="hh-link hh-touch-target -ml-2 w-fit sm:-ml-3"
            >
              <BrandWordmark
                sizes="(max-width: 640px) 13.5rem, 15rem"
                className="h-8 w-[13.5rem] sm:h-9 sm:w-[15rem]"
              />
            </Link>
            <p className="mt-2 text-[0.95rem] font-medium tracking-[0.02em] text-muted-strong">
              {siteConfig.tagline}
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
              {siteConfig.serviceArea}
            </p>
            <Link
              href={siteConfig.primaryCta.href}
              className="hh-link hh-touch-target mt-1 w-fit whitespace-nowrap text-sm font-medium leading-6 text-accent"
            >
              {siteConfig.primaryCta.label}
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </Link>
          </div>

          <div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2 lg:gap-8 lg:border-t-0 lg:pt-0">
            <nav
              aria-label="Contact"
              className="min-w-0"
            >
              <FooterHeading label="Contact" />
              <ul className="mt-2">
                <li>
                  <a
                    href={siteConfig.contact.email.href}
                    className="hh-link hh-touch-target break-all text-sm leading-6 text-muted"
                  >
                    {siteConfig.contact.email.label}
                  </a>
                </li>
              </ul>
            </nav>

            <nav
              aria-label="Information"
              className="min-w-0"
            >
              <FooterHeading label="Information" />
              <ul className="mt-2 flex flex-wrap gap-x-5">
                {[...pageLinks, ...siteConfig.legalNav].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href as Route}
                      className="hh-link hh-touch-target text-sm leading-6 text-muted"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="flex flex-col pt-2 text-xs text-muted sm:min-h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pt-0">
          <nav
            aria-label="AI agent resources"
            className="flex flex-col sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-strong">
              For AI agents:
            </span>
            <ul className="flex flex-wrap gap-x-5">
              {agentLinks.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className="hh-link hh-touch-target text-[0.82rem] leading-5 text-muted"
                  >
                    {item.footerLabel}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="flex min-h-12 shrink-0 items-center">
            © {year} {siteConfig.shortName}
          </p>
        </div>
      </Container>
    </footer>
  );
}
