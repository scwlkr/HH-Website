import Link from "next/link";
import type { Route } from "next";
import { buttonVariants } from "@/components/ui/button";
import { getCtaAnalyticsAttributes } from "@/lib/analytics/events";
import { cn } from "@/lib/utils/cn";

type ButtonOptions = NonNullable<Parameters<typeof buttonVariants>[0]>;

type ActionLinkProps = {
  href: string;
  label: string;
  variant?: ButtonOptions["variant"];
  size?: ButtonOptions["size"];
  className?: string;
  track?: boolean;
  trackingLocation?: string;
  trackingContext?: string;
};

export function ActionLink({
  href,
  label,
  variant,
  size,
  className,
  track = true,
  trackingLocation,
  trackingContext,
}: ActionLinkProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  const analyticsAttributes = track
    ? getCtaAnalyticsAttributes({
        label,
        destination: href,
        location: trackingLocation,
        context: trackingContext,
      })
    : {};

  if (href.startsWith("/")) {
    return (
      <Link
        href={href as Route}
        className={classes}
        {...analyticsAttributes}
      >
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={classes} {...analyticsAttributes}>
      {label}
    </a>
  );
}
