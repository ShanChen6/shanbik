import { describe, expect, it } from "vitest";
import {
  applyAlgorithm,
  applyAlgorithmText,
  applyMove,
  invertAlgorithm,
} from "../core/moves";
import { parseAlgorithm, type CubeMove } from "../core/notation";
import { createSolvedCubeState } from "../core/state";
import { createMoveQueuePlayer, MAX_QUEUE_MOVES } from "./move-queue";

const initial = applyAlgorithmText(createSolvedCubeState(), "F U2 L' B D2");
const sequence = parseAlgorithm("R U F' D2 L B' U2 R2 F D' L2 B2");

function finish(player: ReturnType<typeof createMoveQueuePlayer>) {
  const ids = new Set<number>();
  while (player.getSnapshot().active) {
    const id = player.getSnapshot().active!.id;
    expect(ids.has(id)).toBe(false);
    ids.add(id);
    expect(player.complete(id)).toBe(true);
    expect(player.complete(id)).toBe(false);
  }
}

describe("FIFO move queue", () => {
  it.each([false, true])(
    "applies a batch in order with reducedMotion=%s",
    (reduced) => {
      const player = createMoveQueuePlayer(initial);
      player.setReducedMotion(reduced);
      expect(player.enqueue(sequence)).toBe(true);
      if (!reduced) {
        let expected = initial;
        for (const move of sequence) {
          expect(player.getSnapshot().active!.move).toEqual(move);
          expect(player.getSnapshot().state).toEqual(expected);
          expected = applyMove(expected, move);
          player.complete(player.getSnapshot().active!.id);
        }
      }
      expect(player.getSnapshot()).toMatchObject({
        state: applyAlgorithm(initial, sequence),
        active: null,
        pending: [],
        completed: sequence.length,
        paused: false,
      });
    },
  );
  it("appends rapid input after existing pending moves without replacing the active ID", () => {
    const player = createMoveQueuePlayer(initial);
    player.enqueue(sequence.slice(0, 2));
    const id = player.getSnapshot().active!.id;
    for (const move of sequence.slice(2)) player.enqueue([move]);
    expect(player.getSnapshot().active!.id).toBe(id);
    expect(player.getSnapshot().pending).toEqual(sequence.slice(1));
    finish(player);
    expect(player.getSnapshot().state).toEqual(
      applyAlgorithm(initial, sequence),
    );
    expect(player.getSnapshot().completed).toBe(sequence.length);
  });
  it("pause finishes the current move, then holds all pending moves until resume", () => {
    const player = createMoveQueuePlayer(initial);
    player.enqueue(sequence.slice(0, 3));
    const id = player.getSnapshot().active!.id;
    player.pause();
    expect(player.getSnapshot().active!.id).toBe(id);
    expect(player.getSnapshot().state).toEqual(initial);
    player.complete(id);
    expect(player.getSnapshot()).toMatchObject({
      state: applyMove(initial, sequence[0]),
      active: null,
      pending: sequence.slice(1, 3),
      paused: true,
      completed: 1,
    });
    player.enqueue(sequence.slice(3));
    expect(player.getSnapshot().active).toBeNull();
    player.resume();
    const nextId = player.getSnapshot().active!.id;
    expect(player.resume()).toBe(false);
    expect(player.getSnapshot().active!.id).toBe(nextId);
    finish(player);
    expect(player.getSnapshot().state).toEqual(
      applyAlgorithm(initial, sequence),
    );
  });
  it("resume before current completion does not create a second active move", () => {
    const player = createMoveQueuePlayer();
    player.enqueue(sequence);
    const active = player.getSnapshot().active;
    for (let i = 0; i < 20; i++) {
      player.pause();
      player.resume();
    }
    expect(player.getSnapshot().active).toBe(active);
    finish(player);
    expect(player.getSnapshot().completed).toBe(sequence.length);
  });
  it("cancel retains only committed moves and rejects stale callbacks after restart", () => {
    const player = createMoveQueuePlayer(initial);
    player.enqueue(sequence);
    player.complete(player.getSnapshot().active!.id);
    const stale = player.getSnapshot().active!.id;
    player.cancel();
    const committed = applyMove(initial, sequence[0]);
    expect(player.getSnapshot()).toMatchObject({
      state: committed,
      active: null,
      pending: [],
      completed: 1,
      paused: false,
    });
    player.enqueue(sequence.slice(5, 7));
    const fresh = player.getSnapshot().active!.id;
    expect(fresh).toBeGreaterThan(stale);
    expect(player.complete(stale)).toBe(false);
    expect(player.cancel(stale)).toBe(false);
    finish(player);
    expect(player.getSnapshot().state).toEqual(
      applyAlgorithm(committed, sequence.slice(5, 7)),
    );
  });
  it("reset clears active, pending and pause without reusing IDs", () => {
    const player = createMoveQueuePlayer(initial);
    player.enqueue(sequence);
    player.pause();
    const stale = player.getSnapshot().active!.id;
    player.reset();
    expect(player.getSnapshot()).toMatchObject({
      state: createSolvedCubeState(),
      active: null,
      pending: [],
      paused: false,
      completed: 0,
    });
    player.enqueue(sequence.slice(2, 4));
    expect(player.getSnapshot().active!.id).toBeGreaterThan(stale);
    expect(player.complete(stale)).toBe(false);
    finish(player);
    expect(player.getSnapshot().state).toEqual(
      applyAlgorithm(createSolvedCubeState(), sequence.slice(2, 4)),
    );
  });
  it("a late callback cannot advance the queue twice", () => {
    const player = createMoveQueuePlayer();
    player.enqueue(sequence);
    const id = player.getSnapshot().active!.id;
    player.complete(id);
    const next = player.getSnapshot();
    expect(player.complete(id)).toBe(false);
    expect(player.getSnapshot()).toBe(next);
  });
  it("drains 2000 animated moves in bounded batches and returns through their inverse", () => {
    const player = createMoveQueuePlayer(initial);
    const forward = Array.from(
      { length: 1000 },
      (_, index) => sequence[index % sequence.length],
    );
    const all = [...forward, ...invertAlgorithm(forward)];
    for (let offset = 0; offset < all.length; offset += 200) {
      player.enqueue(all.slice(offset, offset + 200));
      finish(player);
    }
    expect(player.getSnapshot()).toMatchObject({
      state: initial,
      active: null,
      pending: [],
      completed: 2000,
    });
  });
  it("capacity rejects an entire batch without partial enqueue or state changes", () => {
    const player = createMoveQueuePlayer();
    const full = Array(MAX_QUEUE_MOVES).fill(sequence[0]);
    player.enqueue(full);
    expect(player.getSnapshot().pending.length).toBe(MAX_QUEUE_MOVES - 1);
    const before = player.getSnapshot();
    expect(player.enqueue([sequence[1]])).toBe(false);
    expect(player.getSnapshot()).toBe(before);
    player.complete(before.active!.id);
    expect(player.enqueue([sequence[1]])).toBe(true);
    expect(player.getSnapshot().pending.at(-1)).toEqual(sequence[1]);
  });
  it.each([
    null,
    [{}],
    [{ face: "R", turns: 0 }],
    [sequence[0], { face: "M", turns: 1 }],
  ])("rejects invalid batch %j atomically", (batch) => {
    const player = createMoveQueuePlayer();
    const before = player.getSnapshot();
    expect(() => player.enqueue(batch as never)).toThrow();
    expect(player.getSnapshot()).toBe(before);
  });
  it("empty batches do not notify and queued moves are frozen copies", () => {
    const player = createMoveQueuePlayer();
    let changes = 0;
    player.subscribe(() => changes++);
    player.enqueue([]);
    expect(changes).toBe(0);
    const input: CubeMove[] = [
      { face: "R", turns: 1 },
      { face: "U", turns: -1 },
    ];
    player.enqueue(input);
    input[0] = { face: "B", turns: 2 };
    input.pop();
    expect(player.getSnapshot().active!.move).toEqual({ face: "R", turns: 1 });
    expect(Object.isFrozen(player.getSnapshot().pending)).toBe(true);
    expect(Object.isFrozen(player.getSnapshot().pending[0])).toBe(true);
    finish(player);
    expect(player.getSnapshot().state).toEqual(
      applyAlgorithmText(createSolvedCubeState(), "R U'"),
    );
  });
  it("completion publishes the next active ID atomically with one notification", () => {
    const player = createMoveQueuePlayer();
    const states: ReturnType<typeof player.getSnapshot>[] = [];
    const unsubscribe = player.subscribe(() =>
      states.push(player.getSnapshot()),
    );
    player.enqueue(sequence);
    player.complete(player.getSnapshot().active!.id);
    expect(states).toHaveLength(2);
    expect(states[1]).toMatchObject({
      active: { move: sequence[1] },
      completed: 1,
      pending: sequence.slice(2),
    });
    unsubscribe();
    player.cancel();
    expect(states).toHaveLength(2);
  });
  it("switching to reduced motion commits active and drains pending once", () => {
    const player = createMoveQueuePlayer(initial);
    player.enqueue(sequence);
    const id = player.getSnapshot().active!.id;
    player.setReducedMotion(true);
    expect(player.complete(id)).toBe(false);
    expect(player.getSnapshot()).toMatchObject({
      state: applyAlgorithm(initial, sequence),
      completed: sequence.length,
      active: null,
      pending: [],
    });
    player.setReducedMotion(true);
    expect(player.getSnapshot().completed).toBe(sequence.length);
  });
  it("reduced motion respects a paused boundary and resumes pending moves later", () => {
    const player = createMoveQueuePlayer(initial);
    player.enqueue(sequence);
    player.pause();
    player.setReducedMotion(true);
    expect(player.getSnapshot()).toMatchObject({
      active: null,
      completed: 1,
      pending: sequence.slice(1),
      paused: true,
    });
    player.setReducedMotion(false);
    expect(player.getSnapshot().active).toBeNull();
    player.resume();
    expect(player.getSnapshot().active!.move).toEqual(sequence[1]);
    finish(player);
    expect(player.getSnapshot().state).toEqual(
      applyAlgorithm(initial, sequence),
    );
  });
  it("a paused empty queue can stage an instant batch without applying it early", () => {
    const player = createMoveQueuePlayer(initial);
    player.pause();
    player.setReducedMotion(true);
    player.enqueue(sequence);
    expect(player.getSnapshot()).toMatchObject({
      state: initial,
      completed: 0,
      active: null,
      pending: sequence,
    });
    player.resume();
    expect(player.getSnapshot().state).toEqual(
      applyAlgorithm(initial, sequence),
    );
    expect(player.getSnapshot().completed).toBe(sequence.length);
  });
});
