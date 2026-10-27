import { FORMULAS, GROUPS } from "../algorithms/catalog";
import { PUZZLES } from "../encyclopedia/catalog";
import { getPublishedLessons } from "../learn/lessons/catalog";
import { normalizeQuery, type SearchEntry } from "./match";
const entry = (
  e: Omit<SearchEntry, "name" | "text">,
  body: readonly string[],
): SearchEntry =>
  Object.freeze({
    ...e,
    name: normalizeQuery(e.title),
    text: normalizeQuery([e.title, ...body].join(" ")),
  });
/** Published content only. Import from server components: it pulls in the full catalogs. */
export function buildSearchIndex(): readonly SearchEntry[] {
  return Object.freeze([
    ...PUZZLES.map((p) =>
      entry(
        {
          kind: "puzzle",
          id: p.slug,
          title: p.name,
          detail: p.summary,
          href: `/puzzles/${p.slug}`,
        },
        [p.summary, ...p.aliases],
      ),
    ),
    ...getPublishedLessons().map((l) =>
      entry(
        {
          kind: "lesson",
          id: l.slug,
          title: l.title,
          detail: l.summary,
          href: `/learn/lessons/${l.slug}`,
        },
        [
          l.summary,
          ...l.objectives.map((o) => o.description),
          ...l.steps.map((s) => s.title),
        ],
      ),
    ),
    ...FORMULAS.map((f) =>
      entry(
        {
          kind: "formula",
          id: f.id,
          title: f.name,
          detail: `${f.groups.map((g) => GROUPS[g]).join(", ")} · ${f.notation}`,
          href: `/algorithms?f=${encodeURIComponent(f.id)}`,
        },
        [...f.aliases, ...f.groups.map((g) => GROUPS[g]), f.notation, f.notes],
      ),
    ),
  ]);
}
