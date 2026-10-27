import { FACE_COLORS } from "./constants";
import { serializeCubeState } from "./serialization";
import { createCubeState } from "./state";
import type {
  CubeColor,
  CubeFace,
  CubeState,
  CubeStructureIssue,
} from "./types";
import { validateCubeStructure } from "./validation";

export type StickerLocation = Readonly<{ face: CubeFace; index: number }>;
export type FeasibilityIssue = Readonly<{
  code:
    | CubeStructureIssue["code"]
    | "INVALID_EDGE"
    | "INVALID_CORNER"
    | "EDGE_INVENTORY"
    | "CORNER_INVENTORY"
    | "EDGE_FLIP"
    | "CORNER_TWIST"
    | "PARITY";
  message: string;
  stickers: readonly StickerLocation[];
}>;
export type CubieCoordinates = Readonly<{
  cp: readonly number[];
  co: readonly number[];
  ep: readonly number[];
  eo: readonly number[];
}>;
export type CubeFeasibility =
  | Readonly<{
      valid: false;
      stage: "structure" | "cubies";
      issues: readonly FeasibilityIssue[];
    }>
  | Readonly<{
      valid: true;
      state: CubeState;
      serialization: string;
      cubies: CubieCoordinates;
    }>;

const location = (face: CubeFace, index: number): StickerLocation =>
  Object.freeze({ face, index });
function slot(name: string, facelets: readonly [CubeFace, number][]) {
  return Object.freeze({
    name,
    stickers: Object.freeze(
      facelets.map(([face, index]) => location(face, index)),
    ),
  });
}
/** Standard URFDLB row-major, zero-based. Corner order is cyclic, never mirrored. */
export const CORNER_SLOTS = Object.freeze([
  slot("URF", [
    ["U", 8],
    ["R", 0],
    ["F", 2],
  ]),
  slot("UFL", [
    ["U", 6],
    ["F", 0],
    ["L", 2],
  ]),
  slot("ULB", [
    ["U", 0],
    ["L", 0],
    ["B", 2],
  ]),
  slot("UBR", [
    ["U", 2],
    ["B", 0],
    ["R", 2],
  ]),
  slot("DFR", [
    ["D", 2],
    ["F", 8],
    ["R", 6],
  ]),
  slot("DLF", [
    ["D", 0],
    ["L", 8],
    ["F", 6],
  ]),
  slot("DBL", [
    ["D", 6],
    ["B", 8],
    ["L", 6],
  ]),
  slot("DRB", [
    ["D", 8],
    ["R", 8],
    ["B", 6],
  ]),
]);
export const EDGE_SLOTS = Object.freeze([
  slot("UR", [
    ["U", 5],
    ["R", 1],
  ]),
  slot("UF", [
    ["U", 7],
    ["F", 1],
  ]),
  slot("UL", [
    ["U", 3],
    ["L", 1],
  ]),
  slot("UB", [
    ["U", 1],
    ["B", 1],
  ]),
  slot("DR", [
    ["D", 5],
    ["R", 7],
  ]),
  slot("DF", [
    ["D", 1],
    ["F", 7],
  ]),
  slot("DL", [
    ["D", 3],
    ["L", 7],
  ]),
  slot("DB", [
    ["D", 7],
    ["B", 7],
  ]),
  slot("FR", [
    ["F", 5],
    ["R", 3],
  ]),
  slot("FL", [
    ["F", 3],
    ["L", 5],
  ]),
  slot("BL", [
    ["B", 5],
    ["L", 3],
  ]),
  slot("BR", [
    ["B", 3],
    ["R", 5],
  ]),
]);

const failure = (
  stage: "structure" | "cubies",
  issues: readonly FeasibilityIssue[],
): CubeFeasibility =>
  Object.freeze({
    valid: false,
    stage,
    issues: Object.freeze(
      issues.map((issue) =>
        Object.freeze({
          ...issue,
          stickers: Object.freeze([...issue.stickers]),
        }),
      ),
    ),
  });
function parity(permutation: readonly number[]) {
  let inversions = 0;
  for (let i = 0; i < permutation.length; i++)
    for (let j = i + 1; j < permutation.length; j++)
      if (permutation[i] > permutation[j]) inversions++;
  return inversions % 2;
}

