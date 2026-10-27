import { describe, expect, it } from "vitest";
import {
  applyAlgorithm,
  applyAlgorithmText,
  invertAlgorithm,
} from "../core/moves";
import { parseAlgorithm, serializeAlgorithm } from "../core/notation";
import { serializeCubeState } from "../core/serialization";
import { createSolvedCubeState, isCubeSolved } from "../core/state";
import { createMoveQueuePlayer } from "../viewer/move-queue";
import { createSolverController, type SolverPort } from "./controller";
import type { SolverRequest } from "./protocol";
import { loadSolution } from "./load-solution";
import { verifySolution } from "./verify-solution";
const solved = createSolvedCubeState();
const scramble = parseAlgorithm("R U F2 L' D B2");
const initial = applyAlgorithm(solved, scramble);
const solution = verifySolution(
  initial,
  serializeCubeState(initial),
  serializeAlgorithm(invertAlgorithm(scramble)),
);
function complete(player: ReturnType<typeof createMoveQueuePlayer>) {
  const id = player.getSnapshot().active?.id;
  if (id !== undefined) player.complete(id);
}
describe("verified solution → player", () => {
  it.each([false, true])(
    "loads the input snapshot and supports every prefix, back/reset/play (instant=%s)",
    (instant) => {
      const player = createMoveQueuePlayer(applyAlgorithmText(solved, "D2"));
      player.setReducedMotion(instant);
      player.enqueue(parseAlgorithm("U R"));
      const stale = player.getSnapshot().active?.id;
      let publications = 0;
      player.subscribe(() => publications++);
      expect(loadSolution(player, solution)).toBe(true);
      expect(publications).toBe(1);
      expect(player.getSnapshot()).toMatchObject({
        state: initial,
        active: null,
        pending: [],
        playback: { initial, cursor: 0, playing: false },
      });
      if (stale !== undefined) expect(player.complete(stale)).toBe(false);
      for (let cursor = 1; cursor <= solution.moves.length; cursor++) {
        expect(player.stepForward()).toBe(true);
        complete(player);
        expect(player.getSnapshot().state).toEqual(
          applyAlgorithm(initial, solution.moves.slice(0, cursor)),
        );
      }
      expect(isCubeSolved(player.getSnapshot().state)).toBe(true);
      for (let cursor = solution.moves.length - 1; cursor >= 0; cursor--) {
        expect(player.stepBackward()).toBe(true);
        complete(player);
        expect(player.getSnapshot().state).toEqual(
          applyAlgorithm(initial, solution.moves.slice(0, cursor)),
        );
      }
      player.play();
      while (player.getSnapshot().active) complete(player);
      expect(isCubeSolved(player.getSnapshot().state)).toBe(true);
      player.resetPlayback();
      expect(player.getSnapshot().state).toEqual(initial);
      expect(player.getSnapshot().playback?.cursor).toBe(0);
      player.stepForward();
      const cancelled = player.getSnapshot().active?.id;
      player.resetPlayback();
      if (cancelled !== undefined)
        expect(player.complete(cancelled)).toBe(false);
      expect(player.getSnapshot().state).toEqual(initial);
      player.reset();
      expect(player.getSnapshot().playback).toBeNull();
    },
  );
  it("rejects stale fingerprints, invalid moves, wrong solutions and solved empty input without mutation", () => {
    const player = createMoveQueuePlayer();
    const before = player.getSnapshot();
    const invalid = [
      { ...solution, serialization: serializeCubeState(solved) },
      { ...solution, moves: parseAlgorithm("U") },
      { ...solution, moves: Array(257).fill({ face: "R", turns: 1 }) },
      { ...solution, moves: [{ face: "X", turns: 1 }] },
      verifySolution(solved, serializeCubeState(solved), ""),
    ];
    for (const result of invalid) {
      expect(loadSolution(player, result as typeof solution)).toBe(false);
      expect(player.getSnapshot()).toBe(before);
    }
  });
  it("copies external state and validates before cancelling an active move", () => {
    const player = createMoveQueuePlayer();
    player.enqueue(parseAlgorithm("R U"));
    const before = player.getSnapshot();
    expect(() =>
      player.loadSequence(solution.moves, {} as typeof initial),
    ).toThrow();
    expect(player.getSnapshot()).toBe(before);
    const mutable = JSON.parse(JSON.stringify(initial));
    player.loadSequence(solution.moves, mutable);
    mutable.faces.U[0] = "red";
    expect(player.getSnapshot().state).toEqual(initial);
    expect(Object.isFrozen(player.getSnapshot().state.faces.U)).toBe(true);
  });
  it("consumes a controller result when the player changes and leaves the loaded sequence usable", () => {
    const requests: SolverRequest[] = [];
    const port: SolverPort = {
      onmessage: null,
      onerror: null,
      onmessageerror: null,
      postMessage: (request) => {
        requests.push(request);
      },
      terminate: () => {},
    };
    const solver = createSolverController({ createWorker: () => port });
    solver.solve(initial);
    port.onmessage?.({
      data: { type: "ready", generationId: requests[0].generationId },
    } as MessageEvent);
    port.onmessage?.({
      data: {
        ...requests.at(-1),
        type: "result",
        algorithm: solution.notation,
      },
    } as MessageEvent);
    expect(solver.getSnapshot().status).toBe("success");
    const player = createMoveQueuePlayer();
    let changes = 0;
    const unsubscribe = player.subscribe(() => {
      changes++;
      solver.invalidate();
    });
    const result = solver.getSnapshot().result!;
    expect(loadSolution(player, result)).toBe(true);
    expect(changes).toBe(1);
    expect(solver.getSnapshot().result).toBeNull();
    player.stepForward();
    complete(player);
    expect(player.getSnapshot().playback?.cursor).toBe(1);
    unsubscribe();
    solver.release();
  });
});
