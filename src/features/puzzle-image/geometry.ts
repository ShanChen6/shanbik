import type { ImageCell, Point, Quad } from "./types";
export const DEFAULT_CROP: Quad = Object.freeze([
  Object.freeze({ x: 0.05, y: 0.05 }),
  Object.freeze({ x: 0.95, y: 0.05 }),
  Object.freeze({ x: 0.95, y: 0.95 }),
  Object.freeze({ x: 0.05, y: 0.95 }),
]);
export function validQuad(quad: Quad): boolean {
  if (
    quad.length !== 4 ||
    quad.some(
      (p) =>
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        p.x < 0 ||
        p.y < 0 ||
        p.x > 1 ||
        p.y > 1,
    )
  )
    return false;
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const a = quad[i],
      b = quad[(i + 1) % 4],
      c = quad[(i + 2) % 4];
    if ((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) <= 0.0001)
      return false;
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2 >= 0.01;
}
/** A projective mapping, so angled face photographs do not use a rectangular approximation. */
export function project(point: Point, quad: Quad, turns = 0): Point {
  if (!validQuad(quad) || !Number.isInteger(turns) || turns < 0 || turns > 3)
    throw Error("INVALID_CROP");
  let { x: u, y: v } = point;
  for (let i = 0; i < turns; i++) [u, v] = [v, 1 - u];
  const [p0, p1, p2, p3] = quad;
  const dx1 = p1.x - p2.x,
    dx2 = p3.x - p2.x,
    dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y,
    dy2 = p3.y - p2.y,
    dy3 = p0.y - p1.y + p2.y - p3.y;
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  const denominator = g * u + h * v + 1;
  return {
    x:
      ((p1.x - p0.x + g * p1.x) * u + (p3.x - p0.x + h * p3.x) * v + p0.x) /
      denominator,
    y:
      ((p1.y - p0.y + g * p1.y) * u + (p3.y - p0.y + h * p3.y) * v + p0.y) /
      denominator,
  };
}
/** Reusable geometry for NxN; selecting a supported puzzle is the adapter's responsibility. */
export function squareGrid(size: number): readonly ImageCell[] {
  if (!Number.isInteger(size) || size < 2 || size > 17)
    throw Error("INVALID_GRID");
  return Object.freeze(
    Array.from({ length: size * size }, (_, index) => {
      const column = index % size,
        row = Math.floor(index / size);
      const polygon = [
        { x: column / size, y: row / size },
        { x: (column + 1) / size, y: row / size },
        { x: (column + 1) / size, y: (row + 1) / size },
        { x: column / size, y: (row + 1) / size },
      ];
      const samples = Array.from({ length: 25 }, (_, i) => ({
        x: (column + 0.5 + ((i % 5) - 2) * 0.05) / size,
        y: (row + 0.5 + (Math.floor(i / 5) - 2) * 0.05) / size,
      }));
      return Object.freeze({
        id: String(index),
        polygon: Object.freeze(polygon.map(Object.freeze)),
        samples: Object.freeze(samples.map(Object.freeze)),
      }) as ImageCell;
    }),
  );
}
