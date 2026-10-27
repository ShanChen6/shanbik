import { normalizeAlgorithm, parseAlgorithm } from "../cube/core/notation";
export type Solve = Readonly<{
  id: string;
  puzzle: "3x3";
  durationMs: number;
  scramble: string;
  timestamp: number;
}>;
export const MAX_SOLVES = 1000;
export function validateSolve(input: unknown): Solve {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw Error("Invalid solve");
  const v = input as Record<string, unknown>;
  if (
    typeof v.id !== "string" ||
    !/^[a-zA-Z0-9-]{1,100}$/.test(v.id) ||
    v.puzzle !== "3x3" ||
    typeof v.durationMs !== "number" ||
    !Number.isSafeInteger(v.durationMs) ||
    v.durationMs < 0 ||
    typeof v.timestamp !== "number" ||
    !Number.isSafeInteger(v.timestamp) ||
    v.timestamp < 0 ||
    v.timestamp > 8640000000000000 ||
    typeof v.scramble !== "string" ||
    v.scramble.length > 2048
  )
    throw Error("Invalid solve");
  const moves = parseAlgorithm(v.scramble);
  if (!moves.length || moves.length > 256) throw Error("Invalid scramble");
  return Object.freeze({
    id: v.id,
    puzzle: "3x3",
    durationMs: v.durationMs,
    scramble: normalizeAlgorithm(v.scramble),
    timestamp: v.timestamp,
  });
}
export function mergeSolves(
  ...lists: readonly (readonly Solve[])[]
): readonly Solve[] {
  const ids = new Map<string, Solve>();
  for (const list of lists)
    for (const solve of list) {
      const old = ids.get(solve.id);
      if (old && JSON.stringify(old) !== JSON.stringify(solve))
        throw Error("Conflicting solve ID");
      ids.set(solve.id, solve);
    }
  if (ids.size > MAX_SOLVES) throw Error("Solve limit reached");
  return Object.freeze(
    [...ids.values()].sort(
      (a, b) => b.timestamp - a.timestamp || a.id.localeCompare(b.id),
    ),
  );
}
export function formatDuration(ms: number): string {
  const value = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 10)) : 0,
    seconds = Math.floor(value / 100),
    centis = String(value % 100).padStart(2, "0");
  return seconds < 60
    ? `${seconds}.${centis}`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}.${centis}`;
}
