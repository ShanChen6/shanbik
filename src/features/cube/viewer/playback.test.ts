import { describe, expect, it } from "vitest";
import { applyAlgorithm, applyAlgorithmText } from "../core/moves";
import { parseAlgorithm } from "../core/notation";
import { createSolvedCubeState, isCubeSolved } from "../core/state";
import { createMoveQueuePlayer, MAX_QUEUE_MOVES } from "./move-queue";

const initial = applyAlgorithmText(createSolvedCubeState(), "F R2 D'");
const moves = parseAlgorithm("R U R' U' F2 D L' B2");
const expected = (cursor: number) => applyAlgorithm(initial, moves.slice(0, cursor));
type Player = ReturnType<typeof createMoveQueuePlayer>;

function finishOne(player: Player) {
  const id = player.getSnapshot().active!.id;
  expect(player.complete(id)).toBe(true);
  expect(player.complete(id)).toBe(false);
}
function drain(player: Player) {
  let count = 0;
  while (player.getSnapshot().active) {
    expect(count++).toBeLessThan(MAX_QUEUE_MOVES + 1);
    finishOne(player);
  }
}

describe("sequence playback on the queue state owner", () => {
  it.each([false, true])("forward/backward match every core prefix, reducedMotion=%s", (reduced) => {
    const player = createMoveQueuePlayer(initial);
    player.setReducedMotion(reduced);
    player.loadSequence(moves);
    expect(player.getSnapshot().state).toEqual(initial);
    expect(player.stepBackward()).toBe(false);
    for (let cursor = 1; cursor <= moves.length; cursor++) {
      expect(player.stepForward()).toBe(true);
      if (!reduced) {
        expect(player.getSnapshot().playback!.cursor).toBe(cursor - 1);
        expect(player.getSnapshot().state).toEqual(expected(cursor - 1));
        finishOne(player);
      }
      expect(player.getSnapshot().state).toEqual(expected(cursor));
      expect(player.getSnapshot().playback!.cursor).toBe(cursor);
    }
    expect(player.stepForward()).toBe(false);
    expect(player.play()).toBe(false);
    for (let cursor = moves.length - 1; cursor >= 0; cursor--) {
      expect(player.stepBackward()).toBe(true);
      if (!reduced) {
        expect(player.getSnapshot().playback!.step).toBe(-1);
        finishOne(player);
      }
      expect(player.getSnapshot().state).toEqual(expected(cursor));
      expect(player.getSnapshot().playback!.cursor).toBe(cursor);
    }
    expect(player.stepBackward()).toBe(false);
    expect(player.getSnapshot().state).toEqual(initial);
  });

  it("pause commits the in-flight move then holds the exact prefix until play", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.play();
    const id = player.getSnapshot().active!.id;
    player.pausePlayback();
    expect(player.getSnapshot().active!.id).toBe(id);
    finishOne(player);
    expect(player.getSnapshot()).toMatchObject({ state: expected(1), active: null, playback: { cursor: 1, playing: false, step: 0 } });
    player.play(); drain(player);
    expect(player.getSnapshot()).toMatchObject({ state: expected(moves.length), active: null, playback: { cursor: moves.length, playing: false } });
  });

  it("reset player restores a non-solved initial snapshot and keeps the sequence", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.play(); finishOne(player);
    const stale = player.getSnapshot().active!.id;
    player.resetPlayback();
    expect(player.getSnapshot()).toMatchObject({ state: initial, active: null, playback: { moves, cursor: 0, playing: false, step: 0 } });
    expect(isCubeSolved(player.getSnapshot().state)).toBe(false);
    player.stepForward();
    expect(player.getSnapshot().active!.id).toBeGreaterThan(stale);
    expect(player.complete(stale)).toBe(false);
    finishOne(player);
    expect(player.getSnapshot().state).toEqual(expected(1));
  });

  it("reset solved is separate and removes the loaded sequence", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.play(); player.reset();
    expect(player.getSnapshot()).toMatchObject({ state: createSolvedCubeState(), active: null, playback: null, completed: 0 });
    expect(player.play()).toBe(false);
  });

  it("rapid step/play controls cannot overlap an active transaction", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.stepForward();
    const before = player.getSnapshot();
    for (let i = 0; i < 50; i++) {
      expect(player.stepForward()).toBe(false);
      expect(player.stepBackward()).toBe(false);
      expect(player.play()).toBe(false);
    }
    expect(player.getSnapshot()).toBe(before);
    finishOne(player);
    expect(player.getSnapshot().playback!.cursor).toBe(1);
    expect(player.getSnapshot().state).toEqual(expected(1));
  });

  it("manual FIFO commands cannot compete with loaded playback", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves);
    const before = player.getSnapshot();
    expect(player.enqueue(moves)).toBe(false);
    expect(player.start(moves[0])).toBe(false);
    expect(player.pause()).toBe(false);
    expect(player.resume()).toBe(false);
    expect(player.getSnapshot()).toBe(before);
    player.exitPlayback();
    expect(player.enqueue(moves)).toBe(true);
  });

  it("load replaces old work atomically at the last committed state", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.play(); finishOne(player);
    const stale = player.getSnapshot().active!.id;
    const replacement = parseAlgorithm("D2 B'");
    player.loadSequence(replacement);
    expect(player.getSnapshot()).toMatchObject({ state: expected(1), active: null, pending: [], playback: { initial: expected(1), moves: replacement, cursor: 0 } });
    expect(player.complete(stale)).toBe(false);
    player.play(); drain(player);
    expect(player.getSnapshot().state).toEqual(applyAlgorithm(expected(1), replacement));
  });

  it("malformed or oversized replacement does not change the current snapshot", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.play();
    const before = player.getSnapshot();
    expect(() => player.loadSequence([{ face: "M", turns: 1 }] as never)).toThrow();
    expect(player.loadSequence(Array(MAX_QUEUE_MOVES + 1).fill(moves[0]))).toBe(false);
    expect(player.getSnapshot()).toBe(before);
  });

  it("empty and unloaded sequences are safe no-ops at step boundaries", () => {
    const player = createMoveQueuePlayer(initial);
    expect(player.play()).toBe(false);
    expect(player.stepForward()).toBe(false);
    expect(player.stepBackward()).toBe(false);
    expect(player.resetPlayback()).toBe(false);
    expect(player.exitPlayback()).toBe(false);
    player.loadSequence([]);
    expect(player.play()).toBe(false);
    expect(player.stepForward()).toBe(false);
    expect(player.stepBackward()).toBe(false);
    expect(player.pausePlayback()).toBe(false);
    player.resetPlayback();
    expect(player.getSnapshot().state).toEqual(initial);
  });

  it("route/context cancellation preserves the committed prefix for safe resume", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.play(); finishOne(player);
    const stale = player.getSnapshot().active!.id;
    player.cancel();
    expect(player.getSnapshot()).toMatchObject({ state: expected(1), active: null, playback: { cursor: 1, playing: false, step: 0 } });
    player.play();
    expect(player.complete(stale)).toBe(false);
    expect(player.cancel(stale)).toBe(false);
    drain(player);
    expect(player.getSnapshot().state).toEqual(expected(moves.length));
  });

  it("exit during animation retains the committed state and rejects old completion", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.play(); finishOne(player);
    const stale = player.getSnapshot().active!.id;
    player.exitPlayback();
    expect(player.getSnapshot()).toMatchObject({ state: expected(1), playback: null, active: null });
    expect(player.complete(stale)).toBe(false);
    player.enqueue(parseAlgorithm("U2")); drain(player);
    expect(player.getSnapshot().state).toEqual(applyAlgorithmText(expected(1), "U2"));
  });

  it("reduced motion while auto-playing finishes each remaining move once", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.play();
    const stale = player.getSnapshot().active!.id;
    player.setReducedMotion(true);
    expect(player.getSnapshot()).toMatchObject({ state: expected(moves.length), active: null, playback: { cursor: moves.length, playing: false, step: 0 } });
    expect(player.complete(stale)).toBe(false);
    player.resetPlayback();
    player.play();
    expect(player.getSnapshot().state).toEqual(expected(moves.length));
  });

  it("reduced motion during a backward step moves the cursor backward and stays stopped", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.stepForward(); finishOne(player);
    player.stepBackward();
    const stale = player.getSnapshot().active!.id;
    player.setReducedMotion(true);
    expect(player.complete(stale)).toBe(false);
    expect(player.getSnapshot()).toMatchObject({ state: initial, active: null, playback: { cursor: 0, playing: false, step: 0 } });
  });

  it("reset during backward animation invalidates that inverse completion", () => {
    const player = createMoveQueuePlayer(initial);
    player.loadSequence(moves); player.stepForward(); finishOne(player);
    player.stepForward(); finishOne(player);
    player.stepBackward();
    const stale = player.getSnapshot().active!.id;
    player.resetPlayback();
    expect(player.complete(stale)).toBe(false);
    expect(player.getSnapshot()).toMatchObject({ state: initial, playback: { cursor: 0 } });
  });

  it("preserves immutable snapshots, copied input and one notification per completion", () => {
    const player = createMoveQueuePlayer(initial);
    const input = [...moves];
    let notifications = 0;
    const unsubscribe = player.subscribe(() => notifications++);
    player.loadSequence(input); input.pop();
    expect(player.getSnapshot().playback!.moves).toEqual(moves);
    expect(Object.isFrozen(player.getSnapshot().playback)).toBe(true);
    expect(Object.isFrozen(player.getSnapshot().playback!.moves)).toBe(true);
    player.stepForward();
    expect(notifications).toBe(2);
    finishOne(player);
    expect(notifications).toBe(3);
    unsubscribe(); player.resetPlayback();
    expect(notifications).toBe(3);
  });
});
