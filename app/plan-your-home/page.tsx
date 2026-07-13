import type { Metadata } from "next";
import {
  planYourHomeFeature,
  PlanYourHomeShell,
} from "@/features/plan-your-home";
import {
  checkpointPlanHomeDraftAction,
  createPlanHomeDraftAction,
} from "@/app/plan-your-home/actions";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Plan Your Home",
  description:
    "Internal preview of the guided Howeth and Harp home-planning experience.",
  path: planYourHomeFeature.route,
  eyebrow: "Plan Your Home",
  noIndex: true,
});

export default function PlanYourHomePage() {
  return (
    <PlanYourHomeShell
      createDraft={createPlanHomeDraftAction}
      checkpointDraft={checkpointPlanHomeDraftAction}
    />
  );
}
