import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyAlgorithmText } from "../core/moves";
import { createSolvedCubeState } from "../core/state";
import { createSolverController, type SolverPort } from "./controller";
import {
  INIT_TIMEOUT_MS,
  SOLVE_TIMEOUT_MS,
  RETRY_COOLDOWN_MS,
  type SolverRequest,
} from "./protocol";
const r = applyAlgorithmText(createSolvedCubeState(), "R"),
  u = applyAlgorithmText(createSolvedCubeState(), "U");
class Port implements SolverPort {
  onmessage: SolverPort["onmessage"] = null;
  onerror: SolverPort["onerror"] = null;
  onmessageerror: SolverPort["onmessageerror"] = null;
  messages: SolverRequest[] = [];
  postMessage = vi.fn((data: SolverRequest) => {
    this.messages.push(data);
  });
  terminate = vi.fn();
  emit(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
  ready() {
    this.emit({ type: "ready", generationId: this.messages[0].generationId });
  }
  result(algorithm = "R'", overrides: Record<string, unknown> = {}) {
    const request = this.messages.at(-1)!;
    this.emit({ ...request, type: "result", algorithm, ...overrides });
  }
}
function setup() {
  const ports: Port[] = [];
  const controller = createSolverController({
    createWorker: () => {
      const port = new Port();
      ports.push(port);
      return port;
    },
  });
  return { controller, ports };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
describe("Worker solver controller", () => {
  it("is SSR-safe/lazy; invalid and solved inputs never create or message a worker", () => {
    const { controller, ports } = setup();
    expect(controller.getSnapshot()).toBe(controller.getServerSnapshot());
    expect(controller.solve(null)).toBe(false);
    expect(controller.getSnapshot().error).toBe("INVALID_INPUT");
    expect(controller.solve(createSolvedCubeState())).toBe(true);
    expect(controller.getSnapshot().status).toBe("already-solved");
    expect(controller.getSnapshot().result!.moves).toHaveLength(0);
    expect(ports).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("initializes once, verifies a result and retains a frozen snapshot", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    expect(controller.getSnapshot().status).toBe("initializing");
    const port = ports[0];
    port.ready();
    expect(controller.getSnapshot().status).toBe("solving");
    port.result();
    const result = controller.getSnapshot().result!;
    expect(controller.getSnapshot().status).toBe("success");
    expect(result.initial).toEqual(r);
    expect(result.initial).not.toBe(r);
    expect(result.notation).toBe("R'");
    expect(Object.isFrozen(result.moves)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("reuses ready tables with a fresh request ID and ignores an old same-worker result", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    const port = ports[0];
    port.ready();
    const old = port.messages.at(-1)!;
    port.result();
    controller.solve(u);
    expect(ports).toHaveLength(1);
    const request = port.messages.at(-1)!;
    expect(request.type).toBe("solve");
    expect(request).not.toEqual(old);
    port.emit({ ...old, type: "result", algorithm: "R'" });
    expect(controller.getSnapshot().status).toBe("solving");
    port.result("U'");
    expect(controller.getSnapshot().result!.notation).toBe("U'");
    controller.release();
  });
  it("coalesces 50 repeated requests during init and search", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    const first = controller.getSnapshot();
    for (let i = 0; i < 50; i++) expect(controller.solve(r)).toBe(false);
    expect(controller.getSnapshot()).toBe(first);
    expect(ports).toHaveLength(1);
    expect(ports[0].messages).toHaveLength(1);
    ports[0].ready();
    for (let i = 0; i < 50; i++) controller.solve(r);
    expect(ports[0].messages).toHaveLength(2);
    controller.release();
  });
  it.each(["init", "search"])(
    "invalidates %s, clears stale results and ignores late messages/errors",
    (phase) => {
      const { controller, ports } = setup();
      controller.solve(r);
      const port = ports[0];
      if (phase === "search") port.ready();
      const late = port.onmessage!,
        lateError = port.onerror!;
      const request = port.messages.at(-1)!;
      controller.invalidate();
      expect(port.terminate).toHaveBeenCalledOnce();
      expect(port.onmessage).toBeNull();
      const held = controller.getSnapshot();
      late({
        data: { ...request, type: "result", algorithm: "R'" },
      } as MessageEvent);
      lateError({ preventDefault: vi.fn() } as unknown as ErrorEvent);
      expect(controller.getSnapshot()).toBe(held);
      expect(controller.solve(u)).toBe(false);
      expect(ports).toHaveLength(1);
      vi.advanceTimersByTime(RETRY_COOLDOWN_MS);
      expect(controller.solve(u)).toBe(true);
      expect(ports).toHaveLength(2);
      ports[1].ready();
      ports[1].result("U'");
      expect(controller.getSnapshot().status).toBe("success");
      controller.release();
    },
  );
  it("latest different input cancels the old request and requires cooldown before retry", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    ports[0].ready();
    expect(controller.solve(u)).toBe(false);
    expect(controller.getSnapshot().error).toBe("RETRY_LATER");
    expect(ports[0].terminate).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(RETRY_COOLDOWN_MS);
    controller.solve(u);
    ports[1].ready();
    ports[1].result("U'");
    expect(controller.getSnapshot().result!.initial).toEqual(u);
    controller.release();
  });
  it("clears a successful result on edit while preserving reusable ready tables", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    ports[0].ready();
    ports[0].result();
    controller.invalidate();
    expect(controller.getSnapshot().result).toBeNull();
    expect(ports[0].terminate).not.toHaveBeenCalled();
    controller.solve(u);
    expect(ports).toHaveLength(1);
    ports[0].result("U'");
    controller.release();
  });
  it("cancels without letting the old phase timeout fire", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    controller.cancel();
    vi.advanceTimersByTime(INIT_TIMEOUT_MS + SOLVE_TIMEOUT_MS);
    expect(controller.getSnapshot().status).toBe("cancelled");
    expect(controller.getSnapshot().retryAt).toBe(0);
    expect(ports).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("times out cold initialization, terminates, then retries with a new worker", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    vi.advanceTimersByTime(INIT_TIMEOUT_MS);
    expect(controller.getSnapshot().error).toBe("INIT_TIMEOUT");
    expect(ports[0].terminate).toHaveBeenCalledOnce();
    expect(controller.solve(r)).toBe(false);
    vi.advanceTimersByTime(RETRY_COOLDOWN_MS);
    controller.solve(r);
    ports[1].ready();
    ports[1].result();
    expect(controller.getSnapshot().status).toBe("success");
    controller.release();
  });
  it("uses a fresh search deadline after initialization finishes", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    vi.advanceTimersByTime(INIT_TIMEOUT_MS - 1);
    ports[0].ready();
    vi.advanceTimersByTime(SOLVE_TIMEOUT_MS - 1);
    expect(controller.getSnapshot().status).toBe("solving");
    vi.advanceTimersByTime(1);
    expect(controller.getSnapshot().error).toBe("SOLVE_TIMEOUT");
    expect(ports[0].terminate).toHaveBeenCalledOnce();
    controller.release();
  });
  it.each([
    "",
    "R",
    "x",
    "(R U)",
    Array(257).fill("R").join(" "),
    "R".repeat(2049),
  ])("refuses incorrect, unsupported or oversized output %s", (algorithm) => {
    const { controller, ports } = setup();
    controller.solve(r);
    ports[0].ready();
    ports[0].result(algorithm);
    expect(controller.getSnapshot().error).toBe("INVALID_RESULT");
    expect(controller.getSnapshot().result).toBeNull();
    expect(ports[0].terminate).toHaveBeenCalledOnce();
    controller.release();
  });
  it("ignores wrong generation, request, fingerprint and duplicate ready messages", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    const port = ports[0];
    port.ready();
    const sent = port.messages.length;
    port.ready();
    expect(port.messages).toHaveLength(sent);
    port.result("R'", { generationId: 999 });
    port.result("R'", { requestId: 999 });
    port.result("R'", { serialization: "U".repeat(54) });
    expect(controller.getSnapshot().status).toBe("solving");
    port.result();
    expect(controller.getSnapshot().status).toBe("success");
    controller.release();
  });
  it("turns malformed data, messageerror and Worker error into retryable failures", () => {
    for (const kind of ["malformed", "messageerror", "error"]) {
      const { controller, ports } = setup();
      controller.solve(r);
      const p = ports[0];
      if (kind === "malformed") p.emit(null);
      else if (kind === "messageerror") p.onmessageerror!({} as MessageEvent);
      else p.onerror!({ preventDefault: vi.fn() } as unknown as ErrorEvent);
      expect(controller.getSnapshot().status).toBe("error");
      expect(p.terminate).toHaveBeenCalledOnce();
      controller.release();
    }
  });
  it("handles an init/search error from the matching worker only", () => {
    for (const search of [false, true]) {
      const { controller, ports } = setup();
      controller.solve(r);
      const p = ports[0];
      if (search) p.ready();
      const request = p.messages.at(-1)!;
      p.emit({
        type: "error",
        generationId: request.generationId,
        requestId: request.type === "solve" ? request.requestId : null,
        serialization: request.type === "solve" ? request.serialization : null,
        code: "WORKER_ERROR",
      });
      expect(controller.getSnapshot().error).toBe("WORKER_ERROR");
      controller.release();
    }
  });
  it("rejects invalid replacement input without sending any new solve", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    ports[0].ready();
    controller.solve({});
    expect(controller.getSnapshot().error).toBe("INVALID_INPUT");
    expect(ports[0].messages).toHaveLength(2);
    expect(ports[0].terminate).toHaveBeenCalledOnce();
    controller.release();
  });
  it("handles blocked Worker construction without synchronous solve fallback", () => {
    const controller = createSolverController({
      createWorker: () => {
        throw Error("blocked");
      },
    });
    expect(controller.solve(r)).toBe(false);
    expect(controller.getSnapshot().error).toBe("WORKER_ERROR");
    controller.release();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("handles postMessage failure and tears down listeners/timers", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    ports[0].postMessage.mockImplementation(() => {
      throw Error("clone");
    });
    ports[0].ready();
    expect(controller.getSnapshot().error).toBe("WORKER_ERROR");
    controller.release();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("release is idempotent and safe for StrictMode/route hide and subsequent reuse", () => {
    const { controller, ports } = setup();
    controller.solve(r);
    const old = ports[0].messages[0].generationId;
    controller.release();
    controller.release();
    expect(vi.getTimerCount()).toBe(0);
    expect(ports[0].onerror).toBeNull();
    controller.solve(r);
    expect(ports[1].messages[0].generationId).toBeGreaterThan(old);
    ports[1].ready();
    ports[1].result();
    expect(controller.getSnapshot().status).toBe("success");
    controller.release();
  });
  it("survives subscriber cleanup during a phase publication", () => {
    const { controller, ports } = setup();
    const off = controller.subscribe(() => {
      if (controller.getSnapshot().status === "initializing")
        controller.release();
    });
    expect(() => controller.solve(r)).not.toThrow();
    expect(ports[0].messages).toHaveLength(0);
    expect(controller.getSnapshot().status).toBe("idle");
    off();
    controller.release();
  });
});
