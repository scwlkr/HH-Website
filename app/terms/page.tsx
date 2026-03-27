import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/marketing/route-placeholder";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Terms",
  description:
    "Terms route for Howeth & Harp. Final terms copy is still pending before launch.",
  path: "/terms",
  eyebrow: "Terms",
  noIndex: true,
});

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
        "Confirm the final terms match inquiry handling and direct-contact expectations.",
        "Test footer and legal routing in launch QA.",
      ]}
    />
  );
}
