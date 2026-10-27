/**
 * Which ShanBik implementations exist for each puzzle, declared separately
 * for rendering, scrambling and solving. This is the single source the UI
 * and the encyclopedia binding guard read: a library that *could* support a
 * puzzle does not make a capability available until an adapter is listed here.
 * Data only — no imports of renderers, Workers or cubing.js.
 */
export const PUZZLE_IDS = [
  "3x3",
  "2x2",
  "4x4",
  "5x5",
  "pyraminx",
  "megaminx",
  "skewb",
  "square-1",
] as const;
export type PuzzleId = (typeof PUZZLE_IDS)[number];
export type RenderCapability =
  | Readonly<{ kind: "cube-3x3"; route: "/practice" }>
  | Readonly<{ kind: "nxn"; size: 2 | 4; net: true; webgl: true }>
  | Readonly<{ kind: "pyraminx-net"; net: true; webgl: false }>;
export type ScrambleCapability =
  | Readonly<{ kind: "random-move-3x3"; official: false }>
  | Readonly<{
      kind: "cubing-worker";
      puzzle: "2x2" | "4x4" | "pyraminx" | "megaminx";
      /** cubing.js engine behind `randomScrambleForEvent`, read from 0.66.1 (19.1 spike). */
      engine: "twips-wasm" | "tnoodle-port";
    }>;
export type SolveCapability = Readonly<{ kind: "cubing-3x3-worker" }>;
/** Timer + history + stats; solves are validated as 3×3 scrambles today. */
export type TimerCapability = Readonly<{ route: "/timer" }>;
export type PuzzleCapabilities = Readonly<{
  render: RenderCapability | null;
  scramble: ScrambleCapability | null;
  solve: SolveCapability | null;
  timer: TimerCapability | null;
}>;
const none: PuzzleCapabilities = {
  render: null,
  scramble: null,
  solve: null,
  timer: null,
};
export const PUZZLE_REGISTRY: Readonly<Record<PuzzleId, PuzzleCapabilities>> =
  Object.freeze({
    "3x3": {
      render: { kind: "cube-3x3", route: "/practice" },
      scramble: { kind: "random-move-3x3", official: false },
      solve: { kind: "cubing-3x3-worker" },
      timer: { route: "/timer" },
    },
    "2x2": {
      render: { kind: "nxn", size: 2, net: true, webgl: true },
      scramble: { kind: "cubing-worker", puzzle: "2x2", engine: "twips-wasm" },
      solve: null,
      timer: null,
    },
    "4x4": {
      render: { kind: "nxn", size: 4, net: true, webgl: true },
      scramble: {
        kind: "cubing-worker",
        puzzle: "4x4",
        engine: "tnoodle-port",
      },
      solve: null,
      timer: null,
    },
    "5x5": none,
    pyraminx: {
      render: { kind: "pyraminx-net", net: true, webgl: false },
      scramble: {
        kind: "cubing-worker",
        puzzle: "pyraminx",
        engine: "twips-wasm",
      },
      solve: null,
      timer: null,
    },
    megaminx: {
      // 19.3: scramble verified; viewer/solver moved to a later milestone.
      render: null,
      scramble: {
        kind: "cubing-worker",
        puzzle: "megaminx",
        engine: "twips-wasm",
      },
      solve: null,
      timer: null,
    },
    skewb: none,
    "square-1": none,
  });
export const isPuzzleId = (value: unknown): value is PuzzleId =>
  typeof value === "string" &&
  (PUZZLE_IDS as readonly string[]).includes(value);
export const capabilitiesOf = (id: string): PuzzleCapabilities =>
  isPuzzleId(id) ? PUZZLE_REGISTRY[id] : none;
/** The workbench on /puzzles/[slug] appears only for these puzzles. */
export const hasWorkbench = (id: string) => {
  const c = capabilitiesOf(id);
  return (
    c.scramble?.kind === "cubing-worker" ||
    c.render?.kind === "nxn" ||
    c.render?.kind === "pyraminx-net"
  );
};
