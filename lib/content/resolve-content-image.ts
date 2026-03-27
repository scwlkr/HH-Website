import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { ContentImage } from "@/types/content";

const fallbackImageByCollection = {
  finishes: "/images/brand/finish-placeholder.svg",
  "build-types": "/images/brand/build-type-placeholder.svg",
} as const;

function getCollectionFromPath(src: string) {
  if (src.includes("/build-types/")) {
    return "build-types";
  }

  return "finishes";
}

export function resolveContentImage(image: ContentImage) {
  const normalizedPath = image.src.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", normalizedPath);
  const exists = fs.existsSync(absolutePath);
  const collection = getCollectionFromPath(image.src);

  return {
    ...image,
    src: exists ? image.src : fallbackImageByCollection[collection],
    isPlaceholder: !exists,
  };
}
