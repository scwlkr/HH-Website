import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { DividerFrame } from "@/components/ui/divider-frame";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils/cn";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  detail?: ReactNode;
  className?: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  detail,
  className,
}: PageIntroProps) {
  return (
    <section className={cn("pb-10 pt-2 sm:pb-12", className)}>
      <Container size="wide">
        <div className="hh-page-frame px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.65fr)] lg:gap-10">
            <div>
              <DividerFrame label={eyebrow} detail={siteConfig.shortName} />
              <h1 className="mt-7 max-w-4xl text-4xl sm:text-5xl lg:text-[4.25rem] lg:leading-[1.02]">
                {title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                {description}
              </p>
              {actions ? (
                <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
              ) : null}
            </div>
            <aside className="flex flex-col justify-between gap-6 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              {detail ?? (
                <p className="max-w-xs text-sm leading-7 text-muted">
                  Shared layout primitives are now established for the routes
                  that follow.
                </p>
              )}
            </aside>
          </div>
        </div>
      </Container>
    </section>
  );
}
