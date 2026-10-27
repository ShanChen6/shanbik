import {
  parseAlgorithm,
  serializeAlgorithm,
  type CubeAlgorithm,
} from "../cube/core/notation";
export const GROUPS = {
  beginner: "Beginner",
  cfop: "CFOP",
  f2l: "F2L",
  oll: "OLL",
  pll: "PLL",
} as const;
export const DIFFICULTIES = {
  easy: "Dễ",
  medium: "Vừa",
  advanced: "Nâng cao",
} as const;
export type Group = keyof typeof GROUPS;
export type Difficulty = keyof typeof DIFFICULTIES;
export type Formula = Readonly<{
  id: string;
  name: string;
  aliases: readonly string[];
  puzzle: "3x3";
  groups: readonly Group[];
  difficulty: Difficulty;
  notation: string;
  notes: string;
  moves: CubeAlgorithm;
}>;
function text(value: unknown, max: number): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}
export function validateCatalog(input: unknown): readonly Formula[] {
  if (!Array.isArray(input) || !input.length || input.length > 500)
    throw Error("Catalog must contain 1–500 formulas");
  const ids = new Set<string>();
  return Object.freeze(
    input.map((raw: unknown) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw))
        throw Error("Invalid formula");
      const value = raw as Record<string, unknown>;
      const { id, name, aliases, puzzle, groups, difficulty, notation, notes } =
        value;
      if (
        !text(id, 80) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
        ids.has(id) ||
        !text(name, 120) ||
        puzzle !== "3x3" ||
        !text(notes, 1500) ||
        !text(notation, 2048) ||
        !Array.isArray(aliases) ||
        aliases.length > 10 ||
        !aliases.every((a) => text(a, 120)) ||
        !Array.isArray(groups) ||
        !groups.length ||
        groups.length > 5 ||
        !groups.every(
          (g) => typeof g === "string" && Object.hasOwn(GROUPS, g),
        ) ||
        new Set(groups).size !== groups.length ||
        typeof difficulty !== "string" ||
        !Object.hasOwn(DIFFICULTIES, difficulty)
      )
        throw Error(`Invalid formula ${String(id)}`);
      if (
        groups.some((g) => ["f2l", "oll", "pll"].includes(g)) &&
        !groups.includes("cfop")
      )
        throw Error("CFOP stages require CFOP parent");
      const moves = parseAlgorithm(notation);
      if (!moves.length || moves.length > 256)
        throw Error("Formula requires 1–256 moves");
      ids.add(id);
      return Object.freeze({
        id,
        name,
        aliases: Object.freeze([...aliases]) as readonly string[],
        puzzle,
        groups: Object.freeze([...groups]) as readonly Group[],
        difficulty: difficulty as Difficulty,
        notation: serializeAlgorithm(moves),
        notes,
        moves,
      });
    }),
  );
}
export const FORMULAS = validateCatalog([
  {
    id: "right-trigger",
    name: "Trigger tay phải",
    aliases: ["Sexy move"],
    puzzle: "3x3",
    groups: ["beginner", "cfop"],
    difficulty: "easy",
    notation: "R U R' U'",
    notes:
      "Chuỗi luyện tay phải, không phải công thức giải mọi tình huống. Quan sát cạnh và góc thay đổi sau mỗi lần thực hiện.",
  },
  {
    id: "left-trigger",
    name: "Trigger tay trái",
    aliases: ["Left trigger"],
    puzzle: "3x3",
    groups: ["beginner", "cfop"],
    difficulty: "easy",
    notation: "L' U' L U",
    notes:
      "Chuỗi đối xứng để luyện tay trái. Giữ nguyên hướng khối trong suốt chuỗi.",
  },
  {
    id: "f2l-right-insert",
    name: "F2L — Đưa cặp vào khe phải",
    aliases: ["Right insertion"],
    puzzle: "3x3",
    groups: ["cfop", "f2l"],
    difficulty: "easy",
    notation: "U R U' R'",
    notes:
      "Ví dụ chèn cặp góc–cạnh vào khe trước-phải. Cặp phải có đúng hướng và vị trí như trạng thái mẫu; không áp dụng cho mọi cặp F2L.",
  },
  {
    id: "oll-cross",
    name: "OLL — Dấu thập mặt trên",
    aliases: ["Edge orientation", "Line"],
    puzzle: "3x3",
    groups: ["beginner", "cfop", "oll"],
    difficulty: "medium",
    notation: "F R U R' U' F'",
    notes:
      "Ví dụ định hướng cạnh tầng cuối từ hình đường thẳng. Đối chiếu trạng thái mẫu trước khi xoay; thuật toán chưa nhất thiết định hướng xong các góc.",
  },
  {
    id: "oll-sune",
    name: "OLL — Sune",
    aliases: ["Cá", "Fish"],
    puzzle: "3x3",
    groups: ["cfop", "oll"],
    difficulty: "medium",
    notation: "R U R' U R U2 R'",
    notes:
      "Mẫu Sune để định hướng góc tầng cuối. Giữ đúng hướng như mô hình mẫu. Định hướng tầng cuối không đồng nghĩa đã hoán vị đúng tất cả các viên.",
  },
  {
    id: "pll-t",
    name: "PLL — T perm",
    aliases: ["T permutation", "Hoán vị chữ T"],
    puzzle: "3x3",
    groups: ["cfop", "pll"],
    difficulty: "advanced",
    notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
    notes:
      "Hoán vị tầng cuối kiểu T. Đối chiếu đủ các mặt với trạng thái mẫu; với khối thực tế có thể cần chỉnh U để căn lại tầng cuối.",
  },
]);
export const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[’′]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
export function filterFormulas(
  items: readonly Formula[],
  query: string,
  group: Group | "",
  difficulty: Difficulty | "",
  favorites?: readonly string[],
) {
  const search = normalizeSearch(query);
  return items.filter(
    (item) =>
      (!group || item.groups.includes(group)) &&
      (!difficulty || item.difficulty === difficulty) &&
      (!favorites || favorites.includes(item.id)) &&
      normalizeSearch(
        [
          item.name,
          ...item.aliases,
          ...item.groups.map((g) => GROUPS[g]),
          item.notation,
          item.notes,
        ].join(" "),
      ).includes(search),
  );
}
