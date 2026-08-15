import type { Metadata } from "next";

import {
  planYourHomeFeature,
  PlanYourHomeShell,
} from "@/features/plan-your-home";
import { createPageMetadata } from "@/lib/metadata";

const reviewPath = `${planYourHomeFeature.route}/review`;

export const metadata: Metadata = createPageMetadata({
  title: "Plan Your Home owner review",
  description:
    "A private-by-link walkthrough for reviewing the Plan Your Home experience with fake information.",
  path: reviewPath,
  eyebrow: "Plan Your Home",
  noIndex: true,
});

export default function PlanYourHomeReviewPage() {
  return <PlanYourHomeShell reviewMode />;
}
