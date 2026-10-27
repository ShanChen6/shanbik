import type { CubeColor } from "../core/types";

// Puzzle data colors do not change with the website's brand or light/dark theme.
export const STICKER_COLORS: Readonly<Record<CubeColor, string>> =
  Object.freeze({
    white: "#f8fafc",
    red: "#dc2626",
    green: "#16a34a",
    yellow: "#facc15",
    orange: "#f97316",
    blue: "#2563eb",
  });
export const COLOR_LABELS: Readonly<Record<CubeColor, string>> = Object.freeze({
  white: "Trắng",
  red: "Đỏ",
  green: "Xanh lá",
  yellow: "Vàng",
  orange: "Cam",
  blue: "Xanh dương",
});

export const COLOR_ABBREVIATIONS = Object.freeze({
  white: "Tr",
  red: "Đ",
  green: "XL",
  yellow: "V",
  orange: "C",
  blue: "XD",
} as const);
