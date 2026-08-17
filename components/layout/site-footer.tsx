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
  const pageLinks = [
    ...siteConfig.nav.filter((item) => item.href !== "/"),
    siteConfig.primaryCta,
  ];
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
          </div>

          <div className="border-t border-line lg:grid lg:grid-cols-[minmax(10rem,0.9fr)_minmax(15rem,1.35fr)_minmax(7rem,0.65fr)] lg:items-start lg:gap-x-14 lg:border-t-0">
            <nav
              aria-label="Explore"
              className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-4 border-b border-line py-2 lg:block lg:border-b-0 lg:py-0"
            >
              <FooterHeading label="Explore" />
              <ul className="-my-1 flex flex-wrap gap-x-5 lg:mt-3 lg:grid lg:grid-cols-[max-content_minmax(0,1fr)] lg:gap-x-5">
                {pageLinks.map((item) => {
                  const isPrimaryCta = item.href === siteConfig.primaryCta.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href as Route}
                        className={`hh-link hh-touch-target whitespace-nowrap text-sm leading-6 ${
                          isPrimaryCta
                            ? "font-medium text-accent"
                            : "text-muted"
                        }`}
                      >
                        {item.label}
                        {isPrimaryCta ? (
                          <span aria-hidden="true" className="ml-2">
                            →
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <nav
              aria-label="Contact"
              className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-4 border-b border-line py-2 lg:block lg:border-b-0 lg:py-0"
            >
              <FooterHeading label="Contact" />
              <ul className="-my-1 lg:mt-3">
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
              className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-4 py-2 lg:block lg:py-0"
            >
              <FooterHeading label="Information" />
              <ul className="-my-1 flex flex-wrap gap-x-5 lg:mt-3 lg:block">
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

        <div className="flex flex-col pt-2 text-xs text-muted sm:min-h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pt-0">
          <nav
            aria-label="Agent resources"
            className="flex flex-col sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-muted-strong">
              For agents:
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
