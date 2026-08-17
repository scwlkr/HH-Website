import { absoluteUrl } from "@/lib/metadata";

export function markdownLink(label: string, path: string) {
  return `[${label}](${absoluteUrl(path)})`;
}
