import {
  FACE_COLORS,
  FACE_ORDER,
  STICKERS_PER_FACE,
  TOTAL_STICKERS,
} from "./constants";
import { createCubeState, CubeStateValidationError } from "./state";
import { validateCubeStructure } from "./validation";
import type { CubeColor, CubeFace, CubeState } from "./types";

const COLOR_TO_FACE = Object.freeze(
  Object.fromEntries(
    FACE_ORDER.map((face) => [FACE_COLORS[face], face]),
  ) as Record<CubeColor, CubeFace>,
);

/** URFDLB face blocks, each 9 row-major stickers, encoded by fixed center face letters. */
export function serializeCubeState(state: CubeState): string {
  const result = validateCubeStructure(state);
  if (!result.valid) throw new CubeStateValidationError(result.issues);
  return FACE_ORDER.map((face) =>
    state.faces[face].map((color) => COLOR_TO_FACE[color]).join(""),
  ).join("");
}

export function deserializeCubeState(input: unknown): CubeState {
  if (
    typeof input !== "string" ||
    input.length !== TOTAL_STICKERS ||
    !/^[URFDLB]+$/.test(input)
  ) {
    throw new CubeStateValidationError([
      {
        code: "INVALID_SERIALIZATION",
        path: "serialization",
        message:
          "Cần đúng 54 ký tự U/R/F/D/L/B viết hoa, không chứa khoảng trắng.",
      },
    ]);
  }
  return createCubeState({
    faces: Object.fromEntries(
      FACE_ORDER.map((face, block) => [
        face,
        Array.from(
          input.slice(
            block * STICKERS_PER_FACE,
            (block + 1) * STICKERS_PER_FACE,
          ),
          (token) => FACE_COLORS[token as CubeFace],
        ),
      ]),
    ),
  });
}
