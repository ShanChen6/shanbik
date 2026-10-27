import { describe, expect, it, vi } from "vitest";
import { FORMULAS } from "./catalog";
import {
  DEFAULT_PRACTICE,
  SPEEDS,
  createPracticeStorage,
  currentMoveIndex,
  maxRepeats,
  practiceKey,
  practiceSequence,
  validatePractice,
} from "./practice";
import {
  applyAlgorithm,
  createSolvedCubeState,
  invertAlgorithm,
  isCubeSolved,
} from "../cube/core";
import { createMoveQueuePlayer } from "../cube/viewer/move-queue";
import { sampleMoveAngle } from "../cube/viewer/single-move";
const formula = FORMULAS[0];
function memory() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
  };
}
describe("algorithm practice playback", () => {
  it.each(["forward", "reverse"] as const)(
    "seek has the exact prefix during play/backward/reset: %s",
    (direction) => {
      const sequence = practiceSequence(formula, {
        ...DEFAULT_PRACTICE,
        direction,
        repeat: 3,
      });
      const p = createMoveQueuePlayer(sequence.initial);
      p.loadSequence(sequence.moves, sequence.initial);
      p.play();
      const stale = p.getSnapshot().active!.id;
      for (const cursor of [0, 7, 3, 12, 1, 0]) {
        expect(p.seekPlayback(cursor)).toBe(true);
        const snap = p.getSnapshot();
        expect(snap.active).toBeNull();
        expect(snap.playback).toMatchObject({
          cursor,
          playing: false,
          step: 0,
        });
        expect(snap.state).toEqual(
          applyAlgorithm(sequence.initial, sequence.moves.slice(0, cursor)),
        );
      }
      expect(p.complete(stale)).toBe(false);
      p.seekPlayback(4);
      p.stepBackward();
      const back = p.getSnapshot().active!.id;
      p.seekPlayback(9);
      expect(p.complete(back)).toBe(false);
      p.resetPlayback();
      expect(p.getSnapshot().state).toEqual(sequence.initial);
    },
  );
  it("invalid seeks do not mutate a queue or a running sequence", () => {
    const p = createMoveQueuePlayer();
    expect(p.seekPlayback(0)).toBe(false);
    p.loadSequence(formula.moves);
    p.play();
    for (const n of [-1, 0.5, 5, NaN, Infinity]) {
      const before = p.getSnapshot();
      expect(p.seekPlayback(n)).toBe(false);
      expect(p.getSnapshot()).toBe(before);
    }
  });
  it.each([false, true])(
    "play/pause/step remain aligned after seek, reduced=%s",
    (reduced) => {
      const sequence = practiceSequence(formula, {
        ...DEFAULT_PRACTICE,
        repeat: 2,
      });
      const p = createMoveQueuePlayer(sequence.initial);
      p.loadSequence(sequence.moves, sequence.initial);
      p.setReducedMotion(reduced);
      p.seekPlayback(2);
      p.stepForward();
      if (p.getSnapshot().active) p.complete(p.getSnapshot().active!.id);
      expect(p.getSnapshot().state).toEqual(
        applyAlgorithm(sequence.initial, sequence.moves.slice(0, 3)),
      );
      p.stepBackward();
      if (p.getSnapshot().active) p.complete(p.getSnapshot().active!.id);
      expect(p.getSnapshot().playback?.cursor).toBe(2);
      p.play();
      p.pausePlayback();
      while (p.getSnapshot().active) p.complete(p.getSnapshot().active!.id);
      const cursor = p.getSnapshot().playback!.cursor;
      expect(p.getSnapshot().state).toEqual(
        applyAlgorithm(sequence.initial, sequence.moves.slice(0, cursor)),
      );
    },
  );
  it("reverse uses inverse in reverse order; repeat continues on the current cube with a bounded finite sequence", () => {
    for (const f of FORMULAS) {
      const forward = practiceSequence(f, DEFAULT_PRACTICE),
        reverse = practiceSequence(f, {
          ...DEFAULT_PRACTICE,
          direction: "reverse",
        });
      expect(isCubeSolved(applyAlgorithm(forward.initial, forward.moves))).toBe(
        true,
      );
      expect(reverse.initial).toEqual(createSolvedCubeState());
      expect(reverse.moves).toEqual(invertAlgorithm(f.moves));
      expect(applyAlgorithm(reverse.initial, reverse.moves)).toEqual(
        forward.initial,
      );
      const repeated = practiceSequence(f, {
        ...DEFAULT_PRACTICE,
        repeat: maxRepeats(f),
      });
      expect(repeated.moves.length).toBeLessThanOrEqual(256);
      expect(repeated.moves).toEqual(Array(maxRepeats(f)).fill(f.moves).flat());
    }
  });
  it("current move denotes active forward/backward or the last committed prefix", () => {
    expect(currentMoveIndex(0, 0, false)).toBeNull();
    expect(currentMoveIndex(2, 1, true)).toBe(2);
    expect(currentMoveIndex(2, -1, true)).toBe(1);
    expect(currentMoveIndex(2, 0, false)).toBe(1);
  });
  it.each(SPEEDS)(
    "speed %s reaches the same angle at its configured duration",
    (speed) => {
      const duration = 360 / speed;
      expect(
        sampleMoveAngle(Math.PI / 2, duration / 2, duration).angle,
      ).toBeCloseTo(Math.PI / 4);
      expect(sampleMoveAngle(Math.PI / 2, duration, duration)).toEqual({
        angle: Math.PI / 2,
        done: true,
      });
    },
  );
});
describe("algorithm practice local storage", () => {
  it("SSR does not read or write; restore all settings and notes without autoplay data", () => {
    const storage = memory(),
      factory = vi.fn(() => storage),
      s = createPracticeStorage(formula, factory);
    expect(factory).not.toHaveBeenCalled();
    expect(s.update({ note: "early" })).toBe(false);
    s.open();
    expect(storage.setItem).not.toHaveBeenCalled();
    s.update({
      note: "Luyện tay phải\nChậm hơn",
      completed: true,
      speed: 0.5,
      direction: "reverse",
      repeat: 3,
    });
    const restored = createPracticeStorage(formula, () => storage);
    restored.open();
    expect(restored.getSnapshot().settings).toEqual({
      note: "Luyện tay phải\nChậm hơn",
      completed: true,
      speed: 0.5,
      direction: "reverse",
      repeat: 3,
    });
    expect(
      Object.keys(JSON.parse(storage.data.get(practiceKey(formula.id))!)),
    ).toEqual(["version", "notation", "settings"]);
    expect(restored.getSnapshot().settings).not.toHaveProperty("cursor");
  });
  it.each([
    null,
    [],
    {},
    { speed: 0 },
    { ...DEFAULT_PRACTICE, speed: 3 },
    { ...DEFAULT_PRACTICE, direction: "sideways" },
    { ...DEFAULT_PRACTICE, repeat: 0 },
    { ...DEFAULT_PRACTICE, repeat: 1.5 },
    { ...DEFAULT_PRACTICE, repeat: 11 },
    { ...DEFAULT_PRACTICE, note: "x".repeat(2001) },
    { ...DEFAULT_PRACTICE, completed: "true" },
  ] as unknown[])("rejects invalid settings %#", (input) => {
    expect(() => validatePractice(input, formula)).toThrow();
  });
  it.each([
    "{",
    "null",
    "[]",
    "{}",
    '{"version":2}',
    JSON.stringify({
      version: 1,
      notation: "wrong",
      settings: DEFAULT_PRACTICE,
    }),
    "x".repeat(20001),
  ])("ignores corrupted/incompatible storage without overwriting %#", (raw) => {
    const storage = memory();
    storage.data.set(practiceKey(formula.id), raw);
    const s = createPracticeStorage(formula, () => storage);
    s.open();
    expect(s.getSnapshot().status).toBe("invalid");
    expect(s.getSnapshot().settings).toEqual(DEFAULT_PRACTICE);
    expect(storage.setItem).not.toHaveBeenCalled();
    s.update({ note: "new" });
    expect(s.getSnapshot().settings.note).toBe("new");
    expect(s.getSnapshot().status).toBe("ready");
  });
  it.each(["factory", "read", "write", "remove"])(
    "storage %s failure is recoverable in memory",
    (mode) => {
      const storage = memory();
      if (mode === "read")
        storage.getItem.mockImplementation(() => {
          throw Error("blocked");
        });
      if (mode === "write")
        storage.setItem.mockImplementation(() => {
          throw Error("quota");
        });
      if (mode === "remove")
        storage.removeItem.mockImplementation(() => {
          throw Error("blocked");
        });
      const s = createPracticeStorage(formula, () => {
        if (mode === "factory") throw Error("blocked");
        return storage;
      });
      s.open();
      s.update({ note: "keep", completed: true });
      expect(s.getSnapshot().settings.note).toBe("keep");
      if (mode !== "remove") expect(s.getSnapshot().status).toBe("unavailable");
      s.clear();
      expect(s.getSnapshot().settings).toEqual(DEFAULT_PRACTICE);
      if (mode === "remove") expect(s.getSnapshot().status).toBe("unavailable");
    },
  );
  it("formula keys are isolated, clear preserves favorites/lesson data and close/open rejects late writes", () => {
    const storage = memory();
    storage.data.set("shanbik:algorithm-favorites:v1", "keep");
    const s = createPracticeStorage(formula, () => storage),
      other = createPracticeStorage(FORMULAS[1], () => storage);
    s.open();
    other.open();
    s.update({ note: "one" });
    other.update({ note: "two" });
    s.close();
    expect(s.update({ note: "late" })).toBe(false);
    s.open();
    expect(s.getSnapshot().settings.note).toBe("one");
    s.clear();
    expect(storage.data.get("shanbik:algorithm-favorites:v1")).toBe("keep");
    expect(storage.data.has(practiceKey(formula.id))).toBe(false);
    expect(other.getSnapshot().settings.note).toBe("two");
  });
  it("playing to the end never marks user completion", () => {
    const storage = memory(),
      s = createPracticeStorage(formula, () => storage);
    s.open();
    const seq = practiceSequence(formula, s.getSnapshot().settings),
      p = createMoveQueuePlayer(seq.initial);
    p.loadSequence(seq.moves, seq.initial);
    p.setReducedMotion(true);
    p.play();
    expect(s.getSnapshot().settings.completed).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
