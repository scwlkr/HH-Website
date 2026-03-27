import { RoutePlaceholder } from "@/components/marketing/route-placeholder";
import { buildTypes } from "@/lib/content";

export default function CatalogPage() {
  return (
    <RoutePlaceholder
      eyebrow="Catalog"
      title="Build-type overview shell is established."
      description="This route now inherits the shared HH composition system and already has structured build-type data available from the Phase 3 content layer."
      primaryAction={{ href: "/inquire", label: "Start a Project" }}
      secondaryAction={{ href: "/", label: "Back Home" }}
      readyNow={[
        "The route shell is live and aligned with the root layout.",
        "Section framing and card patterns are consistent with pricing and FAQ.",
        `${buildTypes.length} build types are seeded with stable slugs, hero/gallery image metadata, and finish-level cross-links.`,
      ]}
      nextUp={[
        "Implement overview and detail category pages in Phase 4.",
        "Support inquiry prefills from build-type pages in Phase 5.",
        "Replace placeholder image paths with production assets while preserving the seeded folder structure.",
      ]}
    />
  );
}
