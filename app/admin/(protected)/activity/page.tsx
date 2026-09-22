import Link from "next/link";
import type { Route } from "next";
import { HHQIcon } from "@/components/admin/hhq-icon";
import { HHQPageHeading } from "@/components/admin/hhq-dashboard";
import { getHHQOverview } from "@/lib/admin/overview";
import { recentActivity } from "@/lib/admin/overview-model";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "HHQ Activity", description: "Recent project and inquiry updates.", path: "/admin/activity", noIndex: true });

export default async function ActivityPage() {
  const data = await getHHQOverview();
  const activity = recentActivity(data);
  return <><HHQPageHeading title="Recent Activity" description="The latest update to each project and inquiry. All time." />{(!data.projectsAvailable || !data.inquiriesAvailable) && <div className="hhq-alert" role="alert">Some records couldn’t be loaded. Activity may be incomplete.</div>}<div className="hhq-results">{activity.map((item) => <Link href={item.href as Route} className="hhq-card hhq-result" key={item.id}><span className="hhq-avatar small"><HHQIcon name={item.kind === "project" ? "projects" : "inbox"} width="17" /></span><div><strong>{item.name}</strong><p>{item.description} · {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date(item.date))}</p></div><HHQIcon name="arrow" width="18" /></Link>)}</div>{!activity.length && <div className="hhq-empty hhq-card"><HHQIcon name="bolt" /><h2>No updates yet</h2><p>Saved projects and inquiries will appear here.</p></div>}</>;
}
