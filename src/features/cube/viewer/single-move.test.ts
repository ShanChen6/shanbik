import { describe, expect, it } from "vitest";
import { FACE_ORDER } from "../core/constants";
import { applyAlgorithmText, applyMove, invertAlgorithm } from "../core/moves";
import { parseAlgorithm } from "../core/notation";
import { createSolvedCubeState, isCubeSolved } from "../core/state";
import { createSingleMovePlayer, sampleMoveAngle } from "./single-move";

const variants = FACE_ORDER.flatMap((face) =>
  ([1, -1, 2] as const).map((turns) => ({ face, turns })),
);
const initial = applyAlgorithmText(createSolvedCubeState(), "R U2 F' L D B2");

describe("single move transaction", () => {
  it.each(variants)(
    "$face/$turns commits exactly once at completion",
    (move) => {
      const player = createSingleMovePlayer(initial);
      const before = player.getSnapshot().state;
      expect(player.start(move)).toBe(true);
      expect(player.getSnapshot().state).toBe(before);
      expect(player.getSnapshot().completed).toBe(0);
      const id = player.getSnapshot().active!.id;
      expect(player.complete(id)).toBe(true);
      const completed = player.getSnapshot();
      expect(completed.state).toEqual(applyMove(initial, move));
      expect(completed.completed).toBe(1);
      expect(completed.active).toBeNull();
      expect(player.complete(id)).toBe(false);
      expect(player.getSnapshot()).toBe(completed);
    },
  );
  it.each(variants)(
    "$face/$turns reduced motion has the same result without a pending animation",
    (move) => {
      const player = createSingleMovePlayer(initial);
      player.start(move, true);
      expect(player.getSnapshot()).toMatchObject({
        state: applyMove(initial, move),
        active: null,
        completed: 1,
      });
    },
  );
  it("rejects overlapping starts instead of queuing them", () => {
    const player = createSingleMovePlayer();
    player.start({ face: "R", turns: 1 });
    const active = player.getSnapshot();
    for (const move of variants) expect(player.start(move)).toBe(false);
    expect(player.getSnapshot()).toBe(active);
    player.complete(active.active!.id);
    expect(player.getSnapshot().completed).toBe(1);
    expect(player.getSnapshot().active).toBeNull();
  });
  it("reset during animation invalidates old completion even after a new start", () => {
    const player = createSingleMovePlayer(initial);
    player.start({ face: "F", turns: -1 });
    const stale = player.getSnapshot().active!.id;
    player.reset();
    expect(isCubeSolved(player.getSnapshot().state)).toBe(true);
    player.start({ face: "U", turns: 2 });
    const fresh = player.getSnapshot().active!.id;
    expect(fresh).toBeGreaterThan(stale);
    expect(player.complete(stale)).toBe(false);
    expect(player.cancel(stale)).toBe(false);
    expect(player.getSnapshot().active!.id).toBe(fresh);
    player.complete(fresh);
    expect(player.getSnapshot().state).toEqual(
      applyAlgorithmText(createSolvedCubeState(), "U2"),
    );
    expect(player.getSnapshot().completed).toBe(1);
  });
  it("cancel/unmount/context loss preserves the committed state and rejects late completion", () => {
    const player = createSingleMovePlayer(initial);
    player.start({ face: "B", turns: 1 });
    const id = player.getSnapshot().active!.id;
    expect(player.cancel(id)).toBe(true);
    expect(player.cancel(id)).toBe(false);
    expect(player.complete(id)).toBe(false);
    expect(player.getSnapshot()).toMatchObject({
      state: initial,
      completed: 0,
      active: null,
    });
  });
  it("publishes only transaction changes, with stable snapshots and removable subscriptions", () => {
    const player = createSingleMovePlayer();
    let changes = 0;
    const unsubscribe = player.subscribe(() => changes++);
    const server = player.getServerSnapshot();
    player.start({ face: "L", turns: 1 });
    const active = player.getSnapshot();
    for (let elapsed = 0; elapsed <= 400; elapsed++)
      sampleMoveAngle(Math.PI / 2, elapsed);
    expect(player.getSnapshot()).toBe(active);
    expect(changes).toBe(1);
    player.complete(active.active!.id);
    expect(changes).toBe(2);
    expect(player.getServerSnapshot()).toBe(server);
    expect(Object.isFrozen(active)).toBe(true);
    expect(Object.isFrozen(active.active!.move)).toBe(true);
    unsubscribe();
    player.reset();
    expect(changes).toBe(2);
  });
  it("repeated moves and inverse return exactly to the initial snapshot", () => {
    const player = createSingleMovePlayer(initial);
    const sequence = parseAlgorithm(
      Array(10).fill("R U' F2 D L2 B'").join(" "),
    );
    for (const move of [...sequence, ...invertAlgorithm(sequence)]) {
      player.start(move);
      player.complete(player.getSnapshot().active!.id);
    }
    expect(player.getSnapshot().state).toEqual(initial);
    expect(player.getSnapshot().completed).toBe(120);
  });
  it("invalid input does not change the snapshot", () => {
    const player = createSingleMovePlayer();
    const before = player.getSnapshot();
    expect(() => player.start({ face: "R", turns: 3 } as never)).toThrow();
    expect(player.getSnapshot()).toBe(before);
  });
});

describe("animation sampling", () => {
  it.each([-Math.PI, -Math.PI / 2, Math.PI / 2, Math.PI])(
    "%s reaches the exact endpoint, clamps and stays monotonic",
    (target) => {
      expect(sampleMoveAngle(target, -50)).toEqual({ angle: 0, done: false });
      expect(sampleMoveAngle(target, 0)).toEqual({ angle: 0, done: false });
      let previous = 0;
      for (let time = 1; time < 360; time++) {
        const frame = sampleMoveAngle(target, time);
        expect(Math.abs(frame.angle)).toBeGreaterThanOrEqual(previous);
        expect(Math.abs(frame.angle)).toBeLessThan(Math.abs(target));
        expect(frame.done).toBe(false);
        previous = Math.abs(frame.angle);
      }
      expect(sampleMoveAngle(target, 360)).toEqual({
        angle: target,
        done: true,
      });
      expect(sampleMoveAngle(target, 10000)).toEqual({
        angle: target,
        done: true,
      });
    },
  );
});
