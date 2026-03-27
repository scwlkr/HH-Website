import { RoutePlaceholder } from "@/components/marketing/route-placeholder";

export default function PricingPage() {
  return (
    <RoutePlaceholder
      eyebrow="Pricing"
      title="Finish-level overview shell is established."
      description="The route, shared intro structure, CTA framing, and page composition are in place. Phase 3 and Phase 4 will connect typed finish content, comparisons, and detail routing."
      primaryAction={{ href: "/inquire", label: "Start a Project" }}
      secondaryAction={{ href: "/", label: "Back Home" }}
      readyNow={[
        "Header and footer navigation resolve without dead links.",
        "Page-level framing, card treatments, and CTA styling are shared with the rest of the site.",
        "The route is ready for finish-level cards and comparison content.",
      ]}
      nextUp={[
        "Define typed finish-level content in the Phase 3 content layer.",
        "Implement the full pricing overview and finish detail routes in Phase 4.",
        "Wire finish preselection into the inquiry flow in Phase 5.",
      ]}
    />
  );
}
