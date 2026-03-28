import type { User } from "@supabase/supabase-js";

export const adminAppRole = "admin";

export function isAuthorizedAdminUser(user: User | null | undefined) {
  return user?.app_metadata?.role === adminAppRole;
}
