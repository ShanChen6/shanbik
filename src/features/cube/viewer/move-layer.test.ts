import { describe, expect, it } from "vitest";
import { Group, Object3D, Quaternion, Vector3 } from "three";
import { FACE_ORDER, FACE_ORIENTATIONS } from "../core/constants";
import { applyAlgorithmText, applyMove } from "../core/moves";
import { parseAlgorithm, type CubeMove } from "../core/notation";
import { createSolvedCubeState } from "../core/state";
import type { CubeState } from "../core/types";
import { buildCubeViewModel } from "./view-model";
import { getMoveLayer, selectLayerCubies } from "./move-layer";
import { STICKER_ROTATIONS } from "./sticker-orientation";

const FIXTURES = [
  { face: "U", axis: "y", axisIndex: 1, layer: 1, angle: -Math.PI / 2 },
  { face: "R", axis: "x", axisIndex: 0, layer: 1, angle: -Math.PI / 2 },
  { face: "F", axis: "z", axisIndex: 2, layer: 1, angle: -Math.PI / 2 },
  { face: "D", axis: "y", axisIndex: 1, layer: -1, angle: Math.PI / 2 },
  { face: "L", axis: "x", axisIndex: 0, layer: -1, angle: Math.PI / 2 },
  { face: "B", axis: "z", axisIndex: 2, layer: -1, angle: Math.PI / 2 },
] as const;
const solved = createSolvedCubeState();
const scrambled = applyAlgorithmText(solved, "R U2 F' L D B2 R' F U L2 D'");
const variants = FACE_ORDER.flatMap((face) =>
  ([1, -1, 2] as const).map((turns) => ({ face, turns })),
);

function rounded(vector: Vector3) {
  const result = vector.toArray().map((value) => Math.round(value) || 0);
  expect(vector.distanceTo(new Vector3(...result))).toBeLessThan(1e-8);
  return result.join(",");
}

/** Same parent/child transforms and sticker Euler orientations used by CubeModel. */
function rotateScene(state: CubeState, move: CubeMove) {
  const cubies = buildCubeViewModel(state);
  const turn = getMoveLayer(move);
  const selected = new Set(
    selectLayerCubies(cubies, turn).map((cubie) => cubie.id),
  );
  const root = new Group();
  const pivot = new Group();
  root.add(pivot);
  const pieces = cubies.map((cubie) => {
    const piece = new Group();
    piece.position.set(...cubie.position);
    for (const sticker of cubie.stickers) {
      const plane = new Object3D();
      plane.position.set(...sticker.normal).multiplyScalar(0.476);
      plane.rotation.set(...STICKER_ROTATIONS[sticker.face]);
      plane.userData.color = sticker.color;
      piece.add(plane);
    }
    (selected.has(cubie.id) ? pivot : root).add(piece);
    return piece;
  });
  pivot.rotation[turn.axis] = turn.angle;
  root.updateMatrixWorld(true);
  const stickers = new Map<string, string>();
  for (const piece of pieces) {
    const center = piece.getWorldPosition(new Vector3());
    for (const plane of piece.children) {
      const normal = new Vector3(0, 0, 1).applyQuaternion(
        plane.getWorldQuaternion(new Quaternion()),
      );
      expect(
        plane
          .getWorldPosition(new Vector3())
          .distanceTo(center.clone().addScaledVector(normal, 0.476)),
      ).toBeLessThan(1e-8);
      const key = `${rounded(center)}|${rounded(normal)}`;
      expect(stickers.has(key)).toBe(false);
      stickers.set(key, plane.userData.color);
    }
  }
  expect(stickers.size).toBe(54);
  return stickers;
}

function coreGeometry(state: CubeState) {
  return new Map(
    buildCubeViewModel(state).flatMap((cubie) =>
      cubie.stickers.map(
        (sticker) =>
          [
            `${cubie.position.join(",")}|${sticker.normal.join(",")}`,
            sticker.color,
          ] as const,
      ),
    ),
  );
}

