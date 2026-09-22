"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HHQIcon } from "./hhq-icon";
import { hhqNavigation } from "@/lib/admin/navigation";

export function AdminShell({ children, userEmail, onSignOut }: {
  children: React.ReactNode;
  userEmail: string;
  onSignOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [panel, setPanel] = useState<"account" | "notifications" | null>(null);
  const menu = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLDialogElement>(null);
  const topbar = useRef<HTMLElement>(null);
  const accountName = userEmail.split("@")[0].replace(/[._-]/g, " ");
  const initials = accountName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.current?.showModal();
      }
      if (event.key === "Escape") setPanel(null);
    }
    function outside(event: PointerEvent) {
      if (!topbar.current?.contains(event.target as Node)) setPanel(null);
    }
    document.addEventListener("keydown", keyboard);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);

  function navigation() {
    return <>
      <Link href="/admin" className="hhq-wordmark" aria-label="HHQ home" onClick={() => { menu.current?.close(); setPanel(null); }}>HHQ<span className="hhq-brand-dot" /></Link>
      <nav aria-label="HHQ navigation" className="hhq-nav">
        {hhqNavigation.map((item) => <Link key={item.href} href={item.href as Route}
          aria-current={(item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href)) ? "page" : undefined}
          onClick={() => { menu.current?.close(); setPanel(null); }}><HHQIcon name={item.icon} /><span>{item.label}</span></Link>)}
      </nav>
      <div className="hhq-sidebar-bottom"><Link href={"/admin/help" as Route} onClick={() => { menu.current?.close(); setPanel(null); }}><HHQIcon name="help" />Help &amp; Support</Link><p>H and H workspace</p></div>
    </>;
  }

  return <div className="hhq-app">
    <a href="#hhq-content" className="hhq-skip">Skip to workspace</a>
    <aside className="hhq-sidebar">{navigation()}</aside>
    <dialog ref={menu} className="hhq-mobile-drawer" aria-label="Workspace navigation" onClick={(event) => { if (event.target === menu.current) menu.current.close(); }}>
      <button className="hhq-icon-button hhq-drawer-close" aria-label="Close navigation" onClick={() => { menu.current?.close(); setPanel(null); }}><HHQIcon name="close" /></button>
      {navigation()}
    </dialog>
    <div className="hhq-workspace">
      <header ref={topbar} className="hhq-topbar">
        <button className="hhq-icon-button hhq-menu-button" aria-label="Open navigation" onClick={() => menu.current?.showModal()}><HHQIcon name="menu" /></button>
        <button className="hhq-search-trigger" onClick={() => search.current?.showModal()}><HHQIcon name="search" /><span>Search projects, inquiries, or anything...</span><kbd>⌘ K</kbd></button>
        <div className="hhq-topbar-actions">
          <button className="hhq-icon-button" aria-label="Notifications" aria-expanded={panel === "notifications"} onClick={() => setPanel(panel === "notifications" ? null : "notifications")}><HHQIcon name="bell" /></button>
          <span className="hhq-topbar-divider" />
          <button className="hhq-account-trigger" aria-label="Your account" aria-expanded={panel === "account"} onClick={() => setPanel(panel === "account" ? null : "account")}>
            <span className="hhq-avatar">{initials}</span><span className="hhq-account-name"><strong>{accountName}</strong><small>HHQ staff</small></span><HHQIcon name="chevron" width="16" />
          </button>
        </div>
        {panel === "account" && <div className="hhq-popover"><p className="hhq-popover-title">Your workspace</p><p className="hhq-account-email">{userEmail}</p><Link href={"/admin/settings" as Route} onClick={() => setPanel(null)}><HHQIcon name="settings" />Settings</Link><Link href="/" target="_blank"><HHQIcon name="external" />View website</Link><form action={onSignOut}><button type="submit"><HHQIcon name="logout" />Sign Out</button></form></div>}
        {panel === "notifications" && <div className="hhq-popover"><p className="hhq-popover-title">Notifications <span className="hhq-badge neutral">Coming soon</span></p><p>Workspace alerts will live here once notifications are connected.</p><Link href="/admin/inquiries?status=submitted" onClick={() => setPanel(null)}><HHQIcon name="inbox" />View inquiries awaiting review</Link></div>}
      </header>
      <div id="hhq-content" tabIndex={-1} className="hhq-content">{children}</div>
      <footer className="hhq-footer"><span>HHQ <span className="hhq-footer-dot">·</span> H and H</span><span>A little more clarity. A lot more possibility.</span></footer>
    </div>
    <dialog ref={search} className="hhq-search-dialog" aria-labelledby="hhq-search-title" onClick={(event) => { if (event.target === search.current) search.current.close(); }}>
      <div className="hhq-dialog-heading"><h2 id="hhq-search-title">Search your workspace</h2><button className="hhq-icon-button" aria-label="Close search" onClick={() => search.current?.close()}><HHQIcon name="close" /></button></div>
      <form action="/admin/search" method="get" className="hhq-search-form" onSubmit={() => search.current?.close()}><HHQIcon name="search" /><input name="q" aria-label="Search projects and inquiries" placeholder="Project, inquiry, or location..." autoComplete="off" required maxLength={100} /><button className="hhq-button" type="submit">Search</button></form>
      <p className="hhq-eyebrow">Jump to</p><div className="hhq-search-links">{hhqNavigation.map((item) => <Link href={item.href as Route} key={item.href} onClick={() => search.current?.close()}><HHQIcon name={item.icon} />{item.label}<HHQIcon name="arrow" width="16" /></Link>)}</div>
    </dialog>
  </div>;
}
