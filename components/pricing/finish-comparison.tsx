import type { FinishLevel } from "@/types/content";
import { ActionLink } from "@/components/marketing/action-link";
import { CardShell } from "@/components/ui/card-shell";
import { getFinishLevelHref } from "@/lib/content/finish-levels";

type FinishComparisonProps = {
  finishLevels: ReadonlyArray<FinishLevel>;
};

export function FinishComparison({ finishLevels }: FinishComparisonProps) {
  const comparisonLabels = finishLevels[0]?.comparisonPoints.map(
    (point) => point.label,
  );

  if (!comparisonLabels?.length) {
    return null;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {comparisonLabels.map((label) => (
        <CardShell key={label}>
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
            {label}
          </p>
          <div className="mt-5 space-y-4">
            {finishLevels.map((finish) => {
              const comparisonPoint = finish.comparisonPoints.find(
                (point) => point.label === label,
              );

              return (
                <div
                  key={finish.slug}
                  className="border-t border-line pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl">{finish.shortTitle}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {comparisonPoint?.value}
                      </p>
                    </div>
                    <ActionLink
                      href={getFinishLevelHref(finish.slug)}
                      label="Open"
                      variant="ghost"
                      size="sm"
                      className="self-start"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardShell>
      ))}
    </div>
  );
}
