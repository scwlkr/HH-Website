import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document";
import { termsDocument } from "@/lib/content/legal";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Terms",
  description:
    "Terms of use for the Howeth & Harp website, including inquiry, content, and acceptable-use rules.",
  path: "/terms",
  eyebrow: "Terms",
  noIndex: true,
});

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
