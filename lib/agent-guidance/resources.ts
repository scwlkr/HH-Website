export const agentDiscoveryResources = {
  llms: {
    path: "/llms.txt",
    documentLabel: "Short agent guide",
    footerLabel: "Agent Guide",
  },
  sitemap: {
    path: "/sitemap.md",
    documentLabel: "Markdown sitemap",
    footerLabel: "Markdown Sitemap",
  },
  services: {
    path: "/services.md",
    documentLabel: "Services guidance",
    footerLabel: "Services Guide",
  },
} as const;

export const agentDiscoveryResourceList = [
  agentDiscoveryResources.llms,
  agentDiscoveryResources.sitemap,
  agentDiscoveryResources.services,
] as const;
