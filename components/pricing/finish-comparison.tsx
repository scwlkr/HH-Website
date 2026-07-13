import type { FinishLevel } from "@/types/content";
import { ActionLink } from "@/components/marketing/action-link";
import { getFinishLevelHref } from "@/lib/content/finish-levels";

type FinishComparisonProps = {
  finishLevels: ReadonlyArray<FinishLevel>;
  pricingLabels?: Partial<Record<FinishLevel["slug"], string>>;
};

export function FinishComparison({
  finishLevels,
  pricingLabels,
}: FinishComparisonProps) {
  const comparisonLabels = finishLevels[0]?.comparisonPoints.map(
    (point) => point.label,
  );

  if (!comparisonLabels?.length) {
    return null;
  }

  return (
    <div className="border-y border-line-strong">
      <div className="divide-y divide-line lg:hidden">
        {finishLevels.map((finish) => (
          <article key={finish.slug} className="py-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-accent">
                  Finish Level
                </p>
                <h3 className="mt-3 text-2xl">{finish.shortTitle}</h3>
                {pricingLabels?.[finish.slug] ? (
                  <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-strong">
                    {pricingLabels[finish.slug]}
                  </p>
                ) : null}
              </div>
              <ActionLink
                href={getFinishLevelHref(finish.slug)}
                label="Open"
                variant="ghost"
                size="sm"
              />
            </div>
            <dl className="mt-6 divide-y divide-line border-t border-line">
              {comparisonLabels.map((label) => {
                const comparisonPoint = finish.comparisonPoints.find(
                  (point) => point.label === label,
                );

                return (
                  <div key={label} className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                    <dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-strong">
                      {label}
                    </dt>
                    <dd className="text-sm leading-7 text-muted">
                      {comparisonPoint?.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden lg:block">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[16%]" />
            {finishLevels.map((finish) => (
              <col key={finish.slug} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                scope="col"
                className="border-b border-line p-5 align-top font-mono text-[0.68rem] font-normal uppercase tracking-[0.2em] text-muted"
              >
                Compare By
              </th>
              {finishLevels.map((finish) => (
                <th
                  key={finish.slug}
                  scope="col"
                  className="border-b border-l border-line p-5 align-top font-normal"
                >
                  <span className="block text-xl">{finish.shortTitle}</span>
                  {pricingLabels?.[finish.slug] ? (
                    <span className="mt-2 block font-mono text-[0.66rem] uppercase tracking-[0.12em] text-accent">
                      {pricingLabels[finish.slug]}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonLabels.map((label) => (
              <tr key={label}>
                <th
                  scope="row"
                  className="border-b border-line p-5 align-top font-mono text-[0.68rem] font-normal uppercase tracking-[0.14em] text-muted-strong"
                >
                  {label}
                </th>
                {finishLevels.map((finish) => {
                  const comparisonPoint = finish.comparisonPoints.find(
                    (point) => point.label === label,
                  );

                  return (
                    <td
                      key={finish.slug}
                      className="border-b border-l border-line p-5 align-top text-sm leading-7 text-muted"
                    >
                      {comparisonPoint?.value}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th
                scope="row"
                className="p-5 align-middle font-mono text-[0.68rem] font-normal uppercase tracking-[0.14em] text-muted"
              >
                Explore
              </th>
              {finishLevels.map((finish) => (
                <td key={finish.slug} className="border-l border-line p-5">
                  <ActionLink
                    href={getFinishLevelHref(finish.slug)}
                    label="View Detail"
                    variant="ghost"
                    size="sm"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
