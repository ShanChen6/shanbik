import { PUBLISHED_LESSON_LINKS } from "../learn/lessons/publication";
export const SHAPES = {
  cube: "Lập phương",
  tetrahedron: "Tứ diện",
  dodecahedron: "Mười hai mặt",
  shapeshifter: "Đổi hình",
} as const;
export const DIFFICULTIES = {
  beginner: "Nhập môn",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
} as const;
export const CAPABILITIES = {
  viewer: "Mô hình 3D",
  scramble: "Scramble",
  solver: "Tìm lời giải",
  imageInput: "Nhập ảnh",
  player: "Phát thuật toán",
  lessons: "Bài học từng bước",
} as const;
export type Shape = keyof typeof SHAPES;
export type Difficulty = keyof typeof DIFFICULTIES;
export type CapabilityKey = keyof typeof CAPABILITIES;
export type Capability = Readonly<{
  status: "available" | "unavailable";
  note: string;
}>;
export type Resource = Readonly<{ title: string; href: string }>;
export type Puzzle = Readonly<{
  slug: string;
  name: string;
  aliases: readonly string[];
  shape: Shape;
  layers: number | null;
  difficulty: Difficulty;
  summary: string;
  description: readonly string[];
  notation: Readonly<{
    summary: string;
    examples: readonly string[];
    source: Resource;
  }>;
  capabilities: Readonly<Record<CapabilityKey, Capability>>;
  relatedReading: readonly Resource[];
  relatedLessons: readonly Resource[];
}>;
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
function fail(path: string): never {
  throw Error(`Invalid puzzle catalog: ${path}`);
}
const text = (value: unknown, path: string) => {
  if (typeof value !== "string" || !value.trim()) fail(path);
};
function strings(value: unknown, path: string, nonempty = false) {
  if (!Array.isArray(value) || (nonempty && !value.length)) fail(path);
  for (const item of value as unknown[]) text(item, path);
}
function resources(value: unknown, path: string, externalOnly = false) {
  if (!Array.isArray(value)) fail(path);
  for (const link of value as unknown[]) {
    if (!record(link)) fail(path);
    text(link.title, path);
    text(link.href, path);
    const href = link.href as string;
    if (externalOnly) {
      try {
        const url = new URL(href);
        if (url.protocol !== "https:" || url.username || url.password)
          fail(path);
      } catch {
        fail(path);
      }
    } else if (
      ![
        "/learn",
        "/help#quick-start",
        ...PUBLISHED_LESSON_LINKS.map((lesson) => lesson.href),
      ].includes(href)
    )
      fail(path);
  }
}
/** Validate authoring data at import/build time; the resulting catalog is deeply immutable. */
export function parseCatalog(input: unknown): readonly Puzzle[] {
  if (!Array.isArray(input) || !input.length) fail("entries");
  const slugs = new Set<string>();
  for (const [index, value] of (input as unknown[]).entries()) {
    const path = `entries[${index}]`;
    if (!record(value)) fail(path);
    for (const field of ["slug", "name", "summary"])
      text(value[field], `${path}.${field}`);
    const slug = value.slug as string;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug))
      fail(`${path}.slug`);
    slugs.add(slug);
    if (
      !Object.hasOwn(SHAPES, String(value.shape)) ||
      !Object.hasOwn(DIFFICULTIES, String(value.difficulty))
    )
      fail(`${path}.taxonomy`);
    if (
      value.layers !== null &&
      (!Number.isInteger(value.layers) ||
        Number(value.layers) < 2 ||
        Number(value.layers) > 17)
    )
      fail(`${path}.layers`);
    if (value.layers !== null && value.shape !== "cube") fail(`${path}.layers`);
    strings(value.aliases, `${path}.aliases`);
    strings(value.description, `${path}.description`, true);
    if (!record(value.notation)) fail(`${path}.notation`);
    text(value.notation.summary, `${path}.notation.summary`);
    strings(value.notation.examples, `${path}.notation.examples`, true);
    resources([value.notation.source], `${path}.notation.source`, true);
    if (
      !record(value.capabilities) ||
      Object.keys(value.capabilities).length !==
        Object.keys(CAPABILITIES).length
    )
      fail(`${path}.capabilities`);
    for (const key of Object.keys(CAPABILITIES)) {
      const cap = value.capabilities[key];
      if (
        !record(cap) ||
        !["available", "unavailable"].includes(cap.status as string)
      )
        fail(`${path}.capabilities.${key}`);
      text(cap.note, `${path}.capabilities.${key}.note`);
      // A library's support is not an implemented ShanBik capability.
      if (cap.status === "available" && slug !== "3x3")
        fail(`${path}.capabilities.${key}.binding`);
    }
    resources(value.relatedReading, `${path}.relatedReading`);
    resources(value.relatedLessons, `${path}.relatedLessons`);
    const expectedLessons = PUBLISHED_LESSON_LINKS.filter(
      (lesson) => lesson.puzzleId === slug,
    );
    const actualLessons = value.relatedLessons as {
      title: string;
      href: string;
    }[];
    if (
      actualLessons.length !== expectedLessons.length ||
      actualLessons.some(
        (link) =>
          !expectedLessons.some(
            (lesson) =>
              lesson.href === link.href && lesson.title === link.title,
          ),
      )
    )
      fail(`${path}.relatedLessons`);
    const lessonCapability = value.capabilities.lessons as { status: string };
    if ((lessonCapability.status === "available") !== !!expectedLessons.length)
      fail(`${path}.capabilities.lessons`);
  }
  const clone = structuredClone(input) as Puzzle[];
  const freeze = (value: unknown): unknown => {
    if (value && typeof value === "object") {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  };
  return freeze(clone) as readonly Puzzle[];
}
