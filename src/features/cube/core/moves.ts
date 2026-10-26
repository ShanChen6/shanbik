import {
  FACE_ORDER,
  FACE_ORIENTATIONS,
  STICKERS_PER_FACE,
  TOTAL_STICKERS,
} from "./constants";
import {
  parseAlgorithm,
  serializeAlgorithm,
  type CubeAlgorithm,
  type CubeMove,
} from "./notation";
import { createCubeState } from "./state";
import type { CubeColor, CubeFace, CubeState } from "./types";

type Vector = readonly [number, number, number];
const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vector, b: Vector): Vector => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** Exact -90 degrees around the outward normal; integer arithmetic, no trig. */
function clockwise(vector: Vector, normal: Vector): Vector {
  const projection = dot(vector, normal);
  const product = cross(normal, vector);
  return [
    normal[0] * projection - product[0],
    normal[1] * projection - product[1],
    normal[2] * projection - product[2],
  ];
}
const key = (position: Vector, normal: Vector) =>
  `${position.join(",")}|${normal.join(",")}`;
const geometry = FACE_ORDER.flatMap((face) => {
  const { normal, right, down } = FACE_ORIENTATIONS[face];
  return Array.from({ length: STICKERS_PER_FACE }, (_, index) => {
    const column = (index % 3) - 1;
    const row = Math.floor(index / 3) - 1;
    const position: Vector = [
      normal[0] + column * right[0] + row * down[0],
      normal[1] + column * right[1] + row * down[1],
      normal[2] + column * right[2] + row * down[2],
    ];
    return { position, normal };
  });
});
const locations = new Map(
  geometry.map((sticker, index) => [
    key(sticker.position, sticker.normal),
    index,
  ]),
);
if (locations.size !== TOTAL_STICKERS)
  throw new Error("Cube face conventions contain duplicate sticker locations.");

function buildPermutation(face: CubeFace): readonly number[] {
  const axis = FACE_ORIENTATIONS[face].normal;
  const permutation = Array<number>(TOTAL_STICKERS).fill(-1);
  geometry.forEach(({ position, normal }, source) => {
    const affected = dot(position, axis) === 1;
    const destination = locations.get(
      key(
        affected ? clockwise(position, axis) : position,
        affected ? clockwise(normal, axis) : normal,
      ),
    );
    if (destination === undefined || permutation[destination] !== -1)
      throw new Error(`Invalid sticker permutation for face ${face}.`);
    permutation[destination] = source;
  });
  if (permutation.some((source) => source < 0))
    throw new Error(`Incomplete sticker permutation for face ${face}.`);
  return Object.freeze(permutation);
}
const PERMUTATIONS = Object.freeze(
  Object.fromEntries(
    FACE_ORDER.map((face) => [face, buildPermutation(face)]),
  ) as Record<CubeFace, readonly number[]>,
);

/** Validates the entire input before applying; returns a fresh immutable snapshot. */
export function applyAlgorithm(
  state: CubeState,
  moves: CubeAlgorithm,
): CubeState {
  const snapshot = createCubeState(state);
  // Share the runtime AST validation rules with the notation serializer.
  serializeAlgorithm(moves);
  let stickers: CubeColor[] = FACE_ORDER.flatMap((face) => [
    ...snapshot.faces[face],
  ]);
  for (const move of moves) {
    const repetitions = move.turns === -1 ? 3 : move.turns;
    const permutation = PERMUTATIONS[move.face];
    for (let turn = 0; turn < repetitions; turn++)
      stickers = permutation.map((source) => stickers[source]);
  }
  return createCubeState({
    faces: Object.fromEntries(
      FACE_ORDER.map((face, block) => [
        face,
        stickers.slice(
          block * STICKERS_PER_FACE,
          (block + 1) * STICKERS_PER_FACE,
        ),
      ]),
    ),
  });
}

export function applyMove(state: CubeState, move: CubeMove): CubeState {
  return applyAlgorithm(state, [move]);
}

export function applyAlgorithmText(
  state: CubeState,
  source: unknown,
): CubeState {
  return applyAlgorithm(state, parseAlgorithm(source));
}

function inverseDescriptor(move: CubeMove): CubeMove {
  return Object.freeze({
    face: move.face,
    turns: move.turns === 1 ? -1 : move.turns === -1 ? 1 : 2,
  });
}

export function invertMove(move: CubeMove): CubeMove {
  serializeAlgorithm([move]);
  return inverseDescriptor(move);
}

export function invertAlgorithm(moves: CubeAlgorithm): CubeAlgorithm {
  serializeAlgorithm(moves);
  return Object.freeze([...moves].reverse().map(inverseDescriptor));
}
