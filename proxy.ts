import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/firebase/proxy";
import { isPotentialPublicRoute } from "@/lib/agent-guidance/public-routes";

const standaloneAgentResources = new Set([
  "/llms.txt",
  "/sitemap.md",
  "/services.md",
]);

function getHtmlPathFromMarkdownPath(pathname: string) {
  if (pathname === "/index.md") {
    return "/";
  }

  if (!pathname.endsWith(".md")) {
    return null;
  }

  return pathname.slice(0, -3);
}

function rewriteToMarkdownRenderer(request: NextRequest, htmlPath: string) {
  const destination = request.nextUrl.clone();
  destination.pathname = "/agent-markdown";
  destination.search = "";
  destination.searchParams.set("path", htmlPath);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-hh-markdown-path", htmlPath);
  return NextResponse.rewrite(destination, {
    request: { headers: requestHeaders },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (standaloneAgentResources.has(pathname)) {
    return NextResponse.next({ request });
  }

  const directMarkdownPath = getHtmlPathFromMarkdownPath(pathname);
  if (directMarkdownPath) {
    return rewriteToMarkdownRenderer(request, directMarkdownPath);
  }

  const acceptsMarkdown = request.headers
    .get("accept")
    ?.split(",")
    .some((value) => value.trim().split(";", 1)[0] === "text/markdown");

  if (
    acceptsMarkdown &&
    ["GET", "HEAD"].includes(request.method) &&
    isPotentialPublicRoute(pathname)
  ) {
    return rewriteToMarkdownRenderer(request, pathname);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)",
  ],
};
