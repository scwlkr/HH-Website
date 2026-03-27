import type { HTMLAttributes, ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { DividerFrame } from "@/components/ui/divider-frame";
import { cn } from "@/lib/utils/cn";

type SectionProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  contentClassName?: string;
  size?: "narrow" | "content" | "wide";
};

export function Section({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  size = "wide",
  ...props
}: SectionProps) {
  return (
    <section className={cn("py-10 sm:py-12", className)} {...props}>
      <Container size={size}>
        {eyebrow || title || description || actions ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.4fr)] lg:gap-10">
            <div>
              {eyebrow ? <DividerFrame label={eyebrow} /> : null}
              {title ? (
                <h2 className="mt-5 max-w-4xl text-3xl sm:text-4xl">{title}</h2>
              ) : null}
              {description ? (
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap items-start gap-3 lg:justify-end">
                {actions}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className={cn(title || eyebrow || description ? "mt-8" : "", contentClassName)}>
          {children}
        </div>
      </Container>
    </section>
  );
}
