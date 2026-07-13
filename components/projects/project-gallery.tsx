import Image from "next/image";
import type { ProjectImage } from "@/types/operations";

type ProjectGalleryProps = {
  images: ProjectImage[];
  title: string;
};

export function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const publishedImages = images.filter((image) => Boolean(image.publicUrl));

  if (!publishedImages.length) {
    return null;
  }

  const [leadImage, ...supportingImages] = publishedImages;

  return (
    <div className="space-y-8">
      <figure className="border-y border-line-strong py-4">
        <div className="relative aspect-[16/9] overflow-hidden border border-line bg-surface">
          <Image
            src={leadImage.publicUrl}
            alt={leadImage.altText || `${title} image 1`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </figure>

      {supportingImages.length > 0 ? (
        <div className="grid gap-x-6 gap-y-8 md:grid-cols-2">
          {supportingImages.map((image, index) => (
            <figure
              key={image.id}
              className="border-y border-line-strong py-4"
            >
              <div className="relative aspect-[4/3] overflow-hidden border border-line bg-surface">
                <Image
                  src={image.publicUrl}
                  alt={image.altText || `${title} image ${index + 2}`}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}
