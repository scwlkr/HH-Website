"use client";

import { lazy, Suspense, type ReactNode } from "react";

const loadFirstZoneScenes = () => import("./first-zone-scenes");
const loadKitchenDiningScene = () => import("./kitchen-dining-scene");
const loadPrimarySuiteScene = () => import("./primary-suite-scene");
const loadBedroomsSharedBathroomsScene = () =>
  import("./bedrooms-shared-bathrooms-scene");
const loadUtilitySystemsScene = () => import("./utility-systems-scene");
const loadExteriorSiteScene = () => import("./exterior-site-scene");
const loadDesignDeskScene = () => import("./design-desk-scene");

export const WelcomeExteriorScene = lazy(() =>
  loadFirstZoneScenes().then(({ WelcomeExteriorScene: Scene }) => ({
    default: Scene,
  })),
);
export const EntryScene = lazy(() =>
  loadFirstZoneScenes().then(({ EntryScene: Scene }) => ({ default: Scene })),
);
export const LivingRoomScene = lazy(() =>
  loadFirstZoneScenes().then(({ LivingRoomScene: Scene }) => ({
    default: Scene,
  })),
);
export const KitchenDiningScene = lazy(() =>
  loadKitchenDiningScene().then(({ KitchenDiningScene: Scene }) => ({
    default: Scene,
  })),
);
export const PrimarySuiteScene = lazy(() =>
  loadPrimarySuiteScene().then(({ PrimarySuiteScene: Scene }) => ({
    default: Scene,
  })),
);
export const BedroomHallThresholdScene = lazy(() =>
  loadPrimarySuiteScene().then(({ BedroomHallThresholdScene: Scene }) => ({
    default: Scene,
  })),
);
export const BedroomsSharedBathroomsScene = lazy(() =>
  loadBedroomsSharedBathroomsScene().then(
    ({ BedroomsSharedBathroomsScene: Scene }) => ({ default: Scene }),
  ),
);
export const UtilityHallThresholdScene = lazy(() =>
  loadBedroomsSharedBathroomsScene().then(
    ({ UtilityHallThresholdScene: Scene }) => ({ default: Scene }),
  ),
);
export const UtilitySystemsScene = lazy(() =>
  loadUtilitySystemsScene().then(({ UtilitySystemsScene: Scene }) => ({
    default: Scene,
  })),
);
export const ExteriorBackDoorThresholdScene = lazy(() =>
  loadUtilitySystemsScene().then(
    ({ ExteriorBackDoorThresholdScene: Scene }) => ({ default: Scene }),
  ),
);
export const ExteriorSiteScene = lazy(() =>
  loadExteriorSiteScene().then(({ ExteriorSiteScene: Scene }) => ({
    default: Scene,
  })),
);
export const BlueprintDesignDeskThresholdScene = lazy(() =>
  loadExteriorSiteScene().then(
    ({ BlueprintDesignDeskThresholdScene: Scene }) => ({ default: Scene }),
  ),
);
export const DesignDeskScene = lazy(() =>
  loadDesignDeskScene().then(({ DesignDeskScene: Scene }) => ({
    default: Scene,
  })),
);
export const ReviewBriefThresholdScene = lazy(() =>
  loadDesignDeskScene().then(({ ReviewBriefThresholdScene: Scene }) => ({
    default: Scene,
  })),
);

const sceneLoaders = [
  loadFirstZoneScenes,
  loadKitchenDiningScene,
  loadPrimarySuiteScene,
  loadBedroomsSharedBathroomsScene,
  loadUtilitySystemsScene,
  loadExteriorSiteScene,
  loadDesignDeskScene,
] as const;

export function planHomeSceneIndex(questionNumber: number | null) {
  if (questionNumber === null || questionNumber <= 11) return 0;
  if (questionNumber <= 15) return 1;
  if (questionNumber <= 19) return 2;
  if (questionNumber <= 21) return 3;
  if (questionNumber <= 25) return 4;
  if (questionNumber <= 30) return 5;
  return 6;
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
