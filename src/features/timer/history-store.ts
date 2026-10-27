import {
  createSolveRepository,
  HISTORY_LIMIT,
  openSolveDatabase,
  sortSolves,
  type SolveRepository,
} from "./database";
import { parseSolves, SOLVES_KEY } from "./legacy";
import { validateSolve, withPenalty, type Penalty, type Solve } from "./solve";
export const UNDO_LIMIT = 20;
export type UndoEntry = Readonly<
  | { kind: "penalty"; id: string; from: Penalty; to: Penalty }
  | { kind: "delete"; solve: Solve }
>;
export type HistorySnapshot = Readonly<{
  loaded: boolean;
  /** False while the database is unavailable: new solves stay in memory only. */
  writable: boolean;
  solves: readonly Solve[];
  pending: number;
  /** Database work is queued; changes on screen may not be committed yet. */
  busy: boolean;
  status:
    | "loading"
    | "ready"
    | "unavailable"
    | "full"
    | "conflict"
    | "stale"
    | "write-failed";
  legacy: "none" | "imported" | "invalid";
  imported: number;
  skipped: number;
  undo: UndoEntry | null;
}>;
type Channel = Pick<BroadcastChannel, "postMessage" | "close"> & {
  onmessage: ((event: MessageEvent) => void) | null;
};
export function createSolveHistory(deps: {
  openRepository: () => Promise<SolveRepository>;
  /** Raw Task 15 localStorage value; may throw when storage is blocked. */
  readLegacy: () => string | null;
  now: () => number;
  channel?: () => Channel | null;
}) {
  let snapshot: HistorySnapshot = Object.freeze({
    loaded: false,
    writable: false,
    solves: Object.freeze([]),
    pending: 0,
    busy: false,
    status: "loading",
    legacy: "none",
    imported: 0,
    skipped: 0,
    undo: null,
  });
  const server = snapshot,
    listeners = new Set<() => void>(),
    pending = new Map<string, Solve>(),
    undoStack: UndoEntry[] = [];
  let repo: SolveRepository | null = null,
    channel: Channel | null = null,
    connecting = false,
    active = false,
    queued = 0,
    queue = Promise.resolve();
  const publish = (next: Partial<HistorySnapshot>) => {
    snapshot = Object.freeze({
      ...snapshot,
      ...next,
      writable: repo !== null,
      pending: pending.size,
      busy: queued > 0,
      undo: undoStack.at(-1) ?? null,
    });
    listeners.forEach((fn) => fn());
  };
  const enqueue = (task: () => Promise<void>) => {
    queued++;
    if (queued === 1) publish({});
    queue = queue
      .then(task)
      .catch(() => {})
      .finally(() => {
        queued--;
        if (!queued) publish({});
      });
    return queue;
  };
  const notify = () => {
    try {
      channel?.postMessage("changed");
    } catch {
      /* Other tabs refresh on their next load. */
    }
  };
  /** Database rows plus unsaved in-memory solves. */
  const reload = async () => {
    if (!repo) return;
    const { solves, skipped } = await repo.list();
    const ids = new Set(solves.map((s) => s.id));
    publish({
      solves: sortSolves([
        ...solves,
        ...[...pending.values()].filter((s) => !ids.has(s.id)),
      ]),
      skipped,
    });
  };
  const flush = async () => {
    if (!repo) return;
    for (const solve of [...pending.values()]) {
      const result = await repo.add(solve);
      pending.delete(solve.id);
      if (result === "full" || result === "conflict")
        publish({ status: result });
    }
  };
  const fail = (status: HistorySnapshot["status"]) => {
    try {
      repo?.close();
    } catch {
      /* Already closed. */
    }
    repo = null;
    publish({ loaded: true, status });
  };
  const connect = () =>
    enqueue(async () => {
      if (repo || connecting) return;
      connecting = true;
      try {
        repo = await deps.openRepository();
        let raw: string | null | undefined;
        try {
          raw = deps.readLegacy();
        } catch {
          raw = undefined; // Blocked: retry the import on a later visit.
        }
        if (raw !== undefined) {
          let legacy: readonly Solve[] | null = null;
          try {
            legacy = parseSolves(raw);
          } catch {
            publish({ legacy: "invalid" });
          }
          if (legacy) {
            const imported = await repo.importLegacy(legacy, deps.now());
            if (imported) publish({ legacy: "imported", imported });
          }
        }
        await flush();
        if (!channel) {
          try {
            channel = deps.channel?.() ?? null;
            if (channel) channel.onmessage = () => void enqueue(reload);
          } catch {
            channel = null;
          }
        }
        const full =
          snapshot.status === "full" || snapshot.status === "conflict";
        await reload();
        publish({ loaded: true, status: full ? snapshot.status : "ready" });
      } catch {
        fail("unavailable");
      } finally {
        connecting = false;
      }
    });
  const pushUndo = (entry: UndoEntry) => {
    undoStack.push(entry);
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  };
  const replace = (solve: Solve) =>
    sortSolves(snapshot.solves.map((s) => (s.id === solve.id ? solve : s)));
  /** Writes a penalty change; on a stale/failed write the database view wins. */
  const writePenalty = (id: string, from: Penalty, to: Penalty) =>
    enqueue(async () => {
      if (!repo) return;
      try {
        const result = await repo.setPenalty(id, from, to);
        if (result !== "updated") {
          undoStack.length = 0;
          publish({ status: "stale" });
        } else publish({ status: "ready" });
        notify();
        await reload();
      } catch {
        undoStack.length = 0;
        publish({ status: "write-failed" });
        await reload().catch(() => fail("unavailable"));
      }
    });
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
      if (!repo) void connect();
    },
    /** Resolves when queued database work has finished (tests/UI waits). */
    settled: () => queue,
    add(input: Solve) {
      if (!active || !snapshot.loaded) return false;
      const solve = validateSolve(input),
        old = snapshot.solves.find((s) => s.id === solve.id);
      if (old) {
        if (
          old.durationMs !== solve.durationMs ||
          old.timestamp !== solve.timestamp ||
          old.scramble !== solve.scramble
        )
          publish({ status: "conflict" });
        return false;
      }
      if (snapshot.solves.length >= HISTORY_LIMIT) {
        publish({ status: "full" });
        return false;
      }
      pending.set(solve.id, solve);
      publish({ solves: sortSolves([solve, ...snapshot.solves]) });
      void enqueue(async () => {
        if (!repo) return publish({ status: "unavailable" });
        try {
          const result = await repo.add(solve);
          pending.delete(solve.id);
          publish({
            status:
              result === "added" || result === "duplicate" ? "ready" : result,
          });
          notify();
          await reload();
        } catch {
          publish({ status: "unavailable" });
        }
      });
      return true;
    },
    setPenalty(id: string, penalty: Penalty) {
      const old = snapshot.solves.find((s) => s.id === id);
      if (
        !active ||
        !repo ||
        !old ||
        pending.has(id) ||
        old.penalty === penalty
      )
        return false;
      pushUndo({ kind: "penalty", id, from: old.penalty, to: penalty });
      publish({ solves: replace(withPenalty(old, penalty)) });
      void writePenalty(id, old.penalty, penalty);
      return true;
    },
    remove(id: string) {
      const old = snapshot.solves.find((s) => s.id === id);
      if (!active || !repo || !old || pending.has(id)) return false;
      pushUndo({ kind: "delete", solve: old });
      publish({ solves: snapshot.solves.filter((s) => s.id !== id) });
      void enqueue(async () => {
        if (!repo) return;
        try {
          const result = await repo.remove(old);
          if (result === "changed") {
            undoStack.length = 0;
            publish({ status: "stale" });
          } else publish({ status: "ready" });
          notify();
          await reload();
        } catch {
          undoStack.length = 0;
          publish({ status: "write-failed" });
          await reload().catch(() => fail("unavailable"));
        }
      });
      return true;
    },
    undo() {
      const entry = undoStack.at(-1);
      if (!active || !repo || !entry) return false;
      undoStack.pop();
      if (entry.kind === "penalty") {
        const current = snapshot.solves.find((s) => s.id === entry.id);
        if (current)
          publish({ solves: replace(withPenalty(current, entry.from)) });
        else publish({});
        void writePenalty(entry.id, entry.to, entry.from);
        return true;
      }
      const { solve } = entry;
      publish({
        solves: sortSolves([
          solve,
          ...snapshot.solves.filter((s) => s.id !== solve.id),
        ]),
      });
      void enqueue(async () => {
        if (!repo) return;
        try {
          const result = await repo.add(solve);
          publish({
            status:
              result === "added" || result === "duplicate"
                ? "ready"
                : result === "full"
                  ? "full"
                  : "stale",
          });
          notify();
          await reload();
        } catch {
          publish({ status: "write-failed" });
          await reload().catch(() => fail("unavailable"));
        }
      });
      return true;
    },
    retry() {
      if (!active || !snapshot.loaded) return false;
      if (!repo) void connect();
      else
        void enqueue(async () => {
          try {
            await flush();
            publish({ status: "ready" });
            await reload();
          } catch {
            publish({ status: "unavailable" });
          }
        });
      return true;
    },
    close() {
      active = false;
      // Release the connection once queued writes finish, unless reopened (StrictMode).
      void enqueue(async () => {
        if (active) return;
        channel?.close();
        channel = null;
        repo?.close();
        repo = null;
      });
    },
  };
}
export type SolveHistory = ReturnType<typeof createSolveHistory>;
/** Browser wiring: IndexedDB, the Task 15 localStorage key and cross-tab refresh. */
export function createBrowserSolveHistory() {
  return createSolveHistory({
    openRepository: async () =>
      createSolveRepository(await openSolveDatabase(window.indexedDB)),
    readLegacy: () => window.localStorage.getItem(SOLVES_KEY),
    now: () => Date.now(),
    channel: () =>
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("shanbik-timer"),
  });
}
