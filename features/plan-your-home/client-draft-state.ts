export const PLAN_HOME_CLIENT_DRAFT_KEY = "plan-home-v1:client-draft";

export type PlanHomeClientDraftState = Readonly<{
  createIdempotencyKey: string;
  projectAndLivingCheckpointKey: string | null;
  draftId: string | null;
  revision: number | null;
}>;

type StorageLike = Readonly<{
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}>;

const draftIdPattern = /^draft-[a-f0-9]{40}$/;
const uuidV4Pattern =
  /(?:^|[:_-])[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=[:_-]|$)/i;

function isClientDraftState(value: unknown): value is PlanHomeClientDraftState {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  const hasValidKey =
    typeof candidate.createIdempotencyKey === "string" &&
    candidate.createIdempotencyKey.length >= 16 &&
    candidate.createIdempotencyKey.length <= 200 &&
    uuidV4Pattern.test(candidate.createIdempotencyKey);
  const hasValidDraft =
    (candidate.draftId === null && candidate.revision === null) ||
    (typeof candidate.draftId === "string" &&
      draftIdPattern.test(candidate.draftId) &&
      typeof candidate.revision === "number" &&
      Number.isInteger(candidate.revision) &&
      candidate.revision > 0);
  const hasValidCheckpointKey =
    candidate.projectAndLivingCheckpointKey === null ||
    (typeof candidate.projectAndLivingCheckpointKey === "string" &&
      candidate.projectAndLivingCheckpointKey.length >= 16 &&
      candidate.projectAndLivingCheckpointKey.length <= 200 &&
      uuidV4Pattern.test(candidate.projectAndLivingCheckpointKey));

  return hasValidKey && hasValidDraft && hasValidCheckpointKey;
}

export function createPlanHomeClientDraftAdapter(
  storage: StorageLike,
  key = PLAN_HOME_CLIENT_DRAFT_KEY,
) {
  function clear() {
    try {
      storage.removeItem(key);
    } catch {
      // Client persistence must not block the tour.
    }
  }

  function load() {
    try {
      const serialized = storage.getItem(key);
      if (!serialized) return null;

      const value: unknown = JSON.parse(serialized);
      if (!isClientDraftState(value)) {
        clear();
        return null;
      }
      return value;
    } catch {
      clear();
      return null;
    }
  }

  function save(value: PlanHomeClientDraftState) {
    if (!isClientDraftState(value)) return false;

    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  return { clear, load, save } as const;
}
