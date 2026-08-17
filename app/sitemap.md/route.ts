import { renderMarkdownSitemap } from "@/lib/agent-guidance/documents";
import { createAgentResourceResponse } from "@/lib/agent-guidance/response";
import { agentDiscoveryResources } from "@/lib/agent-guidance/resources";

export async function GET() {
  return createAgentResourceResponse({
    body: await renderMarkdownSitemap(),
    contentType: "text/markdown",
    canonicalPath: agentDiscoveryResources.sitemap.path,
  });
}
