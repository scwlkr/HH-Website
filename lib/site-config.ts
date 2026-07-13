import type { Route } from "next";
import { env } from "@/lib/env";

export type SiteLink = {
  href: Route;
  label: string;
};

export const siteConfig = {
  name: "Howeth and Harp",
  shortName: "h and h",
  legalName: "H and H Advancement LLC",
  legalShortName: "H and H",
  description: "Architectural design, building, and land development.",
  descriptor: "Architectural design, building, and land development.",
  primaryCta: {
    href: "/inquire" as Route,
    label: "Start a Project",
  },
  nav: [
    { href: "/" as Route, label: "Home" },
    { href: "/projects" as Route, label: "Projects" },
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
    note: "Planning a project? Share your location, goals, timing, and scope to start the conversation.",
  },
} as const;
