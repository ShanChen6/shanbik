import { parseMegaminxScramble } from "../megaminx/notation";
import { parseNxnAlgorithm } from "../nxn/model";
import { parsePyraminxAlgorithm } from "../pyraminx/model";
import type { ScramblePuzzle } from "./protocol";
/**
 * Checks library output against ShanBik's own grammar for that puzzle before
 * it is shown; returns the canonical one-line form or throws.
 */
export function validateScramble(puzzle: ScramblePuzzle, text: string): string {
  if (typeof text !== "string") throw Error("Invalid scramble");
  const line = text.trim().split(/\s+/).join(" ");
  switch (puzzle) {
    case "2x2": {
      const moves = parseNxnAlgorithm(line, 2);
      if (moves.length < 4 || moves.length > 30)
        throw Error("Invalid scramble");
      break;
    }
    case "4x4": {
      const moves = parseNxnAlgorithm(line, 4);
      if (
        moves.length < 30 ||
        moves.length > 60 ||
        moves.some((m) => m.depth > 2)
      )
        throw Error("Invalid scramble");
      break;
    }
    case "pyraminx": {
      const moves = parsePyraminxAlgorithm(line);
      if (moves.length < 6 || moves.length > 20)
        throw Error("Invalid scramble");
      break;
    }
    case "megaminx":
      parseMegaminxScramble(line);
      break;
  }
  return line;
}
