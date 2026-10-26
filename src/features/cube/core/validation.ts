import {
  CENTER_INDEX,
  CUBE_COLORS,
  FACE_COLORS,
  FACE_ORDER,
  STICKERS_PER_FACE,
} from "./constants";
import type {
  CubeColor,
  CubeStructureIssue,
  CubeStructureValidation,
} from "./types";

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Checks shape/counts/centers only, NOT cubie orientation, inventory or parity. */
export function validateCubeStructure(input: unknown): CubeStructureValidation {
  if (
    !record(input) ||
    !Object.hasOwn(input, "faces") ||
    Object.keys(input).length !== 1 ||
    !record(input.faces)
  ) {
    return {
      valid: false,
      issues: [
        {
          code: "INVALID_SHAPE",
          path: "$",
          message: "State phải là object chỉ có thuộc tính faces chứa sáu mặt.",
        },
      ],
    };
  }
  const faces = input.faces;
  if (
    Object.keys(faces).length !== FACE_ORDER.length ||
    !FACE_ORDER.every((face) => Object.hasOwn(faces, face))
  ) {
    return {
      valid: false,
      issues: [
        {
          code: "INVALID_FACE_KEYS",
          path: "faces",
          message: "Cần đúng sáu mặt U, R, F, D, L, B.",
        },
      ],
    };
  }
  const issues: CubeStructureIssue[] = [];
  const counts = new Map<CubeColor, number>(
    CUBE_COLORS.map((color) => [color, 0]),
  );
  let complete = true;
  for (const face of FACE_ORDER) {
    const stickers = faces[face];
    if (!Array.isArray(stickers) || stickers.length !== STICKERS_PER_FACE) {
      complete = false;
      issues.push({
        code: "INVALID_FACE_LENGTH",
        path: `faces.${face}`,
        message: "Mỗi mặt cần đúng 9 sticker.",
      });
      continue;
    }
    // Indexing explicitly rejects sparse arrays; Array.every would skip empty slots.
    for (let index = 0; index < STICKERS_PER_FACE; index++) {
      const color: unknown = stickers[index];
      if (typeof color !== "string" || !counts.has(color as CubeColor)) {
        complete = false;
        issues.push({
          code: "INVALID_COLOR",
          path: `faces.${face}[${index}]`,
          message: "Màu sticker không được hỗ trợ hoặc chưa được nhập.",
        });
        continue;
      }
      const knownColor = color as CubeColor;
      counts.set(knownColor, counts.get(knownColor)! + 1);
      if (index === CENTER_INDEX && knownColor !== FACE_COLORS[face]) {
        issues.push({
          code: "INVALID_CENTER",
          path: `faces.${face}[4]`,
          message: `Tâm mặt ${face} phải là ${FACE_COLORS[face]}.`,
        });
      }
    }
  }
  if (complete) {
    for (const color of CUBE_COLORS) {
      if (counts.get(color) !== STICKERS_PER_FACE)
        issues.push({
          code: "INVALID_COLOR_COUNT",
          path: `colors.${color}`,
          message: `Cần đúng 9 sticker màu ${color}.`,
        });
    }
  }
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}
