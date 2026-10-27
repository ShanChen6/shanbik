import { project } from "./geometry";
import type { ImageCell, ImageSource, RGB, Sample } from "./types";
const median = (values: number[]) =>
  values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
export function sampleCell(source: ImageSource, cell: ImageCell): Sample {
  const { image, crop, turns } = source;
  if (
    image.width < 2 ||
    image.height < 2 ||
    image.data.length !== image.width * image.height * 4 ||
    !cell.samples.length
  )
    throw Error("INVALID_IMAGE");
  const pixels = cell.samples.map((point) => {
    const p = project(point, crop, turns);
    const x = Math.max(
      0,
      Math.min(image.width - 1, Math.round(p.x * (image.width - 1))),
    );
    const y = Math.max(
      0,
      Math.min(image.height - 1, Math.round(p.y * (image.height - 1))),
    );
    const index = (y * image.width + x) * 4;
    return Array.from(image.data.slice(index, index + 4));
  });
  const rgb = [0, 1, 2].map((channel) =>
    median(pixels.map((pixel) => pixel[channel])),
  ) as unknown as RGB;
  return Object.freeze({
    rgb,
    spread: median(
      pixels.map((pixel) =>
        Math.hypot(pixel[0] - rgb[0], pixel[1] - rgb[1], pixel[2] - rgb[2]),
      ),
    ),
    transparent: pixels.some((pixel) => pixel[3] < 200),
  });
}
