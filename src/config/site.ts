import type { Metadata } from "next";
/**
 * Public origin used for canonical URLs, Open Graph, sitemap and robots.
 * Set NEXT_PUBLIC_SITE_URL (https) for production. Without it the build is
 * treated as a preview: pages are noindex and robots.txt disallows crawling,
 * so localhost/preview URLs never end up in a search index.
 */
export const SITE_NAME = "ShanBik";
export const SITE_DESCRIPTION =
  "Học, mô phỏng và luyện tập Rubik: mô hình 3×3, bộ giải, timer, công thức và bách khoa puzzle.";
export function readSiteUrl(value: string | undefined): URL | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
    url.hash = "";
    url.search = "";
    return url;
  } catch {
    return null;
  }
}
const configured = readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_INDEXABLE = configured !== null;
export const SITE_URL = configured ?? new URL("http://localhost:3000");
const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "ShanBik — Học và luyện tập Rubik: mô hình 3×3, bộ giải, timer và công thức",
};
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();
/** Per-page metadata: canonical path plus matching Open Graph/Twitter fields. */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "vi_VN",
      type,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
