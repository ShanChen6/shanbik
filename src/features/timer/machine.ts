import { normalizeAlgorithm, parseAlgorithm } from "../cube/core/notation";
import { validateSolve, type Solve } from "./solve";
export const HOLD_MS = 300,
  INSPECTION_MS = 15000;
export type TimerSnapshot = Readonly<{
  phase: "ready" | "inspection" | "running" | "stopped";
  scramble: string;
  inspectionEnabled: boolean;
  pressed: boolean;
  armed: boolean;
  elapsedMs: number;
  inspectionMs: number;
  result: Solve | null;
}>;
export function createTimer({
  now,
  wallNow,
  newId,
  onSolve,
}: {
  now: () => number;
  wallNow: () => number;
  newId: () => string;
  onSolve: (solve: Solve) => void;
}) {
  let snapshot: TimerSnapshot = Object.freeze({
    phase: "ready",
    scramble: "",
    inspectionEnabled: false,
    pressed: false,
    armed: false,
    elapsedMs: 0,
    inspectionMs: 0,
    result: null,
  });
  const server = snapshot,
    listeners = new Set<() => void>();
  let active = false,
    last = 0,
    pressAt: number | null = null,
    runAt: number | null = null,
    inspectAt: number | null = null,
    attemptId: string | null = null;
  const clock = () => {
    const n = now();
    if (Number.isFinite(n)) last = Math.max(last, n);
    return last;
  };
  const publish = (next: TimerSnapshot) => {
    snapshot = Object.freeze(next);
    listeners.forEach((fn) => fn());
  };
  const idle = () => snapshot.phase === "ready" || snapshot.phase === "stopped";
  const begin = (at: number) => {
    if (snapshot.phase === "inspection") {
      runAt = at;
      publish({
        ...snapshot,
        phase: "running",
        pressed: false,
        armed: false,
        inspectionMs: Math.floor(at - inspectAt!),
        elapsedMs: 0,
      });
      return true;
    }
    if (!idle() || !snapshot.scramble) return false;
    const id = newId();
    if (typeof id !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(id))
      throw Error("Cannot create attempt ID");
    attemptId = id;
    runAt = null;
    inspectAt = null;
    if (snapshot.inspectionEnabled) inspectAt = at;
    else runAt = at;
    publish({
      ...snapshot,
      phase: snapshot.inspectionEnabled ? "inspection" : "running",
      pressed: false,
      armed: false,
      elapsedMs: 0,
      inspectionMs: 0,
      result: null,
    });
    return true;
  };
  const finish = (at: number, pressed: boolean) => {
    if (snapshot.phase !== "running" || runAt === null || attemptId === null)
      return false;
    const result = validateSolve({
      id: attemptId,
      puzzle: "3x3",
      durationMs: Math.floor(at - runAt),
      scramble: snapshot.scramble,
      timestamp: Math.floor(wallNow()),
    });
    runAt = null;
    attemptId = null;
    pressAt = null;
    publish({
      ...snapshot,
      phase: "stopped",
      elapsedMs: result.durationMs,
      result,
      pressed,
      armed: false,
    });
    onSolve(result);
    return true;
  };
  const cancel = () => {
    if (!active) return;
    pressAt = null;
    runAt = null;
    inspectAt = null;
    attemptId = null;
    publish({
      ...snapshot,
      phase: "ready",
      pressed: false,
      armed: false,
      elapsedMs: 0,
      inspectionMs: 0,
      result: null,
    });
  };
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => server,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    open() {
      active = true;
    },
    prepare(scramble: string) {
      if (!active || !idle() || snapshot.pressed) return false;
      const moves = parseAlgorithm(scramble);
      if (!moves.length || moves.length > 256 || scramble.length > 2048)
        throw Error("Invalid scramble");
      publish({
        ...snapshot,
        phase: "ready",
        scramble: normalizeAlgorithm(scramble),
        elapsedMs: 0,
        inspectionMs: 0,
        result: null,
      });
      return true;
    },
    setInspection(value: boolean) {
      if (!active || !idle() || snapshot.pressed) return false;
      publish({ ...snapshot, inspectionEnabled: value });
      return true;
    },
    press() {
      if (!active || snapshot.pressed || !snapshot.scramble) return false;
      const at = clock();
      if (snapshot.phase === "running") return finish(at, true);
      pressAt = at;
      publish({ ...snapshot, pressed: true, armed: false });
      return true;
    },
    release() {
      if (!active || !snapshot.pressed) return false;
      const at = clock(),
        held = pressAt !== null && at - pressAt >= HOLD_MS;
      pressAt = null;
      publish({ ...snapshot, pressed: false, armed: false });
      return held ? begin(at) : false;
    },
    start() {
      if (
        !active ||
        snapshot.pressed ||
        !snapshot.scramble ||
        snapshot.phase === "running"
      )
        return false;
      return begin(clock());
    },
    stop() {
      return active ? finish(clock(), false) : false;
    },
    cancelPress() {
      pressAt = null;
      if (snapshot.pressed)
        publish({ ...snapshot, pressed: false, armed: false });
    },
    tick() {
      if (!active) return;
      const at = clock(),
        elapsedMs =
          runAt === null ? snapshot.elapsedMs : Math.floor(at - runAt),
        inspectionMs =
          inspectAt !== null && snapshot.phase === "inspection"
            ? Math.floor(at - inspectAt)
            : snapshot.inspectionMs,
        armed = pressAt !== null && at - pressAt >= HOLD_MS;
      if (
        elapsedMs !== snapshot.elapsedMs ||
        inspectionMs !== snapshot.inspectionMs ||
        armed !== snapshot.armed
      )
        publish({ ...snapshot, elapsedMs, inspectionMs, armed });
    },
    cancel,
    close() {
      cancel();
      active = false;
    },
  };
}
