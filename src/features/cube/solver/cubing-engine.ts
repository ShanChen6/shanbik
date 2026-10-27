import { KPattern } from "cubing/kpuzzle";
import { puzzles } from "cubing/puzzles";
import {
  experimentalSolve3x3x3IgnoringCenters,
  setSearchDebug,
} from "cubing/search";
import { validateCubeFeasibility } from "../core/feasibility";
import { deserializeCubeState } from "../core/serialization";

// cubing.js Reid orbit order -> ShanBik/Kociemba orbit order.
// Mapping/orientation is checked against all 18 moves and independent fixtures.
const EDGES = [1, 0, 3, 2, 5, 4, 7, 6, 8, 9, 11, 10] as const;
const CORNERS = [0, 3, 2, 1, 4, 5, 6, 7] as const;
const model = () => puzzles["3x3x3"].kpuzzle();
function convert(
  permutation: readonly number[],
  orientation: readonly number[],
  order: readonly number[],
) {
  const inverse = Object.fromEntries(
    order.map((coreIndex, cubingIndex) => [coreIndex, cubingIndex]),
  );
  return {
    pieces: order.map((index) => inverse[permutation[index]]),
    orientation: order.map((index) => orientation[index]),
  };
}
export async function toCubingPattern(
  serialization: string,
): Promise<KPattern> {
  const checked = validateCubeFeasibility(deserializeCubeState(serialization));
  if (!checked.valid) throw Error("INVALID_INPUT");
  const kpuzzle = await model();
  const centers = kpuzzle.defaultPattern().patternData.CENTERS;
  return new KPattern(kpuzzle, {
    EDGES: convert(checked.cubies.ep, checked.cubies.eo, EDGES),
    CORNERS: convert(checked.cubies.cp, checked.cubies.co, CORNERS),
    CENTERS: {
      ...centers,
      pieces: [...centers.pieces],
      orientation: [...centers.orientation],
      ...(centers.orientationMod
        ? { orientationMod: [...centers.orientationMod] }
        : {}),
    },
  });
}
export const cubingEngine = {
  async init() {
    setSearchDebug({ logPerf: false, scramblePrefetchLevel: "none" });
    // Warm the library's own search Worker/tables inside the owned outer Worker.
    // User already-solved inputs never reach this initialization path.
    const kpuzzle = await model();
    await experimentalSolve3x3x3IgnoringCenters(kpuzzle.defaultPattern());
  },
  async solve(serialization: string) {
    const algorithm = await experimentalSolve3x3x3IgnoringCenters(
      await toCubingPattern(serialization),
    );
    return algorithm.toString();
  },
};
