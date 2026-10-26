import { describe, expect, it } from "vitest";
import {
  AlgorithmParseError,
  AlgorithmSerializationError,
  normalizeAlgorithm,
  parseAlgorithm,
  serializeAlgorithm,
  tryParseAlgorithm,
} from "./index";
import type { CubeAlgorithm, CubeMove } from "./notation";

const faces = ["U", "D", "L", "R", "F", "B"] as const;
const cases = faces.flatMap((face) => [
  { token: face, expected: { face, turns: 1 } },
  { token: `${face}'`, expected: { face, turns: -1 } },
  { token: `${face}2`, expected: { face, turns: 2 } },
]);

describe("basic 3×3 notation", () => {
  it.each(cases)("parses and serializes $token", ({ token, expected }) => {
    const moves = parseAlgorithm(token);
    expect(moves).toEqual([expected]);
    expect(serializeAlgorithm(moves)).toBe(token);
  });
  it("keeps sequence order and repeated moves without simplifying", () => {
    const moves = parseAlgorithm("R U R' U' F2 R R R'");
    expect(moves).toEqual([
      { face: "R", turns: 1 },
      { face: "U", turns: 1 },
      { face: "R", turns: -1 },
      { face: "U", turns: -1 },
      { face: "F", turns: 2 },
      { face: "R", turns: 1 },
      { face: "R", turns: 1 },
      { face: "R", turns: -1 },
    ]);
    expect(serializeAlgorithm(moves)).toBe("R U R' U' F2 R R R'");
  });
  it.each(["", " ", "\t\r\n", "\u00a0\u2003"])(
    "treats blank input as an empty no-op: %j",
    (input) => {
      expect(parseAlgorithm(input)).toEqual([]);
      expect(normalizeAlgorithm(input)).toBe("");
      expect(serializeAlgorithm([])).toBe("");
    },
  );
  it("normalizes spaces, tabs, line breaks and Unicode whitespace", () => {
    expect(normalizeAlgorithm("  R\tU'\r\n F2\u00a0D\u2003B2  ")).toBe(
      "R U' F2 D B2",
    );
  });
  it.each(["’", "′"])("normalizes copy-pasted prime %s", (prime) => {
    expect(parseAlgorithm(`R${prime}`)).toEqual([{ face: "R", turns: -1 }]);
    expect(normalizeAlgorithm(`U${prime} D${prime}`)).toBe("U' D'");
  });
  it("round-trips an algorithm after normalization", () => {
    const parsed = parseAlgorithm(" R’\n U2 L F′ B D2 ");
    const text = serializeAlgorithm(parsed);
    expect(text).toBe("R' U2 L F' B D2");
    expect(parseAlgorithm(text)).toEqual(parsed);
    expect(normalizeAlgorithm(text)).toBe(text);
  });
  it("returns immutable parsed moves", () => {
    const moves = parseAlgorithm("R U2");
    expect(() => (moves as CubeMove[]).push({ face: "F", turns: 1 })).toThrow(
      TypeError,
    );
    expect(() => {
      (moves[0] as { face: string }).face = "B";
    }).toThrow(TypeError);
    expect(serializeAlgorithm(moves)).toBe("R U2");
  });
  it("does not mutate a caller-owned move list during serialization", () => {
    const moves: CubeMove[] = [
      { face: "F", turns: -1 },
      { face: "D", turns: 2 },
    ];
    const before = JSON.stringify(moves);
    expect(serializeAlgorithm(moves)).toBe("F' D2");
    expect(JSON.stringify(moves)).toBe(before);
  });
});

describe("notation errors", () => {
  it.each([null, undefined, 42, [], {}])(
    "reports non-string input %j",
    (input) => {
      expect(tryParseAlgorithm(input)).toMatchObject({
        valid: false,
        issues: [
          {
            code: "INVALID_INPUT",
            token: null,
            tokenIndex: null,
            start: 0,
            end: 0,
          },
        ],
      });
      expect(() => parseAlgorithm(input)).toThrow(AlgorithmParseError);
    },
  );
  it.each([
    "X",
    "r",
    "Rw",
    "M",
    "x",
    "R3",
    "R0",
    "R2'",
    "R''",
    "RUR'",
    "(R)",
    "R,",
    "Ｒ",
    "2",
    "'",
    "R\u200b",
  ])("rejects unsupported or malformed token %j", (token) => {
    const result = tryParseAlgorithm(token);
    expect(result).toMatchObject({
      valid: false,
      issues: [
        {
          code: "INVALID_TOKEN",
          token,
          tokenIndex: 0,
          start: 0,
          end: token.length,
        },
      ],
    });
  });
  it("reports all invalid tokens at their original offsets with no partial moves", () => {
    const source = "  R\tU’\nX R3";
    const result = tryParseAlgorithm(source);
    expect(result.valid).toBe(false);
    expect(result).not.toHaveProperty("moves");
    if (!result.valid) {
      expect(result.issues).toEqual([
        expect.objectContaining({
          token: "X",
          tokenIndex: 2,
          start: 7,
          end: 8,
        }),
        expect.objectContaining({
          token: "R3",
          tokenIndex: 3,
          start: 9,
          end: 11,
        }),
      ]);
      for (const issue of result.issues)
        expect(source.slice(issue.start, issue.end)).toBe(issue.token);
    }
  });
  it("uses UTF-16 offsets so a UI can select an invalid emoji token", () => {
    const result = tryParseAlgorithm("R 🧩 U");
    expect(result).toMatchObject({
      valid: false,
      issues: [{ token: "🧩", tokenIndex: 1, start: 2, end: 4 }],
    });
  });
  it("exposes issues on the thrown error and never normalizes invalid input", () => {
    expect(() => normalizeAlgorithm("R nope U")).toThrow(AlgorithmParseError);
    try {
      parseAlgorithm("R nope U");
      throw new Error("Expected parse failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AlgorithmParseError);
      if (error instanceof AlgorithmParseError) {
        expect(error.issues[0]).toMatchObject({
          token: "nope",
          start: 2,
          end: 6,
        });
        expect(error.message).toContain("nope");
        expect(error.message).toContain("3");
      }
    }
  });
});

describe("move serialization validation", () => {
  it.each([
    null,
    {},
    { face: "X", turns: 1 },
    { face: "r", turns: 1 },
    { face: "U", turns: 0 },
    { face: "U", turns: 3 },
    { face: "U", turns: "2" },
    { face: "U", turns: NaN },
  ])("rejects invalid move %j", (move) => {
    expect(() =>
      serializeAlgorithm([move] as unknown as CubeAlgorithm),
    ).toThrow(AlgorithmSerializationError);
  });
  it("rejects a non-array and sparse arrays instead of emitting partial notation", () => {
    expect(() => serializeAlgorithm(null as unknown as CubeAlgorithm)).toThrow(
      AlgorithmSerializationError,
    );
    const sparse = Array<CubeMove>(2);
    sparse[0] = { face: "R", turns: 1 };
    expect(() => serializeAlgorithm(sparse)).toThrow(
      AlgorithmSerializationError,
    );
  });
  it("locates an invalid AST move by index", () => {
    try {
      serializeAlgorithm([
        { face: "R", turns: 1 },
        { face: "Z", turns: 1 },
      ] as unknown as CubeAlgorithm);
      throw new Error("Expected invalid move");
    } catch (error) {
      expect(error).toBeInstanceOf(AlgorithmSerializationError);
      if (error instanceof AlgorithmSerializationError)
        expect(error.moveIndex).toBe(1);
    }
  });
});
