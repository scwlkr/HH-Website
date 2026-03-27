import { RoutePlaceholder } from "@/components/marketing/route-placeholder";

export default function PrivacyPage() {
  return (
    <RoutePlaceholder
      eyebrow="Privacy"
      title="Legal route shell is established."
      description="The footer now has a real privacy destination instead of a dead link. Final legal copy can be dropped into this shared page structure later without revisiting the overall shell."
      primaryAction={{ href: "/", label: "Back Home" }}
      readyNow={[
        "Footer legal navigation resolves cleanly.",
        "The route already inherits the shared composition and CTA rules.",
        "Future copy can be added without changing the site-wide frame.",
      ]}
      nextUp={[
        "Replace the placeholder with final privacy language before launch.",
        "Align metadata and accessibility details during Phase 6.",
        "Verify footer link behavior during Phase 7 QA.",
      ]}
    />
  );
}
