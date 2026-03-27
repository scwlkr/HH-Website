import { RoutePlaceholder } from "@/components/marketing/route-placeholder";

export default function FaqPage() {
  return (
    <RoutePlaceholder
      eyebrow="FAQ"
      title="FAQ route shell is established."
      description="The shared accordion primitive already exists, so this route is ready to receive structured FAQ groups once the Phase 3 content model is in place."
      primaryAction={{ href: "/inquire", label: "Start a Project" }}
      secondaryAction={{ href: "/", label: "Back Home" }}
      readyNow={[
        "The route inherits the same shell, linework, and CTA system as the rest of the site.",
        "An accessible accordion primitive is already available for grouped questions.",
        "Footer and header navigation can route users here immediately.",
      ]}
      nextUp={[
        "Model FAQ content in typed local files during Phase 3.",
        "Implement grouped questions and page-specific copy in Phase 4.",
        "Point reassurance CTAs toward the inquiry workflow in Phase 5.",
      ]}
    />
  );
}
