import type { AxisVector, CubeColor, CubeFace } from "./types";

export const FACE_ORDER = Object.freeze([
  "U",
  "R",
  "F",
  "D",
  "L",
  "B",
] as const);
export const CUBE_COLORS = Object.freeze([
  "white",
  "red",
  "green",
  "yellow",
  "orange",
  "blue",
] as const);
export const FACE_COLORS = Object.freeze({
  U: "white",
  R: "red",
  F: "green",
  D: "yellow",
  L: "orange",
  B: "blue",
} as const satisfies Record<CubeFace, CubeColor>);
export const STICKERS_PER_FACE = 9;
export const CENTER_INDEX = 4;
export const TOTAL_STICKERS = 54;

function orientation(normal: AxisVector, right: AxisVector, down: AxisVector) {
  return Object.freeze({
    normal: Object.freeze(normal),
    right: Object.freeze(right),
    down: Object.freeze(down),
  });
}

/** Right-handed world: +x right, +y up, +z front. Each face is viewed from outside. */
export const FACE_ORIENTATIONS = Object.freeze({
  U: orientation([0, 1, 0], [1, 0, 0], [0, 0, 1]),
  R: orientation([1, 0, 0], [0, 0, -1], [0, -1, 0]),
  F: orientation([0, 0, 1], [1, 0, 0], [0, -1, 0]),
  D: orientation([0, -1, 0], [1, 0, 0], [0, 0, -1]),
  L: orientation([-1, 0, 0], [0, 0, 1], [0, -1, 0]),
  B: orientation([0, 0, -1], [-1, 0, 0], [0, -1, 0]),
});