/** Complete fixed-center 3×3 reachability check. Never repairs input or runs a solver. */
export function validateCubeFeasibility(input: unknown): CubeFeasibility {
  const structure = validateCubeStructure(input);
  if (!structure.valid)
    return failure(
      "structure",
      structure.issues.map((issue) => {
        const match = /^faces\.([URFDLB])\[(\d)\]$/.exec(issue.path);
        return {
          code: issue.code,
          message: issue.message,
          stickers: match
            ? [location(match[1] as CubeFace, Number(match[2]))]
            : [],
        };
      }),
    );
  const state = input as CubeState;
  const issues: FeasibilityIssue[] = [];
  const extract = (slots: typeof CORNER_SLOTS, corner: boolean) => {
    const p: number[] = [],
      o: number[] = [];
    const n = corner ? 3 : 2;
    const canonical = slots.map((item) =>
      item.stickers.map((cell) => FACE_COLORS[cell.face] as CubeColor),
    );
    slots.forEach((item) => {
      const observed = item.stickers.map(
        (cell) => state.faces[cell.face][cell.index],
      );
      let piece = -1,
        orientation = -1;
      for (
        let candidate = 0;
        candidate < slots.length && piece < 0;
        candidate++
      ) {
        for (let rotation = 0; rotation < n; rotation++) {
          if (
            canonical[candidate].every(
              (color, index) => observed[(index + rotation) % n] === color,
            )
          ) {
            piece = candidate;
            orientation = rotation;
            break;
          }
        }
      }
      p.push(piece);
      o.push(orientation);
      if (piece < 0)
        issues.push({
          code: corner ? "INVALID_CORNER" : "INVALID_EDGE",
          message: `${corner ? "Góc" : "Cạnh"} tại ${item.name} có bộ màu hoặc thứ tự màu không thể có. Kiểm tra các ô của vị trí này và hướng nhập mặt.`,
          stickers: item.stickers,
        });
    });
    const counts = slots.map(
      (_, index) => p.filter((piece) => piece === index).length,
    );
    const repeated = slots
      .filter((_, index) => counts[index] > 1)
      .map((item) => item.name);
    const missing = slots
      .filter((_, index) => counts[index] === 0)
      .map((item) => item.name);
    const unique =
      p.every((piece) => piece >= 0) && counts.every((count) => count === 1);
    if (!unique)
      issues.push({
        code: corner ? "CORNER_INVENTORY" : "EDGE_INVENTORY",
        message: `Không đủ đúng một lần mỗi ${corner ? "góc" : "cạnh"}.${repeated.length ? ` Bộ màu lặp: ${repeated.join(", ")}.` : ""}${missing.length ? ` Bộ màu thiếu: ${missing.join(", ")}.` : ""} Kiểm tra màu đã nhập, không tự đổi vị trí các viên.`,
        stickers: slots.flatMap((item, index) =>
          p[index] < 0 || counts[p[index]] > 1 ? item.stickers : [],
        ),
      });
    return { p, o, unique };
  };
  const corners = extract(CORNER_SLOTS, true),
    edges = extract(EDGE_SLOTS, false);
  // Orientation/parity require a bijection first; do not report misleading secondary failures.
  if (corners.unique && edges.unique) {
    if (edges.o.reduce((sum, value) => sum + value, 0) % 2 !== 0)
      issues.push({
        code: "EDGE_FLIP",
        message:
          "Tổng hướng cạnh không hợp lệ (lẻ). Hãy kiểm tra màu hai ô của các cạnh và hướng giữ mặt; không thể sửa trạng thái này chỉ bằng các nước xoay hợp lệ.",
        stickers: EDGE_SLOTS.flatMap((item, index) =>
          edges.o[index] ? item.stickers : [],
        ),
      });
    if (corners.o.reduce((sum, value) => sum + value, 0) % 3 !== 0)
      issues.push({
        code: "CORNER_TWIST",
        message:
          "Tổng hướng góc không chia hết cho 3. Hãy kiểm tra thứ tự ba màu tại các góc và hướng nhập mặt; trạng thái này không đạt được bằng các nước xoay hợp lệ.",
        stickers: CORNER_SLOTS.flatMap((item, index) =>
          corners.o[index] ? item.stickers : [],
        ),
      });
    if (parity(corners.p) !== parity(edges.p))
      issues.push({
        code: "PARITY",
        message:
          "Parity cạnh và góc không khớp (hoán vị lẻ). Hãy kiểm tra lại vị trí cạnh/góc và hướng nhập cả sáu mặt. Không thể xác định duy nhất ô nhập sai từ lỗi này.",
        stickers: [],
      });
  }
  if (issues.length) return failure("cubies", issues);
  const snapshot = createCubeState(state);
  return Object.freeze({
    valid: true,
    state: snapshot,
    serialization: serializeCubeState(snapshot),
    cubies: Object.freeze({
      cp: Object.freeze(corners.p),
      co: Object.freeze(corners.o),
      ep: Object.freeze(edges.p),
      eo: Object.freeze(edges.o),
    }),
  });
}
