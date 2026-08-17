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
      title: "When the finish direction is close enough to discuss, start a project.",
      description:
        "Use the project start page for the guided new-home walkthrough or a short general inquiry.",
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
        "Use the guided new-home walkthrough or send a short inquiry with the project type, location, and what you are planning.",
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
      title: "Choose the project path that fits.",
      description:
        "Plan Your Home creates a detailed new-home brief; the general inquiry starts a shorter conversation about other work.",
    },
  },
  thankYou: {
    eyebrow: "Submission Received",
    title: "Inquiry Received",
    lede: "The next step is a direct follow-up.",
    description:
      `Your project inquiry has been received. ${shortName} will review the details and follow up using the contact information you provided.`,
    nextSteps: [
      `${shortName} reviews the project type, location, and short description you submitted.`,
      `${shortName} will respond using the contact information you provided.`,
      `If you need to add or correct something, email ${shortName} directly.`,
    ],
  },
} as const;
