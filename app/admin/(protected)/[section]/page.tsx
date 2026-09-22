import { notFound } from "next/navigation";
import { HHQHelp, HHQIntegrations, HHQPeople, HHQReports, HHQSettings, HHQSystems, HHQTasks } from "@/components/admin/hhq-workspace-pages";
import { requireAdminUser } from "@/lib/admin/auth";
import { usesWorkOSAuth } from "@/lib/admin/auth-config";
import { getHHQOverview } from "@/lib/admin/overview";
import { createPageMetadata } from "@/lib/metadata";

const titles: Record<string, string> = { tasks: "Tasks", people: "People", systems: "Systems", reports: "Reports", integrations: "Integrations", settings: "Settings", help: "Help & Support" };

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return createPageMetadata({ title: `HHQ ${titles[section] ?? "Workspace"}`, description: "The H and H staff workspace.", path: `/admin/${section}`, noIndex: true });
}

export default async function WorkspaceSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const user = await requireAdminUser();
  switch (section) {
    case "tasks": return <HHQTasks />;
    case "people": return <HHQPeople email={user.email ?? "Staff account"} />;
    case "systems": return <HHQSystems data={await getHHQOverview()} />;
    case "reports": return <HHQReports data={await getHHQOverview()} />;
    case "integrations": return <HHQIntegrations data={await getHHQOverview()} authProvider={usesWorkOSAuth() ? "WorkOS AuthKit" : "Firebase Authentication"} />;
    case "settings": return <HHQSettings />;
    case "help": return <HHQHelp />;
    default: notFound();
  }
}
