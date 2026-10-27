import { describe, expect, it, vi } from "vitest";
import { createTimer, HOLD_MS, INSPECTION_MS } from "./machine";
import { parseSolves } from "./legacy";
import { formatDuration, MAX_SOLVES, validateSolve } from "./solve";
const scramble = "R U R' U'";
const solve = (id = "solve-1", timestamp = 1000) =>
  validateSolve({ id, puzzle: "3x3", durationMs: 1234, scramble, timestamp });
/** A Task 15 localStorage record, which never carried a penalty. */
const v1 = (id = "solve-1", timestamp = 1000) => {
  const record: Record<string, unknown> = { ...solve(id, timestamp) };
  delete record.penalty;
  return record;
};
function harness() {
  let time = 0,
    wall = 100000,
    id = 0;
  const onSolve = vi.fn(),
    now = vi.fn(() => time),
    wallNow = vi.fn(() => wall),
    newId = vi.fn(() => `attempt-${++id}`),
    timer = createTimer({ now, wallNow, newId, onSolve });
  return {
    timer,
    now,
    wallNow,
    newId,
    onSolve,
    set: (n: number) => {
      time = n;
    },
    advance: (n: number) => {
      time += n;
    },
    wall: (n: number) => {
      wall = n;
    },
  };
}
describe("timer state machine", () => {
  it("does not read clocks or create IDs during SSR, rejects closed transitions", () => {
    const h = harness();
    expect(h.timer.getServerSnapshot().phase).toBe("ready");
    expect(h.now).not.toHaveBeenCalled();
    expect(h.wallNow).not.toHaveBeenCalled();
    expect(h.newId).not.toHaveBeenCalled();
    expect(h.timer.start()).toBe(false);
    expect(h.timer.prepare(scramble)).toBe(false);
  });
  it("ready → armed → running → stopped records exactly once on stop press, never on release/repeat", () => {
    const h = harness(),
      t = h.timer;
    t.open();
    t.prepare(scramble);
    t.press();
    expect(t.press()).toBe(false);
    h.advance(HOLD_MS - 1);
    t.tick();
    expect(t.getSnapshot().armed).toBe(false);
    h.advance(1);
    t.tick();
    expect(t.getSnapshot().armed).toBe(true);
    expect(t.release()).toBe(true);
    expect(t.getSnapshot().phase).toBe("running");
    h.advance(1234);
    t.press();
    expect(t.getSnapshot()).toMatchObject({
      phase: "stopped",
      elapsedMs: 1234,
      pressed: true,
    });
    expect(t.press()).toBe(false);
    expect(t.stop()).toBe(false);
    expect(t.release()).toBe(false);
    expect(h.onSolve).toHaveBeenCalledTimes(1);
    expect(h.onSolve.mock.calls[0][0]).toEqual({
      id: "attempt-1",
      puzzle: "3x3",
      durationMs: 1234,
      scramble,
      timestamp: 100000,
      penalty: "none",
    });
  });
  it("short hold and canceled pointer/blur never start a solve", () => {
    const h = harness(),
      t = h.timer;
    t.open();
    t.prepare(scramble);
    t.press();
    h.advance(299);
    expect(t.release()).toBe(false);
    t.press();
    h.advance(1000);
    t.cancelPress();
    expect(t.release()).toBe(false);
    expect(t.getSnapshot().phase).toBe("ready");
    expect(h.newId).not.toHaveBeenCalled();
  });
  it("optional inspection uses monotonic time, does not auto-penalize or include inspection in solve", () => {
    const h = harness(),
      t = h.timer;
    t.open();
    t.prepare(scramble);
    t.setInspection(true);
    t.start();
    expect(t.getSnapshot().phase).toBe("inspection");
    expect(t.prepare("U")).toBe(false);
    expect(t.setInspection(false)).toBe(false);
    h.advance(INSPECTION_MS + 5000);
    t.tick();
    expect(t.getSnapshot().inspectionMs).toBe(20000);
    expect(h.onSolve).not.toHaveBeenCalled();
    t.start();
    h.advance(500);
    t.stop();
    expect(h.onSolve).toHaveBeenCalledTimes(1);
    expect(h.onSolve.mock.calls[0][0].durationMs).toBe(500);
    expect(h.newId).toHaveBeenCalledTimes(1);
  });
  it("hold/release starts inspection then timing; a stop release cannot create another attempt", () => {
    const h = harness(),
      t = h.timer;
    t.open();
    t.prepare(scramble);
    t.setInspection(true);
    for (const phase of ["inspection", "running"]) {
      t.press();
      h.advance(300);
      t.release();
      expect(t.getSnapshot().phase).toBe(phase);
    }
    h.advance(100);
    t.press();
    h.advance(1000);
    t.release();
    expect(t.getSnapshot().phase).toBe("stopped");
    expect(h.newId).toHaveBeenCalledTimes(1);
  });
  it("elapsed comes from absolute clock across long frame gaps and wall clock changes", () => {
    const h = harness(),
      t = h.timer;
    t.open();
    t.prepare(scramble);
    h.set(10000);
    t.start();
    h.advance(65432);
    h.wall(1);
    t.stop();
    expect(t.getSnapshot().elapsedMs).toBe(65432);
    expect(h.onSolve.mock.calls[0][0].timestamp).toBe(1);
  });
  it("backward/invalid clock samples cannot produce negative or shrinking durations", () => {
    const h = harness(),
      t = h.timer;
    t.open();
    t.prepare(scramble);
    h.set(1000);
    t.start();
    h.set(1500);
    t.tick();
    h.set(1400);
    t.tick();
    expect(t.getSnapshot().elapsedMs).toBe(500);
    h.set(NaN);
    t.stop();
    expect(t.getSnapshot().elapsedMs).toBe(500);
  });
  it("cancel/close discard active attempts; reopen is safe, callbacks and ticks after close cannot save", () => {
    const h = harness(),
      t = h.timer;
    t.open();
    t.prepare(scramble);
    t.start();
    h.advance(200);
    t.cancel();
    expect(t.stop()).toBe(false);
    t.start();
    const close = t.close;
    close();
    t.tick();
    expect(t.stop()).toBe(false);
    expect(h.onSolve).not.toHaveBeenCalled();
    t.open();
    t.start();
    h.advance(800);
    t.stop();
    expect(h.onSolve).toHaveBeenCalledTimes(1);
    expect(h.onSolve.mock.calls[0][0].durationMs).toBe(800);
  });
  it("captures the attempt scramble and creates fresh IDs for genuine repeated solves", () => {
    const h = harness(),
      t = h.timer;
    t.open();
    t.prepare(scramble);
    t.start();
    expect(t.prepare("U")).toBe(false);
    h.advance(100);
    t.stop();
    t.prepare("U");
    t.start();
    h.advance(100);
    t.stop();
    expect(h.onSolve.mock.calls.map(([s]) => s.id)).toEqual([
      "attempt-1",
      "attempt-2",
    ]);
    expect(h.onSolve.mock.calls.map(([s]) => s.scramble)).toEqual([
      scramble,
      "U",
    ]);
  });
  it("invalid scramble or UUID leaves state recoverable without a fabricated solve", () => {
    const h = harness(),
      t = h.timer;
    t.open();
    t.prepare(scramble);
    const before = t.getSnapshot();
    expect(() => t.prepare("r U")).toThrow();
    expect(t.getSnapshot()).toBe(before);
    h.newId.mockReturnValue("bad id");
    expect(() => t.start()).toThrow();
    expect(t.getSnapshot().phase).toBe("ready");
    expect(h.onSolve).not.toHaveBeenCalled();
  });
});
describe("timer solve schema and storage", () => {
  it.each([
    [0, "0.00"],
    [9, "0.00"],
    [1234, "1.23"],
    [59999, "59.99"],
    [60000, "1:00.00"],
    [3600000, "60:00.00"],
  ])("formats %s ms as %s", (ms, text) =>
    expect(formatDuration(ms)).toBe(text),
  );
  it.each([
    null,
    {},
    { ...solve(), id: "bad id" },
    { ...solve(), durationMs: -1 },
    { ...solve(), durationMs: 1.5 },
    { ...solve(), timestamp: NaN },
    { ...solve(), puzzle: "4x4" },
    { ...solve(), scramble: "" },
    { ...solve(), scramble: "r U" },
    { ...solve(), scramble: "U ".repeat(257) },
  ] as unknown[])("rejects malformed solve %#", (input) =>
    expect(() => validateSolve(input)).toThrow(),
  );
  it("legacy v1 storage deduplicates identical records and rejects ID conflicts", () => {
    expect(
      parseSolves(JSON.stringify({ version: 1, solves: [v1(), v1()] })),
    ).toEqual([solve()]);
    expect(() =>
      parseSolves(
        JSON.stringify({
          version: 1,
          solves: [v1(), { ...v1(), durationMs: 2 }],
        }),
      ),
    ).toThrow();
    expect(parseSolves(null)).toEqual([]);
  });
  it.each([
    "{",
    "null",
    "[]",
    "{}",
    '{"version":2,"solves":[]}',
    JSON.stringify({ version: 1, solves: [{ ...v1(), durationMs: -1 }] }),
    JSON.stringify({
      version: 1,
      solves: Array.from({ length: MAX_SOLVES + 1 }, (_, i) =>
        solve(`id-${i}`),
      ),
    }),
    "x".repeat(3000001),
  ])("rejects invalid legacy storage %#", (raw) =>
    expect(() => parseSolves(raw)).toThrow(),
  );
});
