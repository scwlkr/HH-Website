import Link from "next/link";
import type { Route } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type ButtonOptions = NonNullable<Parameters<typeof buttonVariants>[0]>;

type ActionLinkProps = {
  href: string;
  label: string;
  variant?: ButtonOptions["variant"];
  size?: ButtonOptions["size"];
  className?: string;
};

export function ActionLink({
  href,
  label,
  variant,
  size,
  className,
}: ActionLinkProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (href.startsWith("/")) {
    return (
      <Link href={href as Route} className={classes}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={classes}>
      {label}
    </a>
  );
}
