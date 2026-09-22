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
    <div className={cn("border-y border-line", className)}>
      {items.map((item) => {
        const summaryId = `${item.id}-summary`;
        const panelId = `${item.id}-panel`;

        return (
          <details
            key={item.id}
            open={item.defaultOpen}
            className="group border-b border-line last:border-b-0"
          >
            <summary
              id={summaryId}
              aria-controls={panelId}
              className="flex min-h-16 cursor-pointer items-start justify-between gap-4 rounded-[var(--hh-radius-tight)] py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="text-left text-base font-medium leading-7 text-foreground">
                {item.title}
              </span>
              <span aria-hidden="true" className="shrink-0 font-mono text-2xl leading-7 text-accent">
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">−</span>
              </span>
            </summary>
            <div
              id={panelId}
              role="region"
              aria-labelledby={summaryId}
              className="whitespace-pre-line pb-5 text-base leading-7 text-muted"
            >
              {item.content}
            </div>
          </details>
        );
      })}
    </div>
  );
}
