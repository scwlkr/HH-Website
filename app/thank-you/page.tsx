import { RoutePlaceholder } from "@/components/marketing/route-placeholder";

export default function ThankYouPage() {
  return (
    <RoutePlaceholder
      eyebrow="Thank You"
      title="Success-state shell is established."
      description="The thank-you route now exists inside the shared layout, so the inquiry workflow will have a stable destination once submission handling is implemented."
      primaryAction={{ href: "/inquire", label: "View Inquiry Route" }}
      secondaryAction={{ href: "/", label: "Back Home" }}
      readyNow={[
        "A dedicated success destination exists inside the Phase 2 shell.",
        "Header, footer, and CTA patterns remain consistent even on follow-up states.",
        "This route can later hold confirmation copy and fallback contact info.",
      ]}
      nextUp={[
        "Add final success-state messaging and direct contact fallback in Phase 4.",
        "Wire actual submission redirects in Phase 5.",
        "Harden analytics, metadata, and accessibility details in Phase 6.",
      ]}
    />
  );
}
