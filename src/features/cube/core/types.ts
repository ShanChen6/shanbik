export type CubeFace = "U" | "R" | "F" | "D" | "L" | "B";
export type CubeColor =
  "white" | "red" | "green" | "yellow" | "orange" | "blue";
export type FaceStickers = readonly [
  CubeColor,
  CubeColor,
  CubeColor,
  CubeColor,
  CubeColor,
  CubeColor,
  CubeColor,
  CubeColor,
  CubeColor,
];
export type CubeState = Readonly<{
  faces: Readonly<Record<CubeFace, FaceStickers>>;
}>;
export type AxisVector = readonly [-1 | 0 | 1, -1 | 0 | 1, -1 | 0 | 1];
export type CubeStructureIssue = Readonly<{
  code:
    | "INVALID_SHAPE"
    | "INVALID_FACE_KEYS"
    | "INVALID_FACE_LENGTH"
    | "INVALID_COLOR"
    | "INVALID_CENTER"
    | "INVALID_COLOR_COUNT"
    | "INVALID_SERIALIZATION";
  path: string;
  message: string;
}>;
export type CubeStructureValidation =
  | Readonly<{ valid: true; issues: readonly [] }>
  | Readonly<{ valid: false; issues: readonly CubeStructureIssue[] }>;
