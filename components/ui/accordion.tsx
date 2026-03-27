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
      {items.map((item) => (
        <details
          key={item.id}
          open={item.defaultOpen}
          className="group rounded-[var(--hh-radius-input)] border border-line bg-surface-raised px-4 py-3"
        >
          <summary className="flex cursor-pointer items-start justify-between gap-4">
            <span className="text-left text-base font-medium leading-7">
              {item.title}
            </span>
            <span className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-accent transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="pt-4 text-sm leading-7 text-muted">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
