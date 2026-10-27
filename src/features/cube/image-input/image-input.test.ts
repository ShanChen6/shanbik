import { describe, expect, it } from "vitest";
import { FACE_COLORS, FACE_ORDER } from "../core/constants";
import { validateCubeFeasibility } from "../core/feasibility";
import { serializeCubeState } from "../core/serialization";
import { createSolvedCubeState } from "../core/state";
import { inspectFaceDraft } from "../face-input/draft";
import {
  classify,
  distinguishable,
  toLab,
  distance,
} from "../../puzzle-image/color";
import {
  DEFAULT_CROP,
  project,
  squareGrid,
  validQuad,
} from "../../puzzle-image/geometry";
import { sampleCell } from "../../puzzle-image/sampling";
import type { ImageSource, Quad, RGB } from "../../puzzle-image/types";
import { recognizeCubeImages, type Sources } from "./adapter";
const palette: Record<string, RGB> = {
  U: [248, 250, 252],
  R: [220, 38, 38],
  F: [22, 163, 74],
  D: [250, 204, 21],
  L: [249, 115, 22],
  B: [37, 99, 235],
};
const solved = FACE_ORDER.map((face) => face.repeat(9)).join("");
const uTurn = "UUUUUUUUUBBBRRRRRRRRRFFFFFFDDDDDDDDDFFFLLLLLLLLLBBBBBB";
function source(letters: string): ImageSource {
  const data = new Uint8ClampedArray(90 * 90 * 4);
  for (let y = 0; y < 90; y++)
    for (let x = 0; x < 90; x++) {
      const rgb = palette[letters[Math.floor(y / 30) * 3 + Math.floor(x / 30)]];
      data.set([...rgb, 255], (y * 90 + x) * 4);
    }
  return {
    image: { width: 90, height: 90, data },
    preview: "",
    crop: DEFAULT_CROP,
    turns: 0,
  };
}
function sources(serialization = solved): Sources {
  return Object.fromEntries(
    FACE_ORDER.map((face, index) => [
      face,
      source(serialization.slice(index * 9, index * 9 + 9)),
    ]),
  );
}
describe("reusable image geometry and color engine", () => {
  it.each([2, 3, 4, 5, 17])(
    "generates %sx%s independent cells and inset samples",
    (size) => {
      const cells = squareGrid(size);
      expect(cells).toHaveLength(size * size);
      expect(new Set(cells.map((cell) => cell.id)).size).toBe(size * size);
      for (const cell of cells)
        for (const p of cell.samples) {
          expect(p.x).toBeGreaterThan(cell.polygon[0].x);
          expect(p.x).toBeLessThan(cell.polygon[2].x);
          expect(p.y).toBeGreaterThan(cell.polygon[0].y);
          expect(p.y).toBeLessThan(cell.polygon[2].y);
        }
    },
  );
  it.each([0, 1, 1.5, 18, NaN])("rejects invalid grid size %s", (size) =>
    expect(() => squareGrid(size)).toThrow(),
  );
  it("maps perspective corners and rotation without mirroring", () => {
    const quad: Quad = [
      { x: 0.1, y: 0.2 },
      { x: 0.8, y: 0.1 },
      { x: 0.95, y: 0.9 },
      { x: 0.05, y: 0.8 },
    ];
    expect(validQuad(quad)).toBe(true);
    for (const [p, index] of [
      [{ x: 0, y: 0 }, 0],
      [{ x: 1, y: 0 }, 1],
      [{ x: 1, y: 1 }, 2],
      [{ x: 0, y: 1 }, 3],
    ] as const) {
      expect(project(p, quad).x).toBeCloseTo(quad[index].x);
      expect(project(p, quad).y).toBeCloseTo(quad[index].y);
    }
    expect(project({ x: 0, y: 0 }, quad, 1).x).toBeCloseTo(quad[3].x);
    expect(() => project({ x: 0.5, y: 0.5 }, quad, -1)).toThrow();
  });
  it("maps the center of a trapezoid projectively, not bilinearly", () => {
    const quad: Quad = [
      { x: 0.2, y: 0.1 },
      { x: 0.8, y: 0.1 },
      { x: 0.95, y: 0.9 },
      { x: 0.05, y: 0.9 },
    ];
    expect(project({ x: 0.5, y: 0.5 }, quad).x).toBeCloseTo(0.5);
    expect(project({ x: 0.5, y: 0.5 }, quad).y).toBeCloseTo(0.42);
  });
  it.each([
    [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0.01, y: 0 },
      { x: 0.01, y: 0.01 },
      { x: 0, y: 0.01 },
    ],
    [
      { x: NaN, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
  ])("rejects crossed, reversed, tiny or nonfinite crops", (quad) =>
    expect(validQuad(quad as unknown as Quad)).toBe(false),
  );
  it("sRGB Lab neutral anchors and calibrated palette", () => {
    expect(toLab([255, 255, 255])[0]).toBeCloseTo(100, 1);
    expect(toLab([0, 0, 0])[0]).toBe(0);
    expect(distance([1, 2, 3], [1, 2, 3])).toBe(0);
    expect(distinguishable(palette)).toBe(true);
    expect(distinguishable({ a: [255, 255, 255], b: [254, 254, 254] })).toBe(
      false,
    );
    for (const [color, rgb] of Object.entries(palette))
      expect(
        classify({ rgb, spread: 0, transparent: false }, palette),
      ).toMatchObject({ color, reason: null });
  });
  it.each([
    { rgb: [0, 0, 0], spread: 0, transparent: false },
    { rgb: [255, 255, 255], spread: 0, transparent: true },
    { rgb: [220, 38, 38], spread: 90, transparent: false },
    { rgb: [180, 60, 220], spread: 0, transparent: false },
  ])("leaves unsafe colors unassigned", (sample) =>
    expect(
      classify({ ...sample, rgb: sample.rgb as unknown as RGB }, palette).color,
    ).toBeNull(),
  );
  it("uses median patches and respects rotation", () => {
    const image = source("URFDLBFRD");
    const grid = squareGrid(3);
    expect(sampleCell(image, grid[0]).rgb).toEqual(palette.U);
    expect(sampleCell({ ...image, turns: 1 }, grid[0]).rgb).toEqual(palette.F); // bottom-left is F
    expect(sampleCell({ ...image, turns: 1 }, grid[2]).rgb).toEqual(palette.U); // top-left is U
    expect(() =>
      sampleCell(
        { ...image, image: { ...image.image, data: new Uint8ClampedArray(0) } },
        grid[0],
      ),
    ).toThrow();
  });
});
describe("3×3 image adapter", () => {
  it.each([solved, uTurn])(
    "recognizes complete input and produces the expected immutable draft",
    (serialization) => {
      const result = recognizeCubeImages(sources(serialization));
      const report = inspectFaceDraft(result.draft);
      expect(report.state).not.toBeNull();
      expect(serializeCubeState(report.state!)).toBe(serialization);
      expect(Object.isFrozen(result.draft.U)).toBe(true);
      expect(validateCubeFeasibility(report.state).valid).toBe(true);
    },
  );
  it("requires all faces and distinguishable centers", () => {
    expect(() => recognizeCubeImages({})).toThrow();
    const images = sources();
    images.R = source("UUUUUUUUU");
    expect(() => recognizeCubeImages(images)).toThrow(/giống nhau/);
  });
  it("leaves a transparent sticker blank while keeping centers fixed", () => {
    const images = sources();
    for (let y = 0; y < 30; y++)
      for (let x = 0; x < 30; x++)
        images.U!.image.data[(y * 90 + x) * 4 + 3] = 0;
    const result = recognizeCubeImages(images);
    expect(result.draft.U[0]).toBeNull();
    expect(result.draft.U[4]).toBe(FACE_COLORS.U);
    expect(inspectFaceDraft(result.draft).state).toBeNull();
  });
  it("never calls a color-count match proof of solvability", () => {
    const impossible = solved.split("");
    [impossible[7], impossible[19]] = [impossible[19], impossible[7]];
    const report = inspectFaceDraft(
      recognizeCubeImages(sources(impossible.join(""))).draft,
    );
    expect(report.state).toBeDefined();
    expect(validateCubeFeasibility(report.state).valid).toBe(false);
    expect(
      createSolvedCubeState().faces.U.every((color) => color === "white"),
    ).toBe(true);
  });
});
