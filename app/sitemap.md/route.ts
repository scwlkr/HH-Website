import { renderMarkdownSitemap } from "@/lib/agent-guidance/documents";
import { createAgentResourceResponse } from "@/lib/agent-guidance/response";

export async function GET() {
  return createAgentResourceResponse({
    body: await renderMarkdownSitemap(),
    contentType: "text/markdown",
  });
}
