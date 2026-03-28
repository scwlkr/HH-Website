import type { Metadata } from "next";
import localFont from "next/font/local";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { PathAwareShell } from "@/components/layout/path-aware-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buildOgImageUrl, metadataBase } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";
import "../styles/tokens.css";
import "./globals.css";

const panchang = localFont({
  src: [
    {
      path: "../BRAND/Panchang_Complete/Fonts/WEB/fonts/Panchang-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../BRAND/Panchang_Complete/Fonts/WEB/fonts/Panchang-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../BRAND/Panchang_Complete/Fonts/WEB/fonts/Panchang-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../BRAND/Panchang_Complete/Fonts/WEB/fonts/Panchang-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-panchang",
  display: "swap",
});

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
    <html lang="en" className={`${panchang.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <AnalyticsProvider />
        <PathAwareShell
          header={<SiteHeader />}
          footer={<SiteFooter />}
        >
          {children}
        </PathAwareShell>
      </body>
    </html>
  );
}
