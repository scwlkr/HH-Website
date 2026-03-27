import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/marketing/route-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy",
  description:
    "Privacy route for Howeth & Harp. Final policy copy is still pending before launch.",
  path: "/privacy",
  eyebrow: "Privacy",
  noIndex: true,
});

export default function PrivacyPage() {
  return (
    <RoutePlaceholder
      eyebrow="Privacy"
      title="Legal route shell is established."
      description="The footer now has a real privacy destination instead of a dead link. Final legal copy can be added into this shared page structure without revisiting the overall shell."
      primaryAction={{ href: "/", label: "Back Home" }}
      readyNow={[
        "Footer legal navigation resolves cleanly.",
        "The route already inherits the shared composition and CTA rules.",
        "Future copy can be added without changing the site-wide frame.",
      ]}
      nextUp={[
        "Replace the placeholder with final privacy language before launch.",
        "Confirm the final policy text matches the submission workflow and analytics setup.",
        "Verify footer link behavior during launch QA.",
      ]}
    />
  );
}
