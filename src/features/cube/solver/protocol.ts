export const INIT_TIMEOUT_MS = 60_000;
export const SOLVE_TIMEOUT_MS = 10_000;
export const RETRY_COOLDOWN_MS = 2_000;
export const MAX_SOLUTION_MOVES = 256;
export const MAX_SOLUTION_TEXT = 2048;
export type SolverErrorCode =
  | "INVALID_INPUT"
  | "INIT_TIMEOUT"
  | "SOLVE_TIMEOUT"
  | "WORKER_ERROR"
  | "INVALID_RESULT"
  | "RETRY_LATER";
export type SolverRequest =
  | { type: "init"; generationId: number }
  | {
      type: "solve";
      generationId: number;
      requestId: number;
      serialization: string;
    };
export type SolverResponse =
  | { type: "ready"; generationId: number }
  | {
      type: "result";
      generationId: number;
      requestId: number;
      serialization: string;
      algorithm: string;
    }
  | {
      type: "error";
      generationId: number;
      requestId: number | null;
      serialization: string | null;
      code: "INVALID_INPUT" | "WORKER_ERROR" | "INVALID_RESULT";
    };
export function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export const validId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
export const validSerialization = (value: unknown): value is string =>
  typeof value === "string" && /^[URFDLB]{54}$/.test(value);
export function parseRequest(value: unknown): SolverRequest | null {
  if (!record(value) || !validId(value.generationId)) return null;
  if (value.type === "init")
    return { type: "init", generationId: value.generationId };
  if (
    value.type === "solve" &&
    validId(value.requestId) &&
    validSerialization(value.serialization)
  )
    return {
      type: "solve",
      generationId: value.generationId,
      requestId: value.requestId,
      serialization: value.serialization,
    };
  return null;
}
export function parseResponse(value: unknown): SolverResponse | null {
  if (!record(value) || !validId(value.generationId)) return null;
  if (value.type === "ready")
    return { type: "ready", generationId: value.generationId };
  if (
    value.type === "result" &&
    validId(value.requestId) &&
    validSerialization(value.serialization) &&
    typeof value.algorithm === "string" &&
    value.algorithm.length <= MAX_SOLUTION_TEXT
  )
    return {
      type: "result",
      generationId: value.generationId,
      requestId: value.requestId,
      serialization: value.serialization,
      algorithm: value.algorithm,
    };
  if (
    value.type === "error" &&
    (value.requestId === null || validId(value.requestId)) &&
    (value.serialization === null || validSerialization(value.serialization)) &&
    (value.code === "INVALID_INPUT" ||
      value.code === "WORKER_ERROR" ||
      value.code === "INVALID_RESULT")
  )
    return {
      type: "error",
      generationId: value.generationId,
      requestId: value.requestId,
      serialization: value.serialization,
      code: value.code,
    };
  return null;
}
