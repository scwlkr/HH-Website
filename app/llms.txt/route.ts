import { renderLlmsText } from "@/lib/agent-guidance/documents";
import { createAgentResourceResponse } from "@/lib/agent-guidance/response";
import { agentDiscoveryResources } from "@/lib/agent-guidance/resources";

export function GET() {
  return createAgentResourceResponse({
    body: renderLlmsText(),
    contentType: "text/plain",
    canonicalPath: agentDiscoveryResources.llms.path,
  });
}
