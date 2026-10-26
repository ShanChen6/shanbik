import type { CubeFace } from "../core/types";

/** Local sticker plane faces +z; Euler XYZ maps it to the face's outward normal. */
export const STICKER_ROTATIONS: Readonly<
  Record<CubeFace, readonly [number, number, number]>
> = Object.freeze({
  U: Object.freeze([-Math.PI / 2, 0, 0] as const),
  R: Object.freeze([0, Math.PI / 2, 0] as const),
  F: Object.freeze([0, 0, 0] as const),
  D: Object.freeze([Math.PI / 2, 0, 0] as const),
  L: Object.freeze([0, -Math.PI / 2, 0] as const),
  B: Object.freeze([0, Math.PI, 0] as const),
});
