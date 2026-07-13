export type PlanYourHomeFeatureShell = Readonly<{
  id: "plan-your-home";
  route: "/plan-your-home";
  stage: "shared-stage";
}>;

export const planYourHomeFeature = {
  id: "plan-your-home",
  route: "/plan-your-home",
  stage: "shared-stage",
} satisfies PlanYourHomeFeatureShell;
