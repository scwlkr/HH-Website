import Image from "next/image";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils/cn";

type BrandAssetProps = {
  className?: string;
  decorative?: boolean;
  priority?: boolean;
  sizes?: string;
  tone?: "default" | "reversed";
};

const brandAssets = {
  mark: "/brand/logo/h-h_logo_mark-dark.svg",
  wordmark: "/brand/logo/h-h_logo_full_dark.svg",
} as const;

function getAltText(decorative: boolean) {
  return decorative ? "" : siteConfig.name;
}

export function BrandMark({
  className,
  decorative = false,
  priority = false,
  sizes = "48px",
  tone = "default",
}: BrandAssetProps) {
  return (
    <span
      className={cn("relative block overflow-hidden", className)}
      aria-hidden={decorative || undefined}
    >
      <Image
        src={brandAssets.mark}
        alt={getAltText(decorative)}
        fill
        priority={priority}
        sizes={sizes}
        unoptimized
        className={cn(
          "object-contain scale-[1.55]",
          tone === "reversed" ? "brightness-0 invert opacity-95" : null,
        )}
      />
    </span>
  );
}

export function BrandWordmark({
  className,
  decorative = false,
  priority = false,
  sizes = "(max-width: 640px) 11rem, 14rem",
  tone = "default",
}: BrandAssetProps) {
  return (
    <span
      className={cn("relative block overflow-hidden", className)}
      aria-hidden={decorative || undefined}
    >
      <Image
        src={brandAssets.wordmark}
        alt={getAltText(decorative)}
        fill
        priority={priority}
        sizes={sizes}
        unoptimized
        className={cn(
          "object-cover object-center",
          tone === "reversed" ? "brightness-0 invert opacity-95" : null,
        )}
      />
    </span>
  );
}
