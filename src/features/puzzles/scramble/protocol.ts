/** cubing.js `randomScrambleForEvent` IDs for puzzles with a verified adapter. */
export const SCRAMBLE_EVENTS = {
  "2x2": "222",
  "4x4": "444",
  pyraminx: "pyram",
  megaminx: "minx",
} as const;
export type ScramblePuzzle = keyof typeof SCRAMBLE_EVENTS;
export const isScramblePuzzle = (value: unknown): value is ScramblePuzzle =>
  typeof value === "string" && Object.hasOwn(SCRAMBLE_EVENTS, value);
export type ScrambleRequest = Readonly<{
  type: "scramble";
  id: number;
  puzzle: ScramblePuzzle;
}>;
export type ScrambleResponse = Readonly<
  | { type: "scramble"; id: number; ok: true; scramble: string }
  | { type: "scramble"; id: number; ok: false }
>;
/** First 4×4 generation builds tables (~4 s in Node on desktop); slow phones need headroom. */
export const SCRAMBLE_TIMEOUT_MS = 60_000;
export const WORKER_URL = "/solver-worker/scramble.worker.js";
