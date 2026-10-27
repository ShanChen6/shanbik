import {
  CENTER_INDEX,
  CUBE_COLORS,
  FACE_COLORS,
  FACE_ORDER,
} from "../core/constants";
import { createCubeState } from "../core/state";
import type { CubeColor, CubeFace, CubeState } from "../core/types";

export type StickerInput = CubeColor | null;
export type FaceDraft = Readonly<Record<CubeFace, readonly StickerInput[]>>;
const freezeDraft = (
  faces: Record<CubeFace, readonly StickerInput[]>,
): FaceDraft =>
  Object.freeze(
    Object.fromEntries(
      FACE_ORDER.map((face) => [face, Object.freeze([...faces[face]])]),
    ) as Record<CubeFace, readonly StickerInput[]>,
  );

export function createFaceDraft(state?: CubeState): FaceDraft {
  return freezeDraft(
    Object.fromEntries(
      FACE_ORDER.map((face) => [
        face,
        state
          ? [...state.faces[face]]
          : Array.from({ length: 9 }, (_, index) =>
              index === CENTER_INDEX ? FACE_COLORS[face] : null,
            ),
      ]),
    ) as Record<CubeFace, StickerInput[]>,
  );
}

/** Centers cannot be edited, including through programmatic actions. */
export function paintSticker(
  draft: FaceDraft,
  face: CubeFace,
  index: number,
  color: StickerInput,
): FaceDraft {
  if (
    !FACE_ORDER.includes(face) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 8 ||
    index === CENTER_INDEX ||
    (color !== null && !CUBE_COLORS.includes(color)) ||
    draft[face][index] === color
  )
    return draft;
  return freezeDraft({
    ...draft,
    [face]: draft[face].map((old, position) =>
      position === index ? color : old,
    ),
  });
}

/** These directions follow FACE_ORIENTATIONS, each face viewed from outside. */
export const FACE_GUIDES = Object.freeze({
  U: { name: "Trên", top: "B", left: "L", right: "R", bottom: "F" },
  R: { name: "Phải", top: "U", left: "F", right: "B", bottom: "D" },
  F: { name: "Trước", top: "U", left: "L", right: "R", bottom: "D" },
  D: { name: "Dưới", top: "F", left: "L", right: "R", bottom: "B" },
  L: { name: "Trái", top: "U", left: "B", right: "F", bottom: "D" },
  B: { name: "Sau", top: "U", left: "R", right: "L", bottom: "D" },
} as const);

export function inspectFaceDraft(draft: FaceDraft) {
  const counts = Object.fromEntries(
    CUBE_COLORS.map((color) => [color, 0]),
  ) as Record<CubeColor, number>;
  const missing: { face: CubeFace; index: number }[] = [];
  const invalidCenters: CubeFace[] = [];
  for (const face of FACE_ORDER) {
    if (draft[face][CENTER_INDEX] !== FACE_COLORS[face])
      invalidCenters.push(face);
    draft[face].forEach((color, index) => {
      if (color === null) missing.push({ face, index });
      else counts[color]++;
    });
  }
  const balanced = CUBE_COLORS.every((color) => counts[color] === 9);
  // Structural snapshot only. Physical feasibility MUST be checked separately (9.1b).
  const state =
    !missing.length && balanced && !invalidCenters.length
      ? createCubeState({ faces: draft })
      : null;
  return { counts, missing, invalidCenters, state };
}
