import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/thank-you"],
    },
    sitemap: absoluteUrl("/sitemap.xml").toString(),
  };
}
