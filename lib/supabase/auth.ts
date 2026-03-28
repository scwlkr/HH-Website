import "server-only";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { isAuthorizedAdminUser } from "@/lib/supabase/admin-access";
import { createSupabaseServerClient, isSupabaseAuthConfigured } from "@/lib/supabase/server";

export async function getAuthenticatedAdminUser() {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !isAuthorizedAdminUser(user)) {
    return null;
  }

  return user;
}

export async function requireAdminUser() {
  const authenticatedUser = await getAuthenticatedAdminUser();

  if (!authenticatedUser) {
    redirect("/admin/login" as Route);
  }

  return authenticatedUser;
}
