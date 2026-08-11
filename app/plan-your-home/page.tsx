import type { Metadata } from "next";
import {
  planYourHomeFeature,
  PlanYourHomeShell,
} from "@/features/plan-your-home";
import {
  abandonPlanHomeReferenceUploadAction,
  addPlanHomeReferenceLinkAction,
  checkpointPlanHomeDraftAction,
  createPlanHomeDraftAction,
  finalizePlanHomeReferenceUploadAction,
  issuePlanHomeReferenceUploadAction,
  removePlanHomeReferenceAction,
  restorePlanHomeDraftAction,
  syncPlanHomeReferenceNotesAction,
  submitPlanHomeDraftAction,
} from "@/app/plan-your-home/actions";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Plan Your Home",
  description:
    "Walk through seven illustrated zones and build a detailed new-home project brief for Howeth and Harp.",
  path: planYourHomeFeature.route,
  eyebrow: "Plan Your Home",
});

export default function PlanYourHomePage() {
  return (
    <PlanYourHomeShell
      createDraft={createPlanHomeDraftAction}
      restoreDraft={restorePlanHomeDraftAction}
      checkpointDraft={checkpointPlanHomeDraftAction}
      issueReferenceUpload={issuePlanHomeReferenceUploadAction}
      finalizeReferenceUpload={finalizePlanHomeReferenceUploadAction}
      abandonReferenceUpload={abandonPlanHomeReferenceUploadAction}
      addReferenceLink={addPlanHomeReferenceLinkAction}
      removeReference={removePlanHomeReferenceAction}
      syncReferenceNotes={syncPlanHomeReferenceNotesAction}
      submitDraft={submitPlanHomeDraftAction}
    />
  );
}
