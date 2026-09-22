import Link from "next/link";
import type { Route } from "next";
import { HHQIcon } from "@/components/admin/hhq-icon";
import { HHQPageHeading } from "@/components/admin/hhq-dashboard";
import { getHHQOverview } from "@/lib/admin/overview";
import { searchOverview } from "@/lib/admin/overview-model";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({ title: "HHQ Search", description: "Find projects and inquiries.", path: "/admin/search", noIndex: true });

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q ?? "").trim().slice(0, 100);
  const data = await getHHQOverview();
  const results = searchOverview(data, query);
  const count = results.projects.length + results.inquiries.length;
  return <><HHQPageHeading title="Search" description="Find a project or inquiry by name or location." /><form action="/admin/search" className="hhq-search-form"><HHQIcon name="search" /><input name="q" defaultValue={query} aria-label="Search projects and inquiries" placeholder="Project, inquiry, or location..." maxLength={100} required /><button className="hhq-button">Search</button></form>{(!data.projectsAvailable || !data.inquiriesAvailable) && <div className="hhq-alert" role="alert">Some records couldn’t be loaded. Results may be incomplete.</div>}<p className="hhq-subtle" style={{ marginBottom: 16 }}>{query ? `${count} ${count === 1 ? "result" : "results"} for “${query}”` : "Enter a name or location to get started."}</p><div className="hhq-results">{results.projects.map((item) => <Link href={`/admin/projects/${item.id}` as Route} className="hhq-card hhq-result" key={item.id}><HHQIcon name="projects" /><div><strong>{item.title}</strong><p>Project · {item.location} · {item.published ? "Published" : "Draft"}</p></div><HHQIcon name="arrow" /></Link>)}{results.inquiries.map((item) => <Link href={`/admin/inquiries/${encodeURIComponent(item.id)}` as Route} className="hhq-card hhq-result" key={item.id}><HHQIcon name="inbox" /><div><strong>{item.name}</strong><p>Inquiry · {item.location ?? "No location"} · {item.status}</p></div><HHQIcon name="arrow" /></Link>)}</div>{query && !count && data.projectsAvailable && data.inquiriesAvailable && <div className="hhq-empty hhq-card"><HHQIcon name="search" /><h2>No matching records</h2><p>Try a different name or location.</p></div>}</>;
}