describe("move-to-layer conventions", () => {
  it.each(FIXTURES)(
    "$face uses positive world $axis and layer $layer",
    (fixture) => {
      const turn = getMoveLayer({ face: fixture.face, turns: 1 });
      expect(turn).toMatchObject(fixture);
      expect(turn.axisVector[turn.axisIndex]).toBe(1);
      expect(
        turn.axisVector.reduce<number>((sum, value) => sum + value, 0),
      ).toBe(1);
      expect(getMoveLayer({ face: fixture.face, turns: -1 }).angle).toBe(
        -fixture.angle,
      );
      expect(getMoveLayer({ face: fixture.face, turns: 2 }).angle).toBe(
        2 * fixture.angle,
      );
    },
  );
  it.each(FACE_ORDER)(
    "%s selects exactly 9 cubies, 21 stickers, leaving 17 cubies still",
    (face) => {
      const cubies = buildCubeViewModel(scrambled);
      const layer = selectLayerCubies(cubies, getMoveLayer({ face, turns: 1 }));
      const normal = FACE_ORIENTATIONS[face].normal;
      const expected = cubies.filter(
        (cubie) =>
          cubie.position.reduce<number>(
            (sum, value, axis) => sum + value * normal[axis],
            0,
          ) === 1,
      );
      expect(layer).toEqual(expected);
      expect(layer).toHaveLength(9);
      expect(new Set(layer.map((cubie) => cubie.id)).size).toBe(9);
      expect(layer.flatMap((cubie) => cubie.stickers)).toHaveLength(21);
      expect(layer.filter((cubie) => cubie.stickers.length === 1)).toHaveLength(
        1,
      );
      expect(layer.filter((cubie) => cubie.stickers.length === 2)).toHaveLength(
        4,
      );
      expect(layer.filter((cubie) => cubie.stickers.length === 3)).toHaveLength(
        4,
      );
      expect(cubies.filter((cubie) => !layer.includes(cubie))).toHaveLength(17);
    },
  );
  it.each(FACE_ORDER)(
    "%s sticker plane points outward in the actual renderer convention",
    (face) => {
      const plane = new Object3D();
      plane.rotation.set(...STICKER_ROTATIONS[face]);
      expect(
        rounded(new Vector3(0, 0, 1).applyQuaternion(plane.quaternion)),
      ).toBe(FACE_ORIENTATIONS[face].normal.join(","));
    },
  );
  it("returns immutable descriptors/selection without changing input", () => {
    const move = { face: "R", turns: -1 } as const;
    const before = JSON.stringify(scrambled);
    const cubies = buildCubeViewModel(scrambled);
    const turn = getMoveLayer(move);
    const layer = selectLayerCubies(cubies, turn);
    expect(Object.isFrozen(turn)).toBe(true);
    expect(Object.isFrozen(turn.axisVector)).toBe(true);
    expect(Object.isFrozen(layer)).toBe(true);
    expect(layer.every((cubie) => cubies.includes(cubie))).toBe(true);
    expect(move).toEqual({ face: "R", turns: -1 });
    expect(JSON.stringify(scrambled)).toBe(before);
  });
  it.each([
    null,
    undefined,
    {},
    { face: "M", turns: 1 },
    { face: "R", turns: 0 },
    { face: "F", turns: 3 },
    { face: "U", turns: "1" },
  ])("rejects malformed AST %j using core validation", (value) =>
    expect(() => getMoveLayer(value as CubeMove)).toThrow(),
  );
});

describe.each([
  { name: "solved", state: solved },
  { name: "scrambled", state: scrambled },
])("Three.js group endpoint vs core on $name state", ({ state }) => {
  it.each(variants)(
    "$face / turns=$turns matches all 54 sticker slots",
    (move) => {
      expect(rotateScene(state, move)).toEqual(
        coreGeometry(applyMove(state, move)),
      );
    },
  );
});

it.each(["R U R' U'", "F2 B' D L2 U' R B2", "U D L R F B U2 D2 L2 R2 F2 B2"])(
  "reselects current slots after each move in %s",
  (source) => {
    let state = scrambled;
    for (const move of parseAlgorithm(source)) {
      const rendered = rotateScene(state, move);
      state = applyMove(state, move);
      expect(rendered).toEqual(coreGeometry(state));
    }
  },
);
