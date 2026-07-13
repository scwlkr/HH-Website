import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document";
import { privacyDocument } from "@/lib/content/legal";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy",
  description:
    "Privacy policy for H and H Advancement LLC covering project inquiries, analytics, and website data handling.",
  path: "/privacy",
  eyebrow: "Privacy",
  noIndex: true,
});

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyDocument} />;
}
