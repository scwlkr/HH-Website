import { RoutePlaceholder } from "@/components/marketing/route-placeholder";

export default function CatalogPage() {
  return (
    <RoutePlaceholder
      eyebrow="Catalog"
      title="Build-type overview shell is established."
      description="This route now inherits the shared HH composition system and can receive structured build-type content cleanly once the Phase 3 data layer is added."
      primaryAction={{ href: "/inquire", label: "Start a Project" }}
      secondaryAction={{ href: "/", label: "Back Home" }}
      readyNow={[
        "The route shell is live and aligned with the root layout.",
        "Section framing and card patterns are consistent with pricing and FAQ.",
        "Navigation to and from the catalog route is already part of the global shell.",
      ]}
      nextUp={[
        "Define typed build-type content and slug helpers in Phase 3.",
        "Implement overview and detail category pages in Phase 4.",
        "Support inquiry prefills from build-type pages in Phase 5.",
      ]}
    />
  );
}
