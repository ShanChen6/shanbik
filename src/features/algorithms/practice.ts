import {
  applyAlgorithm,
  createSolvedCubeState,
  invertAlgorithm,
  type CubeAlgorithm,
} from "../cube/core";
import { MAX_QUEUE_MOVES } from "../cube/viewer/move-queue";
import type { Formula } from "./catalog";
export const SPEEDS = [0.5, 1, 1.5, 2] as const;
export type PracticeSettings = Readonly<{
  speed: number;
  direction: "forward" | "reverse";
  repeat: number;
  note: string;
  completed: boolean;
}>;
export const DEFAULT_PRACTICE: PracticeSettings = Object.freeze({
  speed: 1,
  direction: "forward",
  repeat: 1,
  note: "",
  completed: false,
});
export const practiceKey = (id: string) =>
  `shanbik:algorithm-practice:${id}:v1`;
export const maxRepeats = (formula: Formula) =>
  Math.min(10, Math.floor(MAX_QUEUE_MOVES / formula.moves.length));
export function validatePractice(
  value: unknown,
  formula: Formula,
): PracticeSettings {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid practice settings");
  const record = value as Record<string, unknown>;
  if (
    typeof record.speed !== "number" ||
    !SPEEDS.some((s) => s === record.speed) ||
    (record.direction !== "forward" && record.direction !== "reverse") ||
    typeof record.repeat !== "number" ||
    !Number.isInteger(record.repeat) ||
    record.repeat < 1 ||
    record.repeat > maxRepeats(formula) ||
    typeof record.note !== "string" ||
    record.note.length > 2000 ||
    typeof record.completed !== "boolean"
  )
    throw Error("Invalid practice settings");
  return Object.freeze({
    speed: record.speed,
    direction: record.direction,
    repeat: record.repeat,
    note: record.note,
    completed: record.completed,
  });
}
export function practiceSequence(formula: Formula, settings: PracticeSettings) {
  const valid = validatePractice(settings, formula),
    solved = createSolvedCubeState();
  const single =
    valid.direction === "reverse"
      ? invertAlgorithm(formula.moves)
      : formula.moves;
  const moves: CubeAlgorithm = Object.freeze(
    Array.from({ length: valid.repeat }, () => single).flat(),
  );
  return Object.freeze({
    moves,
    initial:
      valid.direction === "reverse"
        ? solved
        : applyAlgorithm(solved, invertAlgorithm(formula.moves)),
  });
}
export function currentMoveIndex(
  cursor: number,
  step: -1 | 0 | 1,
  active: boolean,
) {
  return active
    ? step === -1
      ? cursor - 1
      : cursor
    : cursor > 0
      ? cursor - 1
      : null;
}
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Snapshot = Readonly<{
  loaded: boolean;
  settings: PracticeSettings;
  status: "loading" | "ready" | "invalid" | "unavailable";
}>;
export function createPracticeStorage(
  formula: Formula,
  getStorage: () => StoragePort,
) {
  let snapshot: Snapshot = Object.freeze({
      loaded: false,
      settings: DEFAULT_PRACTICE,
      status: "loading",
    }),
    active = false,
    storage: StoragePort | null = null;
  const server = snapshot,
    listeners = new Set<() => void>(),
    key = practiceKey(formula.id);
  const publish = (value: Snapshot) => {
    snapshot = Object.freeze(value);
    listeners.forEach((fn) => fn());
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
      if (snapshot.loaded) return;
      let raw: string | null;
      try {
        storage = getStorage();
        raw = storage.getItem(key);
      } catch {
        storage = null;
        publish({
          loaded: true,
          settings: DEFAULT_PRACTICE,
          status: "unavailable",
        });
        return;
      }
      try {
        let settings = DEFAULT_PRACTICE;
        if (raw !== null) {
          if (raw.length > 20000) throw Error("Practice record too large");
          const value = JSON.parse(raw);
          if (
            !value ||
            value.version !== 1 ||
            value.notation !== formula.notation
          )
            throw Error("Incompatible practice record");
          settings = validatePractice(value.settings, formula);
        }
        publish({ loaded: true, settings, status: "ready" });
      } catch {
        publish({
          loaded: true,
          settings: DEFAULT_PRACTICE,
          status: "invalid",
        });
      }
    },
    update(patch: Partial<PracticeSettings>) {
      if (!active || !snapshot.loaded) return false;
      const settings = validatePractice(
        { ...snapshot.settings, ...patch },
        formula,
      );
      let status: Snapshot["status"] = "ready";
      try {
        if (!storage) throw Error("Storage unavailable");
        storage.setItem(
          key,
          JSON.stringify({ version: 1, notation: formula.notation, settings }),
        );
      } catch {
        status = "unavailable";
      }
      publish({ loaded: true, settings, status });
      return true;
    },
    clear() {
      if (!active || !snapshot.loaded) return;
      let status: Snapshot["status"] = "ready";
      try {
        if (!storage) throw Error("Storage unavailable");
        storage.removeItem(key);
      } catch {
        status = "unavailable";
      }
      publish({ loaded: true, settings: DEFAULT_PRACTICE, status });
    },
    close() {
      active = false;
    },
  };
}
