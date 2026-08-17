import { renderLlmsText } from "@/lib/agent-guidance/documents";
import { createAgentResourceResponse } from "@/lib/agent-guidance/response";

export function GET() {
  return createAgentResourceResponse({
    body: renderLlmsText(),
    contentType: "text/plain",
  });
}
