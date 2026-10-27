// Backward-compatible single-move entry point; the queue is the sole state owner.
export { createMoveQueuePlayer as createSingleMovePlayer } from "./move-queue";
export type { MoveAnimation, MoveSnapshot } from "./move-queue";

/** Absolute elapsed time, never accumulated mesh rotations. */
export function sampleMoveAngle(
  angle: number,
  elapsedMs: number,
  durationMs = 360,
) {
  const progress = Math.max(0, Math.min(1, elapsedMs / durationMs));
  if (progress === 0) return { angle: 0, done: false };
  return {
    angle: angle * progress * progress * (3 - 2 * progress),
    done: progress === 1,
  };
}
