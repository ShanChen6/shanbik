import { describe, expect, it } from "vitest";
import {
  cloneCubeState,
  createCubeState,
  createSolvedCubeState,
  CubeStateValidationError,
  deserializeCubeState,
  FACE_COLORS,
  FACE_ORDER,
  FACE_ORIENTATIONS,
  isCubeSolved,
  resetCubeState,
  serializeCubeState,
  validateCubeStructure,
} from "./index";
import type { CubeColor, CubeFace, CubeState } from "./types";

const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
// A non-center U/R sticker swap preserves counts but is not a claim of physical solvability.
const MIXED = "RUUUUUUUUURRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
function editable() {
  return JSON.parse(JSON.stringify(createSolvedCubeState())) as {
    faces: Record<CubeFace, CubeColor[]>;
  };
}

describe("3×3 snapshot model", () => {
  it("creates six faces with nine stickers and fixed centers", () => {
    const state = createSolvedCubeState();
    expect(Object.keys(state.faces)).toEqual(["U", "R", "F", "D", "L", "B"]);
    expect(state.faces.U).toEqual(Array(9).fill("white"));
    expect(state.faces.R[4]).toBe("red");
    expect(state.faces.F[4]).toBe("green");
    expect(state.faces.D[4]).toBe("yellow");
    expect(state.faces.L[4]).toBe("orange");
    expect(state.faces.B[4]).toBe("blue");
    expect(isCubeSolved(state)).toBe(true);
    expect(validateCubeStructure(state)).toEqual({ valid: true, issues: [] });
  });
  it("does not share arrays between fresh solved snapshots", () => {
    const first = createSolvedCubeState(),
      second = createSolvedCubeState();
    expect(first).not.toBe(second);
    for (const face of FACE_ORDER)
      expect(first.faces[face]).not.toBe(second.faces[face]);
  });
  it("copies the input, so caller mutation cannot change a snapshot", () => {
    const raw = editable();
    const state = createCubeState(raw);
    raw.faces.U[0] = "red";
    expect(state.faces.U[0]).toBe("white");
  });
  it("clones without sharing nested data and protects snapshots at runtime", () => {
    const state = deserializeCubeState(MIXED);
    const copy = cloneCubeState(state);
    expect(copy).toEqual(state);
    expect(copy).not.toBe(state);
    expect(copy.faces).not.toBe(state.faces);
    for (const face of FACE_ORDER)
      expect(copy.faces[face]).not.toBe(state.faces[face]);
    expect(() => {
      (copy.faces.U as unknown as CubeColor[])[0] = "green";
    }).toThrow(TypeError);
    expect(() => {
      (copy.faces as unknown as Record<CubeFace, unknown>).U = [];
    }).toThrow(TypeError);
    expect(serializeCubeState(state)).toBe(MIXED);
  });
  it("resets by returning a solved snapshot without mutating the previous state", () => {
    const before = deserializeCubeState(MIXED);
    const next = resetCubeState();
    expect(isCubeSolved(next)).toBe(true);
    expect(serializeCubeState(next)).toBe(SOLVED);
    expect(serializeCubeState(before)).toBe(MIXED);
    expect(isCubeSolved(before)).toBe(false);
  });
  it("survives JSON transport without relying on prototypes or browser APIs", () => {
    const state = deserializeCubeState(MIXED);
    const json = JSON.parse(JSON.stringify(state));
    expect(createCubeState(json)).toEqual(state);
    expect(createCubeState(structuredClone(state))).toEqual(state);
  });
});

