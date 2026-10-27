import { FACE_COLORS, FACE_ORDER } from "../core/constants";
import type { CubeFace } from "../core/types";
import {
  createFaceDraft,
  paintSticker,
  type FaceDraft,
  type StickerInput,
} from "../face-input/draft";
import { classify, distinguishable } from "../../puzzle-image/color";
import { sampleCell } from "../../puzzle-image/sampling";
import type { ColorGuess, ImageSource, RGB } from "../../puzzle-image/types";
import { CUBE_3_IMAGE_PROFILE } from "./profile";
export type Sources = Partial<Record<CubeFace, ImageSource>>;
export type ImageResult = Readonly<{
  draft: FaceDraft;
  guesses: Readonly<Record<CubeFace, readonly ColorGuess[]>>;
}>;
export function recognizeCubeImages(sources: Sources): ImageResult {
  const palette: Record<string, RGB> = {};
  for (const face of CUBE_3_IMAGE_PROFILE.faces) {
    const source = sources[face.id as CubeFace];
    if (!source) throw Error("Hãy chọn đủ ảnh cho sáu mặt trước khi nhận màu.");
    const center = sampleCell(source, face.cells[4]);
    if (
      center.transparent ||
      center.spread > 45 ||
      Math.max(...center.rgb) < 25
    )
      throw Error(
        `Tâm mặt ${face.id} không rõ. Hãy chỉnh vùng hoặc chọn ảnh khác.`,
      );
    palette[FACE_COLORS[face.id as CubeFace]] = center.rgb;
  }
  if (!distinguishable(palette))
    throw Error(
      "Màu sáu tâm quá giống nhau. Kiểm tra đúng mặt, ánh sáng và vùng chọn; chưa chuyển kết quả sang solver.",
    );
  let draft = createFaceDraft();
  const guesses = {} as Record<CubeFace, readonly ColorGuess[]>;
  for (const face of CUBE_3_IMAGE_PROFILE.faces) {
    const id = face.id as CubeFace;
    guesses[id] = Object.freeze(
      face.cells.map((cell, index) => {
        const guess = classify(sampleCell(sources[id]!, cell), palette);
        const color = index === 4 ? FACE_COLORS[id] : guess.color;
        if (index !== 4)
          draft = paintSticker(draft, id, index, color as StickerInput);
        return index === 4
          ? Object.freeze({ ...guess, color: FACE_COLORS[id], reason: null })
          : guess;
      }),
    );
  }
  return Object.freeze({ draft, guesses: Object.freeze(guesses) });
}
export const allImagesPresent = (sources: Sources) =>
  FACE_ORDER.every((face) => !!sources[face]);
