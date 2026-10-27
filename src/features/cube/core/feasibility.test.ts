import { describe, expect, it } from "vitest";
import fixtures from "./__fixtures__/moves.json";
import { FACE_COLORS, FACE_ORDER, FACE_ORIENTATIONS } from "./constants";
import {
  CORNER_SLOTS,
  EDGE_SLOTS,
  validateCubeFeasibility,
} from "./feasibility";
import type { CubeFeasibility, StickerLocation } from "./feasibility";
import { applyAlgorithm, applyMove } from "./moves";
import { parseAlgorithm } from "./notation";
import { deserializeCubeState, serializeCubeState } from "./serialization";
import { createSolvedCubeState } from "./state";
import type { CubeColor, CubeFace } from "./types";
import { validateCubeStructure } from "./validation";

const mutable = () =>
  JSON.parse(JSON.stringify(createSolvedCubeState())) as {
    faces: Record<CubeFace, CubeColor[]>;
  };
type Mutable = ReturnType<typeof mutable>;
function swap(state: Mutable, a: StickerLocation, b: StickerLocation) {
  [state.faces[a.face][a.index], state.faces[b.face][b.index]] = [
    state.faces[b.face][b.index],
    state.faces[a.face][a.index],
  ];
}
function rotate(
  state: Mutable,
  cells: readonly StickerLocation[],
  amount: number,
) {
  const colors = cells.map((cell) => state.faces[cell.face][cell.index]);
  cells.forEach((cell, index) => {
    state.faces[cell.face][cell.index] =
      colors[(index + amount) % cells.length];
  });
}
function place(
  state: Mutable,
  slots: typeof CORNER_SLOTS,
  target: number,
  source: number,
) {
  slots[target].stickers.forEach((cell, index) => {
    state.faces[cell.face][cell.index] =
      FACE_COLORS[slots[source].stickers[index].face];
  });
}
function codes(result: CubeFeasibility) {
  expect(result.valid).toBe(false);
  return result.valid ? [] : result.issues.map((issue) => issue.code);
}
function negative(state: Mutable, expected: string) {
  expect(validateCubeStructure(state).valid).toBe(true);
  const before = JSON.stringify(state);
  const result = validateCubeFeasibility(state);
  expect(codes(result)).toContain(expected);
  expect(JSON.stringify(state)).toBe(before);
  expect(result).not.toHaveProperty("cubies");
  expect(result).not.toHaveProperty("state");
  return result;
}

