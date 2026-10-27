import { validateCubeFeasibility } from "../core/feasibility";
import { serializeAlgorithm } from "../core/notation";
import type { createMoveQueuePlayer } from "../viewer/move-queue";
import { verifySolution, type VerifiedSolution } from "./verify-solution";

/** Validate everything before atomically replacing the viewer state and sequence. */
export function loadSolution(
  player: ReturnType<typeof createMoveQueuePlayer>,
  solution: VerifiedSolution,
): boolean {
  try {
    const report = validateCubeFeasibility(solution.initial);
    if (!report.valid || report.serialization !== solution.serialization)
      return false;
    const verified = verifySolution(
      report.state,
      report.serialization,
      serializeAlgorithm(solution.moves),
    );
    if (!verified.moves.length) return false;
    return player.loadSequence(verified.moves, verified.initial);
  } catch {
    return false;
  }
}
