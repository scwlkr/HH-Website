import type { Route } from "next";
import { env } from "@/lib/env";

export type SiteLink = {
  href: Route;
  label: string;
};

export const siteConfig = {
  name: "Howeth and Harp",
  shortName: "H&H",
  legalName: "Howeth and Harp Advancement, LLC",
  legalShortName: "H&H Advancement, LLC",
  description: "Architectural design, building, and land development.",
  descriptor: "Architectural design, building, and land development.",
  primaryCta: {
    href: "/inquire" as Route,
    label: "Start a Project",
  },
  nav: [
    { href: "/" as Route, label: "Home" },
    { href: "/projects" as Route, label: "Projects" },
    { href: "/catalog" as Route, label: "Catalog" },
    { href: "/pricing" as Route, label: "Pricing" },
    { href: "/faq" as Route, label: "FAQ" },
  ] satisfies SiteLink[],
  legalNav: [
    { href: "/privacy" as Route, label: "Privacy" },
    { href: "/terms" as Route, label: "Terms" },
  ] satisfies SiteLink[],
  contact: {
    phone: {
      href: env.contactPhoneHref,
      label: env.contactPhoneLabel,
      title: "Phone",
    },
    email: {
      href: env.contactEmailHref,
      label: env.contactEmailAddress,
      title: "Email",
    },
    note: "For new work, the structured project brief remains the clearest starting point.",
  },
} as const;
