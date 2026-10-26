import { FACE_ORDER } from "../core/constants";
import { serializeAlgorithm, type CubeAlgorithm } from "../core/notation";
import type { CubeFace } from "../core/types";

export const SCRAMBLE_LENGTH = 25;
export type RandomIndex = (upperExclusive: number) => number;
export type PracticeScramble = Readonly<{
  kind: "random-move-3x3";
  moves: CubeAlgorithm;
  notation: string;
}>;
const AXIS: Record<CubeFace, string> = {
  U: "y",
  D: "y",
  R: "x",
  L: "x",
  F: "z",
  B: "z",
};

/** Rejection sampling avoids modulo bias; called only on explicit client generation. */
export function secureRandomIndex(upperExclusive: number): number {
  if (
    !Number.isSafeInteger(upperExclusive) ||
    upperExclusive < 1 ||
    upperExclusive > 0x100000000
  )
    throw new RangeError("Invalid random range.");
  const values = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / upperExclusive) * upperExclusive;
  do {
    globalThis.crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return values[0] % upperExclusive;
}

/** Practice random-move generator. No claim of uniform random-state or competition use. */
export function generatePracticeScramble(
  randomIndex: RandomIndex = secureRandomIndex,
): PracticeScramble {
  const choose = (size: number) => {
    const value = randomIndex(size);
    if (!Number.isInteger(value) || value < 0 || value >= size)
      throw new RangeError("Random source returned an invalid index.");
    return value;
  };
  const moves = [];
  let previousAxis = "";
  for (let index = 0; index < SCRAMBLE_LENGTH; index++) {
    const eligible = FACE_ORDER.filter((face) => AXIS[face] !== previousAxis);
    const face = eligible[choose(eligible.length)];
    const turns = ([1, -1, 2] as const)[choose(3)];
    moves.push(Object.freeze({ face, turns }));
    previousAxis = AXIS[face];
  }
  const frozen = Object.freeze(moves);
  return Object.freeze({
    kind: "random-move-3x3",
    moves: frozen,
    notation: serializeAlgorithm(frozen),
  });
}
