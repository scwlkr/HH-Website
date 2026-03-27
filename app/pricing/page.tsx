import { RoutePlaceholder } from "@/components/marketing/route-placeholder";
import { finishLevels } from "@/lib/content";

export default function PricingPage() {
  return (
    <RoutePlaceholder
      eyebrow="Pricing"
      title="Finish-level overview shell is established."
      description="The route, shared intro structure, CTA framing, and page composition are in place, and the Phase 3 content layer now defines the finish data this section will render."
      primaryAction={{ href: "/inquire", label: "Start a Project" }}
      secondaryAction={{ href: "/", label: "Back Home" }}
      readyNow={[
        "Header and footer navigation resolve without dead links.",
        "Page-level framing, card treatments, and CTA styling are shared with the rest of the site.",
        `${finishLevels.length} finish levels are seeded with stable slugs, comparison points, gallery image metadata, and inquiry-prefill path helpers.`,
      ]}
      nextUp={[
        "Implement the full pricing overview and finish detail routes in Phase 4.",
        "Wire finish preselection into the inquiry flow in Phase 5.",
        "Replace placeholder image paths with production assets while keeping the same folder conventions.",
      ]}
    />
  );
}
