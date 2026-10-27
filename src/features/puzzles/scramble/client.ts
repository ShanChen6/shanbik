import {
  SCRAMBLE_TIMEOUT_MS,
  WORKER_URL,
  type ScramblePuzzle,
  type ScrambleResponse,
} from "./protocol";
import { validateScramble } from "./validate";
type WorkerPort = Pick<Worker, "postMessage" | "terminate"> & {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
};
export type ScrambleSnapshot = Readonly<{
  status: "idle" | "generating" | "ready" | "error";
  /** Kept while a new one is generated so the page never empties. */
  scramble: string | null;
  error: "timeout" | "failed" | null;
  /** True until the first result: the first 4×4 builds tables in the Worker. */
  cold: boolean;
}>;
/**
 * One dedicated Worker per page, created on the first explicit request and
 * reused. A newer request or release discards older replies; a timeout or
 * Worker error terminates it so the next request starts clean.
 */
export function createScrambleClient(
  puzzle: ScramblePuzzle,
  deps: {
    createWorker?: () => WorkerPort;
    setTimer?: (fn: () => void, ms: number) => unknown;
    clearTimer?: (handle: unknown) => void;
  } = {},
) {
  const createWorker =
      deps.createWorker ??
      (() => new Worker(WORKER_URL, { type: "module" }) as WorkerPort),
    setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms)),
    clearTimer =
      deps.clearTimer ??
      ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  let snapshot: ScrambleSnapshot = Object.freeze({
    status: "idle",
    scramble: null,
    error: null,
    cold: true,
  });
  const server = snapshot,
    listeners = new Set<() => void>();
  let worker: WorkerPort | null = null,
    current = 0,
    timer: unknown = null;
  const publish = (next: Partial<ScrambleSnapshot>) => {
    snapshot = Object.freeze({ ...snapshot, ...next });
    listeners.forEach((fn) => fn());
  };
  const stop = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
    worker?.terminate();
    worker = null;
  };
  const fail = (error: "timeout" | "failed") => {
    stop();
    current++;
    publish({ status: "error", error });
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
    generate() {
      if (snapshot.status === "generating") return false;
      const id = ++current;
      try {
        if (!worker) {
          worker = createWorker();
          worker.onmessage = (event: MessageEvent<ScrambleResponse>) => {
            const data = event.data;
            if (!data || data.type !== "scramble" || data.id !== current)
              return;
            if (timer !== null) clearTimer(timer);
            timer = null;
            if (!data.ok) return fail("failed");
            try {
              publish({
                status: "ready",
                scramble: validateScramble(puzzle, data.scramble),
                error: null,
                cold: false,
              });
            } catch {
              fail("failed");
            }
          };
          worker.onerror = () => fail("failed");
        }
        timer = setTimer(() => {
          if (id === current) fail("timeout");
        }, SCRAMBLE_TIMEOUT_MS);
        publish({ status: "generating", error: null });
        worker.postMessage({ type: "scramble", id, puzzle });
        return true;
      } catch {
        fail("failed");
        return false;
      }
    },
    /** Unmount: drop the Worker; a later generate() recreates it. */
    release() {
      current++;
      stop();
      if (snapshot.status === "generating")
        publish({ status: snapshot.scramble ? "ready" : "idle" });
    },
  };
}
export type ScrambleClient = ReturnType<typeof createScrambleClient>;
