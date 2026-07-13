import Image from "next/image";
import { resolveContentImage } from "@/lib/content/resolve-content-image";
import type { ContentImage } from "@/types/content";
import { cn } from "@/lib/utils/cn";

type ContentImageCardProps = {
  image: ContentImage;
  className?: string;
  aspectClassName?: string;
  sizes?: string;
  priority?: boolean;
};

export function ContentImageCard({
  image,
  className,
  aspectClassName = "aspect-[16/11]",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: ContentImageCardProps) {
  const resolvedImage = resolveContentImage(image);

  return (
    <figure className={cn("border-t border-line-strong pt-4", className)}>
      <div
        className={cn(
          "hh-drafted-media relative overflow-hidden border border-line bg-surface-raised",
          aspectClassName,
        )}
      >
        <Image
          src={resolvedImage.src}
          alt={resolvedImage.alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
          unoptimized={resolvedImage.isPlaceholder}
        />
      </div>
      <div className="flex flex-col gap-3 border-b border-line py-4 sm:flex-row sm:items-start sm:justify-between">
        <figcaption className="max-w-2xl text-sm leading-7 text-muted">
          {image.caption ?? image.alt}
        </figcaption>
        {resolvedImage.isPlaceholder ? (
          <span className="shrink-0 font-mono text-[0.64rem] uppercase tracking-[0.2em] text-muted">
            Reference Study
          </span>
        ) : null}
      </div>
    </figure>
  );
}
