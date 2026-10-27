import { MAX_SOLVES, mergeSolves, validateSolve, type Solve } from "./solve";
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
  return mergeSolves(value.solves.map(validateSolve));
}
type StoragePort = Pick<Storage, "getItem" | "setItem">;
type Snapshot = Readonly<{
  loaded: boolean;
  solves: readonly Solve[];
  status: "loading" | "ready" | "invalid" | "unavailable" | "full" | "conflict";
}>;
export function createSolveStorage(getStorage: () => StoragePort) {
  let snapshot: Snapshot = Object.freeze({
      loaded: false,
      solves: Object.freeze([]),
      status: "loading",
    }),
    active = false;
  const server = snapshot,
    listeners = new Set<() => void>();
  const publish = (next: Snapshot) => {
    snapshot = Object.freeze(next);
    listeners.forEach((fn) => fn());
  };
  const persist = () => {
    try {
      const storage = getStorage();
      const raw = storage.getItem(SOLVES_KEY);
      let disk: readonly Solve[] = [];
      try {
        disk = parseSolves(raw);
      } catch {
        /* Only an explicit save replaces invalid data; a read failure never does. */
      }
      const solves = mergeSolves(disk, snapshot.solves);
      storage.setItem(SOLVES_KEY, JSON.stringify({ version: 1, solves }));
      publish({ loaded: true, solves, status: "ready" });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      publish({
        ...snapshot,
        status:
          message === "Solve limit reached"
            ? "full"
            : message === "Conflicting solve ID"
              ? "conflict"
              : "unavailable",
      });
      return false;
    }
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
        raw = getStorage().getItem(SOLVES_KEY);
      } catch {
        publish({
          loaded: true,
          solves: Object.freeze([]),
          status: "unavailable",
        });
        return;
      }
      try {
        publish({ loaded: true, solves: parseSolves(raw), status: "ready" });
      } catch {
        publish({ loaded: true, solves: Object.freeze([]), status: "invalid" });
      }
    },
    add(input: Solve) {
      if (!active || !snapshot.loaded) return false;
      const solve = validateSolve(input),
        old = snapshot.solves.find((s) => s.id === solve.id);
      if (old) {
        if (JSON.stringify(old) !== JSON.stringify(solve))
          publish({ ...snapshot, status: "conflict" });
        return false;
      }
      if (snapshot.solves.length >= MAX_SOLVES) {
        publish({ ...snapshot, status: "full" });
        return false;
      }
      publish({ ...snapshot, solves: mergeSolves(snapshot.solves, [solve]) });
      return persist();
    },
    retry() {
      return active && snapshot.loaded && snapshot.solves.length > 0
        ? persist()
        : false;
    },
    close() {
      active = false;
    },
  };
}
