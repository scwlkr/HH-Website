import type { ContentImage, ContentImageCollection } from "@/types/content";

type CreateContentImageOptions = {
  collection: ContentImageCollection;
  slug: string;
  fileName: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
};

export const contentImageConventions = {
  root: "/images",
  finishLevels: "/images/finishes/[finish-slug]/[asset-name].jpg",
  buildTypes: "/images/build-types/[build-type-slug]/[asset-name].jpg",
} as const;

export function getContentImagePath(
  collection: ContentImageCollection,
  slug: string,
  fileName: string,
) {
  return `${contentImageConventions.root}/${collection}/${slug}/${fileName}`;
}

export function createContentImage({
  collection,
  slug,
  fileName,
  alt,
  width,
  height,
  caption,
}: CreateContentImageOptions): ContentImage {
  return {
    src: getContentImagePath(collection, slug, fileName),
    alt,
    width,
    height,
    caption,
  };
}
