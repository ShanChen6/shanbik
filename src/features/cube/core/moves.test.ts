import { describe, expect, it } from "vitest";
import fixtures from "./__fixtures__/moves.json";
import {
  AlgorithmParseError,
  AlgorithmSerializationError,
  applyAlgorithm,
  applyAlgorithmText,
  applyMove,
  createSolvedCubeState,
  CubeStateValidationError,
  deserializeCubeState,
  FACE_COLORS,
  FACE_ORDER,
  invertAlgorithm,
  invertMove,
  isCubeSolved,
  parseAlgorithm,
  serializeAlgorithm,
  serializeCubeState,
  validateCubeStructure,
} from "./index";
import type { CubeAlgorithm, CubeMove } from "./notation";
import type { CubeState } from "./types";

const prefix = "R U2 F' L2 D B R2 U F2 D' L B2";

describe("independent cubejs 1.3.2 golden fixtures", () => {
  it.each(fixtures.cases)(
    "matches $name",
    ({ initialState, algorithm, expectedState }) => {
      const initial = deserializeCubeState(initialState);
      const next = applyAlgorithmText(initial, algorithm);
      expect(serializeCubeState(next)).toBe(expectedState);
      expect(serializeCubeState(initial)).toBe(initialState);
      expect(validateCubeStructure(next).valid).toBe(true);
      for (const face of FACE_ORDER)
        expect(next.faces[face][4]).toBe(FACE_COLORS[face]);
    },
  );
});

describe("move group invariants", () => {
  it.each(FACE_ORDER)("four %s quarter turns restore a mixed state", (face) => {
    const initial = applyAlgorithmText(createSolvedCubeState(), prefix);
    expect(
      applyAlgorithmText(initial, `${face} ${face} ${face} ${face}`),
    ).toEqual(initial);
  });
  it.each(FACE_ORDER)(
    "%s prime is the inverse and double matches two turns",
    (face) => {
      const state = applyAlgorithmText(createSolvedCubeState(), prefix);
      expect(applyAlgorithmText(state, `${face} ${face}'`)).toEqual(state);
      expect(applyAlgorithmText(state, `${face}' ${face}`)).toEqual(state);
      expect(applyAlgorithmText(state, `${face}2`)).toEqual(
        applyAlgorithmText(state, `${face} ${face}`),
      );
      expect(applyAlgorithmText(state, `${face}2 ${face}2`)).toEqual(state);
      expect(applyAlgorithmText(state, `${face}'`)).toEqual(
        applyAlgorithmText(state, `${face} ${face} ${face}`),
      );
    },
  );
  it.each(
    fixtures.cases.filter((item) => item.name.startsWith("deterministic")),
  )(
    "algorithm then inverse restores original: $name",
    ({ initialState, algorithm }) => {
      const state = deserializeCubeState(initialState);
      const moves = parseAlgorithm(algorithm);
      const next = applyAlgorithm(state, moves);
      expect(applyAlgorithm(next, invertAlgorithm(moves))).toEqual(state);
      expect(
        applyAlgorithm(state, [...moves, ...invertAlgorithm(moves)]),
      ).toEqual(state);
    },
  );
  it("a mixed multi-face scramble and inverse returns to solved", () => {
    const moves = parseAlgorithm(prefix);
    const mixed = applyAlgorithm(createSolvedCubeState(), moves);
    expect(isCubeSolved(mixed)).toBe(false);
    expect(isCubeSolved(applyAlgorithm(mixed, invertAlgorithm(moves)))).toBe(
      true,
    );
  });
  it("does not falsely make non-commuting R and U moves interchangeable", () => {
    const solved = createSolvedCubeState();
    expect(serializeCubeState(applyAlgorithmText(solved, "R U"))).not.toBe(
      serializeCubeState(applyAlgorithmText(solved, "U R")),
    );
  });
  it("keeps opposite-face moves commuting", () => {
    const state = applyAlgorithmText(createSolvedCubeState(), prefix);
    for (const [a, b] of [
      ["U", "D"],
      ["R", "L"],
      ["F", "B"],
    ])
      expect(applyAlgorithmText(state, `${a} ${b}`)).toEqual(
        applyAlgorithmText(state, `${b} ${a}`),
      );
  });
});

