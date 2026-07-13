import type { ContentImage } from "@/types/content";
import { ContentImageCard } from "@/components/marketing/content-image-card";

type ContentImageGridProps = {
  images: ContentImage[];
};

export function ContentImageGrid({ images }: ContentImageGridProps) {
  const [leadImage, ...supportingImages] = images;

  if (!leadImage) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <ContentImageCard
        image={leadImage}
        priority
        aspectClassName="aspect-[16/10]"
        sizes="(min-width: 1024px) 66vw, 100vw"
      />
      {supportingImages.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          {supportingImages.map((image, index) => (
            <ContentImageCard
              key={`${image.src}-${index}`}
              image={image}
              aspectClassName="aspect-[16/10]"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
