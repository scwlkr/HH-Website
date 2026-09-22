"use client";

import Link from "next/link";
import type { Route } from "next";
import { useId, useState } from "react";
import { HHQIcon, type HHQIconName } from "./hhq-icon";
import { filterOverview, recentActivity, type HHQOverview } from "@/lib/admin/overview-model";

export function HHQPageHeading({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="hhq-page-heading"><div>{eyebrow && <p className="hhq-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>{children}</div>;
}

export function PreviewBadge() { return <span className="hhq-badge neutral">Preview</span>; }

function CardHeading({ icon, title, href, label = "View all", children }: { icon: HHQIconName; title: string; href?: string; label?: string; children?: React.ReactNode }) {
  return <div className="hhq-card-heading"><HHQIcon name={icon} /><h2>{title}</h2>{children}{href && <Link href={href as Route} className="hhq-text-link">{label}<HHQIcon name="arrow" width="16" /></Link>}</div>;
}

export function TaskActivityChart() {
  const id = useId().replaceAll(":", "");
  const [period, setPeriod] = useState("weekly");
  const created = period === "weekly" ? [76, 69, 86, 101, 134, 116, 136, 122, 146] : [32, 55, 41, 72, 58, 84, 92];
  const completed = period === "weekly" ? [31, 30, 63, 48, 79, 59, 76, 63, 90] : [15, 29, 22, 46, 34, 60, 71];
  const points = (values: number[], width: number) => values.map((value, index) => `${48 + index * ((width - 88) / (values.length - 1))},${162 - value * .7}`).join(" ");
  const labels = period === "weekly" ? ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return <section className="hhq-card hhq-chart-card">
    <div className="hhq-chart-heading"><div><CardHeading icon="reports" title="Task Activity"><PreviewBadge /></CardHeading><p>Tasks created vs. completed over time.</p></div><div className="hhq-chart-controls"><span className="hhq-legend"><i />Created</span><span className="hhq-legend green"><i />Completed</span><select aria-label="Task chart interval" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="weekly">Weekly</option><option value="daily">Daily</option></select></div></div>
    {[1000, 400].map((width) => <svg key={width} className={`hhq-chart ${width === 1000 ? "wide" : "compact"}`} viewBox={`0 0 ${width} 200`} role="img" aria-label={`Illustrative ${period} task activity. Sample data; task tracking is not connected.`}>
      <defs><linearGradient id={`${id}-${width}-blue`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity=".12" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient><linearGradient id={`${id}-${width}-green`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".2" /><stop offset="100%" stopColor="#10b981" stopOpacity=".02" /></linearGradient></defs>
      {[0, 50, 100, 150, 200].map((value) => <g key={value}><line x1="48" y1={162 - value * .7} x2={width - 25} y2={162 - value * .7} stroke="#e9eef5" /><text x="31" y={166 - value * .7} textAnchor="end">{value}</text></g>)}
      {labels.map((label, index) => <g key={label}><line x1={48 + index * ((width - 88) / (labels.length - 1))} y1="22" x2={48 + index * ((width - 88) / (labels.length - 1))} y2="169" stroke="#f0f3f8" /><text x={48 + index * ((width - 88) / (labels.length - 1))} y="189" textAnchor="middle">{label}</text></g>)}
      {[{ values: created, color: "#3b82f6", gradient: "blue" }, { values: completed, color: "#10b981", gradient: "green" }].map(({ values, color, gradient }) => <g key={color}><polygon points={`48,162 ${points(values, width)} ${width - 40},162`} fill={`url(#${id}-${width}-${gradient})`} /><polyline points={points(values, width)} fill="none" stroke={color} strokeWidth="1.8" />{values.map((value, index) => <circle key={index} cx={48 + index * ((width - 88) / (values.length - 1))} cy={162 - value * .7} r="3.8" fill={color} stroke="white" strokeWidth="1.2"><title>{`${gradient === "blue" ? "Created" : "Completed"}: ${value} (sample)`}</title></circle>)}</g>)}
    </svg>)}
    <p className="hhq-chart-note">Sample data · Task tracking is coming soon</p>
  </section>;
}

export function SystemStatus({ data, expanded = false }: { data: HHQOverview; expanded?: boolean }) {
  const rows = [
    { name: "Core Application", status: "Available", tone: "green", detail: "Your HHQ workspace is available." },
    { name: "Staff Access", status: "Authorized", tone: "green", detail: "Your staff session passed the current access check." },
    { name: "Project Records", status: data.projectsAvailable ? "Connected" : "Unavailable", tone: data.projectsAvailable ? "green" : "amber", detail: "Status reflects the latest project read." },
    { name: "Inquiry Queue", status: data.inquiriesAvailable ? "Connected" : "Unavailable", tone: data.inquiriesAvailable ? "green" : "amber", detail: "Status reflects the latest inquiry read." },
    { name: "File Storage", status: "Not checked", tone: "slate", detail: "Uploads and private file access are available in projects and inquiries. Storage health is not monitored here." },
    { name: "Background Workers", status: "Not connected", tone: "slate", detail: "Automated task processing has not been connected." },
  ];
  return <section className="hhq-card hhq-system-card"><CardHeading icon="activity" title="System Status" href={expanded ? undefined : "/admin/systems"} label="View details" /><div className="hhq-system-list">{rows.map((row) => <div className="hhq-system-row" key={row.name}><span className={`hhq-status-dot ${row.tone}`} /><div><span>{row.name}</span>{expanded && <p>{row.detail}</p>}</div><span className={`hhq-status-label ${row.tone}`}>{row.status}</span></div>)}</div>{expanded && <p className="hhq-subtle">Checked on page load. This is connection information, not continuous uptime monitoring.</p>}</section>;
}

export function HHQDashboard({ data }: { data: HHQOverview }) {
  const [days, setDays] = useState(30);
  const filtered = filterOverview(data, days);
  const activities = recentActivity(filtered).slice(0, 5);
  const date = new Date(data.asOf);
  const dateLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" }).format(date);
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Chicago" }).format(date));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const cards: { title: string; value: number; icon: HHQIconName; tone: string; detail: string; href: string; available: boolean }[] = [
    { title: "Total Inquiries", value: filtered.inquiries.length, icon: "people", tone: "blue", detail: `${filtered.inquiries.filter((item) => item.status === "submitted").length} awaiting review`, href: "/admin/inquiries", available: data.inquiriesAvailable },
    { title: "Published Projects", value: filtered.projects.filter((item) => item.published).length, icon: "projects", tone: "green", detail: `${filtered.projects.filter((item) => !item.published).length} unpublished drafts`, href: "/admin/projects", available: data.projectsAvailable },
    { title: "Reviewed Inquiries", value: filtered.inquiries.filter((item) => item.status === "reviewed").length, icon: "check", tone: "amber", detail: "Ready for the next step", href: "/admin/inquiries?status=reviewed", available: data.inquiriesAvailable },
    { title: "Saved Drafts", value: filtered.inquiries.filter((item) => item.status === "draft").length, icon: "clock", tone: "purple", detail: "Plan Your Home in progress", href: "/admin/inquiries?status=draft", available: data.inquiriesAvailable },
  ];
  return <>
    <HHQPageHeading eyebrow={dateLabel} title={`${greeting}, team`} description="Here’s a quick overview of what’s happening in HHQ."><label className="hhq-date-filter"><HHQIcon name="calendar" width="19" /><select aria-label="Dashboard date range" value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={0}>All time</option></select></label></HHQPageHeading>
    {(!data.projectsAvailable || !data.inquiriesAvailable) && <div className="hhq-alert" role="alert">Some workspace data couldn’t be loaded. <button className="underline" onClick={() => window.location.reload()}>Refresh to try again</button>.</div>}
    <div className="hhq-stats">{cards.map((card) => <Link key={card.title} href={card.href as Route} className="hhq-card hhq-stat"><span className={`hhq-stat-icon ${card.tone}`}><HHQIcon name={card.icon} width="27" height="27" /></span><div><p>{card.title}</p><strong>{card.available ? card.value.toLocaleString("en-US") : "—"}</strong><span className={card.available ? "hhq-stat-detail" : "hhq-subtle"}>{card.available ? card.detail : "Data unavailable"}</span><small>{days ? "Updated in this period" : "Across your workspace"}</small></div><HHQIcon name="arrow" className="hhq-stat-arrow" width="15" /></Link>)}</div>
    <div className="hhq-dashboard-grid">
      <TaskActivityChart />
      <section className="hhq-card hhq-activity-card"><CardHeading icon="bolt" title="Recent Activity" href="/admin/activity" /><div className="hhq-activity-list">{activities.length ? activities.map((item) => <Link key={item.id} href={item.href as Route} className="hhq-activity-item"><span className={`hhq-avatar small ${item.kind === "project" ? "mint" : ""}`}><HHQIcon name={item.kind === "project" ? "projects" : "inbox"} width="17" /></span><div><strong>{item.name}</strong><p>{item.description}</p></div><time dateTime={item.date}>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }).format(new Date(item.date))}</time></Link>) : <div className="hhq-empty"><HHQIcon name="bolt" /><h3>A fresh start</h3><p>Your project and inquiry updates will appear here.</p><Link className="hhq-text-link" href="/admin/inquiries">Open inquiries <HHQIcon name="arrow" width="16" /></Link></div>}</div></section>
      <section className="hhq-card hhq-project-card"><CardHeading icon="projects" title="Projects" href="/admin/projects" />{filtered.projects.length ? <div className="hhq-table-scroll"><table className="hhq-table"><thead><tr><th>Name</th><th>Location</th><th>Publication</th><th>Sales status</th><th>Updated</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{filtered.projects.slice(0, 5).map((project) => <tr key={project.id}><td><Link href={`/admin/projects/${project.id}` as Route}>{project.title}</Link></td><td>{project.location || "—"}</td><td><span className={`hhq-badge ${project.published ? "green" : "neutral"}`}>{project.published ? "Published" : "Draft"}</span></td><td><span className={`hhq-badge ${project.status === "sold" ? "blue" : "amber"}`}>{project.status === "sold" ? "Sold" : "For sale"}</span></td><td>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }).format(new Date(project.updatedAt))}</td><td><Link className="hhq-icon-button" href={`/admin/projects/${project.id}` as Route} aria-label={`Edit ${project.title}`}><HHQIcon name="arrow" width="16" /></Link></td></tr>)}</tbody></table></div> : <div className="hhq-empty"><span className="hhq-stat-icon green"><HHQIcon name="projects" /></span><h3>{data.projectsAvailable ? "Room for your next project" : "Projects are temporarily unavailable"}</h3><p>{data.projectsAvailable ? "Add a completed home, or choose a wider date range." : "Refresh the page to try loading your projects again."}</p><Link className="hhq-button" href="/admin/projects/new"><HHQIcon name="plus" width="16" />Add project</Link></div>}</section>
      <SystemStatus data={data} />
    </div>
    <p className="hhq-dashboard-note"><span className="hhq-status-dot green" />Workspace totals use real records. Preview panels show sample data.</p>
  </>;
}
