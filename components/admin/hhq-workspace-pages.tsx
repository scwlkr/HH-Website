"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRef, useState } from "react";
import { HHQIcon, type HHQIconName } from "./hhq-icon";
import { HHQPageHeading, PreviewBadge, SystemStatus, TaskActivityChart } from "./hhq-dashboard";
import type { HHQOverview } from "@/lib/admin/overview-model";

export function PreviewNotice({ children }: { children: React.ReactNode }) {
  return <div className="hhq-preview-banner"><HHQIcon name="clock" width="19" /><p><strong>A look at what’s next.</strong> {children}</p><PreviewBadge /></div>;
}

const sampleTasks = [
  { title: "Review the new project brief", category: "Planning", status: "To do", description: "Gather the project details and prepare the first conversation.", progress: 0 },
  { title: "Select project photography", category: "Content", status: "To do", description: "Choose the images that tell the story of a completed home.", progress: 0 },
  { title: "Prepare the design review", category: "Design", status: "In progress", description: "Bring plans, finish selections, and open questions together.", progress: 65 },
  { title: "Update the project gallery", category: "Content", status: "In progress", description: "Arrange project images and add helpful descriptions.", progress: 40 },
  { title: "Publish a completed home", category: "Projects", status: "Completed", description: "Review the final details and make the project available on the website.", progress: 100 },
];

export function HHQTasks() {
  const [filter, setFilter] = useState("All tasks");
  const [selected, setSelected] = useState<(typeof sampleTasks)[number] | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const statuses = ["To do", "In progress", "Completed"];
  return <>
    <HHQPageHeading title="Tasks" description="A clear view of what’s next, what’s moving, and what’s done."><span className="hhq-badge neutral">Task tracking · Coming soon</span></HHQPageHeading>
    <PreviewNotice>This board uses sample tasks. Assignments, due dates, and saved updates will follow when task tracking is connected.</PreviewNotice>
    <div className="hhq-task-toolbar" aria-label="Filter sample tasks">{["All tasks", ...statuses].map((status) => <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)}>{status}</button>)}</div>
    <div className="hhq-section-grid">{statuses.filter((status) => filter === "All tasks" || filter === status).map((status) => <section key={status} className="hhq-task-column"><h2>{status}<span>{sampleTasks.filter((task) => task.status === status).length}</span></h2>{sampleTasks.filter((task) => task.status === status).map((task) => <button key={task.title} className="hhq-card hhq-task-item" onClick={() => { setSelected(task); dialog.current?.showModal(); }}><span className={`hhq-badge ${status === "Completed" ? "green" : status === "In progress" ? "blue" : "amber"}`}>{task.category}</span><h3>{task.title}</h3><p>{task.description}</p>{task.progress > 0 && <div className="hhq-progress" aria-label={`${task.progress}% sample progress`}><span style={{ width: `${task.progress}%` }} /></div>}<div className="hhq-task-meta"><span className="hhq-avatar small">HH</span><span>Sample task <span aria-hidden="true">↗</span></span></div></button>)}</section>)}</div>
    <dialog ref={dialog} className="hhq-search-dialog" aria-labelledby="sample-task-title"><div className="hhq-dialog-heading"><PreviewBadge /><button className="hhq-icon-button" aria-label="Close task" onClick={() => dialog.current?.close()}><HHQIcon name="close" /></button></div><h2 id="sample-task-title">{selected?.title}</h2><p className="hhq-subtle" style={{ margin: "16px 0" }}>{selected?.description}</p><div className="hhq-preview-banner">This is a sample task. Task changes and assignments are not saved yet.</div><button className="hhq-button secondary" onClick={() => dialog.current?.close()}>Back to board</button></dialog>
  </>;
}

export function HHQPeople({ email }: { email: string }) {
  return <><HHQPageHeading title="People" description="The people behind every project." /><PreviewNotice>Your current account is connected. A shared team directory and invitations are coming soon.</PreviewNotice><div className="hhq-section-grid"><section className="hhq-card hhq-feature-card hhq-people-card"><span className="hhq-avatar">{email[0]?.toUpperCase()}</span><h2>Your account</h2><p>{email}</p><span className="hhq-badge green">HHQ staff · Signed in</span><p style={{ marginTop: 16 }}>Full access to inquiries, projects, and pricing.</p></section><section className="hhq-card hhq-feature-card hhq-people-card"><span className="hhq-avatar mint"><HHQIcon name="people" width="28" height="28" /></span><h2>Your team, together</h2><p>A home for staff profiles, assignments, and shared project ownership.</p><span className="hhq-badge neutral">Directory coming soon</span><p style={{ marginTop: 16 }}>Ask your workspace owner to arrange staff access.</p></section></div></>;
}

export function HHQReports({ data }: { data: HHQOverview }) {
  const rows = [{ key: "submitted", label: "Awaiting review", tone: "blue" }, { key: "reviewed", label: "Reviewed", tone: "green" }, { key: "draft", label: "Saved drafts", tone: "amber" }, { key: "spam", label: "Spam", tone: "neutral" }];
  return <><HHQPageHeading title="Reports" description="See where things stand, and where to focus next." /><div className="hhq-section-stack"><section className="hhq-card hhq-feature-card"><div className="hhq-feature-top"><h2 style={{ margin: 0 }}>Inquiry overview</h2><span className={`hhq-badge ${data.inquiriesAvailable ? "green" : "amber"}`}>{data.inquiriesAvailable ? "Live records · All time" : "Unavailable"}</span></div>{data.inquiriesAvailable ? <div className="hhq-report-rows">{rows.map((row) => { const count = data.inquiries.filter((item) => item.status === row.key).length; return <Link key={row.key} href={`/admin/inquiries?status=${row.key}` as Route} className="hhq-report-row"><span>{row.label}</span><div className="hhq-progress"><span style={{ width: `${data.inquiries.length ? count / data.inquiries.length * 100 : 0}%` }} /></div><strong>{count}</strong><HHQIcon name="arrow" width="16" /></Link>; })}</div> : <p role="alert">Inquiry data couldn’t be loaded. Refresh to try again.</p>}</section><TaskActivityChart /><PreviewNotice>Scheduled reports, exports, and task performance will be available when reporting is connected.</PreviewNotice></div></>;
}

