import { expect, it } from "vitest";
import { validateCubeFeasibility } from "../core/feasibility";
import { applyAlgorithmText } from "../core/moves";
import {
  deserializeCubeState,
  serializeCubeState,
} from "../core/serialization";
import { createSolvedCubeState } from "../core/state";
import { createFaceDraft, inspectFaceDraft, paintSticker } from "./draft";

it("passes a complete draft through structural and physical checks without mutating it", () => {
  const state = applyAlgorithmText(createSolvedCubeState(), "R U F2 D' L B2");
  const draft = createFaceDraft(state);
  const result = validateCubeFeasibility({ faces: draft });
  expect(result.valid).toBe(true);
  if (!result.valid) return;
  expect(result.serialization).toBe(serializeCubeState(state));
  expect(serializeCubeState(deserializeCubeState(result.serialization))).toBe(
    result.serialization,
  );
  expect(draft.U).toEqual(state.faces.U);
});
it("keeps an impossible but count-balanced input and accepts its manual correction", () => {
  const solved = createFaceDraft(createSolvedCubeState());
  const flipped = paintSticker(
    paintSticker(solved, "U", 7, "green"),
    "F",
    1,
    "white",
  );
  expect(inspectFaceDraft(flipped).state).not.toBeNull();
  const result = validateCubeFeasibility({ faces: flipped });
  expect(result.valid).toBe(false);
  if (!result.valid)
    expect(result.issues.map((issue) => issue.code)).toEqual(["EDGE_FLIP"]);
  expect(flipped.U[7]).toBe("green");
  expect(flipped.F[1]).toBe("white");
  const corrected = paintSticker(
    paintSticker(flipped, "U", 7, "white"),
    "F",
    1,
    "green",
  );
  expect(validateCubeFeasibility({ faces: corrected }).valid).toBe(true);
});
it("rejects an incomplete draft without returning a snapshot or coordinates", () => {
  const draft = createFaceDraft();
  const result = validateCubeFeasibility({ faces: draft });
  expect(result.valid).toBe(false);
  if (!result.valid) expect(result.stage).toBe("structure");
  expect(result).not.toHaveProperty("state");
  expect(result).not.toHaveProperty("cubies");
  expect(inspectFaceDraft(draft).missing).toHaveLength(48);
});
