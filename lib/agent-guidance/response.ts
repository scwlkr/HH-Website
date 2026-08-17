import { absoluteUrl } from "@/lib/metadata";

export const agentResourceCacheControl =
  "public, s-maxage=3600, stale-while-revalidate=86400";

export function createAgentResourceResponse({
  body,
  contentType,
  canonicalPath,
  varyOnAccept = false,
}: {
  body: string;
  contentType: "text/markdown" | "text/plain";
  canonicalPath?: string;
  varyOnAccept?: boolean;
}) {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": agentResourceCacheControl,
    "Content-Type": `${contentType}; charset=utf-8`,
  });

  if (canonicalPath) {
    headers.set("Link", `<${absoluteUrl(canonicalPath)}>; rel="canonical"`);
  }

  if (varyOnAccept) {
    headers.set("Vary", "Accept");
  }

  return new Response(`${body.trim()}\n`, { headers });
}
