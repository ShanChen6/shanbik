import { validateCubeFeasibility } from "../core/feasibility";
import { deserializeCubeState } from "../core/serialization";
import { isCubeSolved } from "../core/state";
import {
  parseRequest,
  record,
  validId,
  validSerialization,
  type SolverResponse,
} from "./protocol";
import { verifySolution } from "./verify-solution";
export type SolverEngine = {
  init(): void | Promise<void>;
  solve(serialization: string): string | Promise<string>;
};
/** Dedicated-worker boundary: validate again before invoking the upstream engine. */
export function createSolverRuntime(engine: SolverEngine) {
  let generation: number | null = null,
    ready = false,
    solving = false;
  let initialization: Promise<void> | null = null;
  return async (input: unknown): Promise<SolverResponse | null> => {
    const request = parseRequest(input);
    if (!request) {
      if (!record(input) || !validId(input.generationId)) return null;
      return {
        type: "error",
        generationId: input.generationId,
        requestId: validId(input.requestId) ? input.requestId : null,
        serialization: validSerialization(input.serialization)
          ? input.serialization
          : null,
        code: "INVALID_INPUT",
      };
    }
    const error = (
      code: "INVALID_INPUT" | "WORKER_ERROR" | "INVALID_RESULT",
    ): SolverResponse => ({
      type: "error",
      generationId: request.generationId,
      requestId: request.type === "solve" ? request.requestId : null,
      serialization: request.type === "solve" ? request.serialization : null,
      code,
    });
    if (generation !== null && generation !== request.generationId)
      return error("INVALID_INPUT");
    if (request.type === "init") {
      generation = request.generationId;
      try {
        if (!ready) {
          initialization ??= Promise.resolve().then(() => engine.init());
          await initialization;
          ready = true;
        }
        return { type: "ready", generationId: request.generationId };
      } catch {
        initialization = null;
        return error("WORKER_ERROR");
      }
    }
    let checked;
    try {
      checked = validateCubeFeasibility(
        deserializeCubeState(request.serialization),
      );
    } catch {
      return error("INVALID_INPUT");
    }
    if (!checked.valid) return error("INVALID_INPUT");
    let algorithm = "";
    if (!isCubeSolved(checked.state)) {
      if (!ready || solving) return error("WORKER_ERROR");
      solving = true;
      try {
        algorithm = await engine.solve(request.serialization);
      } catch {
        return error("WORKER_ERROR");
      } finally {
        solving = false;
      }
    }
    try {
      const result = verifySolution(
        checked.state,
        checked.serialization,
        algorithm,
      );
      return {
        type: "result",
        generationId: request.generationId,
        requestId: request.requestId,
        serialization: request.serialization,
        algorithm: result.notation,
      };
    } catch {
      return error("INVALID_RESULT");
    }
  };
}
