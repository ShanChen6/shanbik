import { searchText } from "../encyclopedia/filters";
export const SEARCH_KINDS = {
  puzzle: "Puzzle",
  lesson: "Bài học",
  formula: "Công thức",
} as const;
export type SearchKind = keyof typeof SEARCH_KINDS;
/** Serializable entry built on the server; the client never imports catalogs. */
export type SearchEntry = Readonly<{
  kind: SearchKind;
  id: string;
  title: string;
  detail: string;
  href: string;
  /** Normalized title, used for ranking. */
  name: string;
  /** Normalized title + aliases + body text. */
  text: string;
}>;
export const MAX_QUERY = 80;
/** Accent-, case-, ×- and prime-insensitive, as in the catalog and formula searches. */
export const normalizeQuery = (value: string) =>
  searchText(value.slice(0, MAX_QUERY).replace(/[’′]/g, "'"));
/**
 * Every term must appear (AND). Title matches rank above body matches, and a
 * title starting with the query ranks first; order is otherwise stable.
 */
export function searchEntries(
  index: readonly SearchEntry[],
  query: string,
): Readonly<Record<SearchKind, readonly SearchEntry[]>> {
  const q = normalizeQuery(query),
    terms = q.split(" ").filter(Boolean),
    empty = { puzzle: [], lesson: [], formula: [] };
  if (!terms.length) return empty;
  const score = (e: SearchEntry) =>
    e.name.startsWith(q) ? 0 : terms.every((t) => e.name.includes(t)) ? 1 : 2;
  const hits = index
    .filter((e) => terms.every((t) => e.text.includes(t)))
    .map((e, i) => ({ e, s: score(e), i }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map(({ e }) => e);
  return {
    puzzle: hits.filter((e) => e.kind === "puzzle"),
    lesson: hits.filter((e) => e.kind === "lesson"),
    formula: hits.filter((e) => e.kind === "formula"),
  };
}
