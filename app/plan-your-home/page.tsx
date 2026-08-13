import type { Metadata } from "next";
import { headers } from "next/headers";
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
import {
  createPlanHomeRefinementFixture,
  isLoopbackPlanHomeRefinementRequest,
  normalizePlanHomeRefinementState,
} from "@/features/plan-your-home/refinement-fixture";

export const metadata: Metadata = createPageMetadata({
  title: "Plan Your Home",
  description:
    "Walk through seven illustrated zones and build a detailed new-home project brief for Howeth and Harp.",
  path: planYourHomeFeature.route,
  eyebrow: "Plan Your Home",
  noIndex: true,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PlanYourHomePage({
  searchParams,
}: Readonly<{ searchParams: SearchParams }>) {
  const [requestHeaders, resolvedSearchParams] = await Promise.all([
    headers(),
    searchParams,
  ]);
  const requestedValue = resolvedSearchParams.__refine;
  const requestedState = normalizePlanHomeRefinementState(
    typeof requestedValue === "string" ? requestedValue : "",
  );
  const refinementFixture =
    requestedState &&
    isLoopbackPlanHomeRefinementRequest({
      enabled: process.env.PLAN_HOME_REFINEMENT_MODE === "1",
      environment: process.env.NODE_ENV,
      host: requestHeaders.get("host") ?? "",
    })
      ? createPlanHomeRefinementFixture(requestedState)
      : undefined;
  const refinementMotion =
    Boolean(refinementFixture) && resolvedSearchParams.__motion === "1";

  return (
    <PlanYourHomeShell
      refinementFixture={refinementFixture}
      reducedMotion={refinementFixture ? !refinementMotion : undefined}
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
