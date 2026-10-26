import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { CAMERA_FOV, getCameraPosition } from "./camera";

describe("responsive camera framing", () => {
  it.each([
    [220, 272],
    [288, 272],
    [600, 272],
    [720, 396],
    [1200, 448],
  ])("keeps all cube corners inside the frame at %i × %i", (width, height) => {
    const camera = new PerspectiveCamera(CAMERA_FOV, width / height, 0.1, 100);
    camera.position.set(...getCameraPosition(width, height)!);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    for (const x of [-1.5, 1.5])
      for (const y of [-1.5, 1.5])
        for (const z of [-1.5, 1.5]) {
          const projected = new Vector3(x, y, z).project(camera);
          expect(Math.abs(projected.x)).toBeLessThan(0.9);
          expect(Math.abs(projected.y)).toBeLessThan(0.9);
          expect(projected.z).toBeGreaterThan(-1);
          expect(projected.z).toBeLessThan(1);
        }
  });
  it("returns the same default orientation after resizing and reset", () => {
    const before = getCameraPosition(720, 396)!;
    const narrow = getCameraPosition(220, 396)!;
    expect(Math.hypot(...narrow)).toBeGreaterThan(Math.hypot(...before));
    expect(narrow[0] / narrow[2]).toBeCloseTo(5 / 6);
    expect(narrow[1] / narrow[2]).toBeCloseTo(4 / 6);
    expect(getCameraPosition(720, 396)).toEqual(before);
  });
  it.each([
    [0, 300],
    [300, 0],
    [-1, 300],
    [NaN, 300],
    [300, Infinity],
  ])("ignores hidden or invalid dimensions %s × %s", (width, height) =>
    expect(getCameraPosition(width, height)).toBeNull(),
  );
});
