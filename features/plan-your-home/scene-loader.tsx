"use client";

import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

const loadSceneFamilies = () => import("./scene-families");

function lazyScene<Props>(name: keyof typeof import("./scene-families")) {
  return lazy(() =>
    loadSceneFamilies().then((scenes) => ({
      default: scenes[name] as unknown as ComponentType<Props>,
    })),
  );
}

type AnchorProps = Readonly<{ activeAnchor?: string }>;
type WelcomeProps = Readonly<{ name: string }>;

export const WelcomeExteriorScene = lazyScene<WelcomeProps>("WelcomeExteriorScene");
export const EntryScene = lazyScene<AnchorProps>("EntryScene");
export const LivingRoomScene = lazyScene<AnchorProps>("LivingRoomScene");
export const KitchenDiningScene = lazyScene<AnchorProps>("KitchenDiningScene");
export const PrimarySuiteScene = lazyScene<AnchorProps>("PrimarySuiteScene");
export const BedroomHallThresholdScene = lazyScene<Record<never, never>>("BedroomHallThresholdScene");
export const BedroomsSharedBathroomsScene = lazyScene<AnchorProps>("BedroomsSharedBathroomsScene");
export const UtilityHallThresholdScene = lazyScene<Record<never, never>>("UtilityHallThresholdScene");
export const UtilitySystemsScene = lazyScene<AnchorProps>("UtilitySystemsScene");
export const ExteriorBackDoorThresholdScene = lazyScene<Record<never, never>>("ExteriorBackDoorThresholdScene");
export const ExteriorSiteScene = lazyScene<AnchorProps>("ExteriorSiteScene");
export const BlueprintDesignDeskThresholdScene = lazyScene<Record<never, never>>("BlueprintDesignDeskThresholdScene");
export const DesignDeskScene = lazyScene<AnchorProps>("DesignDeskScene");
export const ReviewBriefThresholdScene = lazyScene<Record<never, never>>("ReviewBriefThresholdScene");
export const ProjectBriefReviewTableScene = lazyScene<Record<never, never>>("ProjectBriefReviewTableScene");

const sceneLoaders = [
  loadSceneFamilies,
  loadSceneFamilies,
  loadSceneFamilies,
  loadSceneFamilies,
  loadSceneFamilies,
] as const;

export function planHomeSceneIndex(questionNumber: number | null) {
  if (questionNumber === null || questionNumber <= 3) return 0;
  if (questionNumber <= 14) return 1;
  if (questionNumber <= 20) return 2;
  if (questionNumber <= 27) return 3;
  return 4;
}

export function preloadNextPlanHomeScene(
  questionNumber: number | null,
  loaders: readonly (() => Promise<unknown>)[] = sceneLoaders,
) {
  const nextLoader = loaders[planHomeSceneIndex(questionNumber) + 1];
  if (nextLoader) void nextLoader();
}

export function PlanHomeSceneSuspense({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          data-plan-home-scene-loading="true"
          style={{ minHeight: "inherit", width: "100%" }}
        />
      }
    >
      {children}
    </Suspense>
  );
}
