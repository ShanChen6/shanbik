import {
  DIFFICULTIES,
  SHAPES,
  type Difficulty,
  type Puzzle,
  type Shape,
} from "./schema";
export type Filters = Readonly<{
  q: string;
  shape: Shape | "";
  difficulty: Difficulty | "";
  layers: "" | "2" | "3" | "4" | "5" | "other";
}>;
export const EMPTY_FILTERS: Filters = Object.freeze({
  q: "",
  shape: "",
  difficulty: "",
  layers: "",
});
export function readFilters(params: Pick<URLSearchParams, "get">): Filters {
  const shape = params.get("shape") ?? "",
    difficulty = params.get("difficulty") ?? "",
    layers = params.get("layers") ?? "";
  return Object.freeze({
    q: (params.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
    shape: Object.hasOwn(SHAPES, shape) ? (shape as Shape) : "",
    difficulty: Object.hasOwn(DIFFICULTIES, difficulty)
      ? (difficulty as Difficulty)
      : "",
    layers: ["2", "3", "4", "5", "other"].includes(layers)
      ? (layers as Filters["layers"])
      : "",
  });
}
export function filterQuery(filters: Filters) {
  const params = new URLSearchParams();
  for (const key of ["q", "shape", "difficulty", "layers"] as const)
    if (filters[key]) params.set(key, filters[key]);
  return params.toString();
}
export function catalogURL(filters: Filters) {
  const query = filterQuery(filters);
  return `/puzzles${query ? `?${query}` : ""}`;
}
export function searchText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/\s*x\s*/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}
export function filterPuzzles(puzzles: readonly Puzzle[], filters: Filters) {
  const terms = searchText(filters.q).split(" ").filter(Boolean);
  return puzzles.filter((puzzle) => {
    if (
      (filters.shape && puzzle.shape !== filters.shape) ||
      (filters.difficulty && puzzle.difficulty !== filters.difficulty)
    )
      return false;
    if (
      filters.layers &&
      (filters.layers === "other"
        ? puzzle.layers !== null
        : puzzle.layers !== Number(filters.layers))
    )
      return false;
    const text = searchText(
      [puzzle.name, puzzle.summary, ...puzzle.aliases].join(" "),
    );
    return terms.every((term) => text.includes(term));
  });
}
