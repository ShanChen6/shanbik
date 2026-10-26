import { applyMove } from "../core/moves";
import {
  serializeAlgorithm,
  type CubeAlgorithm,
  type CubeMove,
} from "../core/notation";
import { createCubeState, createSolvedCubeState } from "../core/state";
import type { CubeState } from "../core/types";

export type MoveAnimation = Readonly<{ id: number; move: CubeMove }>;
export type MoveSnapshot = Readonly<{
  state: CubeState;
  active: MoveAnimation | null;
  completed: number;
  pending: CubeAlgorithm;
  paused: boolean;
}>;
export const MAX_QUEUE_MOVES = 256;
const EMPTY: CubeAlgorithm = Object.freeze([]);

/** Single owner of committed state, active move and FIFO. No timers or per-frame updates. */
export function createMoveQueuePlayer(initial = createSolvedCubeState()) {
  let snapshot: MoveSnapshot = Object.freeze({
    state: createCubeState(initial),
    active: null,
    completed: 0,
    pending: EMPTY,
    paused: false,
  });
  const serverSnapshot = snapshot;
  const listeners = new Set<() => void>();
  let nextId = 0;
  let reducedMotion = false;
  const publish = (value: MoveSnapshot) => {
    snapshot = Object.freeze(value);
    listeners.forEach((listener) => listener());
  };
  const advance = (value: MoveSnapshot): MoveSnapshot => {
    if (value.active || value.paused || !value.pending.length) return value;
    if (reducedMotion) {
      let state = value.state;
      for (const move of value.pending) state = applyMove(state, move);
      return {
        ...value,
        state,
        pending: EMPTY,
        completed: value.completed + value.pending.length,
      };
    }
    const [move, ...rest] = value.pending;
    return {
      ...value,
      active: Object.freeze({ id: ++nextId, move }),
      pending: Object.freeze(rest),
    };
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
    enqueue(moves: CubeAlgorithm) {
      serializeAlgorithm(moves); // Validate the entire batch before changing anything.
      if (
        snapshot.pending.length + (snapshot.active ? 1 : 0) + moves.length >
        MAX_QUEUE_MOVES
      )
        return false;
      if (!moves.length) return true;
      const copies = moves.map((move) => Object.freeze({ ...move }));
      publish(
        advance({
          ...snapshot,
          pending: Object.freeze([...snapshot.pending, ...copies]),
        }),
      );
      return true;
    },
    /** Compatibility entry point: a single move still rejects overlapping starts. */
    start(move: CubeMove, instant = reducedMotion) {
      if (snapshot.active || snapshot.pending.length || snapshot.paused)
        return false;
      serializeAlgorithm([move]);
      const copy = Object.freeze({ ...move });
      const id = ++nextId;
      if (instant)
        publish({
          ...snapshot,
          state: applyMove(snapshot.state, copy),
          active: null,
          completed: snapshot.completed + 1,
        });
      else publish({ ...snapshot, active: Object.freeze({ id, move: copy }) });
      return true;
    },
    complete(id: number) {
      if (snapshot.active?.id !== id) return false;
      const state = applyMove(snapshot.state, snapshot.active.move);
      publish(
        advance({
          ...snapshot,
          state,
          active: null,
          completed: snapshot.completed + 1,
        }),
      );
      return true;
    },
    pause() {
      if (snapshot.paused) return false;
      publish({ ...snapshot, paused: true });
      return true;
    },
    resume() {
      if (!snapshot.paused) return false;
      publish(advance({ ...snapshot, paused: false }));
      return true;
    },
    setReducedMotion(value: boolean) {
      if (reducedMotion === value) return false;
      reducedMotion = value;
      if (!value) return true;
      let next = snapshot;
      if (next.active)
        next = {
          ...next,
          state: applyMove(next.state, next.active.move),
          active: null,
          completed: next.completed + 1,
        };
      const advanced = advance(next);
      if (advanced !== snapshot) publish(advanced);
      return true;
    },
    cancel(id?: number) {
      if (id !== undefined && snapshot.active?.id !== id) return false;
      if (!snapshot.active && !snapshot.pending.length && !snapshot.paused)
        return false;
      publish({ ...snapshot, active: null, pending: EMPTY, paused: false });
      return true;
    },
    reset() {
      publish({
        state: createSolvedCubeState(),
        active: null,
        pending: EMPTY,
        paused: false,
        completed: 0,
      });
    },
  };
}
