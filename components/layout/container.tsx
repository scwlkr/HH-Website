import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: "narrow" | "content" | "wide";
};

const sizeClasses = {
  narrow: "max-w-[var(--hh-container-narrow)]",
  content: "max-w-[var(--hh-container-content)]",
  wide: "max-w-[var(--hh-container-max)]",
} as const;

export function Container({
  className,
  size = "wide",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-10",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
