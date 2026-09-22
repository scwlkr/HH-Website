import { HHQDashboard } from "@/components/admin/hhq-dashboard";
import { getHHQOverview } from "@/lib/admin/overview";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "HHQ Dashboard", description: "Your H and H workspace at a glance.", path: "/admin", noIndex: true });

export default async function AdminIndexPage() {
  return <HHQDashboard data={await getHHQOverview()} />;
}
