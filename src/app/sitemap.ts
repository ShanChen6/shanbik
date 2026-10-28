import type { MetadataRoute } from "next";
import { sitemapPaths } from "@/config/seo";
import { SITE_INDEXABLE, absoluteUrl } from "@/config/site";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE_INDEXABLE) return [];
  return sitemapPaths().map((path) => ({ url: absoluteUrl(path) }));
}
