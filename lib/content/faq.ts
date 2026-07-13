import { createSlugLookup } from "@/lib/content/slug-helpers";
import { siteConfig } from "@/lib/site-config";
import type { FAQGroup, FAQGroupSlug, FAQItem } from "@/types/content";

const publicName = siteConfig.name;
const shortName = siteConfig.shortName;

export const faqGroups = [
  {
    slug: "process",
    title: "Process",
    description: `How ${shortName} structures early conversations, scope alignment, and the path into a real project.`,
  },
  {
    slug: "pricing",
    title: "Pricing & Finish Levels",
    description: "How finish levels are framed and how budget conversations are approached at the outset.",
  },
  {
    slug: "project-types",
    title: "Project Types",
    description: `Which project categories fit ${shortName} best and how scope affects the recommendation.`,
  },
  {
    slug: "timeline",
    title: "Timeline Expectations",
    description: "What affects schedule early and what clients should prepare before targeting a start window.",
  },
  {
    slug: "next-steps",
    title: "Contact & Next Steps",
    description: `What to bring into the inquiry process and how ${shortName} follows up after an intake is submitted.`,
  },
] satisfies ReadonlyArray<FAQGroup>;

export const faqItems = [
  {
    id: "process-services",
    group: "process",
    question: "Do you handle both design and construction?",
    answer:
      `${publicName} provides architectural design, building, and land development. Depending on the project, h and h can provide one service or coordinate several.`,
  },
  {
    id: "process-land-first",
    group: "process",
    question: "Can I start an inquiry if I only have land or a target area?",
    answer:
      "Yes. You can begin with a lot you own, a site you are evaluating, or simply a target area. Share what you know, and h and h can help determine the next useful step.",
  },
  {
    id: "pricing-finish-levels",
    group: "pricing",
    question: "Are the finish levels fixed price packages?",
    answer:
      "No. The finish levels and any published square-foot benchmarks are meant to clarify direction, not promise a fixed contract number. Final pricing still depends on scope, site conditions, systems, and the degree of customization involved.",
  },
  {
    id: "pricing-upgrade-path",
    group: "pricing",
    question: "How should I choose between Builder Grade, Builder+, and Custom?",
    answer:
      "The right finish level depends on how much customization the project needs, how visible the finish decisions are to the overall experience, and where you want to place the budget emphasis. If you are unsure, choose the closest direction and h and h can help refine it around your priorities and budget.",
  },
  {
    id: "project-types-residential",
    group: "project-types",
    question: "Do you only work on custom homes?",
    answer:
      `No. ${shortName} works across single-family, multifamily, townhome, and commercial projects. Some projects are highly custom, while others are better served by disciplined, repeatable solutions.`,
  },
  {
    id: "project-types-finish-fit",
    group: "project-types",
    question: "Can different project types use different finish levels?",
    answer:
      "Yes. Finish level and build type are related but not locked together. A single-family residence might be Builder Grade or Custom, and a commercial project might lean Builder+ or Custom depending on its goals.",
  },
  {
    id: "timeline-start-window",
    group: "timeline",
    question: "When should I reach out if I have a target start date?",
    answer:
      "Earlier is better, especially when site constraints, financing, entitlements, or consultant coordination are still in motion. A realistic start window is easier to plan when the project brief is formed before major decisions are forced by the calendar.",
  },
  {
    id: "timeline-info-needed",
    group: "timeline",
    question: "What information is most helpful at the start?",
    answer:
      "The most useful inputs are the project type, approximate size, location, intended timeline, finish-level direction, and a short description of the goals or constraints. Even partial information is enough to start the conversation.",
  },
  {
    id: "next-steps-follow-up",
    group: "next-steps",
    question: "What happens after I submit an inquiry?",
    answer:
      `${shortName} reviews the information you submitted, then follows up using your preferred contact method to discuss fit and next steps.`,
  },
  {
    id: "next-steps-contact-method",
    group: "next-steps",
    question: "Can I still call or email directly?",
    answer:
      "Yes. You can call or email directly. For a new project, the project brief helps you share the key details up front.",
  },
] satisfies ReadonlyArray<FAQItem>;

const faqGroupLookup = createSlugLookup(faqGroups);

export const faqGroupSlugs = faqGroupLookup.slugs;

export function isFaqGroupSlug(slug: string): slug is FAQGroupSlug {
  return faqGroupLookup.hasSlug(slug);
}

export function getFaqGroupBySlug(slug: string) {
  return faqGroupLookup.getBySlug(slug);
}

export function getFaqItemsByGroup(group: FAQGroupSlug) {
  return faqItems.filter((item) => item.group === group);
}

export function getFaqPreviewItems(limit = 4) {
  return faqItems.slice(0, limit);
}
