import { FACE_ORDER, FACE_ORIENTATIONS } from "../core/constants";
import { createCubeState } from "../core/state";
import type { AxisVector, CubeColor, CubeFace, CubeState } from "../core/types";

export type StickerView = Readonly<{
  face: CubeFace;
  index: number;
  color: CubeColor;
  normal: AxisVector;
}>;
export type CubieView = Readonly<{
  id: string;
  position: AxisVector;
  stickers: readonly StickerView[];
}>;

/** Pure data adapter: no React, Three.js or second mutable puzzle state. */
export function buildCubeViewModel(input: CubeState): readonly CubieView[] {
  const state = createCubeState(input);
  const cubies = new Map<
    string,
    { id: string; position: AxisVector; stickers: StickerView[] }
  >();
  for (const x of [-1, 0, 1] as const)
    for (const y of [-1, 0, 1] as const)
      for (const z of [-1, 0, 1] as const) {
        if (x === 0 && y === 0 && z === 0) continue;
        const id = `${x},${y},${z}`;
        cubies.set(id, {
          id,
          position: Object.freeze([x, y, z]),
          stickers: [],
        });
      }
  for (const face of FACE_ORDER) {
    const { normal, right, down } = FACE_ORIENTATIONS[face];
    state.faces[face].forEach((color, index) => {
      const column = (index % 3) - 1,
        row = Math.floor(index / 3) - 1;
      const position = normal.map(
        (value, axis) => value + column * right[axis] + row * down[axis],
      );
      const cubie = cubies.get(position.join(","));
      if (!cubie) throw new Error("Sticker does not map to a visible cubie.");
      cubie.stickers.push(Object.freeze({ face, index, color, normal }));
    });
  }
  return Object.freeze(
    [...cubies.values()].map((cubie) =>
      Object.freeze({ ...cubie, stickers: Object.freeze(cubie.stickers) }),
    ),
  );
}
