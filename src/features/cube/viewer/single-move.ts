import { applyMove } from "../core/moves";
import { serializeAlgorithm, type CubeMove } from "../core/notation";
import { createCubeState, createSolvedCubeState } from "../core/state";
import type { CubeState } from "../core/types";

export type MoveAnimation = Readonly<{ id: number; move: CubeMove }>;
export type MoveSnapshot = Readonly<{
  state: CubeState;
  active: MoveAnimation | null;
  completed: number;
}>;

/** One committed puzzle state. Frames never update this store; IDs reject stale completions. */
export function createSingleMovePlayer(initial = createSolvedCubeState()) {
  let snapshot: MoveSnapshot = Object.freeze({
    state: createCubeState(initial),
    active: null,
    completed: 0,
  });
  const serverSnapshot = snapshot;
  const listeners = new Set<() => void>();
  let nextId = 0;
  const publish = (value: MoveSnapshot) => {
    snapshot = Object.freeze(value);
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start(move: CubeMove, reducedMotion = false) {
      if (snapshot.active) return false;
      serializeAlgorithm([move]);
      const copy = Object.freeze({ ...move });
      const id = ++nextId;
      if (reducedMotion) {
        publish({
          state: applyMove(snapshot.state, copy),
          active: null,
          completed: snapshot.completed + 1,
        });
      } else {
        publish({ ...snapshot, active: Object.freeze({ id, move: copy }) });
      }
      return true;
    },
    complete(id: number) {
      if (snapshot.active?.id !== id) return false;
      const state = applyMove(snapshot.state, snapshot.active.move);
      publish({ state, active: null, completed: snapshot.completed + 1 });
      return true;
    },
    cancel(id?: number) {
      if (!snapshot.active || (id !== undefined && snapshot.active.id !== id))
        return false;
      publish({ ...snapshot, active: null });
      return true;
    },
    reset() {
      publish({ state: createSolvedCubeState(), active: null, completed: 0 });
    },
  };
}

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
