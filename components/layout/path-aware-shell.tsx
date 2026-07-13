"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type PathAwareShellProps = {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
};

export function PathAwareShell({
  children,
  header,
  footer,
}: PathAwareShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute ? (
        <a
          href="#main-content"
          className="absolute left-4 top-4 z-[60] -translate-y-24 rounded-[var(--hh-radius-pill)] border border-line-strong bg-white px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-foreground shadow-[0_14px_20px_-24px_rgba(17,17,15,0.45)] transition-transform focus:translate-y-0 focus-visible:translate-y-0"
        >
          Skip to content
        </a>
      ) : null}
      <div className="flex min-h-screen flex-col">
        {!isAdminRoute ? header : null}
        <main
          id="main-content"
          className={
            isAdminRoute
              ? "flex-1 focus:outline-none"
              : "flex-1 focus:outline-none"
          }
          tabIndex={-1}
        >
          {children}
        </main>
        {!isAdminRoute ? footer : null}
      </div>
    </>
  );
}
