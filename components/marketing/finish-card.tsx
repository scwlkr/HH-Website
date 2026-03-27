import type { FinishLevel } from "@/types/content";
import {
  getFinishLevelHref,
  getFinishLevelInquiryHref,
} from "@/lib/content/finish-levels";
import { ActionLink } from "@/components/marketing/action-link";
import { CardShell } from "@/components/ui/card-shell";

type FinishCardProps = {
  finish: FinishLevel;
  variant?: "preview" | "detail";
  showInquiryAction?: boolean;
  directionalPriceLabel?: string | null;
};

export function FinishCard({
  finish,
  variant = "detail",
  showInquiryAction = false,
  directionalPriceLabel,
}: FinishCardProps) {
  const bulletLimit = variant === "preview" ? 2 : 3;

  return (
    <CardShell className="flex h-full flex-col">
      <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
        Finish Level
      </p>
      <div className="mt-4">
        <h3 className="text-2xl sm:text-[1.8rem]">{finish.title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted">{finish.tagline}</p>
      </div>
      {directionalPriceLabel ? (
        <div className="mt-5 rounded-[var(--hh-radius-tight)] border border-line-strong bg-white px-4 py-3">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-strong">
            Directional Benchmark
          </p>
          <p className="mt-2 text-sm text-foreground">{directionalPriceLabel}</p>
        </div>
      ) : null}
      <p className="mt-5 text-sm leading-7 text-muted">{finish.cardSummary}</p>
      <ul className="mt-6 space-y-3 text-sm leading-7 text-muted">
        {finish.differentiators.slice(0, bulletLimit).map((point) => (
          <li
            key={point}
            className="border-b border-line pb-3 last:border-b-0 last:pb-0"
          >
            {point}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <ActionLink
          href={getFinishLevelHref(finish.slug)}
          label="View Finish Details"
          variant="secondary"
        />
        {showInquiryAction ? (
          <ActionLink
            href={getFinishLevelInquiryHref(finish.slug)}
            label="Start With This Finish"
            variant="ghost"
          />
        ) : null}
      </div>
    </CardShell>
  );
}
