import { applyAlgorithm, applyMove, invertMove } from "../core/moves";
import {
  serializeAlgorithm,
  type CubeAlgorithm,
  type CubeMove,
} from "../core/notation";
import { createCubeState, createSolvedCubeState } from "../core/state";
import type { CubeState } from "../core/types";

export type MoveAnimation = Readonly<{ id: number; move: CubeMove }>;
export type PlaybackSnapshot = Readonly<{
  moves: CubeAlgorithm;
  initial: CubeState;
  cursor: number;
  playing: boolean;
  step: -1 | 0 | 1;
}>;
export type MoveSnapshot = Readonly<{
  state: CubeState;
  active: MoveAnimation | null;
  completed: number;
  pending: CubeAlgorithm;
  paused: boolean;
  playback: PlaybackSnapshot | null;
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
    playback: null,
  });
  const serverSnapshot = snapshot;
  const listeners = new Set<() => void>();
  let nextId = 0;
  let reducedMotion = false;
  const publish = (value: MoveSnapshot) => {
    snapshot = Object.freeze(value);
    listeners.forEach((listener) => listener());
  };
  const playbackStep = (
    value: MoveSnapshot,
    direction: -1 | 1,
  ): MoveSnapshot => {
    const playback = value.playback!;
    const move =
      direction === 1
        ? playback.moves[playback.cursor]
        : invertMove(playback.moves[playback.cursor - 1]);
    if (reducedMotion)
      return {
        ...value,
        state: applyMove(value.state, move),
        completed: value.completed + 1,
        playback: Object.freeze({
          ...playback,
          cursor: playback.cursor + direction,
          step: 0,
        }),
      };
    return {
      ...value,
      active: Object.freeze({ id: ++nextId, move }),
      playback: Object.freeze({ ...playback, step: direction }),
    };
  };
  const settle = (value: MoveSnapshot): MoveSnapshot => {
    const active = value.active!;
    const playback = value.playback;
    return {
      ...value,
      state: applyMove(value.state, active.move),
      active: null,
      completed: value.completed + 1,
      playback: playback
        ? Object.freeze({
            ...playback,
            cursor: playback.cursor + playback.step,
            step: 0,
          })
        : null,
    };
  };
  const advance = (value: MoveSnapshot): MoveSnapshot => {
    if (value.active) return value;
    if (value.playback) {
      const playback = value.playback;
      if (!playback.playing) return value;
      if (reducedMotion) {
        let state = value.state;
        for (const move of playback.moves.slice(playback.cursor))
          state = applyMove(state, move);
        return {
          ...value,
          state,
          completed: value.completed + playback.moves.length - playback.cursor,
          playback: Object.freeze({
            ...playback,
            cursor: playback.moves.length,
            playing: false,
            step: 0,
          }),
        };
      }
      if (playback.cursor === playback.moves.length)
        return {
          ...value,
          playback: Object.freeze({ ...playback, playing: false }),
        };
      return playbackStep(value, 1);
    }
    if (value.paused || !value.pending.length) return value;
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
      if (snapshot.playback) return false;
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
      if (
        snapshot.playback ||
        snapshot.active ||
        snapshot.pending.length ||
        snapshot.paused
      )
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
      publish(advance(settle(snapshot)));
      return true;
    },
    pause() {
      if (snapshot.playback || snapshot.paused) return false;
      publish({ ...snapshot, paused: true });
      return true;
    },
    resume() {
      if (snapshot.playback || !snapshot.paused) return false;
      publish(advance({ ...snapshot, paused: false }));
      return true;
    },
    setReducedMotion(value: boolean) {
      if (reducedMotion === value) return false;
      reducedMotion = value;
      if (!value) return true;
      const next = snapshot.active ? settle(snapshot) : snapshot;
      const advanced = advance(next);
      if (advanced !== snapshot) publish(advanced);
      return true;
    },
    cancel(id?: number) {
      if (id !== undefined && snapshot.active?.id !== id) return false;
      if (!snapshot.active && !snapshot.pending.length && !snapshot.paused)
        return false;
      publish({
        ...snapshot,
        active: null,
        pending: EMPTY,
        paused: false,
        playback: snapshot.playback
          ? Object.freeze({ ...snapshot.playback, playing: false, step: 0 })
          : null,
      });
      return true;
    },
    loadSequence(moves: CubeAlgorithm, initial: CubeState = snapshot.state) {
      serializeAlgorithm(moves);
      if (moves.length > MAX_QUEUE_MOVES) return false;
      const baseline =
        initial === snapshot.state ? initial : createCubeState(initial);
      const copy = Object.freeze(
        moves.map((move) => Object.freeze({ ...move })),
      );
      publish({
        ...snapshot,
        active: null,
        pending: EMPTY,
        paused: false,
        state: baseline,
        playback: Object.freeze({
          moves: copy,
          initial: baseline,
          cursor: 0,
          playing: false,
          step: 0,
        }),
      });
      return true;
    },
    play() {
      const playback = snapshot.playback;
      if (
        !playback ||
        snapshot.active ||
        playback.playing ||
        playback.cursor >= playback.moves.length
      )
        return false;
      publish(
        advance({
          ...snapshot,
          playback: Object.freeze({ ...playback, playing: true }),
        }),
      );
      return true;
    },
    pausePlayback() {
      const playback = snapshot.playback;
      if (!playback?.playing) return false;
      publish({
        ...snapshot,
        playback: Object.freeze({ ...playback, playing: false }),
      });
      return true;
    },
    stepForward() {
      const playback = snapshot.playback;
      if (
        !playback ||
        snapshot.active ||
        playback.playing ||
        playback.cursor >= playback.moves.length
      )
        return false;
      publish(playbackStep(snapshot, 1));
      return true;
    },
    stepBackward() {
      const playback = snapshot.playback;
      if (
        !playback ||
        snapshot.active ||
        playback.playing ||
        playback.cursor === 0
      )
        return false;
      publish(playbackStep(snapshot, -1));
      return true;
    },
    /** Seek to a committed prefix; cancels partial animation and stays paused. */
    seekPlayback(cursor: number) {
      const playback = snapshot.playback;
      if (
        !playback ||
        !Number.isInteger(cursor) ||
        cursor < 0 ||
        cursor > playback.moves.length
      )
        return false;
      publish({
        ...snapshot,
        state: applyAlgorithm(
          playback.initial,
          playback.moves.slice(0, cursor),
        ),
        active: null,
        playback: Object.freeze({
          ...playback,
          cursor,
          playing: false,
          step: 0,
        }),
      });
      return true;
    },
    resetPlayback() {
      const playback = snapshot.playback;
      if (!playback) return false;
      publish({
        ...snapshot,
        state: playback.initial,
        active: null,
        playback: Object.freeze({
          ...playback,
          cursor: 0,
          playing: false,
          step: 0,
        }),
      });
      return true;
    },
    exitPlayback() {
      if (!snapshot.playback) return false;
      publish({ ...snapshot, active: null, playback: null });
      return true;
    },
    reset() {
      publish({
        state: createSolvedCubeState(),
        active: null,
        pending: EMPTY,
        paused: false,
        completed: 0,
        playback: null,
      });
    },
  };
}
