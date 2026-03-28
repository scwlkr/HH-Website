import Image from "next/image";
import type { ProjectImage } from "@/types/operations";

type ProjectGalleryProps = {
  images: ProjectImage[];
  title: string;
};

export function ProjectGallery({ images, title }: ProjectGalleryProps) {
  if (!images.length) {
    return (
      <div className="hh-drafted-outline rounded-[var(--hh-radius-panel)] border border-line bg-surface-raised px-6 py-12 text-center text-sm text-muted">
        Project imagery will appear here after uploads are added.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {images.map((image, index) => (
        <figure
          key={image.id}
          className="hh-drafted-outline overflow-hidden rounded-[var(--hh-radius-panel)] border border-line bg-surface-raised"
        >
          <div className="hh-drafted-media relative aspect-[4/3]">
            <Image
              src={image.publicUrl}
              alt={image.altText || `${title} image ${index + 1}`}
              fill
              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="border-t border-line px-4 py-3 text-sm text-muted">
            {image.altText || `${title} image ${index + 1}`}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
