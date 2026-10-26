import { FACE_ORDER } from "./constants";
import type { CubeFace } from "./types";

/** turns: clockwise quarter turn, prime, or half turn when viewed from outside. */
export type CubeMove = Readonly<{ face: CubeFace; turns: 1 | -1 | 2 }>;
export type CubeAlgorithm = readonly CubeMove[];
export type AlgorithmParseIssue = Readonly<{
  code: "INVALID_INPUT" | "INVALID_TOKEN";
  token: string | null;
  tokenIndex: number | null;
  start: number;
  end: number;
  message: string;
}>;
export type AlgorithmParseResult =
  | Readonly<{ valid: true; moves: CubeAlgorithm }>
  | Readonly<{ valid: false; issues: readonly AlgorithmParseIssue[] }>;

export class AlgorithmParseError extends Error {
  readonly issues: readonly AlgorithmParseIssue[];
  constructor(issues: readonly AlgorithmParseIssue[]) {
    super(issues.map((issue) => issue.message).join("; "));
    this.name = "AlgorithmParseError";
    this.issues = Object.freeze(
      issues.map((issue) => Object.freeze({ ...issue })),
    );
  }
}

export class AlgorithmSerializationError extends Error {
  constructor(readonly moveIndex: number | null) {
    super(
      moveIndex === null
        ? "Thuật toán phải là một mảng move."
        : `Move tại index ${moveIndex} không hợp lệ.`,
    );
    this.name = "AlgorithmSerializationError";
  }
}

/** Offsets are zero-based UTF-16, [start, end), suitable for selectionStart/End. */
export function tryParseAlgorithm(input: unknown): AlgorithmParseResult {
  if (typeof input !== "string") {
    return {
      valid: false,
      issues: Object.freeze([
        Object.freeze({
          code: "INVALID_INPUT" as const,
          token: null,
          tokenIndex: null,
          start: 0,
          end: 0,
          message: "Thuật toán phải là chuỗi ký tự.",
        }),
      ]),
    };
  }
  const moves: CubeMove[] = [];
  const issues: AlgorithmParseIssue[] = [];
  let tokenIndex = 0;
  for (const match of input.matchAll(/\S+/gu)) {
    const token = match[0];
    const parsed = /^([URFDLB])([2'’′]?)$/u.exec(token);
    if (!parsed) {
      const start = match.index;
      issues.push(
        Object.freeze({
          code: "INVALID_TOKEN",
          token,
          tokenIndex,
          start,
          end: start + token.length,
          message: `Token “${token}” tại vị trí ${start + 1} không hợp lệ. Dùng U/D/L/R/F/B, thêm ' hoặc 2 nếu cần, và ngăn cách các move bằng khoảng trắng.`,
        }),
      );
    } else {
      moves.push(
        Object.freeze({
          face: parsed[1] as CubeFace,
          turns: parsed[2] === "2" ? 2 : parsed[2] ? -1 : 1,
        }),
      );
    }
    tokenIndex++;
  }
  // Never expose partially parsed moves after any invalid token.
  return issues.length
    ? { valid: false, issues: Object.freeze(issues) }
    : { valid: true, moves: Object.freeze(moves) };
}

export function parseAlgorithm(input: unknown): CubeAlgorithm {
  const result = tryParseAlgorithm(input);
  if (!result.valid) throw new AlgorithmParseError(result.issues);
  return result.moves;
}

const FACES = new Set<string>(FACE_ORDER);
function isMove(input: unknown): input is CubeMove {
  if (input === null || typeof input !== "object" || Array.isArray(input))
    return false;
  const value = input as Record<string, unknown>;
  return (
    typeof value.face === "string" &&
    FACES.has(value.face) &&
    (value.turns === 1 || value.turns === -1 || value.turns === 2)
  );
}

/** Produces uppercase tokens, ASCII prime and one space between tokens. */
export function serializeAlgorithm(moves: CubeAlgorithm): string {
  if (!Array.isArray(moves)) throw new AlgorithmSerializationError(null);
  const tokens: string[] = [];
  for (let index = 0; index < moves.length; index++) {
    const move: unknown = moves[index];
    if (!isMove(move)) throw new AlgorithmSerializationError(index);
    tokens.push(
      `${move.face}${move.turns === -1 ? "'" : move.turns === 2 ? "2" : ""}`,
    );
  }
  return tokens.join(" ");
}

export function normalizeAlgorithm(input: unknown): string {
  return serializeAlgorithm(parseAlgorithm(input));
}
