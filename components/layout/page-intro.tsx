import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { DividerFrame } from "@/components/ui/divider-frame";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils/cn";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  lede?: string;
  description: string;
  actions?: ReactNode;
  detail?: ReactNode;
  className?: string;
};

export function PageIntro({
  eyebrow,
  title,
  lede,
  description,
  actions,
  detail,
  className,
}: PageIntroProps) {
  return (
    <section className={cn("hh-route-intro border-b border-line-strong", className)}>
      <Container size="wide">
        <div
          className={cn(
            "grid gap-10 py-12 sm:py-14 lg:py-16",
            detail
              ? "lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:gap-16"
              : "max-w-5xl",
          )}
        >
          <div>
            <DividerFrame label={eyebrow} detail={siteConfig.shortName} />
            <h1 className="mt-8 max-w-[15ch] text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
              {title}
            </h1>
            {lede ? (
              <p className="mt-6 max-w-2xl text-xl font-normal leading-[1.38] text-muted-strong sm:text-2xl">
                {lede}
              </p>
            ) : null}
            <p className={cn("max-w-2xl text-base leading-7 text-muted", lede ? "mt-5" : "mt-7")}>
              {description}
            </p>
            {actions ? (
              <div className="mt-9 flex flex-wrap gap-3">{actions}</div>
            ) : null}
          </div>

          {detail ? (
            <aside className="border-t border-line pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              {detail}
            </aside>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-4 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted">
          <span>Public Sheet</span>
          <span>{eyebrow}</span>
        </div>
      </Container>
    </section>
  );
}
