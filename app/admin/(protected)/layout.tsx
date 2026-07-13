import { AdminShell } from "@/components/admin/admin-shell";
import { logoutAdminAction } from "@/app/admin/actions";
import { requireAdminUser } from "@/lib/firebase/auth";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticatedUser = await requireAdminUser();

  return (
    <AdminShell
      userEmail={authenticatedUser.email ?? "Unknown user"}
      onSignOut={logoutAdminAction}
    >
      {children}
    </AdminShell>
  );
}