describe("structural validation (not physical validation)", () => {
  it("does not report malformed or sparse data as solved", () => {
    const raw = editable();
    delete raw.faces.U[0];
    expect(isCubeSolved(raw)).toBe(false);
    expect(isCubeSolved(null)).toBe(false);
    expect(isCubeSolved({})).toBe(false);
  });
  it.each([
    null,
    undefined,
    [],
    "cube",
    12,
    {},
    { faces: null },
    { faces: [], extra: true },
  ])("rejects invalid root %j", (raw) => {
    expect(validateCubeStructure(raw).valid).toBe(false);
    expect(() => createCubeState(raw)).toThrow(CubeStateValidationError);
  });
  it("rejects missing faces and extra faces", () => {
    const raw = editable();
    delete (raw.faces as Partial<typeof raw.faces>).B;
    expect(validateCubeStructure(raw)).toMatchObject({
      valid: false,
      issues: [{ code: "INVALID_FACE_KEYS" }],
    });
    const extra = { faces: { ...editable().faces, X: [] } };
    expect(validateCubeStructure(extra).valid).toBe(false);
  });
  it.each([0, 8, 10])("rejects face length %i", (length) => {
    const raw = editable();
    raw.faces.U = Array(length).fill("white");
    expect(validateCubeStructure(raw)).toMatchObject({
      valid: false,
      issues: [{ code: "INVALID_FACE_LENGTH", path: "faces.U" }],
    });
  });
  it("rejects sparse arrays instead of silently skipping holes", () => {
    const raw = editable();
    delete raw.faces.U[0];
    expect(validateCubeStructure(raw)).toMatchObject({
      valid: false,
      issues: [{ code: "INVALID_COLOR", path: "faces.U[0]" }],
    });
  });
  it.each(["purple", "WHITE", 0, null, undefined])(
    "rejects unknown sticker %j",
    (color) => {
      const raw = editable();
      (raw.faces.U as unknown[])[2] = color;
      expect(validateCubeStructure(raw)).toMatchObject({
        valid: false,
        issues: [{ code: "INVALID_COLOR", path: "faces.U[2]" }],
      });
    },
  );
  it("rejects incorrect color counts with valid vocabulary", () => {
    const raw = editable();
    raw.faces.U[0] = "red";
    const result = validateCubeStructure(raw);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "INVALID_COLOR_COUNT",
          path: "colors.white",
        }),
        expect.objectContaining({
          code: "INVALID_COLOR_COUNT",
          path: "colors.red",
        }),
      ]),
    );
  });
  it("rejects changed centers even when counts remain nine", () => {
    const raw = editable();
    [raw.faces.U[4], raw.faces.R[4]] = [raw.faces.R[4], raw.faces.U[4]];
    const result = validateCubeStructure(raw);
    expect(result.valid).toBe(false);
    expect(
      result.issues.filter((i) => i.code === "INVALID_CENTER"),
    ).toHaveLength(2);
  });
  it("does not mutate caller data while validating", () => {
    const raw = editable();
    raw.faces.U[0] = "red";
    const before = JSON.stringify(raw);
    validateCubeStructure(raw);
    expect(JSON.stringify(raw)).toBe(before);
  });
  it("explicitly permits structurally valid input without proving reachability", () => {
    expect(validateCubeStructure(deserializeCubeState(MIXED)).valid).toBe(true);
  });
});

describe("face conventions and state serialization", () => {
  it("serializes solved state as the fixed URFDLB fixture", () =>
    expect(serializeCubeState(createSolvedCubeState())).toBe(SOLVED));
  it("round-trips non-solved sticker positions exactly", () => {
    const state = deserializeCubeState(MIXED);
    expect(state.faces.U[0]).toBe("red");
    expect(state.faces.R[0]).toBe("white");
    expect(serializeCubeState(state)).toBe(MIXED);
  });
  it.each([
    null,
    54,
    "",
    SOLVED.slice(1),
    SOLVED + "U",
    SOLVED.toLowerCase(),
    " " + SOLVED,
    "X" + SOLVED.slice(1),
  ])("rejects malformed encoding %j", (input) => {
    expect(() => deserializeCubeState(input)).toThrow(CubeStateValidationError);
  });
  it("validates centers and counts while decoding", () => {
    expect(() => deserializeCubeState("R" + SOLVED.slice(1))).toThrow(
      CubeStateValidationError,
    );
    const chars = SOLVED.split("");
    [chars[4], chars[13]] = [chars[13], chars[4]];
    expect(() => deserializeCubeState(chars.join(""))).toThrow(
      CubeStateValidationError,
    );
  });
  it("does not serialize an invalid object cast as CubeState", () => {
    const raw = editable();
    raw.faces.F.pop();
    expect(() => serializeCubeState(raw as unknown as CubeState)).toThrow(
      CubeStateValidationError,
    );
  });
  it("exposes structured validation issues to adapters", () => {
    try {
      createCubeState(null);
      throw new Error("expected validation failure");
    } catch (error) {
      expect(error).toBeInstanceOf(CubeStateValidationError);
      if (error instanceof CubeStateValidationError) {
        expect(error.issues[0].code).toBe("INVALID_SHAPE");
        expect(error.message).toContain("$");
      }
    }
  });
  it("keeps each face basis orthogonal and facing out consistently", () => {
    const dot = (a: readonly number[], b: readonly number[]) =>
      a.reduce((sum, n, i) => sum + n * b[i], 0);
    for (const face of FACE_ORDER) {
      const { normal, right, down } = FACE_ORIENTATIONS[face];
      expect(dot(normal, normal)).toBe(1);
      expect(dot(right, right)).toBe(1);
      expect(dot(down, down)).toBe(1);
      expect(dot(normal, right)).toBe(0);
      expect(dot(normal, down)).toBe(0);
      expect(dot(right, down)).toBe(0);
      const cross = [
        right[1] * down[2] - right[2] * down[1],
        right[2] * down[0] - right[0] * down[2],
        right[0] * down[1] - right[1] * down[0],
      ];
      expect(dot(cross, normal)).toBe(-1);
    }
    expect(FACE_ORIENTATIONS.F).toEqual({
      normal: [0, 0, 1],
      right: [1, 0, 0],
      down: [0, -1, 0],
    });
    expect(FACE_COLORS.U).toBe("white");
  });
});
