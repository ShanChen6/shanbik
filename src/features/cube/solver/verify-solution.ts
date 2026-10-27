import { applyAlgorithm } from "../core/moves";
import {
  parseAlgorithm,
  serializeAlgorithm,
  type CubeAlgorithm,
} from "../core/notation";
import { isCubeSolved } from "../core/state";
import type { CubeState } from "../core/types";
import { MAX_SOLUTION_MOVES, MAX_SOLUTION_TEXT } from "./protocol";
export type VerifiedSolution = Readonly<{
  initial: CubeState;
  serialization: string;
  moves: CubeAlgorithm;
  notation: string;
}>;
export function verifySolution(
  initial: CubeState,
  serialization: string,
  text: unknown,
): VerifiedSolution {
  if (typeof text !== "string" || text.length > MAX_SOLUTION_TEXT)
    throw Error("INVALID_RESULT");
  const moves = parseAlgorithm(text);
  if (
    moves.length > MAX_SOLUTION_MOVES ||
    !isCubeSolved(applyAlgorithm(initial, moves))
  )
    throw Error("INVALID_RESULT");
  return Object.freeze({
    initial,
    serialization,
    moves,
    notation: serializeAlgorithm(moves),
  });
}
