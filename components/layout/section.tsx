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
  const hasHeader = Boolean(eyebrow || title || description || actions);

  return (
    <section
      className={cn("border-b border-line py-14 sm:py-16 lg:py-20", className)}
      {...props}
    >
      <Container size={size}>
        {hasHeader ? (
          <div className="grid gap-7 lg:grid-cols-[minmax(13rem,0.42fr)_minmax(0,1.58fr)] lg:gap-14">
            <div>
              {eyebrow ? <DividerFrame label={eyebrow} /> : null}
            </div>
            <div>
              {title ? <h2 className="max-w-4xl text-3xl sm:text-4xl">{title}</h2> : null}
              {description ? (
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
                  {description}
                </p>
              ) : null}
              {actions ? (
                <div className="mt-6 flex flex-wrap items-start gap-3">
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className={cn(hasHeader ? "mt-10 lg:mt-12" : "", contentClassName)}>
          {children}
        </div>
      </Container>
    </section>
  );
}
