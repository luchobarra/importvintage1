import { createSiteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        allow: "/",
        disallow: ["/retro-campus-admin", "/retro-campus-admin/*", "/admin", "/admin/*"],
        userAgent: "*",
      },
    ],
    sitemap: createSiteUrl("/sitemap.xml"),
  };
}
