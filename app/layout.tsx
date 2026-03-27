import type { Metadata } from "next";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buildOgImageUrl, metadataBase } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";
import "../styles/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  category: "business",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_US",
    images: [
      {
        url: buildOgImageUrl({
          title: siteConfig.name,
          eyebrow: siteConfig.name,
          detail: siteConfig.description,
        }),
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      buildOgImageUrl({
        title: siteConfig.name,
        eyebrow: siteConfig.name,
        detail: siteConfig.description,
      }),
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <a
          href="#main-content"
          className="absolute left-4 top-4 z-[60] -translate-y-24 rounded-full border border-line-strong bg-surface-raised px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-foreground transition-transform focus:translate-y-0 focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        <AnalyticsProvider />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main
            id="main-content"
            className="flex-1 pb-16 pt-6 focus:outline-none sm:pb-24 sm:pt-8"
            tabIndex={-1}
          >
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
