import { MAX_SOLVES, mergeSolves, validateSolve, type Solve } from "./solve";
/** localStorage format of Task 15.3, read once by the IndexedDB migration. */
export const SOLVES_KEY = "shanbik:timer-solves:v1";
export function parseSolves(raw: string | null): readonly Solve[] {
  if (raw === null) return Object.freeze([]);
  if (raw.length > 3000000) throw Error("Solve data too large");
  const value = JSON.parse(raw);
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.solves) ||
    value.solves.length > MAX_SOLVES
  )
    throw Error("Invalid solve storage");
  return mergeSolves(
    value.solves.map((s: unknown) => {
      // v1 never had penalties; reject a record that claims one.
      if (s && typeof s === "object" && "penalty" in s)
        throw Error("Invalid solve storage");
      return validateSolve(s);
    }),
  );
}
