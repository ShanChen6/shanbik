import { absoluteUrl } from "./site";
import { COMPETITIONS } from "../features/competitions/data";
import { PUZZLES } from "../features/encyclopedia/catalog";
import { getPublishedLessons } from "../features/learn/lessons/catalog";
/** Indexable pages only: personal (local data), account and sample pages are noindex. */
export const STATIC_PATHS = [
  "/",
  "/practice",
  "/puzzles",
  "/timer",
  "/algorithms",
  "/learn",
  "/competitions",
  "/competitions/gop-y",
  "/help",
] as const;
export function sitemapPaths(): string[] {
  return [
    ...STATIC_PATHS,
    ...PUZZLES.map((p) => `/puzzles/${p.slug}`),
    ...getPublishedLessons().map((l) => `/learn/lessons/${l.slug}`),
    ...COMPETITIONS.filter((c) => !c.sample).map(
      (c) => `/competitions/${c.id}`,
    ),
  ];
}
/** JSON for a <script type="application/ld+json">; `<` escaped so content cannot close the tag. */
export const jsonLd = (data: object) =>
  JSON.stringify({ "@context": "https://schema.org", ...data }).replace(
    /</g,
    "\\u003c",
  );
export const breadcrumbs = (items: readonly (readonly [string, string])[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: absoluteUrl(path),
  })),
});
