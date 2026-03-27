import type { Metadata } from "next";
import { env } from "@/lib/env";
import { siteConfig } from "@/lib/site-config";

export const metadataBase = new URL(env.siteUrl);

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  eyebrow?: string;
  detail?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
};

type OpenGraphImageOptions = {
  title: string;
  eyebrow?: string;
  detail?: string;
};

function normalizeQueryValue(value: string | undefined, fallback: string) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return fallback;
  }

  return trimmedValue.slice(0, 180);
}

export function absoluteUrl(path: string) {
  return new URL(path, metadataBase);
}

export function buildOgImageUrl({
  title,
  eyebrow,
  detail,
}: OpenGraphImageOptions) {
  const searchParams = new URLSearchParams({
    title: normalizeQueryValue(title, siteConfig.name),
    eyebrow: normalizeQueryValue(eyebrow, siteConfig.name),
    detail: normalizeQueryValue(detail, siteConfig.description),
  });

  return `/api/og?${searchParams.toString()}`;
}

export function createPageMetadata({
  title,
  description,
  path,
  eyebrow,
  detail,
  keywords,
  noIndex = false,
  type = "website",
}: PageMetadataOptions): Metadata {
  const ogImage = buildOgImageUrl({
    title,
    eyebrow,
    detail: detail ?? description,
  });

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    openGraph: {
      type,
      title,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} | ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
