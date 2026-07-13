import { siteConfig } from "@/lib/site-config";

const publicName = siteConfig.name;
const shortName = siteConfig.shortName;

export const marketingPageContent = {
  home: {
    hero: {
      eyebrow: publicName,
      title: "Design. Build. Develop.",
      description:
        `${publicName} aligns project type, finish strategy, and site realities early so the work starts from a clear brief instead of a scatter of disconnected decisions.`,
    },
    capabilities: [
      {
        title: "Architectural Design",
        description:
          "Planning, massing, circulation, and finish direction are shaped as one system before the project gets expensive to correct.",
      },
      {
        title: "Building",
        description:
          "Construction delivery stays tied to the original logic of the work, with enough discipline to keep the project coherent in the field.",
      },
      {
        title: "Land Development",
        description:
          "Lot evaluation, site fit, and early development thinking can enter the conversation before scope hardens around the wrong assumptions.",
      },
    ],
    inquirySteps: [
      "Share the project type, location, and current level of clarity.",
      "Identify the finish direction, size range, and service mix that seem most likely.",
      "Use the brief to start a real project conversation with enough context to be useful.",
    ],
    inquirySection: {
      eyebrow: "Project Brief",
      title: "The primary conversion path is a structured inquiry, not a generic contact form.",
      description:
        `The intake is meant to surface scope, site context, finish direction, and timing early so ${publicName} can respond from a more informed position.`,
    },
    footerCta: {
      eyebrow: "Start The Conversation",
      title: "Move from general interest into a real project brief.",
      description:
        "Browse finish levels, review project categories, or go directly into inquiry if the scope is already forming.",
    },
  },
  pricing: {
    eyebrow: "Pricing + Finish",
    title: "Finish Levels",
    lede: "Three approaches to specification, coordination, and finish.",
    description:
      "These categories are directional, not fixed-price packages. Final pricing depends on scope, site conditions, systems, and the degree of customization involved.",
    detail:
      "Use this page to understand the posture of each level, then move into the dedicated finish pages for a clearer read on fit.",
    comparison: {
      eyebrow: "High-Level Comparison",
      title: "The differences are about fit, coordination depth, and customization posture.",
      description:
        "This comparison stays intentionally high level. The goal is to clarify direction without turning the page into contract language or technical fine print.",
    },
    cta: {
      eyebrow: "Next Step",
      title: "When the finish direction is close enough to discuss, start the project brief.",
      description:
        `The inquiry form is where ${publicName} can align finish level, build type, site conditions, and timing around the actual scope.`,
    },
  },
  catalog: {
    eyebrow: "Scope Register",
    title: "Project Categories",
    lede:
      "Planning discipline, finish clarity, and credible execution across four project types.",
    description:
      `These categories show where ${publicName} works and how the work tends to organize. Each page explains the nature of the category and routes into the inquiry path.`,
    detail:
      "Project type and finish level are related, but they are not locked together. The category pages help frame that relationship before inquiry.",
    cta: {
      eyebrow: "Inquiry Route",
      title: "Once the category is clear enough, the next move is the project brief.",
      description:
        "The inquiry flow is designed to capture category, finish direction, location, and timing in one disciplined intake.",
    },
  },
  faq: {
    eyebrow: "FAQ",
    title: "Common Questions",
    lede:
      "Direct answers to the questions most likely to slow down a project decision.",
    description:
      "The questions stay short, the answers stay direct, and the page keeps practical objections from becoming a wall of copy.",
    detail:
      "If the scope is already taking shape, the structured project brief is available from the header.",
    cta: {
      eyebrow: "Ready To Proceed",
      title: "Use the inquiry form once the major questions are settled.",
      description:
        `The project brief gives ${publicName} the context needed to respond intelligently on scope, finish direction, and next steps.`,
    },
  },
  thankYou: {
    eyebrow: "Submission Received",
    title: "Brief Received",
    lede: "The next step is a direct follow-up.",
    description:
      "This page is the success destination for the inquiry flow. It confirms receipt, sets expectations for next steps, and keeps direct contact accessible if anything important needs to be added.",
    nextSteps: [
      `${shortName} reviews the project type, finish direction, site context, and timeline you submitted.`,
      "Follow-up can then happen through the contact method and details provided in the brief.",
      "If a time-sensitive detail was missed, direct email remains available as a fallback.",
    ],
  },
} as const;
