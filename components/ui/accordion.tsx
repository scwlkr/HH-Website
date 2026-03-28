import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type AccordionItem = {
  id: string;
  title: string;
  content: ReactNode;
  defaultOpen?: boolean;
};

type AccordionProps = {
  items: AccordionItem[];
  className?: string;
};

export function Accordion({ items, className }: AccordionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const summaryId = `${item.id}-summary`;
        const panelId = `${item.id}-panel`;

        return (
          <details
            key={item.id}
            open={item.defaultOpen}
            className="hh-drafted-outline group rounded-[var(--hh-radius-input)] border border-line bg-surface-raised px-4 py-3"
          >
            <summary
              id={summaryId}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-[calc(var(--hh-radius-input)-0.25rem)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
            >
              <span className="text-left text-base font-medium leading-7">
                {item.title}
              </span>
              <span className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-accent transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div
              id={panelId}
              role="region"
              aria-labelledby={summaryId}
              className="pt-4 text-sm leading-7 text-muted"
            >
              {item.content}
            </div>
          </details>
        );
      })}
    </div>
  );
}
