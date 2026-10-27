import { describe, expect, it } from "vitest";
import { PUZZLES, getPuzzle } from "./catalog";
import { CAPABILITIES, parseCatalog } from "./schema";
import { capabilitiesOf } from "../puzzles/registry";
import {
  catalogURL,
  EMPTY_FILTERS,
  filterPuzzles,
  filterQuery,
  readFilters,
} from "./filters";
const mutable = () => structuredClone([...PUZZLES]);
describe("puzzle catalog contracts", () => {
  it("validates eight entries, unique slugs and immutable nested content", () => {
    expect(PUZZLES).toHaveLength(8);
    expect(new Set(PUZZLES.map((p) => p.slug)).size).toBe(8);
    expect(parseCatalog(mutable())).toEqual(PUZZLES);
    expect(Object.isFrozen(PUZZLES)).toBe(true);
    expect(Object.isFrozen(PUZZLES[0].capabilities.solver)).toBe(true);
    expect(getPuzzle("missing")).toBeUndefined();
    expect(getPuzzle("constructor")).toBeUndefined();
  });
  it.each([
    "3x3",
    "2x2",
    "4x4",
    "pyraminx",
    "megaminx",
    "5x5",
    "skewb",
    "square-1",
  ])("has complete content and capability keys for %s", (slug) => {
    const puzzle = getPuzzle(slug)!;
    expect(puzzle.description.length).toBeGreaterThan(0);
    expect(puzzle.notation.examples.length).toBeGreaterThan(0);
    expect(Object.keys(puzzle.capabilities).sort()).toEqual(
      Object.keys(CAPABILITIES).sort(),
    );
    expect(puzzle.notation.source.href).toMatch(
      /^https:\/\/www.worldcubeassociation.org\/regulations\/#12/,
    );
  });
  it("advertises exactly the registry's implementations and the published lesson", () => {
    const shown = Object.fromEntries(
      PUZZLES.map((p) => [
        p.slug,
        Object.entries(p.capabilities)
          .filter(([, c]) => c.status === "available")
          .map(([k]) => k)
          .sort(),
      ]),
    );
    expect(shown).toEqual({
      "3x3": [
        "imageInput",
        "lessons",
        "player",
        "scramble",
        "solver",
        "viewer",
      ],
      "2x2": ["scramble", "viewer"],
      "4x4": ["scramble", "viewer"],
      "5x5": [],
      pyraminx: ["scramble", "viewer"],
      megaminx: ["scramble"],
      skewb: [],
      "square-1": [],
    });
    for (const p of PUZZLES) {
      const reg = capabilitiesOf(p.slug);
      expect(p.capabilities.viewer.status === "available").toBe(!!reg.render);
      expect(p.capabilities.scramble.status === "available").toBe(
        !!reg.scramble,
      );
      expect(p.capabilities.solver.status === "available").toBe(!!reg.solve);
    }
    expect(
      PUZZLES.every(
        (p) => p.relatedLessons.length === (p.slug === "3x3" ? 1 : 0),
      ),
    ).toBe(true);
  });
  it.each([
    (rows: ReturnType<typeof mutable>) => {
      rows[1] = { ...rows[1], slug: rows[0].slug };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[0] = { ...rows[0], slug: "../bad" };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[0] = { ...rows[0], name: " " };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[0] = { ...rows[0], layers: 1 };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[0] = {
        ...rows[0],
        shape: "constructor" as (typeof rows)[0]["shape"],
      };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[0] = {
        ...rows[0],
        difficulty: "constructor" as (typeof rows)[0]["difficulty"],
      };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[4] = { ...rows[4], layers: 3 };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[0] = {
        ...rows[0],
        capabilities: {
          ...rows[0].capabilities,
          solver: { status: "available", note: "" },
        },
      };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[1] = {
        ...rows[1],
        capabilities: {
          ...rows[1].capabilities,
          solver: { status: "available", note: "Unwired engine" },
        },
      };
    },
    (rows: ReturnType<typeof mutable>) => {
      // Hiding an implemented capability is as wrong as inventing one.
      rows[1] = {
        ...rows[1],
        capabilities: {
          ...rows[1].capabilities,
          scramble: { status: "unavailable", note: "Hidden" },
        },
      };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[0] = {
        ...rows[0],
        relatedLessons: [{ title: "fake", href: "/learn/fake" }],
      };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[0] = {
        ...rows[0],
        relatedReading: [{ title: "fake", href: "//evil.example" }],
      };
    },
    (rows: ReturnType<typeof mutable>) => {
      rows[0] = {
        ...rows[0],
        notation: {
          ...rows[0].notation,
          source: { title: "unsafe", href: "javascript:alert(1)" },
        },
      };
    },
  ])("rejects authoring errors and unimplemented claims (%#)", (change) => {
    const rows = mutable();
    change(rows);
    expect(() => parseCatalog(rows)).toThrow(/Invalid puzzle catalog/);
  });
  it.each([null, {}, [], [null], [{ slug: "bad" }]])(
    "rejects incomplete input %#",
    (input) => expect(() => parseCatalog(input)).toThrow(),
  );
});
describe("URL filters and search", () => {
  it.each([
    ["3×3", "3x3"],
    ["3 x 3", "3x3"],
    ["333", "3x3"],
    ["ĐỔI HÌNH", "square-1"],
    ["tu dien", "pyraminx"],
    ["pocket cube", "2x2"],
  ])("matches %s without case or accents", (q, slug) =>
    expect(
      filterPuzzles(PUZZLES, { ...EMPTY_FILTERS, q }).map((p) => p.slug),
    ).toEqual([slug]),
  );
  it("ANDs taxonomy filters and supports empty results", () => {
    expect(
      filterPuzzles(PUZZLES, {
        ...EMPTY_FILTERS,
        shape: "cube",
        difficulty: "intermediate",
      }).map((p) => p.slug),
    ).toEqual(["4x4", "5x5"]);
    expect(
      filterPuzzles(PUZZLES, { ...EMPTY_FILTERS, layers: "other" }).map(
        (p) => p.slug,
      ),
    ).toEqual(["pyraminx", "megaminx", "skewb", "square-1"]);
    expect(
      filterPuzzles(PUZZLES, {
        ...EMPTY_FILTERS,
        layers: "4",
        shape: "tetrahedron",
      }),
    ).toEqual([]);
  });
  it("normalizes invalid, duplicate, oversized and encoded URL values", () => {
    const filters = readFilters(
      new URLSearchParams(
        "q=%20Pyraminx%20%20&shape=constructor&difficulty=invalid&layers=999&shape=cube",
      ),
    );
    expect(filters).toEqual({ ...EMPTY_FILTERS, q: "Pyraminx" });
    expect(
      readFilters(new URLSearchParams({ q: "a".repeat(1000) })).q,
    ).toHaveLength(80);
  });
  it("round trips only supported keys, with deterministic escaping and no open redirects", () => {
    const filters = readFilters(
      new URLSearchParams(
        "q=%3Cscript%3E+%26+rubik&shape=cube&layers=3&returnTo=https://evil.example",
      ),
    );
    expect(readFilters(new URLSearchParams(filterQuery(filters)))).toEqual(
      filters,
    );
    expect(catalogURL(filters)).toMatch(/^\/puzzles\?q=/);
    expect(catalogURL(filters)).not.toContain("returnTo");
    expect(catalogURL(EMPTY_FILTERS)).toBe("/puzzles");
  });
});