export function HHQIntegrations({ data, authProvider }: { data: HHQOverview; authProvider: string }) {
  const cards: { title: string; icon: HHQIconName; description: string; status: string; connected: boolean; href?: string }[] = [
    { title: "Website content", icon: "projects", description: "Manage project details, photography, and publication from one place.", status: data.projectsAvailable ? "Connected" : "Unavailable", connected: data.projectsAvailable, href: "/admin/projects" },
    { title: "Project inquiries", icon: "inbox", description: "Bring general inquiries and Plan Your Home briefs into your workspace.", status: data.inquiriesAvailable ? "Connected" : "Unavailable", connected: data.inquiriesAvailable, href: "/admin/inquiries" },
    { title: "Staff sign-in", icon: "people", description: `${authProvider} provides your current staff sign-in. Access remains limited to authorized staff.`, status: "In use", connected: true, href: "/admin/people" },
    { title: "Email notifications", icon: "bell", description: "Keep up with new inquiries, assignments, and important project updates.", status: "Coming soon", connected: false },
    { title: "Team calendar", icon: "calendar", description: "Bring project milestones, reviews, and site visits into a shared calendar.", status: "Coming soon", connected: false },
    { title: "Task automation", icon: "bolt", description: "Connect recurring work and project follow-ups to the rest of your tools.", status: "Coming soon", connected: false },
  ];
  return <><HHQPageHeading title="Integrations" description="Your tools, working together." /><div className="hhq-section-grid">{cards.map((card) => <section key={card.title} className="hhq-card hhq-feature-card"><div className="hhq-feature-top"><span className={`hhq-stat-icon ${card.connected ? "green" : "blue"}`}><HHQIcon name={card.icon} /></span><span className={`hhq-badge ${card.connected ? "green" : "neutral"}`}>{card.status}</span></div><h2>{card.title}</h2><p>{card.description}</p>{card.href && <Link href={card.href as Route} className="hhq-text-link">Open {card.title.toLowerCase()}<HHQIcon name="arrow" width="16" /></Link>}</section>)}</div></>;
}

export function HHQSettings() {
  return <><HHQPageHeading title="Settings" description="A few good foundations for your workspace." /><div className="hhq-section-grid"><section className="hhq-card hhq-feature-card"><span className="hhq-stat-icon green"><HHQIcon name="settings" /></span><h2>Website pricing</h2><p>Update the square-foot benchmarks and pricing note used on the website.</p><Link className="hhq-text-link" href="/admin/settings/pricing">Manage pricing<HHQIcon name="arrow" width="16" /></Link></section><section className="hhq-card hhq-feature-card"><span className="hhq-stat-icon blue"><HHQIcon name="people" /></span><h2>Staff access</h2><p>View your signed-in account. Staff members share the same workspace access.</p><Link className="hhq-text-link" href={"/admin/people" as Route}>Your account<HHQIcon name="arrow" width="16" /></Link></section><section className="hhq-card hhq-feature-card"><span className="hhq-stat-icon purple"><HHQIcon name="bell" /></span><h2>Notification preferences</h2><p>Choose the updates you want to receive when workspace alerts are connected.</p><span className="hhq-badge neutral">Coming soon</span></section></div></>;
}

export function HHQHelp() {
  const items = [
    ["How do I review a new inquiry?", "Open Inquiries, choose Submitted in the status filter, and select an inquiry. You can read the brief and attachments, mark it reviewed, or mark it as spam."],
    ["How do I publish a project?", "Open Projects and add or edit a completed home. Review its details and images, select the publication option, and save. Draft projects stay private."],
    ["Where can I update website pricing?", "Open Settings, then Manage pricing. Changes to the shared pricing benchmarks appear on the public website after saving."],
    ["How does another staff member get access?", "Ask the H and H workspace owner to arrange access. Every authorized staff member has the same HHQ access. The People screen is not a complete staff directory yet."],
    ["What does Preview mean?", "Preview panels show sample content for features still being built. Sample tasks and charts are not company activity. Live project and inquiry records are available in their own sections."],
  ];
  return <><HHQPageHeading title="Help & Support" description="A little guidance for your day-to-day work." /><section className="hhq-card hhq-feature-card hhq-help-list">{items.map(([title, description]) => <details key={title}><summary>{title}<HHQIcon name="chevron" width="17" /></summary><p>{description}</p></details>)}</section><p className="hhq-subtle" style={{ marginTop: 20 }}>Need a hand? Contact your H and H workspace owner.</p></>;
}

export function HHQSystems({ data }: { data: HHQOverview }) {
  return <><HHQPageHeading title="Systems" description="A clear view of your workspace connections." /><div className="hhq-section-stack"><SystemStatus data={data} expanded /><PreviewNotice>Continuous monitoring, incident history, and service alerts are coming soon.</PreviewNotice></div></>;
}
