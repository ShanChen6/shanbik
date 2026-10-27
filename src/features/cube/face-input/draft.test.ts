import { describe, expect, it } from "vitest";
import {
  CUBE_COLORS,
  FACE_COLORS,
  FACE_ORDER,
  FACE_ORIENTATIONS,
} from "../core/constants";
import { applyAlgorithmText } from "../core/moves";
import { serializeCubeState } from "../core/serialization";
import { createSolvedCubeState } from "../core/state";
import {
  createFaceDraft,
  FACE_GUIDES,
  inspectFaceDraft,
  paintSticker,
} from "./draft";

describe("six-face color draft", () => {
  it("starts with six fixed centers and 48 empty stickers", () => {
    const draft = createFaceDraft();
    const report = inspectFaceDraft(draft);
    expect(report.missing).toHaveLength(48);
    expect(Object.values(report.counts)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(report.state).toBeNull();
    for (const face of FACE_ORDER) {
      expect(draft[face]).toHaveLength(9);
      expect(draft[face][4]).toBe(FACE_COLORS[face]);
      expect(Object.isFrozen(draft[face])).toBe(true);
    }
    expect(Object.isFrozen(draft)).toBe(true);
  });
  it.each(FACE_ORDER)(
    "locks center %s against every color and eraser",
    (face) => {
      const draft = createFaceDraft();
      for (const color of [...CUBE_COLORS, null])
        expect(paintSticker(draft, face, 4, color)).toBe(draft);
    },
  );
  it("corrects and erases a single sticker without losing the rest", () => {
    const initial = createFaceDraft();
    const a = paintSticker(initial, "F", 0, "red");
    const b = paintSticker(a, "B", 8, "blue");
    const c = paintSticker(b, "F", 0, "green");
    const d = paintSticker(c, "F", 0, null);
    expect(a.F[0]).toBe("red");
    expect(initial.F[0]).toBeNull();
    expect(c.F[0]).toBe("green");
    expect(d.F[0]).toBeNull();
    expect(d.B[8]).toBe("blue");
    expect(inspectFaceDraft(d).missing).toHaveLength(47);
  });
  it.each([-1, 9, 1.5, NaN])("ignores invalid index %s", (index) => {
    const draft = createFaceDraft();
    expect(paintSticker(draft, "U", index, "red")).toBe(draft);
  });
  it("counts excess colors and preserves data when checking repeatedly", () => {
    let draft = createFaceDraft(createSolvedCubeState());
    draft = paintSticker(draft, "U", 0, "red");
    const before = JSON.stringify(draft);
    const report = inspectFaceDraft(draft);
    expect(report.missing).toHaveLength(0);
    expect(report.counts.red).toBe(10);
    expect(report.counts.white).toBe(8);
    expect(report.state).toBeNull();
    inspectFaceDraft(draft);
    expect(JSON.stringify(draft)).toBe(before);
    draft = paintSticker(draft, "U", 0, "white");
    expect(inspectFaceDraft(draft).state).toEqual(createSolvedCubeState());
  });
  it("round-trips a scrambled core state by the same row-major face order", () => {
    const state = applyAlgorithmText(createSolvedCubeState(), "R U F2 L' D B2");
    const draft = createFaceDraft(state);
    const report = inspectFaceDraft(draft);
    expect(report.state).toEqual(state);
    expect(report.state).not.toBe(state);
    expect(serializeCubeState(report.state!)).toBe(serializeCubeState(state));
  });
  it("rejects a corrupted center even when all colors still have nine stickers", () => {
    const draft = createFaceDraft(createSolvedCubeState());
    const corrupted = { ...draft, U: [...draft.U], R: [...draft.R] };
    [corrupted.U[4], corrupted.R[4]] = [corrupted.R[4], corrupted.U[4]];
    const report = inspectFaceDraft(corrupted);
    expect(report.invalidCenters).toEqual(["U", "R"]);
    expect(report.state).toBeNull();
  });
  it("does not mistake structural counts for physical feasibility", () => {
    const draft = createFaceDraft(createSolvedCubeState());
    // Flip only the UF edge: balanced colors and fixed centers, physically impossible.
    const flipped = { ...draft, U: [...draft.U], F: [...draft.F] };
    [flipped.U[7], flipped.F[1]] = [flipped.F[1], flipped.U[7]];
    expect(inspectFaceDraft(flipped).state).not.toBeNull(); // 9.1b must reject it.
  });
  it.each(FACE_ORDER)(
    "guides for %s agree with core outward face orientation",
    (face) => {
      const orientation = FACE_ORIENTATIONS[face];
      const guide = FACE_GUIDES[face];
      expect(FACE_ORIENTATIONS[guide.top].normal).toEqual(
        orientation.down.map((value) => (value === 0 ? 0 : -value)),
      );
      expect(FACE_ORIENTATIONS[guide.bottom].normal).toEqual(orientation.down);
      expect(FACE_ORIENTATIONS[guide.left].normal).toEqual(
        orientation.right.map((value) => (value === 0 ? 0 : -value)),
      );
      expect(FACE_ORIENTATIONS[guide.right].normal).toEqual(orientation.right);
    },
  );
});
