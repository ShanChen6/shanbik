import { deflateSync } from "node:zlib";
const FACE_ORDER = "URFDLB";
const COLORS: Record<string, readonly number[]> = {
  U: [248, 250, 252],
  R: [220, 38, 38],
  F: [22, 163, 74],
  D: [250, 204, 21],
  L: [249, 115, 22],
  B: [37, 99, 235],
};
export const SOLVED = Array.from(FACE_ORDER, (face) => face.repeat(9)).join("");
export const U_TURN = "UUUUUUUUUBBBRRRRRRRRRFFFFFFDDDDDDDDDFFFLLLLLLLLLBBBBBB";
function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const name = Buffer.from(type);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, crc]);
}
/** Deterministic fixture pixels; no app recognition code participates in creating them. */
export function facePNG(
  serialization: string,
  face: string,
  transparentFirst = false,
  perspective = false,
) {
  const width = 180;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(width, 4);
  header[8] = 8;
  header[9] = 6;
  const letters = serialization.slice(
    FACE_ORDER.indexOf(face) * 9,
    FACE_ORDER.indexOf(face) * 9 + 9,
  );
  const raw = Buffer.alloc(width * (width * 4 + 1));
  for (let y = 0; y < width; y++)
    for (let x = 0; x < width; x++) {
      // Analytic inverse for a known trapezoid, independent from the application mapper.
      const sy = y / (width - 1),
        sx = x / (width - 1);
      const v = perspective ? (sy - 0.1) / (0.5 + sy / 3) : sy;
      const u = perspective ? (sx * (1 - v / 3) + 0.15 * v - 0.2) / 0.6 : sx;
      const inside = u >= 0 && u <= 1 && v >= 0 && v <= 1;
      const cell =
        Math.min(2, Math.floor(v * 3)) * 3 + Math.min(2, Math.floor(u * 3));
      const color = inside ? COLORS[letters[cell]] : [30, 30, 30];
      const index = y * (width * 4 + 1) + 1 + x * 4;
      raw.set(
        [
          ...color.map((value) => Math.round(value * (perspective ? 0.9 : 1))),
          transparentFirst && cell === 0 ? 0 : 255,
        ],
        index,
      );
    }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
export function flippedEdge() {
  const letters = SOLVED.split("");
  [letters[7], letters[19]] = [letters[19], letters[7]];
  return letters.join("");
}
