import { afterEach, describe, expect, it, vi } from "vitest";
import { applyAlgorithm, invertAlgorithm } from "../core/moves";
import { parseAlgorithm } from "../core/notation";
import { createSolvedCubeState } from "../core/state";
import { validateCubeStructure } from "../core/validation";
import { createMoveQueuePlayer, MAX_QUEUE_MOVES } from "../viewer/move-queue";
import {
  generatePracticeScramble,
  SCRAMBLE_LENGTH,
  secureRandomIndex,
} from "./generate";
import { createScrambleSession } from "./session";
import { copyScramble } from "./clipboard";

afterEach(() => vi.unstubAllGlobals());

function seeded(seed: number) {
  return (size: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % size;
  };
}
const deterministic = () => generatePracticeScramble(seeded(12345));

describe("3×3 practice scramble adapter", () => {
  it.each([1, 2, 17, 42, 99, 1234, 2026, 99999])(
    "seed %i round-trips notation and creates a valid reversible state",
    (seed) => {
      const scramble = generatePracticeScramble(seeded(seed));
      expect(scramble.kind).toBe("random-move-3x3");
      expect(scramble.moves).toHaveLength(SCRAMBLE_LENGTH);
      expect(parseAlgorithm(scramble.notation)).toEqual(scramble.moves);
      const axes = { U: "y", D: "y", R: "x", L: "x", F: "z", B: "z" };
      scramble.moves.forEach((move, index) => {
        expect([1, -1, 2]).toContain(move.turns);
        if (index)
          expect(axes[move.face]).not.toBe(
            axes[scramble.moves[index - 1].face],
          );
      });
      const initial = createSolvedCubeState();
      const state = applyAlgorithm(initial, scramble.moves);
      expect(validateCubeStructure(state).valid).toBe(true);
      expect(applyAlgorithm(state, invertAlgorithm(scramble.moves))).toEqual(
        initial,
      );
      expect(Object.isFrozen(scramble)).toBe(true);
      expect(Object.isFrozen(scramble.moves)).toBe(true);
      expect(scramble.moves.every(Object.isFrozen)).toBe(true);
    },
  );
  it("injected RNG is reproducible and can reach every face and turn variant", () => {
    expect(deterministic()).toEqual(deterministic());
    const observed = new Set<string>();
    for (let seed = 0; seed < 100; seed++)
      for (const move of generatePracticeScramble(seeded(seed)).moves)
        observed.add(`${move.face}:${move.turns}`);
    expect(observed.size).toBe(18);
  });
  it.each([-1, 6, NaN, 0.5, Infinity])(
    "rejects invalid random index %s",
    (value) => {
      expect(() => generatePracticeScramble(() => value)).toThrow(RangeError);
    },
  );
  it("secure RNG rejects the biased tail before taking modulo", () => {
    const values = [0xffffffff, 8];
    const getRandomValues = vi.fn((array: Uint32Array) => {
      array[0] = values.shift()!;
      return array;
    });
    vi.stubGlobal("crypto", { getRandomValues });
    expect(secureRandomIndex(3)).toBe(2);
    expect(getRandomValues).toHaveBeenCalledTimes(2);
  });
  it.each([0, -1, 1.2, NaN, Infinity, 0x100000001])(
    "rejects invalid secure range %s",
    (range) => {
      expect(() => secureRandomIndex(range)).toThrow(RangeError);
    },
  );
});

