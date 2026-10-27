import { describe, expect, it, vi } from "vitest";
import oracle from "../core/__fixtures__/moves.json";
import benchmark from "../../../../docs/benchmarks/solver-3x3.json";
import { validateCubeFeasibility } from "../core/feasibility";
import { applyAlgorithmText } from "../core/moves";
import { serializeCubeState } from "../core/serialization";
import { createSolvedCubeState } from "../core/state";
import { parseAlgorithm } from "../core/notation";
import { createSolverRuntime } from "./runtime";
import { MAX_SOLUTION_MOVES, parseRequest, parseResponse } from "./protocol";
import { MAX_QUEUE_MOVES } from "../viewer/move-queue";
import { verifySolution } from "./verify-solution";
import { puzzles } from "cubing/puzzles";
import { toCubingPattern } from "./cubing-engine";
const solved = createSolvedCubeState(),
  r = applyAlgorithmText(solved, "R");
const request = (serialization = serializeCubeState(r)) => ({
  type: "solve",
  generationId: 1,
  requestId: 2,
  serialization,
});

describe("worker protocol/runtime boundary", () => {
  it.each([
    null,
    {},
    [],
    { type: "init", generationId: 0 },
    { type: "init", generationId: 1.5 },
    { type: "solve", generationId: 1, requestId: 1, serialization: "bad" },
  ])("rejects malformed request %j", (input) => {
    expect(parseRequest(input)).toBeNull();
  });
  it("requires complete bounded typed response fields", async () => {
    expect(
      parseResponse({
        type: "result",
        generationId: 1,
        requestId: 1,
        serialization: serializeCubeState(r),
        algorithm: 1,
      }),
    ).toBeNull();
    expect(
      parseResponse({
        type: "error",
        generationId: 1,
        requestId: null,
        serialization: null,
        code: "STACK_TRACE",
      }),
    ).toBeNull();
    expect(parseResponse({ type: "ready", generationId: 1 })).toEqual({
      type: "ready",
      generationId: 1,
    });
  });
  it("initializes once and rejects a different generation", async () => {
    const engine = { init: vi.fn(), solve: vi.fn(() => "R'") },
      handle = createSolverRuntime(engine);
    await handle({ type: "init", generationId: 1 });
    await handle({ type: "init", generationId: 1 });
    expect(engine.init).toHaveBeenCalledOnce();
    expect(await handle({ type: "init", generationId: 2 })).toMatchObject({
      type: "error",
      code: "INVALID_INPUT",
    });
    expect(await handle(request())).toMatchObject({
      type: "result",
      algorithm: "R'",
    });
    expect(engine.solve).toHaveBeenCalledOnce();
  });
  it("rejects direct physically impossible worker messages before invoking the engine", async () => {
    const input = JSON.parse(JSON.stringify(solved));
    [input.faces.U[7], input.faces.F[1]] = [input.faces.F[1], input.faces.U[7]];
    expect(validateCubeFeasibility(input).valid).toBe(false);
    const engine = { init: vi.fn(), solve: vi.fn() },
      handle = createSolverRuntime(engine);
    expect(await handle(request(serializeCubeState(input)))).toMatchObject({
      code: "INVALID_INPUT",
    });
    expect(engine.solve).not.toHaveBeenCalled();
    expect(engine.init).not.toHaveBeenCalled();
  });
  it("rejects structural errors, malformed requests and an uninitialized search", async () => {
    const engine = { init: vi.fn(), solve: vi.fn() },
      handle = createSolverRuntime(engine);
    expect(await handle(null)).toBeNull();
    expect(await handle({ type: "bad", generationId: 1 })).toMatchObject({
      code: "INVALID_INPUT",
    });
    expect(await handle(request("U".repeat(54)))).toMatchObject({
      code: "INVALID_INPUT",
    });
    expect(await handle(request())).toMatchObject({ code: "WORKER_ERROR" });
    expect(engine.solve).not.toHaveBeenCalled();
  });
  it("returns already-solved without initialization/search", async () => {
    const engine = { init: vi.fn(), solve: vi.fn() },
      handle = createSolverRuntime(engine);
    expect(await handle(request(serializeCubeState(solved)))).toMatchObject({
      type: "result",
      algorithm: "",
    });
    expect(engine.init).not.toHaveBeenCalled();
    expect(engine.solve).not.toHaveBeenCalled();
  });
  it.each(["", "R", "x", "(R U)", Array(257).fill("R").join(" ")])(
    "refuses an engine result that is invalid or does not solve: %s",
    async (algorithm) => {
      const handle = createSolverRuntime({ init() {}, solve: () => algorithm });
      await handle({ type: "init", generationId: 1 });
      expect(await handle(request())).toMatchObject({
        type: "error",
        code: "INVALID_RESULT",
      });
    },
  );
  it("contains upstream exceptions as typed errors without stack or input leaks", async () => {
    const handle = createSolverRuntime({
      init() {},
      solve() {
        throw Error("private detail");
      },
    });
    await handle({ type: "init", generationId: 1 });
    const result = await handle(request());
    expect(result).toMatchObject({ type: "error", code: "WORKER_ERROR" });
    expect(result).not.toHaveProperty("message");
    const badInit = createSolverRuntime({
      init() {
        throw Error("init");
      },
      solve: () => "",
    });
    expect(await badInit({ type: "init", generationId: 1 })).toMatchObject({
      code: "WORKER_ERROR",
    });
  });
  it("keeps the solution cap aligned with the existing player", async () => {
    expect(MAX_SOLUTION_MOVES).toBe(MAX_QUEUE_MOVES);
  });
  it("normalizes verified output and preserves a snapshot without mutating input", async () => {
    const initial = applyAlgorithmText(solved, "R");
    const result = verifySolution(
      initial,
      serializeCubeState(initial),
      "  R’\n",
    );
    expect(result.notation).toBe("R'");
    expect(result.initial).toBe(initial);
    expect(result.moves).toEqual(parseAlgorithm("R'"));
  });
});

