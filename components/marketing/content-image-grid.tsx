import type { ContentImage } from "@/types/content";
import { ContentImageCard } from "@/components/marketing/content-image-card";

type ContentImageGridProps = {
  images: ContentImage[];
};

export function ContentImageGrid({ images }: ContentImageGridProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {images.map((image, index) => (
        <ContentImageCard
          key={`${image.src}-${index}`}
          image={image}
          priority={index === 0}
          className={index === 0 ? "lg:col-span-2" : undefined}
          aspectClassName={index === 0 ? "aspect-[16/10]" : "aspect-[16/11]"}
          sizes={
            index === 0
              ? "(min-width: 1024px) 66vw, 100vw"
              : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          }
        />
      ))}
    </div>
  );
}
