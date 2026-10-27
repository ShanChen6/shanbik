import { describe, expect, it, vi } from "vitest";
import { createFavorites, FAVORITES_KEY, parseFavorites } from "./favorites";
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
describe("algorithm favorites", () => {
  it("does not touch browser/storage or write before opening; persists and restores", () => {
    const storage = memory(),
      factory = vi.fn(() => storage),
      s = createFavorites(factory);
    expect(s.getServerSnapshot().loaded).toBe(false);
    expect(factory).not.toHaveBeenCalled();
    expect(s.toggle("pll-t")).toBe(false);
    s.open();
    expect(storage.setItem).not.toHaveBeenCalled();
    s.toggle("pll-t");
    s.toggle("oll-sune");
    const restored = createFavorites(() => storage);
    restored.open();
    expect(restored.getSnapshot().ids).toEqual(["pll-t", "oll-sune"]);
    expect(JSON.parse(storage.data.get(FAVORITES_KEY)!)).toEqual({
      version: 1,
      ids: ["pll-t", "oll-sune"],
    });
    restored.toggle("pll-t");
    expect(restored.getSnapshot().ids).toEqual(["oll-sune"]);
  });
  it.each([
    "{",
    "null",
    "[]",
    "{}",
    '{"version":2,"ids":[]}',
    '{"version":1,"ids":[1]}',
    "x".repeat(20001),
  ])("ignores corrupted input without writing it back %#", (raw) => {
    const storage = memory();
    storage.data.set(FAVORITES_KEY, raw);
    const s = createFavorites(() => storage);
    s.open();
    expect(s.getSnapshot().status).toBe("invalid");
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(s.getSnapshot().ids).toEqual([]);
    s.toggle("pll-t");
    expect(s.getSnapshot().status).toBe("ready");
  });
  it("deduplicates and drops removed IDs, ignores unknown updates", () => {
    expect(
      parseFavorites('{"version":1,"ids":["pll-t","removed","pll-t"]}'),
    ).toEqual(["pll-t"]);
    const storage = memory(),
      s = createFavorites(() => storage);
    s.open();
    expect(s.toggle("unknown")).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it.each(["factory", "read", "write", "remove"])(
    "survives %s failure and retains in-memory choices",
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
      const s = createFavorites(() => {
        if (mode === "factory") throw Error("blocked");
        return storage;
      });
      s.open();
      s.toggle("pll-t");
      expect(s.getSnapshot().ids).toEqual(["pll-t"]);
      if (mode !== "remove") expect(s.getSnapshot().status).toBe("unavailable");
      s.clear();
      expect(s.getSnapshot().ids).toEqual([]);
      if (mode === "remove") expect(s.getSnapshot().status).toBe("unavailable");
    },
  );
  it("clear removes only its own key, close rejects late writes, reopen does not reread stale state", () => {
    const storage = memory();
    storage.data.set("shanbik-theme", "dark");
    const s = createFavorites(() => storage);
    s.open();
    s.toggle("pll-t");
    s.close();
    expect(s.toggle("oll-sune")).toBe(false);
    s.open();
    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(s.getSnapshot().ids).toEqual(["pll-t"]);
    s.clear();
    expect(storage.data.has(FAVORITES_KEY)).toBe(false);
    expect(storage.data.get("shanbik-theme")).toBe("dark");
  });
});
