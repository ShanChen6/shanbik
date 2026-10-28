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
/** Plastic body of 3D models (WebGL material, so a value rather than a CSS token). */
export const PLASTIC_COLOR = "#34464d";
/** Readable label color on a sticker, from the diagram tokens in src/styles/tokens.css. */
export const stickerTextColor = (color: CubeColor) =>
  color === "red" || color === "blue"
    ? "var(--color-diagram-paper)"
    : "var(--color-diagram-ink)";
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