describe("cubing.js orbit conversion", () => {
  const corpus = [
    ...new Map(
      [
        ...oracle.cases.map((item) => ({
          name: item.name,
          serialization: item.expectedState,
          algorithm: `${item.initialAlgorithm} ${item.algorithm}`,
        })),
        ...benchmark.profiles[0].samples.map((item) => ({
          name: item.name,
          serialization: item.serialization,
          algorithm: null,
        })),
      ].map((item) => [item.serialization, item]),
    ).values(),
  ];
  it.each(oracle.cases)(
    "matches cubing.js pattern for $name",
    async (fixture) => {
      const kpuzzle = await puzzles["3x3x3"].kpuzzle();
      const expected = kpuzzle
        .defaultPattern()
        .applyAlg(`${fixture.initialAlgorithm} ${fixture.algorithm}`);
      const actual = await toCubingPattern(fixture.expectedState);
      expect(actual.patternData.EDGES).toEqual(expected.patternData.EDGES);
      expect(actual.patternData.CORNERS).toEqual(expected.patternData.CORNERS);
      expect(actual.patternData.CENTERS.pieces).toEqual(
        expected.patternData.CENTERS.pieces,
      );
    },
  );
  it.each(corpus)(
    "preserves a complete pattern for $name",
    async ({ serialization }) => {
      const pattern = await toCubingPattern(serialization);
      expect(new Set(pattern.patternData.EDGES.pieces).size).toBe(12);
      expect(new Set(pattern.patternData.CORNERS.pieces).size).toBe(8);
    },
  );
  it("rejects impossible state before returning a library pattern", async () => {
    const state = JSON.parse(JSON.stringify(solved));
    [state.faces.U[7], state.faces.F[1]] = [state.faces.F[1], state.faces.U[7]];
    await expect(toCubingPattern(serializeCubeState(state))).rejects.toThrow(
      "INVALID_INPUT",
    );
  });
});