describe("inverse descriptors", () => {
  it("reverses order and flips turns, keeping half turns unchanged", () => {
    const source = parseAlgorithm("R U2 F' D");
    const before = serializeAlgorithm(source);
    const inverse = invertAlgorithm(source);
    expect(serializeAlgorithm(inverse)).toBe("D' F U2 R'");
    expect(serializeAlgorithm(source)).toBe(before);
    expect(invertAlgorithm(inverse)).toEqual(source);
  });
  it.each([1, -1, 2] as const)(
    "inverts a single move with turns %s",
    (turns) => {
      const move: CubeMove = { face: "R", turns };
      const inverse = invertMove(move);
      expect(inverse).not.toBe(move);
      expect(invertMove(inverse)).toEqual(move);
      expect(
        applyMove(applyMove(createSolvedCubeState(), move), inverse),
      ).toEqual(createSolvedCubeState());
    },
  );
  it("returns immutable inverse descriptors and arrays", () => {
    const moves = invertAlgorithm(parseAlgorithm("R U"));
    expect(() => (moves as CubeMove[]).pop()).toThrow(TypeError);
    expect(() => {
      (moves[0] as { turns: number }).turns = 2;
    }).toThrow(TypeError);
    expect(invertAlgorithm([])).toEqual([]);
  });
});

describe("snapshot and input contracts", () => {
  it("single move agrees with sequence API and returns a new frozen snapshot", () => {
    const state = createSolvedCubeState();
    const move = parseAlgorithm("F")[0];
    const next = applyMove(state, move);
    expect(next).toEqual(applyAlgorithm(state, [move]));
    expect(next).not.toBe(state);
    expect(Object.isFrozen(next)).toBe(true);
    expect(Object.isFrozen(next.faces)).toBe(true);
    for (const face of FACE_ORDER) {
      expect(next.faces[face]).not.toBe(state.faces[face]);
      expect(Object.isFrozen(next.faces[face])).toBe(true);
    }
  });
  it("empty input returns an equal but independent snapshot", () => {
    const state = applyAlgorithmText(createSolvedCubeState(), prefix);
    const next = applyAlgorithm(state, []);
    expect(next).toEqual(state);
    expect(next).not.toBe(state);
    expect(applyAlgorithmText(state, " \t\n")).toEqual(state);
  });
  it("never mutates caller-owned descriptors", () => {
    const moves: CubeMove[] = [
      { face: "R", turns: 1 },
      { face: "B", turns: 2 },
    ];
    const before = JSON.stringify(moves);
    applyAlgorithm(createSolvedCubeState(), moves);
    invertAlgorithm(moves);
    expect(JSON.stringify(moves)).toBe(before);
  });
  it("invalid source never applies a valid prefix to the original state", () => {
    const initial = applyAlgorithmText(createSolvedCubeState(), prefix);
    const before = serializeCubeState(initial);
    expect(() => applyAlgorithmText(initial, "R U nope F")).toThrow(
      AlgorithmParseError,
    );
    expect(serializeCubeState(initial)).toBe(before);
  });
  it("rejects an invalid late AST move without changing the original state", () => {
    const initial = createSolvedCubeState();
    const before = serializeCubeState(initial);
    const invalid = [
      { face: "R", turns: 1 },
      { face: "X", turns: 1 },
    ] as unknown as CubeAlgorithm;
    expect(() => applyAlgorithm(initial, invalid)).toThrow(
      AlgorithmSerializationError,
    );
    expect(() => invertAlgorithm(invalid)).toThrow(AlgorithmSerializationError);
    expect(serializeCubeState(initial)).toBe(before);
  });
  it("rejects sparse AST and invalid single moves", () => {
    const sparse = Array<CubeMove>(2);
    sparse[0] = { face: "R", turns: 1 };
    expect(() => applyAlgorithm(createSolvedCubeState(), sparse)).toThrow(
      AlgorithmSerializationError,
    );
    expect(() =>
      applyMove(createSolvedCubeState(), {
        face: "U",
        turns: 3,
      } as unknown as CubeMove),
    ).toThrow(AlgorithmSerializationError);
    expect(() =>
      invertMove({ face: "Z", turns: 1 } as unknown as CubeMove),
    ).toThrow(AlgorithmSerializationError);
  });
  it("rejects malformed state before execution", () => {
    expect(() =>
      applyAlgorithm({ faces: {} } as CubeState, parseAlgorithm("R")),
    ).toThrow(CubeStateValidationError);
  });
});
