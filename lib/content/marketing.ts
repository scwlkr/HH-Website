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
      title: "Start with the details that shape the work.",
      description:
        `Share the scope, site context, finish direction, and timing so ${publicName} can prepare for a focused first conversation.`,
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
      "Choose the level that best matches the project's priorities, material expectations, and degree of customization.",
    comparison: {
      eyebrow: "High-Level Comparison",
      title: "The differences are about fit, coordination depth, and customization posture.",
      description:
        "Compare design flexibility, material selection, construction coordination, and long-term value.",
    },
    cta: {
      eyebrow: "Next Step",
      title: "When the finish direction is close enough to discuss, start the project brief.",
      description:
        `${publicName} can align finish level, build type, site conditions, and timing around the actual scope.`,
    },
  },
  catalog: {
    eyebrow: "Scope Register",
    title: "Project Categories",
    lede:
      "Planning discipline, finish clarity, and credible execution across four project types.",
    description:
      `From single-family homes to commercial work, each category pairs its priorities with the appropriate design, building, and development approach.`,
    detail:
      "Finish direction depends on use, budget, durability, market position, and design ambition—not project type alone.",
    cta: {
      eyebrow: "Ready To Begin",
      title: "Bring the project into focus.",
      description:
        `Share the project category, location, finish direction, and timing so ${publicName} can respond with informed next steps.`,
    },
  },
  faq: {
    eyebrow: "FAQ",
    title: "Common Questions",
    lede:
      "Direct answers to the questions most likely to slow down a project decision.",
    description:
      "Find clear answers about services, finish levels, project types, schedules, and starting a project.",
    detail:
      "Have a project in mind? Share what you know today, even if some details are still open.",
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
      `Your project brief has been received. ${shortName} will review the details and follow up using your preferred contact method.`,
    nextSteps: [
      `${shortName} reviews the project type, finish direction, site context, and timeline you submitted.`,
      `${shortName} will contact you using the method you selected.`,
      `If you need to add or correct something, email ${shortName} directly.`,
    ],
  },
} as const;
