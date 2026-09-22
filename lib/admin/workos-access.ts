import type { WorkOS } from "@workos-inc/node";
import { hhqStaffRole } from "./auth-config";
import { adminSessionDurationSeconds } from "../firebase/admin-session-policy";

type Identity = {
  user: { id: string; emailVerified: boolean } | null;
  organizationId?: string;
  sessionId?: string;
  impersonator?: unknown;
};

export async function hasCurrentHHQAccess(
  identity: Identity,
  organizationId: string | undefined,
  users: Pick<WorkOS["userManagement"], "listOrganizationMemberships" | "listSessions">,
  now = Date.now(),
) {
  if (!organizationId || !identity.user?.emailVerified ||
      identity.organizationId !== organizationId || !identity.sessionId ||
      identity.impersonator) return false;

  try {
    // Query current authority on every request, including after token revocation.
    const [memberships, sessionList] = await Promise.all([
      users.listOrganizationMemberships({
        userId: identity.user.id, organizationId, statuses: ["active"],
      }),
      users.listSessions(identity.user.id),
    ]);
    const approved = memberships.data.some((membership) =>
      membership.userId === identity.user!.id &&
      membership.organizationId === organizationId &&
      membership.status === "active" &&
      (membership.role.slug === hhqStaffRole ||
        membership.roles?.some((role) => role.slug === hhqStaffRole)),
    );
    if (!approved) return false;
    const sessions = await sessionList.autoPagination();
    return sessions.some((session) =>
      session.id === identity.sessionId &&
      session.userId === identity.user!.id &&
      session.organizationId === organizationId &&
      session.status === "active" && !session.impersonator &&
      Date.parse(session.expiresAt) > now &&
      Date.parse(session.createdAt) <= now &&
      now - Date.parse(session.createdAt) < adminSessionDurationSeconds * 1000,
    );
  } catch {
    return false;
  }
}
