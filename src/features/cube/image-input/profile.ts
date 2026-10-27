import { FACE_ORDER } from "../core/constants";
import { squareGrid } from "../../puzzle-image/geometry";
import type { ImageProfile } from "../../puzzle-image/types";
export const CUBE_3_IMAGE_PROFILE: ImageProfile = Object.freeze({
  id: "cube-3x3",
  faces: Object.freeze(
    FACE_ORDER.map((id) => Object.freeze({ id, cells: squareGrid(3) })),
  ),
});
