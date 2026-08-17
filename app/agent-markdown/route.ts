import type { NextRequest } from "next/server";
import { renderMarkdownTwin } from "@/lib/agent-guidance/twins";
import { createAgentResourceResponse } from "@/lib/agent-guidance/response";

function notFoundResponse() {
  return new Response("Not found\n", {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function GET(request: NextRequest) {
  const path =
    request.headers.get("x-hh-markdown-path") ??
    request.nextUrl.searchParams.get("path");

  if (!path || !path.startsWith("/") || path.includes("..")) {
    return notFoundResponse();
  }

  const body = await renderMarkdownTwin(path);

  if (!body) {
    return notFoundResponse();
  }

  return createAgentResourceResponse({
    body,
    contentType: "text/markdown",
    canonicalPath: path,
  });
}
