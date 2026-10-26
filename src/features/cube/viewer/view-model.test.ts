import { describe, expect, it } from "vitest";
import {
  applyAlgorithmText,
  createSolvedCubeState,
  CubeStateValidationError,
} from "../core";
import type { CubeState } from "../core/types";
import { buildCubeViewModel } from "./view-model";

describe("cube view model adapter", () => {
  it("has 26 unique visible cubies and 54 stickers without a core cubie", () => {
    const view = buildCubeViewModel(createSolvedCubeState());
    expect(view).toHaveLength(26);
    expect(new Set(view.map((c) => c.id)).size).toBe(26);
    expect(view.find((c) => c.id === "0,0,0")).toBeUndefined();
    expect(view.reduce((n, c) => n + c.stickers.length, 0)).toBe(54);
    expect(view.filter((c) => c.stickers.length === 1)).toHaveLength(6);
    expect(view.filter((c) => c.stickers.length === 2)).toHaveLength(12);
    expect(view.filter((c) => c.stickers.length === 3)).toHaveLength(8);
  });
  it("maps a solved front/top/right corner from the established face directions", () => {
    const corner = buildCubeViewModel(createSolvedCubeState()).find(
      (c) => c.id === "1,1,1",
    )!;
    expect(corner.position).toEqual([1, 1, 1]);
    expect(corner.stickers).toEqual([
      { face: "U", index: 8, color: "white", normal: [0, 1, 0] },
      { face: "R", index: 0, color: "red", normal: [1, 0, 0] },
      { face: "F", index: 2, color: "green", normal: [0, 0, 1] },
    ]);
  });
  it("reflects updated snapshot colors rather than storing separate puzzle state", () => {
    const corner = buildCubeViewModel(
      applyAlgorithmText(createSolvedCubeState(), "R"),
    ).find((c) => c.id === "1,1,1")!;
    expect(corner.stickers.map((s) => [s.face, s.color])).toEqual([
      ["U", "green"],
      ["R", "red"],
      ["F", "yellow"],
    ]);
  });
  it("never changes the source snapshot and exposes immutable view data", () => {
    const state = createSolvedCubeState();
    const before = JSON.stringify(state);
    const view = buildCubeViewModel(state);
    expect(JSON.stringify(state)).toBe(before);
    expect(Object.isFrozen(view)).toBe(true);
    expect(Object.isFrozen(view[0].stickers)).toBe(true);
    expect(Object.isFrozen(view[0].position)).toBe(true);
  });
  it("rejects malformed state at the adapter boundary", () =>
    expect(() => buildCubeViewModel({ faces: {} } as CubeState)).toThrow(
      CubeStateValidationError,
    ));
});