describe("fixed-center 3×3 feasibility", () => {
  it("accepts solved with immutable identity coordinates and canonical serialization", () => {
    const input = createSolvedCubeState();
    const result = validateCubeFeasibility(input);
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.state).not.toBe(input);
    expect(result.state).toEqual(input);
    expect(result.cubies.cp).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(result.cubies.ep).toEqual(Array.from({ length: 12 }, (_, i) => i));
    expect(result.cubies.co).toEqual(Array(8).fill(0));
    expect(result.cubies.eo).toEqual(Array(12).fill(0));
    expect(serializeCubeState(deserializeCubeState(result.serialization))).toBe(
      result.serialization,
    );
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.cubies.cp)).toBe(true);
    expect(Object.isFrozen(result.cubies.eo)).toBe(true);
    expect(Object.isFrozen(result.state.faces.U)).toBe(true);
  });
  it.each(fixtures.cases)(
    "accepts independent cubejs fixture $name",
    (fixture) => {
      const result = validateCubeFeasibility(
        deserializeCubeState(fixture.expectedState),
      );
      expect(result.valid).toBe(true);
      if (result.valid)
        expect(result.serialization).toBe(fixture.expectedState);
    },
  );
  it("matches independently published F coordinates (Kociemba cubie level)", () => {
    const result = validateCubeFeasibility(
      applyAlgorithm(createSolvedCubeState(), parseAlgorithm("F")),
    );
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.cubies).toEqual({
      cp: [1, 5, 2, 3, 0, 4, 6, 7],
      co: [1, 2, 0, 0, 2, 1, 0, 0],
      ep: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11],
      eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
    });
  });
  it("accepts 2000 deterministic move prefixes across all 18 moves", () => {
    let seed = 0x53424b;
    let state = createSolvedCubeState();
    const moves = FACE_ORDER.flatMap((face) =>
      ([1, -1, 2] as const).map((turns) => ({ face, turns })),
    );
    for (let index = 0; index < 2000; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      state = applyMove(state, moves[seed % 18]);
      expect(validateCubeFeasibility(state).valid, `prefix ${index}`).toBe(
        true,
      );
    }
  });
  it("covers each non-center facelet exactly once at the same geometric cubie", () => {
    const ids = new Set<string>();
    for (const item of [...CORNER_SLOTS, ...EDGE_SLOTS]) {
      const positions = item.stickers.map((cell) => {
        ids.add(`${cell.face}${cell.index}`);
        const basis = FACE_ORIENTATIONS[cell.face];
        return basis.normal.map(
          (value, axis) =>
            value +
            ((cell.index % 3) - 1) * basis.right[axis] +
            (Math.floor(cell.index / 3) - 1) * basis.down[axis],
        );
      });
      for (const position of positions) expect(position).toEqual(positions[0]);
    }
    expect(ids.size).toBe(48);
    for (const face of FACE_ORDER) expect(ids.has(`${face}4`)).toBe(false);
  });
  it.each(EDGE_SLOTS.map((slot, index) => ({ name: slot.name, index })))(
    "rejects a single flipped $name edge",
    ({ index }) => {
      const state = mutable();
      rotate(state, EDGE_SLOTS[index].stickers, 1);
      expect(codes(negative(state, "EDGE_FLIP"))).toEqual(["EDGE_FLIP"]);
    },
  );
  it.each(
    CORNER_SLOTS.flatMap((slot, index) =>
      [1, 2].map((amount) => ({ name: slot.name, index, amount })),
    ),
  )("rejects corner $name twist $amount", ({ index, amount }) => {
    const state = mutable();
    rotate(state, CORNER_SLOTS[index].stickers, amount);
    expect(codes(negative(state, "CORNER_TWIST"))).toEqual(["CORNER_TWIST"]);
  });
  it.each(CORNER_SLOTS.map((slot, index) => ({ name: slot.name, index })))(
    "rejects mirrored corner $name despite unchanged counts",
    ({ index }) => {
      const state = mutable();
      swap(
        state,
        CORNER_SLOTS[index].stickers[1],
        CORNER_SLOTS[index].stickers[2],
      );
      const result = negative(state, "INVALID_CORNER");
      expect(codes(result)).not.toContain("CORNER_TWIST");
      expect(codes(result)).not.toContain("PARITY");
    },
  );
  it("rejects duplicate/missing edges with correct total colors", () => {
    const state = mutable();
    swap(state, { face: "F", index: 1 }, { face: "B", index: 7 });
    expect(codes(negative(state, "EDGE_INVENTORY"))).toEqual([
      "EDGE_INVENTORY",
    ]);
  });
  it("rejects duplicate/missing corners with correct total colors", () => {
    const state = mutable();
    place(state, CORNER_SLOTS, 0, 1);
    place(state, CORNER_SLOTS, 5, 4);
    expect(codes(negative(state, "CORNER_INVENTORY"))).toEqual([
      "CORNER_INVENTORY",
    ]);
  });
  it("rejects an impossible color pair and avoids secondary orientation/parity errors", () => {
    const state = mutable();
    swap(state, { face: "R", index: 1 }, { face: "U", index: 7 });
    const result = negative(state, "INVALID_EDGE");
    expect(codes(result)).not.toContain("EDGE_FLIP");
    expect(codes(result)).not.toContain("PARITY");
  });
  it.each(["edge", "corner"])("rejects a single %s transposition", (kind) => {
    const state = mutable();
    const slots = kind === "edge" ? EDGE_SLOTS : CORNER_SLOTS;
    place(state, slots, 0, 1);
    place(state, slots, 1, 0);
    expect(codes(negative(state, "PARITY"))).toEqual(["PARITY"]);
  });
  it("accepts matching odd permutations of corners and edges", () => {
    const state = mutable();
    for (const slots of [CORNER_SLOTS, EDGE_SLOTS]) {
      place(state, slots, 0, 1);
      place(state, slots, 1, 0);
    }
    expect(validateCubeFeasibility(state).valid).toBe(true);
  });
  it("accepts balanced twists/flips, even cycles and nonzero last coordinates", () => {
    const state = mutable();
    rotate(state, EDGE_SLOTS[0].stickers, 1);
    rotate(state, EDGE_SLOTS[11].stickers, 1);
    rotate(state, CORNER_SLOTS[0].stickers, 1);
    rotate(state, CORNER_SLOTS[7].stickers, 2);
    expect(validateCubeFeasibility(state).valid).toBe(true);
    const cycled = mutable();
    place(cycled, EDGE_SLOTS, 0, 1);
    place(cycled, EDGE_SLOTS, 1, 2);
    place(cycled, EDGE_SLOTS, 2, 0);
    expect(validateCubeFeasibility(cycled).valid).toBe(true);
  });
  it.each([null, {}, { faces: {} }, { faces: { U: [] } }])(
    "returns structural failures safely for %j",
    (input) => {
      const result = validateCubeFeasibility(input);
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.stage).toBe("structure");
    },
  );
  it("rejects wrong centers/counts before physical analysis", () => {
    const state = mutable();
    swap(state, { face: "U", index: 4 }, { face: "R", index: 4 });
    expect(codes(validateCubeFeasibility(state))).toContain("INVALID_CENTER");
    const counts = mutable();
    counts.faces.U[0] = "red";
    expect(codes(validateCubeFeasibility(counts))).toContain(
      "INVALID_COLOR_COUNT",
    );
  });
  it("returns frozen, locatable errors without changing inputs", () => {
    const state = mutable();
    rotate(state, EDGE_SLOTS[1].stickers, 1);
    const result = negative(state, "EDGE_FLIP");
    if (result.valid) return;
    expect(result.issues[0].stickers).toEqual([
      { face: "U", index: 7 },
      { face: "F", index: 1 },
    ]);
    expect(Object.isFrozen(result.issues)).toBe(true);
    expect(Object.isFrozen(result.issues[0].stickers)).toBe(true);
  });
});
