import { FACE_ORIENTATIONS } from "../core/constants";
import { serializeAlgorithm, type CubeMove } from "../core/notation";
import type { AxisVector, CubeFace } from "../core/types";
import type { CubieView } from "./view-model";

export type LayerTurn = Readonly<{
  face: CubeFace;
  axis: "x" | "y" | "z";
  axisIndex: 0 | 1 | 2;
  /** Layer coordinate along the positive world axis, never camera-relative. */
  layer: -1 | 1;
  /** Positive unit axis for Three.js axis-angle rotation. */
  axisVector: AxisVector;
  quarterTurns: -2 | -1 | 1 | 2;
  angle: number;
}>;

/** Clockwise seen from outside = -90° around the outward face normal. */
export function getMoveLayer(move: CubeMove): LayerTurn {
  serializeAlgorithm([move]); // Share core runtime AST validation.
  const normal = FACE_ORIENTATIONS[move.face].normal;
  const axisIndex = normal.findIndex((value) => value !== 0) as 0 | 1 | 2;
  const layer = normal[axisIndex] as -1 | 1;
  const quarterTurns = (-layer * move.turns) as LayerTurn["quarterTurns"];
  const axisVector = Object.freeze(
    normal.map((value) => Math.abs(value)),
  ) as AxisVector;
  return Object.freeze({
    face: move.face,
    axis: (["x", "y", "z"] as const)[axisIndex],
    axisIndex,
    layer,
    axisVector,
    quarterTurns,
    angle: (quarterTurns * Math.PI) / 2,
  });
}

/** Read the current slot positions; IDs identify slots, not persistent physical pieces. */
export function selectLayerCubies(
  cubies: readonly CubieView[],
  turn: LayerTurn,
): readonly CubieView[] {
  return Object.freeze(
    cubies.filter((cubie) => cubie.position[turn.axisIndex] === turn.layer),
  );
}
