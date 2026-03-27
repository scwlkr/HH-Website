export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate: string;
  intro: string[];
  sections: LegalSection[];
  closing: string[];
};

export const privacyDocument: LegalDocument = {
  eyebrow: "Privacy",
  title: "Privacy Policy",
  description:
    "Howeth & Harp uses the website to share service information, collect project inquiries, and understand which routes lead visitors into contact.",
  effectiveDate: "March 27, 2026",
  intro: [
    "This policy explains what information Howeth & Harp may collect through the website, how that information is used, and the choices available to people who contact the company through the project brief or direct email.",
    "The policy is intended to describe the current website and inquiry workflow. It should be reviewed again whenever the data model, analytics setup, or hosting arrangement changes materially.",
  ],
  sections: [
    {
      title: "Information Collected",
      paragraphs: [
        "Howeth & Harp may collect contact details and project details that a visitor submits through the inquiry form, including name, phone, email, project type, finish direction, site context, timing, and project notes.",
        "The site may also store routing or attribution details tied to the inquiry workflow, such as the page where the brief started and any UTM parameters included in the visit URL.",
      ],
      bullets: [
        "Contact information such as name, phone number, and email address",
        "Project information such as category, finish level, square footage, location, timeline, and budget direction",
        "Technical and referral details such as source page, UTM parameters, and basic anti-spam signals",
      ],
    },
    {
      title: "How Information Is Used",
      paragraphs: [
        "Inquiry information is used to review project fit, respond to potential clients, and keep a usable record of submitted briefs.",
        "Usage and routing data may be used to understand how visitors move through the site, which content paths are useful, and where the inquiry experience needs improvement.",
      ],
      bullets: [
        "Respond to project inquiries and follow-up requests",
        "Operate, secure, and improve the website and inquiry flow",
        "Measure page routes, CTA usage, and other site performance signals",
      ],
    },
    {
      title: "Sharing And Service Providers",
      paragraphs: [
        "Howeth & Harp may use third-party infrastructure providers to host the site, store inquiry submissions, and process analytics or form-delivery events. Those providers only receive the information needed to perform those services.",
        "The company does not use this website to sell personal information collected through the inquiry workflow.",
      ],
    },
    {
      title: "Analytics, Cookies, And Tracking",
      paragraphs: [
        "The website includes a modular analytics layer intended to track core CTA and inquiry events. Depending on the launch configuration, those events may be forwarded to an analytics platform selected by Howeth & Harp.",
        "Browser-level storage, cookies, or similar tracking technologies may be used by the site or its analytics providers. Visitors can usually limit or clear that tracking through their browser settings, though some site behavior may become less accurate as a result.",
      ],
    },
    {
      title: "Retention And Security",
      paragraphs: [
        "Inquiry submissions are kept for business and operational purposes for as long as they remain relevant to active or past project discussions, recordkeeping, fraud prevention, or comparable legitimate needs.",
        "Howeth & Harp uses reasonable administrative and technical safeguards for the website and inquiry workflow, but no internet-based system can guarantee absolute security.",
      ],
    },
    {
      title: "Questions, Updates, And Requests",
      paragraphs: [
        "Anyone who wants to ask about information submitted through the site, request an update, or request deletion should contact Howeth & Harp directly by email.",
        "This policy may be updated when the website, inquiry workflow, or service providers change. The effective date above reflects the current version of the policy.",
      ],
    },
  ],
  closing: [
    "Questions about this policy or a submitted inquiry can be directed to the email address listed below.",
  ],
};

export const termsDocument: LegalDocument = {
  eyebrow: "Terms",
  title: "Terms Of Use",
  description:
    "These terms describe the basic rules for using the Howeth & Harp website and clarify that project information on the site is directional rather than contractual.",
  effectiveDate: "March 27, 2026",
  intro: [
    "These terms apply to use of the Howeth & Harp website, including the public marketing pages, pricing and catalog routes, FAQ content, and the guided project inquiry flow.",
    "Using the website means the visitor accepts these terms. If the visitor does not agree with them, the correct step is to stop using the site.",
  ],
  sections: [
    {
      title: "Informational Use Only",
      paragraphs: [
        "The website is provided to describe Howeth & Harp services, finish levels, and project categories at a high level. It is not a proposal, an estimate, or a binding commitment to perform work.",
        "Finish descriptions, category guidance, timelines, and other planning details are directional only and may change based on scope, site conditions, availability, and later project discussions.",
      ],
    },
    {
      title: "Inquiry Submission And No Client Relationship",
      paragraphs: [
        "Submitting the project brief or sending a direct message through the contact information on the site does not create a client, contractor, consultant, fiduciary, or other professional relationship.",
        "A working relationship exists only after direct follow-up, scope alignment, and any separate written agreement that Howeth & Harp chooses to enter into.",
      ],
    },
    {
      title: "Acceptable Site Use",
      paragraphs: [
        "Visitors may use the site only for lawful purposes and for legitimate review of services or project contact. The site may not be used to submit false information, overload the inquiry workflow, probe for vulnerabilities, or interfere with normal site operation.",
      ],
      bullets: [
        "Do not submit misleading, abusive, or automated spam inquiries",
        "Do not attempt to bypass rate limits, hidden anti-spam fields, or site security controls",
        "Do not copy, scrape, or reuse site content in a way that violates applicable law",
      ],
    },
    {
      title: "Intellectual Property",
      paragraphs: [
        "The site design, written content, brand presentation, graphics, and other original materials are owned by or licensed to Howeth & Harp unless another owner is identified.",
        "No license is granted to reuse those materials except for ordinary personal review of the website.",
      ],
    },
    {
      title: "Third-Party Services And Links",
      paragraphs: [
        "The website may rely on or link to third-party services for hosting, analytics, communications, or related infrastructure. Howeth & Harp is not responsible for the content, policies, or uptime of external services that it does not control.",
      ],
    },
    {
      title: "Disclaimers And Liability Limits",
      paragraphs: [
        "The website is provided on an as-is and as-available basis. To the extent allowed by law, Howeth & Harp disclaims warranties of accuracy, completeness, merchantability, fitness for a particular purpose, and non-infringement.",
        "To the extent allowed by law, Howeth & Harp is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the website or reliance on website content.",
      ],
    },
    {
      title: "Updates To The Site And Terms",
      paragraphs: [
        "Howeth & Harp may revise the website, inquiry flow, or these terms at any time. Continued use of the site after an update means the visitor accepts the revised terms.",
      ],
    },
  ],
  closing: [
    "Questions about these terms or about project-specific next steps should be directed to the email address listed below.",
  ],
};
