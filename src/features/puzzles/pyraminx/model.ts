/**
 * Pyraminx facelet model. Vertices sit on alternate cube corners, so every
 * 120° turn is an exact signed permutation of integer coordinates.
 * Held as in WCA 12e: one face toward the solver (F), one face down (D);
 * U is the top corner, L/R the front bottom corners, B the back corner.
 */
export const PYRAMINX_FACES = ["F", "L", "R", "D"] as const;
export type PyraminxFace = (typeof PYRAMINX_FACES)[number];
export type PyraminxColor = "green" | "red" | "blue" | "yellow";
export const PYRAMINX_COLORS: Readonly<Record<PyraminxFace, PyraminxColor>> =
  Object.freeze({ F: "green", L: "red", R: "blue", D: "yellow" });
type Vertex = "U" | "L" | "R" | "B";
type Vec = readonly [number, number, number];
const VERTICES: Readonly<Record<Vertex, Vec>> = {
  U: [1, 1, 1],
  L: [-1, 1, -1],
  R: [-1, -1, 1],
  B: [1, -1, -1],
};
/** Each face lists its corners in net order: apex/left/right as drawn. */
export const FACE_VERTICES: Readonly<
  Record<PyraminxFace, readonly [Vertex, Vertex, Vertex]>
> = Object.freeze({
  F: ["U", "L", "R"],
  L: ["U", "B", "L"],
  R: ["U", "R", "B"],
  D: ["L", "B", "R"],
});
/** The vertex a face does not touch: the face lies on P·V = −9. */
const OPPOSITE: Readonly<Record<PyraminxFace, Vertex>> = {
  F: "B",
  L: "R",
  R: "L",
  D: "U",
};
/**
 * Sticker slots per face as barycentric weights (sum 9) over FACE_VERTICES:
 * weight 7 = tip, 5 = axial centre, 4/4 = edge. Order is stable for storage.
 */
export const SLOTS: readonly (readonly [number, number, number])[] = [
  [7, 1, 1],
  [5, 2, 2],
  [4, 4, 1],
  [4, 1, 4],
  [2, 5, 2],
  [2, 2, 5],
  [1, 7, 1],
  [1, 4, 4],
  [1, 1, 7],
];
export type PyraminxState = Readonly<
  Record<PyraminxFace, readonly PyraminxColor[]>
>;
export type PyraminxMove = Readonly<{
  vertex: Vertex;
  /** Tip only (u) or tip plus the adjacent layer (U). */
  tip: boolean;
  turns: 1 | -1;
}>;
export class PyraminxNotationError extends Error {
  constructor(
    readonly token: string,
    readonly index: number,
  ) {
    super(`Ký hiệu Pyraminx không hợp lệ ở vị trí ${index + 1}: ${token}`);
  }
}
/** WCA 12e: U/L/R/B two-layer turns, u/l/r/b tips, ' for anticlockwise. */
export function parsePyraminxAlgorithm(text: string): PyraminxMove[] {
  if (typeof text !== "string" || text.length > 2048)
    throw new PyraminxNotationError("", 0);
  const tokens = text.trim() ? text.trim().split(/\s+/) : [];
  if (tokens.length > 256) throw new PyraminxNotationError(tokens[256], 256);
  return tokens.map((token, index) => {
    const match = /^([ULRBulrb])(')?$/.exec(token);
    if (!match) throw new PyraminxNotationError(token, index);
    return Object.freeze({
      vertex: match[1].toUpperCase() as Vertex,
      tip: match[1] !== match[1].toUpperCase(),
      turns: match[2] ? -1 : 1,
    });
  });
}
export const serializePyraminxMove = (m: PyraminxMove) =>
  (m.tip ? m.vertex.toLowerCase() : m.vertex) + (m.turns === -1 ? "'" : "");
export function solvedPyraminx(): PyraminxState {
  return Object.freeze(
    Object.fromEntries(
      PYRAMINX_FACES.map((f) => [
        f,
        Object.freeze(Array(9).fill(PYRAMINX_COLORS[f])),
      ]),
    ) as Record<PyraminxFace, readonly PyraminxColor[]>,
  );
}
export const isPyraminxSolved = (s: PyraminxState) =>
  PYRAMINX_FACES.every((f) => s[f].every((c) => c === PYRAMINX_COLORS[f]));
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** −120° about the vertex axis: clockwise when looking at that corner. */
function rotate(p: Vec, v: Vec): Vec {
  // For axis (sx,sy,sz) with |s|=1 each, conjugate the (x,y,z)→(y,z,x) cycle by the signs.
  const q: Vec = [p[0] * v[0], p[1] * v[1], p[2] * v[2]];
  const r: Vec = [q[1], q[2], q[0]];
  return [r[0] * v[0], r[1] * v[1], r[2] * v[2]];
}
const point = (face: PyraminxFace, slot: readonly number[]): Vec => {
  const vs = FACE_VERTICES[face].map((v) => VERTICES[v]);
  return [0, 1, 2].map((k) =>
    slot.reduce((sum, w, i) => sum + w * vs[i][k], 0),
  ) as unknown as Vec;
};
const SLOT_INDEX = new Map(SLOTS.map((s, i) => [s.join(), i]));
export function applyPyraminxMove(
  state: PyraminxState,
  move: PyraminxMove,
): PyraminxState {
  const axis = VERTICES[move.vertex],
    // Cuts sit at weight 6 (tip) and 3 (layer) on the turned corner: P·V = 4w − 9.
    limit = move.tip ? 15 : 3,
    next = Object.fromEntries(
      PYRAMINX_FACES.map((f) => [f, [...state[f]]]),
    ) as Record<PyraminxFace, PyraminxColor[]>;
  for (const face of PYRAMINX_FACES)
    SLOTS.forEach((slot, index) => {
      let p = point(face, slot);
      if (dot(p, axis) <= limit) return;
      for (let t = 0; t < (move.turns === 1 ? 1 : 2); t++) p = rotate(p, axis);
      const target = PYRAMINX_FACES.find(
        (f) => dot(p, VERTICES[OPPOSITE[f]]) === -9,
      )!;
      const weights = FACE_VERTICES[target].map(
        (v) => (dot(p, VERTICES[v]) + 9) / 4,
      );
      next[target][SLOT_INDEX.get(weights.join())!] = state[face][index];
    });
  return Object.freeze(
    Object.fromEntries(
      PYRAMINX_FACES.map((f) => [f, Object.freeze(next[f])]),
    ) as Record<PyraminxFace, readonly PyraminxColor[]>,
  );
}
export const applyPyraminxAlgorithm = (
  state: PyraminxState,
  moves: readonly PyraminxMove[],
) => moves.reduce(applyPyraminxMove, state);
export const invertPyraminxAlgorithm = (moves: readonly PyraminxMove[]) =>
  [...moves]
    .reverse()
    .map((m) => Object.freeze({ ...m, turns: -m.turns as 1 | -1 }));
