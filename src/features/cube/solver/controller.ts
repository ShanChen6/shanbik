import { validateCubeFeasibility } from "../core/feasibility";
import { isCubeSolved } from "../core/state";
import type { CubeState } from "../core/types";
import {
  INIT_TIMEOUT_MS,
  SOLVE_TIMEOUT_MS,
  RETRY_COOLDOWN_MS,
  parseResponse,
  record,
  validId,
  type SolverErrorCode,
  type SolverRequest,
} from "./protocol";
import { verifySolution, type VerifiedSolution } from "./verify-solution";

export type SolverPort = {
  onmessage: ((event: MessageEvent<unknown>) => unknown) | null;
  onerror: ((event: ErrorEvent) => unknown) | null;
  onmessageerror: ((event: MessageEvent<unknown>) => unknown) | null;
  postMessage(message: SolverRequest): void;
  terminate(): void;
};
export type SolverSnapshot = Readonly<{
  status:
    | "idle"
    | "initializing"
    | "solving"
    | "success"
    | "already-solved"
    | "error"
    | "cancelled";
  result: VerifiedSolution | null;
  error: SolverErrorCode | null;
  retryAt: number;
}>;
const INITIAL: SolverSnapshot = Object.freeze({
  status: "idle",
  result: null,
  error: null,
  retryAt: 0,
});
export function createSolverController(options: {
  createWorker: () => SolverPort;
  initTimeoutMs?: number;
  solveTimeoutMs?: number;
  retryCooldownMs?: number;
  now?: () => number;
}) {
  let snapshot = INITIAL,
    worker: SolverPort | null = null,
    ready = false,
    generation = 0,
    nextRequest = 0;
  let active: { id: number; state: CubeState; serialization: string } | null =
    null;
  let timer: ReturnType<typeof setTimeout> | null = null,
    cooldown: ReturnType<typeof setTimeout> | null = null;
  let retryAt = 0;
  const now = options.now ?? Date.now;
  const listeners = new Set<() => void>();
  const publish = (next: Omit<SolverSnapshot, "retryAt">) => {
    snapshot = Object.freeze({ ...next, retryAt });
    listeners.forEach((notify) => notify());
  };
  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const terminate = (withCooldown: boolean) => {
    const busy = !!active;
    generation++;
    clearTimer();
    active = null;
    ready = false;
    if (worker) {
      const old = worker;
      worker = null;
      old.onmessage = null;
      old.onerror = null;
      old.onmessageerror = null;
      old.terminate();
    }
    if (withCooldown && busy) {
      if (cooldown !== null) clearTimeout(cooldown);
      retryAt = now() + (options.retryCooldownMs ?? RETRY_COOLDOWN_MS);
      cooldown = setTimeout(
        () => {
          cooldown = null;
          retryAt = 0;
          publish(snapshot);
        },
        Math.max(0, retryAt - now()),
      );
    }
  };
  const fail = (error: SolverErrorCode) => {
    terminate(true);
    publish({ status: "error", error, result: null });
  };
  const send = (message: SolverRequest) => {
    try {
      worker!.postMessage(message);
    } catch {
      fail("WORKER_ERROR");
    }
  };
  const deadline = (ms: number, code: "INIT_TIMEOUT" | "SOLVE_TIMEOUT") => {
    clearTimer();
    const epoch = generation;
    const id = active!.id;
    timer = setTimeout(() => {
      if (generation === epoch && active?.id === id) fail(code);
    }, ms);
  };
  const search = () => {
    if (!active) return;
    const request = active;
    const epoch = generation;
    publish({ status: "solving", error: null, result: null });
    if (active !== request || generation !== epoch || !worker) return;
    deadline(options.solveTimeoutMs ?? SOLVE_TIMEOUT_MS, "SOLVE_TIMEOUT");
    send({
      type: "solve",
      generationId: generation,
      requestId: active.id,
      serialization: active.serialization,
    });
  };
  const solve = (input: unknown): boolean => {
    const checked = validateCubeFeasibility(input);
    if (!checked.valid) {
      if (active) terminate(true);
      publish({ status: "error", error: "INVALID_INPUT", result: null });
      return false;
    }
    if (active?.serialization === checked.serialization) return false; // synchronous spam coalescing
    if (active) terminate(true); // latest input invalidates old request; retry respects churn cooldown
    if (isCubeSolved(checked.state)) {
      publish({
        status: "already-solved",
        error: null,
        result: verifySolution(checked.state, checked.serialization, ""),
      });
      return true;
    }
    if (retryAt > now()) {
      publish({ status: "error", error: "RETRY_LATER", result: null });
      return false;
    }
    active = {
      id: ++nextRequest,
      state: checked.state,
      serialization: checked.serialization,
    };
    if (ready && worker) {
      search();
      return true;
    }
    const epoch = ++generation;
    try {
      worker = options.createWorker();
    } catch {
      fail("WORKER_ERROR");
      return false;
    }
    const port = worker;
    port.onmessage = ({ data }) => {
      if (worker !== port || generation !== epoch || !active) return;
      if (
        record(data) &&
        validId(data.generationId) &&
        data.generationId !== epoch
      )
        return;
      const response = parseResponse(data);
      if (!response) {
        fail("INVALID_RESULT");
        return;
      }
      if (response.type === "ready") {
        if (snapshot.status !== "initializing") return;
        clearTimer();
        ready = true;
        search();
        return;
      }
      if (response.type === "error") {
        const matches =
          snapshot.status === "initializing"
            ? response.requestId === null && response.serialization === null
            : response.requestId === active.id &&
              response.serialization === active.serialization;
        if (matches) fail(response.code);
        return;
      }
      if (
        snapshot.status !== "solving" ||
        response.requestId !== active.id ||
        response.serialization !== active.serialization
      )
        return;
      try {
        const result = verifySolution(
          active.state,
          active.serialization,
          response.algorithm,
        );
        clearTimer();
        active = null;
        publish({ status: "success", result, error: null });
      } catch {
        fail("INVALID_RESULT");
      }
    };
    port.onerror = (event) => {
      event?.preventDefault?.();
      if (worker === port && generation === epoch) fail("WORKER_ERROR");
    };
    port.onmessageerror = () => {
      if (worker === port && generation === epoch) fail("WORKER_ERROR");
    };
    publish({ status: "initializing", error: null, result: null });
    if (!active || worker !== port || generation !== epoch) return false;
    deadline(options.initTimeoutMs ?? INIT_TIMEOUT_MS, "INIT_TIMEOUT");
    send({ type: "init", generationId: epoch });
    return snapshot.status !== "error";
  };
  return {
    solve,
    cancel() {
      terminate(true);
      publish({ status: "cancelled", result: null, error: null });
    },
    invalidate() {
      if (active) terminate(true);
      publish({ status: "idle", result: null, error: null });
    },
    /** Reusable after React StrictMode/Activity cleanup; never reuse counters. */
    release() {
      terminate(false);
      if (cooldown !== null) clearTimeout(cooldown);
      cooldown = null;
      retryAt = 0;
      publish({ status: "idle", result: null, error: null });
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => INITIAL,
    subscribe(notify: () => void) {
      listeners.add(notify);
      return () => {
        listeners.delete(notify);
      };
    },
  };
}
