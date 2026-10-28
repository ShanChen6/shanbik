import { validateSolve, type Penalty, type Solve } from "./solve";
export const DB_NAME = "shanbik-timer";
export const HISTORY_LIMIT = 10000;
export const LEGACY_MARKER = "legacy-timer-solves-v1";
const SOLVES = "solves",
  META = "meta";
/**
 * Schema migrations, index i upgrades version i → i + 1. Never edit a shipped
 * step: append a new one so browsers on any older version replay the rest.
 */
export const MIGRATIONS: readonly ((
  db: IDBDatabase,
  tx: IDBTransaction,
) => void)[] = [
  // 0 → 1: solves keyed by attempt ID with a timestamp index; meta records one-time imports.
  (db) => {
    db.createObjectStore(SOLVES, { keyPath: "id" }).createIndex(
      "timestamp",
      "timestamp",
    );
    db.createObjectStore(META, { keyPath: "key" });
  },
];
export const DB_VERSION = MIGRATIONS.length;
export function openSolveDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      for (let v = event.oldVersion; v < DB_VERSION; v++)
        MIGRATIONS[v](request.result, request.transaction!);
    };
    request.onsuccess = () => {
      const db = request.result;
      // Let a newer tab upgrade instead of being blocked by this connection.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error ?? Error("Cannot open"));
  });
}
const same = (a: Solve, b: Solve) =>
  a.id === b.id &&
  a.puzzle === b.puzzle &&
  a.durationMs === b.durationMs &&
  a.scramble === b.scramble &&
  a.timestamp === b.timestamp &&
  a.penalty === b.penalty;
export const sortSolves = (solves: readonly Solve[]): readonly Solve[] =>
  Object.freeze(
    [...solves].sort(
      (a, b) => b.timestamp - a.timestamp || a.id.localeCompare(b.id),
    ),
  );
/** Runs `body` in one transaction and resolves with its result after commit. */
function transact<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  body: (solves: IDBObjectStore, meta: IDBObjectStore) => () => T,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let tx: IDBTransaction;
    try {
      tx = db.transaction([SOLVES, META], mode);
    } catch (error) {
      reject(error);
      return;
    }
    const result = body(tx.objectStore(SOLVES), tx.objectStore(META));
    tx.oncomplete = () => resolve(result());
    tx.onerror = () => reject(tx.error ?? Error("Transaction failed"));
    tx.onabort = () => reject(tx.error ?? Error("Transaction aborted"));
  });
}
const parse = (value: unknown): Solve | null => {
  try {
    return validateSolve(value);
  } catch {
    return null;
  }
};
export type AddResult = "added" | "duplicate" | "conflict" | "full";
export type UpdateResult = "updated" | "missing" | "changed";
export function createSolveRepository(db: IDBDatabase) {
  return {
    /** Valid records newest first; invalid ones are counted, never deleted. */
    list: () =>
      transact(db, "readonly", (solves) => {
        const request = solves.getAll();
        return () => {
          const all = request.result.map(parse),
            valid = all.filter((s): s is Solve => s !== null);
          return {
            solves: sortSolves(valid),
            skipped: all.length - valid.length,
          };
        };
      }),
    add: (solve: Solve) =>
      transact(db, "readwrite", (solves) => {
        let result: AddResult = "added";
        solves.count().onsuccess = (e) => {
          const count = (e.target as IDBRequest<number>).result;
          solves.get(solve.id).onsuccess = (e) => {
            const old = parse((e.target as IDBRequest).result);
            if ((e.target as IDBRequest).result !== undefined)
              result = old && same(old, solve) ? "duplicate" : "conflict";
            else if (count >= HISTORY_LIMIT) result = "full";
            else solves.add(solve);
          };
        };
        return () => result;
      }),
    /** Compare-and-set so a stale tab or undo never overwrites a newer edit. */
    setPenalty: (id: string, from: Penalty, to: Penalty) =>
      transact(db, "readwrite", (solves) => {
        let result: UpdateResult = "missing";
        solves.get(id).onsuccess = (e) => {
          const old = parse((e.target as IDBRequest).result);
          if (!old) return;
          if (old.penalty !== from) result = "changed";
          else {
            solves.put(validateSolve({ ...old, penalty: to }));
            result = "updated";
          }
        };
        return () => result;
      }),
    remove: (expected: Solve) =>
      transact(db, "readwrite", (solves) => {
        let result: UpdateResult = "missing";
        solves.get(expected.id).onsuccess = (e) => {
          const old = parse((e.target as IDBRequest).result);
          if (!old) return;
          if (!same(old, expected)) result = "changed";
          else {
            solves.delete(expected.id);
            result = "updated";
          }
        };
        return () => result;
      }),
    /** Imports Task 15 solves once; existing IDs win so edits survive reloads. */
    importLegacy: (legacy: readonly Solve[], now: number) =>
      transact(db, "readwrite", (solves, meta) => {
        let imported = 0;
        meta.get(LEGACY_MARKER).onsuccess = (e) => {
          if ((e.target as IDBRequest).result !== undefined) return;
          let left = legacy.length;
          const done = () =>
            meta.put({ key: LEGACY_MARKER, importedAt: now, count: imported });
          if (!left) done();
          for (const solve of legacy)
            solves.getKey(solve.id).onsuccess = (e) => {
              if ((e.target as IDBRequest).result === undefined) {
                solves.add(solve);
                imported++;
              }
              if (!--left) done();
            };
        };
        return () => imported;
      }),
    /**
     * Account sync (Task 23.4): write merged solves and remove deleted ones
     * in one transaction. Callers have already resolved conflicts.
     */
    applySync: (upserts: readonly Solve[], deletes: readonly string[]) =>
      transact(db, "readwrite", (solves) => {
        for (const solve of upserts) solves.put(validateSolve(solve));
        for (const id of deletes) solves.delete(id);
        return () => upserts.length + deletes.length;
      }),
    close: () => db.close(),
  };
}
export type SolveRepository = ReturnType<typeof createSolveRepository>;
