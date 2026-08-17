import Link from "next/link";
import type { Route } from "next";
import { BrandWordmark } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { agentDiscoveryResources } from "@/lib/agent-guidance/resources";
import { siteConfig } from "@/lib/site-config";

function FooterHeading({ label }: { label: string }) {
  return (
    <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-muted-strong">
      {label}
    </p>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const pageLinks = [...siteConfig.nav, siteConfig.primaryCta];
  const agentLinks = [
    agentDiscoveryResources.sitemap,
    agentDiscoveryResources.llms,
    agentDiscoveryResources.services,
  ] as const;

  return (
    <footer className="relative border-t border-line-strong bg-white/82">
      <Container size="wide" className="py-7 sm:py-8 lg:py-9">
        <div className="grid gap-7 border-b border-line pb-6 lg:grid-cols-[minmax(15rem,1.05fr)_minmax(0,2fr)] lg:gap-14 lg:pb-8">
          <div className="self-start">
            <BrandWordmark
              sizes="(max-width: 640px) 11.5rem, 13rem"
              className="h-7 w-[11.5rem] sm:h-8 sm:w-[13rem]"
            />
            <p className="mt-3 text-sm font-medium tracking-[0.02em] text-muted-strong">
              {siteConfig.tagline}
            </p>
          </div>

          <div className="border-t border-line sm:grid sm:grid-cols-3 sm:border-t-0">
            <nav
              aria-label="Explore"
              className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-b border-line py-3 sm:block sm:border-b-0 sm:border-l sm:py-0 sm:pl-6"
            >
              <FooterHeading label="Explore" />
              <ul className="-my-1 flex flex-wrap gap-x-5 sm:mt-3 sm:grid sm:grid-cols-2 sm:gap-x-4">
                {pageLinks.map((item) => (
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

            <nav
              aria-label="Contact"
              className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-b border-line py-3 sm:block sm:border-b-0 sm:border-l sm:py-0 sm:pl-6"
            >
              <FooterHeading label="Contact" />
              <ul className="-my-1 sm:mt-3">
                <li>
                  <a
                    href={siteConfig.contact.email.href}
                    className="hh-link hh-touch-target text-sm leading-6 text-muted"
                  >
                    {siteConfig.contact.email.label}
                  </a>
                </li>
              </ul>
            </nav>

            <nav
              aria-label="Information"
              className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 py-3 sm:block sm:border-l sm:py-0 sm:pl-6"
            >
              <FooterHeading label="Information" />
              <ul className="-my-1 flex flex-wrap gap-x-5 sm:mt-3 sm:block">
                {siteConfig.legalNav.map((item) => (
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

        <div className="flex flex-col gap-1 pt-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <nav aria-label="Agent resources">
            <ul className="flex flex-wrap gap-x-5">
              {agentLinks.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className="hh-link hh-touch-target text-xs leading-5 text-muted"
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
