export type Point = Readonly<{ x: number; y: number }>;
/** Image coordinates: top-left, top-right, bottom-right, bottom-left. */
export type Quad = readonly [Point, Point, Point, Point];
export type RGB = readonly [number, number, number];
export type PixelImage = Readonly<{
  width: number;
  height: number;
  data: Uint8ClampedArray;
}>;
export type ImageCell = Readonly<{
  id: string;
  polygon: readonly Point[];
  samples: readonly Point[];
}>;
export type ImageFace = Readonly<{ id: string; cells: readonly ImageCell[] }>;
export type ImageProfile = Readonly<{
  id: string;
  faces: readonly ImageFace[];
}>;
export type ImageSource = Readonly<{
  image: PixelImage;
  preview: string;
  crop: Quad;
  turns: number;
}>;
export type Sample = Readonly<{
  rgb: RGB;
  spread: number;
  transparent: boolean;
}>;
export type ColorGuess = Readonly<{
  color: string | null;
  candidate: string;
  distance: number;
  reason: "dark" | "transparent" | "uneven" | "uncertain" | null;
}>;
