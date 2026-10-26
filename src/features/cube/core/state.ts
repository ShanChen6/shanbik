import { FACE_COLORS, FACE_ORDER, STICKERS_PER_FACE } from "./constants";
import { validateCubeStructure } from "./validation";
import type {
  CubeColor,
  CubeFace,
  CubeState,
  CubeStructureIssue,
  FaceStickers,
} from "./types";

export class CubeStateValidationError extends Error {
  readonly issues: readonly CubeStructureIssue[];
  constructor(issues: readonly CubeStructureIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    this.name = "CubeStateValidationError";
    this.issues = Object.freeze(
      issues.map((issue) => Object.freeze({ ...issue })),
    );
  }
}

/** Makes a fresh deeply frozen snapshot after structural validation only. */
export function createCubeState(input: unknown): CubeState {
  const result = validateCubeStructure(input);
  if (!result.valid) throw new CubeStateValidationError(result.issues);
  const source = input as { faces: Record<CubeFace, CubeColor[]> };
  const faces = Object.fromEntries(
    FACE_ORDER.map((face) => [face, Object.freeze([...source.faces[face]])]),
  ) as Record<CubeFace, FaceStickers>;
  return Object.freeze({ faces: Object.freeze(faces) });
}

export function createSolvedCubeState(): CubeState {
  return createCubeState({
    faces: Object.fromEntries(
      FACE_ORDER.map((face) => [
        face,
        Array<CubeColor>(STICKERS_PER_FACE).fill(FACE_COLORS[face]),
      ]),
    ),
  });
}

export function cloneCubeState(state: CubeState): CubeState {
  return createCubeState(state);
}

/** Returns a fresh solved snapshot. The caller replaces its current state with it. */
export function resetCubeState(): CubeState {
  return createSolvedCubeState();
}

export function isCubeSolved(input: unknown): boolean {
  if (!validateCubeStructure(input).valid) return false;
  const state = input as CubeState;
  return FACE_ORDER.every(
    (face) =>
      state.faces[face].length === STICKERS_PER_FACE &&
      state.faces[face].every((color) => color === FACE_COLORS[face]),
  );
}
