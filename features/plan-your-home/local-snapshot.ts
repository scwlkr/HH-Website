import { localDraftSnapshotSchema } from "./schemas.ts";
import {
  validatePlanHomeTourState,
  type PlanHomeTourState,
  type PlanHomeTourTransition,
} from "./tour-state.ts";

export const PLAN_HOME_LOCAL_SNAPSHOT_KEY = "plan-home-v1:local-snapshot";
export const PLAN_HOME_LOCAL_SNAPSHOT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type StorageLike = Readonly<{
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}>;

export type PlanHomeLocalSnapshotDependencies = Readonly<{
  storage: StorageLike;
  now?: () => Date;
  key?: string;
}>;

export function createPlanHomeLocalSnapshotAdapter({
  storage,
  now = () => new Date(),
  key = PLAN_HOME_LOCAL_SNAPSHOT_KEY,
}: PlanHomeLocalSnapshotDependencies) {
  function clear() {
    try {
      storage.removeItem(key);
    } catch {
      // Storage may be unavailable; local persistence must never block the tour.
    }
  }

  function save(state: PlanHomeTourState) {
    if (validatePlanHomeTourState(state).length > 0) {
      return false;
    }

    const savedAt = now();
    if (Number.isNaN(savedAt.getTime())) {
      return false;
    }

    const snapshot = localDraftSnapshotSchema.safeParse({
      snapshotVersion: 1,
      definitionId: state.definitionId,
      welcomeName: state.welcomeName,
      answers: state.answers,
      progress: {
        location: state.location,
        completedZoneIds: state.completedZoneIds,
        checkpointedZoneIds: state.checkpointedZoneIds,
      },
      contactCheckpoint: state.contactCheckpoint,
      references: state.references,
      savedAt: savedAt.toISOString(),
      expiresAt: new Date(
        savedAt.getTime() + PLAN_HOME_LOCAL_SNAPSHOT_TTL_MS,
      ).toISOString(),
    });
    if (!snapshot.success) {
      return false;
    }

    try {
      storage.setItem(key, JSON.stringify(snapshot.data));
      return true;
    } catch {
      return false;
    }
  }

  function saveAfterTransition(transition: PlanHomeTourTransition) {
    if (
      transition.error !== null ||
      !transition.events.some(
        (event) => event.type === "local-snapshot-requested",
      )
    ) {
      return false;
    }
    return save(transition.state);
  }

  function load(): PlanHomeTourState | null {
    let serialized: string | null;
    try {
      serialized = storage.getItem(key);
    } catch {
      return null;
    }
    if (serialized === null) {
      return null;
    }

    let raw: unknown;
    try {
      raw = JSON.parse(serialized);
    } catch {
      clear();
      return null;
    }

    const snapshot = localDraftSnapshotSchema.safeParse(raw);
    if (!snapshot.success) {
      clear();
      return null;
    }

    const currentTime = now().getTime();
    if (
      Number.isNaN(currentTime) ||
      currentTime >= Date.parse(snapshot.data.expiresAt)
    ) {
      clear();
      return null;
    }

    const state = {
      definitionId: snapshot.data.definitionId,
      welcomeName: snapshot.data.welcomeName,
      answers: snapshot.data.answers,
      location: snapshot.data.progress.location,
      contactCheckpoint: snapshot.data.contactCheckpoint,
      completedZoneIds: snapshot.data.progress.completedZoneIds,
      checkpointedZoneIds: snapshot.data.progress.checkpointedZoneIds,
      references: snapshot.data.references,
    } as PlanHomeTourState;

    if (validatePlanHomeTourState(state).length > 0) {
      clear();
      return null;
    }
    return state;
  }

  return { save, saveAfterTransition, load, clear } as const;
}
