import { renderServicesMarkdown } from "@/lib/agent-guidance/documents";
import { createAgentResourceResponse } from "@/lib/agent-guidance/response";
import { agentDiscoveryResources } from "@/lib/agent-guidance/resources";

export function GET() {
  return createAgentResourceResponse({
    body: renderServicesMarkdown(),
    contentType: "text/markdown",
    canonicalPath: agentDiscoveryResources.services.path,
  });
}
