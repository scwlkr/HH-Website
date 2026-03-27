import { RoutePlaceholder } from "@/components/marketing/route-placeholder";

export default function TermsPage() {
  return (
    <RoutePlaceholder
      eyebrow="Terms"
      title="Legal route shell is established."
      description="The footer now has a real terms destination as part of the shared site shell. Final legal content can replace this placeholder later without new layout work."
      primaryAction={{ href: "/", label: "Back Home" }}
      readyNow={[
        "Footer legal navigation is functional now.",
        "The route uses the same framed structure as all other pages.",
        "The shell can accept final launch copy without another system pass.",
      ]}
      nextUp={[
        "Replace the placeholder with final terms language before launch.",
        "Add final page metadata during Phase 6.",
        "Test footer and legal routing in Phase 7 QA.",
      ]}
    />
  );
}
