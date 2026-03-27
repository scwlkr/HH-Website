import type { Route } from "next";

export type SiteLink = {
  href: Route;
  label: string;
};

export const siteConfig = {
  name: "Howeth & Harp",
  shortName: "HH",
  description: "Architectural design, building, and land development.",
  descriptor: "Architectural design, building, and land development.",
  primaryCta: {
    href: "/inquire" as Route,
    label: "Start a Project",
  },
  nav: [
    { href: "/" as Route, label: "Home" },
    { href: "/pricing" as Route, label: "Pricing" },
    { href: "/catalog" as Route, label: "Catalog" },
    { href: "/faq" as Route, label: "FAQ" },
  ] satisfies SiteLink[],
  legalNav: [
    { href: "/privacy" as Route, label: "Privacy" },
    { href: "/terms" as Route, label: "Terms" },
  ] satisfies SiteLink[],
  contact: {
    phone: {
      href: undefined,
      label: "Direct line pending final launch setup",
      title: "Phone",
    },
    email: {
      href: "mailto:hello@howethandharp.com",
      label: "hello@howethandharp.com",
      title: "Email",
    },
    note: "For new work, the structured project brief remains the clearest starting point.",
  },
} as const;
