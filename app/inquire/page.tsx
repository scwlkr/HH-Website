import { RoutePlaceholder } from "@/components/marketing/route-placeholder";

export default function InquirePage() {
  return (
    <RoutePlaceholder
      eyebrow="Inquiry"
      title="Inquiry route shell is established."
      description="This page now inherits the final site frame and base field styling. The actual guided intake UX, validation, and persistence remain intentionally reserved for Phase 5."
      primaryAction={{ href: "/", label: "Back Home" }}
      secondaryAction={{ href: "/pricing", label: "Review Pricing" }}
      readyNow={[
        "Input, select, textarea, card, and button primitives are already defined.",
        "The global shell makes this route feel continuous with the rest of the site.",
        "The route exists now so CTA flows can point somewhere real during foundation work.",
      ]}
      nextUp={[
        "Define the inquiry schema and shared validation types in Phase 5.",
        "Build the guided multi-step or segmented intake experience in Phase 5.",
        "Add Supabase persistence, anti-spam protections, and thank-you redirects in Phase 5.",
      ]}
    />
  );
}
