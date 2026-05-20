import Image from "next/image";
import type { ProjectImage } from "@/types/operations";

type ProjectGalleryProps = {
  images: ProjectImage[];
  title: string;
};

export function ProjectGallery({ images, title }: ProjectGalleryProps) {
  if (!images.length) {
    return (
      <div className="space-y-4">
        <div
          className="relative aspect-[16/9] overflow-hidden rounded-[var(--hh-radius-panel)] border border-line bg-white"
          role="img"
          aria-label={`${title} abstract gallery image`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(35,45,63,0.052)_0_1px,transparent_1px_38%),linear-gradient(90deg,rgba(17,17,15,0.032)_1px,transparent_1px),linear-gradient(180deg,rgba(17,17,15,0.026)_1px,transparent_1px)] bg-[length:100%_100%,1.25rem_1.25rem,1.25rem_1.25rem]" />
          <div className="absolute inset-x-8 bottom-8 top-10 border border-line" />
          <div className="absolute bottom-12 left-12 h-px w-1/2 bg-line-strong" />
          <div className="absolute bottom-16 left-12 h-px w-1/3 bg-line" />
        </div>
        <p className="max-w-2xl text-sm leading-7 text-muted">
          Gallery space is reserved for published project photography.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
      {images.map((image, index) => (
        <figure
          key={image.id}
          className="overflow-hidden rounded-[var(--hh-radius-panel)] border border-line bg-surface"
        >
          <div className="relative aspect-[4/3]">
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
