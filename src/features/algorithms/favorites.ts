import { FORMULAS } from "./catalog";
export const FAVORITES_KEY = "shanbik:algorithm-favorites:v1";
const known = new Set(FORMULAS.map((f) => f.id));
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function parseFavorites(raw: string | null): readonly string[] {
  if (raw === null) return Object.freeze([]);
  if (raw.length > 20000) throw Error("Favorites too large");
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid favorites");
  const record = value as Record<string, unknown>;
  if (
    record.version !== 1 ||
    !Array.isArray(record.ids) ||
    record.ids.length > 500 ||
    !record.ids.every((id) => typeof id === "string" && id.length <= 80)
  )
    throw Error("Invalid favorites");
  return Object.freeze([...new Set(record.ids.filter((id) => known.has(id)))]);
}
type Snapshot = Readonly<{
  loaded: boolean;
  ids: readonly string[];
  status: "loading" | "ready" | "invalid" | "unavailable";
}>;
export function createFavorites(getStorage: () => StoragePort) {
  let snapshot: Snapshot = Object.freeze({
    loaded: false,
    ids: Object.freeze([]),
    status: "loading",
  });
  const server = snapshot,
    listeners = new Set<() => void>();
  let storage: StoragePort | null = null,
    active = false;
  const publish = (value: Snapshot) => {
    snapshot = Object.freeze(value);
    listeners.forEach((fn) => fn());
  };
  return {
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => server,
    open() {
      active = true;
      if (snapshot.loaded) return;
      let raw: string | null;
      try {
        storage = getStorage();
        raw = storage.getItem(FAVORITES_KEY);
      } catch {
        storage = null;
        publish({
          loaded: true,
          ids: Object.freeze([]),
          status: "unavailable",
        });
        return;
      }
      try {
        publish({ loaded: true, ids: parseFavorites(raw), status: "ready" });
      } catch {
        publish({ loaded: true, ids: Object.freeze([]), status: "invalid" });
      }
    },
    toggle(id: string) {
      if (!active || !snapshot.loaded || !known.has(id)) return false;
      const ids = Object.freeze(
        snapshot.ids.includes(id)
          ? snapshot.ids.filter((x) => x !== id)
          : [...snapshot.ids, id],
      );
      let status: Snapshot["status"] = "ready";
      try {
        if (!storage) throw Error("Unavailable");
        storage.setItem(FAVORITES_KEY, JSON.stringify({ version: 1, ids }));
      } catch {
        status = "unavailable";
      }
      publish({ loaded: true, ids, status });
      return true;
    },
    clear() {
      if (!active || !snapshot.loaded) return;
      let status: Snapshot["status"] = "ready";
      try {
        if (!storage) throw Error("Unavailable");
        storage.removeItem(FAVORITES_KEY);
      } catch {
        status = "unavailable";
      }
      publish({ loaded: true, ids: Object.freeze([]), status });
    },
    close() {
      active = false;
    },
  };
}
