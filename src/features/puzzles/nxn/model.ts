import {
  FACE_COLORS,
  FACE_ORDER,
  FACE_ORIENTATIONS,
} from "../../cube/core/constants";
import type { CubeColor, CubeFace } from "../../cube/core/types";
export const NXN_SIZES = [2, 4] as const;
export type NxnSize = 2 | 3 | 4;
export type NxnState = Readonly<{
  size: NxnSize;
  /** Row-major stickers per face, viewed from outside as in the 3×3 core. */
  faces: Readonly<Record<CubeFace, readonly CubeColor[]>>;
}>;
/** `depth` counts layers from the turned face: 1 = outer (R), 2 = Rw, n = nRw. */
export type NxnMove = Readonly<{
  face: CubeFace;
  depth: number;
  turns: 1 | -1 | 2;
}>;
export class NxnNotationError extends Error {
  constructor(
    readonly token: string,
    readonly index: number,
  ) {
    super(`Ký hiệu không hợp lệ ở vị trí ${index + 1}: ${token}`);
  }
}
const TOKEN = /^(\d+)?([URFDLB])(w)?(2'|2|')?$/;
/**
 * WCA 12a NxN grammar: outer turns, `Xw` (two layers) and `nXw` (n outer
 * layers, 2 ≤ n < size). The 2×2 has outer turns only; inner slices are not
 * part of WCA notation and are rejected.
 */
export function parseNxnAlgorithm(text: string, size: NxnSize): NxnMove[] {
  if (typeof text !== "string" || text.length > 4096)
    throw new NxnNotationError("", 0);
  const tokens = text.trim() ? text.trim().split(/\s+/) : [];
  if (tokens.length > 512) throw new NxnNotationError(tokens[512], 512);
  return tokens.map((token, index) => {
    const match = TOKEN.exec(token);
    if (!match) throw new NxnNotationError(token, index);
    const [, prefix, face, wide, suffix] = match;
    let depth = 1;
    if (wide) depth = prefix ? Number(prefix) : 2;
    else if (prefix) throw new NxnNotationError(token, index);
    if (depth >= size || (prefix && depth < 2) || (wide && size < 4))
      throw new NxnNotationError(token, index);
    return Object.freeze({
      face: face as CubeFace,
      depth,
      turns: suffix === "'" ? -1 : suffix ? 2 : 1,
    });
  });
}
export function serializeNxnMove(move: NxnMove): string {
  const base =
    move.depth === 1
      ? move.face
      : `${move.depth === 2 ? "" : move.depth}${move.face}w`;
  return base + (move.turns === -1 ? "'" : move.turns === 2 ? "2" : "");
}
export function solvedNxn(size: NxnSize): NxnState {
  return Object.freeze({
    size,
    faces: Object.freeze(
      Object.fromEntries(
        FACE_ORDER.map((face) => [
          face,
          Object.freeze(Array(size * size).fill(FACE_COLORS[face])),
        ]),
      ) as Record<CubeFace, readonly CubeColor[]>,
    ),
  });
}
export function isNxnSolved(state: NxnState): boolean {
  return FACE_ORDER.every((face) =>
    state.faces[face].every((color) => color === state.faces[face][0]),
  );
}
type Vec = readonly [number, number, number];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** Clockwise quarter turn seen from outside the face: −90° about its normal. */
const rotate = (v: Vec, n: Vec): Vec => {
  const along = dot(v, n);
  // −(n × v) + n(n·v)
  return [
    -(n[1] * v[2] - n[2] * v[1]) + n[0] * along,
    -(n[2] * v[0] - n[0] * v[2]) + n[1] * along,
    -(n[0] * v[1] - n[1] * v[0]) + n[2] * along,
  ];
};
const faceOf = (normal: Vec) =>
  FACE_ORDER.find((f) => dot(FACE_ORIENTATIONS[f].normal, normal) === 1)!;
/**
 * Stickers live at integer points in doubled units: the cubie centre along
 * each axis is 2i − (N − 1). A move rotates every sticker whose cubie is in
 * the turned layers; geometry alone defines the result, for any N.
 */
export function applyNxnMove(state: NxnState, move: NxnMove): NxnState {
  const n = state.size,
    axis = FACE_ORIENTATIONS[move.face].normal,
    limit = n - 1 - 2 * (move.depth - 1),
    quarterTurns = (move.turns + 4) % 4,
    next = Object.fromEntries(
      FACE_ORDER.map((f) => [f, [...state.faces[f]]]),
    ) as Record<CubeFace, CubeColor[]>;
  for (const face of FACE_ORDER) {
    const { normal, right, down } = FACE_ORIENTATIONS[face];
    state.faces[face].forEach((color, index) => {
      const u = 2 * (index % n) - (n - 1),
        v = 2 * Math.floor(index / n) - (n - 1);
      let p: Vec = [0, 1, 2].map(
        (k) => normal[k] * (n - 1) + right[k] * u + down[k] * v,
      ) as unknown as Vec;
      if (dot(p, axis) < limit) return;
      let dir: Vec = normal;
      for (let t = 0; t < quarterTurns; t++) {
        p = rotate(p, axis);
        dir = rotate(dir, axis);
      }
      const target = faceOf(dir),
        o = FACE_ORIENTATIONS[target],
        col = (dot(p, o.right) + n - 1) / 2,
        row = (dot(p, o.down) + n - 1) / 2;
      next[target][row * n + col] = color;
    });
  }
  return Object.freeze({
    size: n,
    faces: Object.freeze(
      Object.fromEntries(
        FACE_ORDER.map((f) => [f, Object.freeze(next[f])]),
      ) as Record<CubeFace, readonly CubeColor[]>,
    ),
  });
}
export const applyNxnAlgorithm = (state: NxnState, moves: readonly NxnMove[]) =>
  moves.reduce(applyNxnMove, state);
export const invertNxnAlgorithm = (moves: readonly NxnMove[]): NxnMove[] =>
  [...moves]
    .reverse()
    .map((m) =>
      Object.freeze({ ...m, turns: m.turns === 2 ? 2 : (-m.turns as 1 | -1) }),
    );
