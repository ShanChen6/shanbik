export const BOOKMARKS_KEY = "shanbik:competition-bookmarks:v1";
export const MAX_BOOKMARKS = 200;
/** How long before the event a calendar reminder fires. */
export const REMINDERS = {
  none: "Không báo trước",
  "1h": "Trước 1 giờ",
  "1d": "Trước 1 ngày",
  "7d": "Trước 1 tuần",
} as const;
export type Reminder = keyof typeof REMINDERS;
export type Bookmark = Readonly<{
  id: string;
  savedAt: number;
  remind: Reminder;
}>;
type StoragePort = Pick<Storage, "getItem" | "setItem">;
export function parseBookmarks(raw: string | null): readonly Bookmark[] {
  if (raw === null) return Object.freeze([]);
  if (raw.length > 50_000) throw Error("Bookmarks too large");
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== "object" ||
    (value as { version?: unknown }).version !== 1 ||
    !Array.isArray((value as { items?: unknown }).items)
  )
    throw Error("Invalid bookmarks");
  const items = (value as { items: unknown[] }).items;
  if (items.length > MAX_BOOKMARKS) throw Error("Invalid bookmarks");
  const seen = new Set<string>();
  return Object.freeze(
    items.map((item) => {
      const b = item as Record<string, unknown>;
      if (
        !b ||
        typeof b.id !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b.id) ||
        b.id.length > 80 ||
        seen.has(b.id) ||
        typeof b.savedAt !== "number" ||
        !Number.isSafeInteger(b.savedAt) ||
        b.savedAt < 0 ||
        !Object.hasOwn(REMINDERS, String(b.remind))
      )
        throw Error("Invalid bookmarks");
      seen.add(b.id);
      return Object.freeze({
        id: b.id,
        savedAt: b.savedAt,
        remind: b.remind as Reminder,
      });
    }),
  );
}
type Snapshot = Readonly<{
  loaded: boolean;
  items: readonly Bookmark[];
  status: "loading" | "ready" | "invalid" | "unavailable" | "full";
}>;
/**
 * Saved competitions on this device. Bookmarks of competitions no longer in
 * the dataset are kept (they may return) but not shown. Invalid stored data
 * is reported and only replaced when the user saves something new.
 */
export function createBookmarks(
  getStorage: () => StoragePort,
  now: () => number = Date.now,
) {
  let snapshot: Snapshot = Object.freeze({
    loaded: false,
    items: Object.freeze([]),
    status: "loading",
  });
  const server = snapshot,
    listeners = new Set<() => void>();
  let storage: StoragePort | null = null,
    active = false;
  const publish = (next: Partial<Snapshot>) => {
    snapshot = Object.freeze({ ...snapshot, ...next });
    listeners.forEach((fn) => fn());
  };
  const read = () => {
    let raw: string | null;
    try {
      storage = getStorage();
      raw = storage.getItem(BOOKMARKS_KEY);
    } catch {
      storage = null;
      return publish({
        loaded: true,
        items: Object.freeze([]),
        status: "unavailable",
      });
    }
    try {
      publish({ loaded: true, items: parseBookmarks(raw), status: "ready" });
    } catch {
      publish({ loaded: true, items: Object.freeze([]), status: "invalid" });
    }
  };
  const write = (items: readonly Bookmark[]) => {
    let status: Snapshot["status"] = "ready";
    try {
      if (!storage) throw Error("Unavailable");
      storage.setItem(BOOKMARKS_KEY, JSON.stringify({ version: 1, items }));
    } catch {
      status = "unavailable";
    }
    publish({ loaded: true, items: Object.freeze(items), status });
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
      if (!snapshot.loaded) read();
    },
    /** Another tab changed the key. */
    refresh() {
      if (active) read();
    },
    toggle(id: string) {
      if (!active || !snapshot.loaded) return false;
      const has = snapshot.items.some((b) => b.id === id);
      if (!has && snapshot.items.length >= MAX_BOOKMARKS) {
        publish({ status: "full" });
        return false;
      }
      write(
        has
          ? snapshot.items.filter((b) => b.id !== id)
          : [
              ...snapshot.items,
              Object.freeze({ id, savedAt: now(), remind: "1d" as Reminder }),
            ],
      );
      return true;
    },
    setReminder(id: string, remind: Reminder) {
      if (!active || !snapshot.loaded || !Object.hasOwn(REMINDERS, remind))
        return false;
      if (!snapshot.items.some((b) => b.id === id)) return false;
      write(
        snapshot.items.map((b) =>
          b.id === id ? Object.freeze({ ...b, remind }) : b,
        ),
      );
      return true;
    },
    close() {
      active = false;
    },
  };
}
export type BookmarkStore = ReturnType<typeof createBookmarks>;
