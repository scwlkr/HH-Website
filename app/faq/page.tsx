import { RoutePlaceholder } from "@/components/marketing/route-placeholder";
import { faqGroups, faqItems } from "@/lib/content";

export default function FaqPage() {
  return (
    <RoutePlaceholder
      eyebrow="FAQ"
      title="FAQ route shell is established."
      description="The shared accordion primitive already exists, and the Phase 3 content layer now provides grouped FAQ data for the full page build."
      primaryAction={{ href: "/inquire", label: "Start a Project" }}
      secondaryAction={{ href: "/", label: "Back Home" }}
      readyNow={[
        "The route inherits the same shell, linework, and CTA system as the rest of the site.",
        `An accessible accordion primitive is already available for ${faqItems.length} seeded questions across ${faqGroups.length} groups.`,
        "Footer and header navigation can route users here immediately.",
      ]}
      nextUp={[
        "Implement grouped questions and page-specific copy in Phase 4.",
        "Point reassurance CTAs toward the inquiry workflow in Phase 5.",
        "Trim or expand the seeded FAQ set once final launch copy is approved.",
      ]}
    />
  );
}
