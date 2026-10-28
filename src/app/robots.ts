import type { MetadataRoute } from "next";
import { SITE_INDEXABLE, absoluteUrl } from "@/config/site";
export default function robots(): MetadataRoute.Robots {
  // Preview/unconfigured builds must not be crawled (see src/config/site.ts).
  if (!SITE_INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/ui-preview", "/tai-khoan/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