describe("scramble presentation/apply-once session", () => {
  it("generation only displays a scramble without changing puzzle state", () => {
    const session = createScrambleSession(deterministic);
    const queue = createMoveQueuePlayer();
    const initial = queue.getSnapshot();
    expect(session.getSnapshot()).toBeNull();
    expect(session.getServerSnapshot()).toBeNull();
    session.generate();
    expect(session.getSnapshot()).toMatchObject({ id: 1, applied: false });
    expect(queue.getSnapshot()).toBe(initial);
  });
  it("rapid apply calls enqueue one batch, even after the queue is canceled/reset", () => {
    const session = createScrambleSession(deterministic);
    const queue = createMoveQueuePlayer();
    session.generate();
    const enqueue = vi.fn(queue.enqueue);
    expect(session.apply(enqueue)).toBe(true);
    for (let index = 0; index < 20; index++)
      expect(session.apply(enqueue)).toBe(false);
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(queue.getSnapshot().pending).toHaveLength(SCRAMBLE_LENGTH - 1);
    queue.cancel();
    queue.reset();
    expect(session.apply(enqueue)).toBe(false);
    expect(session.getSnapshot()!.applied).toBe(true);
    session.generate();
    expect(session.apply(enqueue)).toBe(true);
    expect(enqueue).toHaveBeenCalledTimes(2);
  });
  it("failed capacity does not consume the scramble, and retry can succeed", () => {
    const session = createScrambleSession(deterministic);
    const queue = createMoveQueuePlayer();
    queue.enqueue(Array(MAX_QUEUE_MOVES).fill({ face: "R", turns: 1 }));
    session.generate();
    const before = session.getSnapshot();
    expect(session.apply(queue.enqueue)).toBe(false);
    expect(session.getSnapshot()).toBe(before);
    queue.cancel();
    expect(session.apply(queue.enqueue)).toBe(true);
  });
  it.each([false, true])(
    "applies the displayed sequence once to the current state with reducedMotion=%s",
    (reduced) => {
      const initial = applyAlgorithm(
        createSolvedCubeState(),
        parseAlgorithm("R U F2"),
      );
      const queue = createMoveQueuePlayer(initial);
      const session = createScrambleSession(deterministic);
      queue.setReducedMotion(reduced);
      session.generate();
      const scramble = session.getSnapshot()!.scramble;
      session.apply(queue.enqueue);
      while (queue.getSnapshot().active)
        queue.complete(queue.getSnapshot().active!.id);
      expect(queue.getSnapshot().state).toEqual(
        applyAlgorithm(initial, parseAlgorithm(scramble.notation)),
      );
      expect(queue.getSnapshot().completed).toBe(SCRAMBLE_LENGTH);
    },
  );
  it("a generation error preserves the previous scramble and its applied marker", () => {
    let fail = false;
    const session = createScrambleSession(() => {
      if (fail) throw Error("RNG unavailable");
      return deterministic();
    });
    session.generate();
    session.apply(() => true);
    const before = session.getSnapshot();
    fail = true;
    expect(() => session.generate()).toThrow();
    expect(session.getSnapshot()).toBe(before);
  });
  it("blocks reentrant apply and unlocks after an enqueue exception", () => {
    const session = createScrambleSession(deterministic);
    session.generate();
    expect(() =>
      session.apply(() => {
        expect(session.apply(() => true)).toBe(false);
        throw Error("queue failure");
      }),
    ).toThrow();
    expect(session.getSnapshot()!.applied).toBe(false);
    expect(session.apply(() => true)).toBe(true);
  });
  it("does not mark a newly generated scramble consumed by an older apply", () => {
    const session = createScrambleSession(deterministic);
    session.generate();
    session.apply(() => {
      session.generate();
      return true;
    });
    expect(session.getSnapshot()).toMatchObject({ id: 2, applied: false });
    expect(session.apply(() => true)).toBe(true);
  });
  it("empty apply is a no-op and subscriptions can be removed", () => {
    const session = createScrambleSession(deterministic);
    const notify = vi.fn();
    const enqueue = vi.fn();
    const unsubscribe = session.subscribe(notify);
    expect(session.apply(enqueue)).toBe(false);
    expect(enqueue).not.toHaveBeenCalled();
    session.generate();
    expect(notify).toHaveBeenCalledTimes(1);
    unsubscribe();
    session.generate();
    expect(notify).toHaveBeenCalledTimes(1);
  });
});

describe("clipboard result", () => {
  it("reports success only after the write succeeds with the exact notation", async () => {
    const write = vi.fn(async () => {});
    expect(await copyScramble("R U' F2", write)).toBe(true);
    expect(write).toHaveBeenCalledWith("R U' F2");
  });
  it("reports denied writes and an unavailable API as failure", async () => {
    expect(
      await copyScramble("R", async () => {
        throw Error("NotAllowedError");
      }),
    ).toBe(false);
    expect(await copyScramble("R")).toBe(false);
  });
});
