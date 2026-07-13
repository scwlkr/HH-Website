export const adminAppRole = "admin";

export function isAuthorizedAdminClaims(
  claims: unknown,
) {
  return (
    typeof claims === "object" &&
    claims !== null &&
    "role" in claims &&
    claims.role === adminAppRole
  );
}
