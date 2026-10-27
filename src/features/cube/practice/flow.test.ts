import { describe, expect, it } from "vitest";
import { applyAlgorithm, invertAlgorithm } from "../core/moves";
import { parseAlgorithm, serializeAlgorithm } from "../core/notation";
import { createSolvedCubeState, isCubeSolved } from "../core/state";
import { inspectFaceDraft, paintSticker } from "../face-input/draft";
import { createSolverController, type SolverPort } from "../solver/controller";
import type { SolverRequest } from "../solver/protocol";
import { loadSolution } from "../solver/load-solution";
import { createMoveQueuePlayer } from "../viewer/move-queue";
import { canCaptureModel, captureModel, modelStatus } from "./flow";
const sequence = parseAlgorithm("R U F2 L' D B2");
const solved = createSolvedCubeState();
const mixed = applyAlgorithm(solved, sequence);
function harness() {
  const requests: SolverRequest[] = [];
  let terminated = 0;
  const port: SolverPort = {
    onmessage: null,
    onerror: null,
    onmessageerror: null,
    postMessage: (request) => {
      requests.push(request);
    },
    terminate: () => {
      terminated++;
    },
  };
  const solver = createSolverController({ createWorker: () => port });
  const emit = (data: unknown) => port.onmessage?.({ data } as MessageEvent);
  return { solver, requests, emit, terminated: () => terminated };
}
describe("practice flow", () => {
  it.each([false, true])(
    "scramble → capture → solve → load → play → reset (instant=%s)",
    (instant) => {
      const player = createMoveQueuePlayer();
      player.setReducedMotion(instant);
      player.loadSequence(sequence);
      player.play();
      while (player.getSnapshot().active)
        player.complete(player.getSnapshot().active!.id);
      expect(player.getSnapshot().state).toEqual(mixed);
      const draft = captureModel(player, true)!;
      expect(inspectFaceDraft(draft).state).toEqual(mixed);
      const { solver, requests, emit, terminated } = harness();
      solver.solve({ faces: draft });
      expect(solver.getSnapshot().status).toBe("initializing");
      emit({ type: "ready", generationId: requests[0].generationId });
      expect(solver.getSnapshot().status).toBe("solving");
      emit({
        ...requests.at(-1),
        type: "result",
        algorithm: serializeAlgorithm(invertAlgorithm(sequence)),
      });
      expect(solver.getSnapshot().status).toBe("success");
      expect(player.getSnapshot().state).toEqual(mixed);
      expect(loadSolution(player, solver.getSnapshot().result!)).toBe(true);
      player.play();
      while (player.getSnapshot().active)
        player.complete(player.getSnapshot().active!.id);
      expect(isCubeSolved(player.getSnapshot().state)).toBe(true);
      expect(modelStatus(player.getSnapshot())).toContain("Mô hình đã solved.");
      player.resetPlayback();
      expect(player.getSnapshot().state).toEqual(mixed);
      solver.release();
      player.reset();
      expect(terminated()).toBe(1);
      expect(solver.getSnapshot().status).toBe("idle");
      expect(player.getSnapshot().playback).toBeNull();
      expect(isCubeSolved(player.getSnapshot().state)).toBe(true);
    },
  );
  it("refuses unavailable 3D, active animations and a paused FIFO with pending moves", () => {
    const player = createMoveQueuePlayer();
    expect(captureModel(player, false)).toBeNull();
    player.enqueue(sequence);
    expect(captureModel(player, true)).toBeNull();
    expect(modelStatus(player.getSnapshot())).toContain("đang xoay");
    player.pause();
    player.complete(player.getSnapshot().active!.id);
    expect(captureModel(player, true)).toBeNull();
    expect(modelStatus(player.getSnapshot())).toContain("hàng đợi");
    player.cancel();
    expect(canCaptureModel(player.getSnapshot(), true)).toBe(true);
  });
  it("captures a paused playback boundary and isolates edits from model and reset", () => {
    const player = createMoveQueuePlayer();
    player.loadSequence(sequence);
    player.play();
    player.pausePlayback();
    expect(captureModel(player, true)).toBeNull();
    player.complete(player.getSnapshot().active!.id);
    const before = player.getSnapshot();
    const draft = captureModel(player, true)!;
    expect(modelStatus(before)).toContain("1/6");
    paintSticker(draft, "U", 0, null);
    expect(player.getSnapshot()).toBe(before);
    player.reset();
    expect(inspectFaceDraft(draft).state).toEqual(before.state);
  });
  it("invalid input and Worker error retain the draft and committed model for retry", () => {
    const player = createMoveQueuePlayer(mixed);
    const before = player.getSnapshot();
    const draft = captureModel(player, true)!;
    const { solver, requests, emit } = harness();
    expect(solver.solve({ faces: paintSticker(draft, "U", 0, null) })).toBe(
      false,
    );
    expect(solver.getSnapshot().error).toBe("INVALID_INPUT");
    expect(requests).toHaveLength(0);
    solver.solve({ faces: draft });
    emit({
      type: "error",
      generationId: requests[0].generationId,
      requestId: null,
      serialization: null,
      code: "WORKER_ERROR",
    });
    expect(solver.getSnapshot().status).toBe("error");
    expect(player.getSnapshot()).toBe(before);
    expect(inspectFaceDraft(draft).state).toEqual(mixed);
    solver.release();
    expect(solver.solve({ faces: draft })).toBe(true);
    solver.release();
  });
  it("already-solved input needs no worker or artificial player sequence", () => {
    const player = createMoveQueuePlayer();
    const before = player.getSnapshot();
    const { solver, requests } = harness();
    solver.solve({ faces: captureModel(player, true)! });
    expect(solver.getSnapshot().status).toBe("already-solved");
    expect(requests).toHaveLength(0);
    expect(loadSolution(player, solver.getSnapshot().result!)).toBe(false);
    expect(player.getSnapshot()).toBe(before);
    solver.release();
  });
});
