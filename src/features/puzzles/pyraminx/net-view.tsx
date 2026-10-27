import {
  FACE_VERTICES,
  PYRAMINX_FACES,
  SLOTS,
  type PyraminxColor,
  type PyraminxFace,
  type PyraminxState,
} from "./model";
export const PYRAMINX_HEX: Readonly<Record<PyraminxColor, string>> = {
  green: "#16a34a",
  red: "#dc2626",
  blue: "#2563eb",
  yellow: "#facc15",
};
export const PYRAMINX_LABELS: Readonly<Record<PyraminxFace, string>> = {
  F: "trước (xanh lá)",
  L: "trái (đỏ)",
  R: "phải (xanh dương)",
  D: "đáy (vàng)",
};
const S = 90,
  H = (S * Math.sqrt(3)) / 2;
type P = readonly [number, number];
/** Unfolded net: F upright in the middle, L and R folded out beside it, D below. */
const NET: Readonly<Record<PyraminxFace, Readonly<Record<string, P>>>> = {
  F: { U: [0, 0], L: [-S / 2, H], R: [S / 2, H] },
  L: { U: [0, 0], B: [-S, 0], L: [-S / 2, H] },
  R: { U: [0, 0], R: [S / 2, H], B: [S, 0] },
  D: { L: [-S / 2, H], B: [0, 2 * H], R: [S / 2, H] },
};
function triangle(face: PyraminxFace, slot: readonly number[]): P[] {
  const corners = FACE_VERTICES[face].map((v) => NET[face][v]);
  const at = (g: readonly number[]): P => [
    (g[0] * corners[0][0] + g[1] * corners[1][0] + g[2] * corners[2][0]) / 3,
    (g[0] * corners[0][1] + g[1] * corners[1][1] + g[2] * corners[2][1]) / 3,
  ];
  const up = slot.every((w) => w % 3 === 1),
    base = slot.map((w) => (w - (up ? 1 : 2)) / 3);
  const pts = (
    up
      ? [
          [base[0] + 1, base[1], base[2]],
          [base[0], base[1] + 1, base[2]],
          [base[0], base[1], base[2] + 1],
        ]
      : [
          [base[0] + 1, base[1] + 1, base[2]],
          [base[0] + 1, base[1], base[2] + 1],
          [base[0], base[1] + 1, base[2] + 1],
        ]
  ).map(at);
  // Shrink toward the centroid for visible gaps between stickers.
  const c: P = [
    (pts[0][0] + pts[1][0] + pts[2][0]) / 3,
    (pts[0][1] + pts[1][1] + pts[2][1]) / 3,
  ];
  return pts.map((p) => [
    c[0] + (p[0] - c[0]) * 0.86,
    c[1] + (p[1] - c[1]) * 0.86,
  ]);
}
export function PyraminxNetView({ state }: { state: PyraminxState }) {
  const solvedFaces = PYRAMINX_FACES.filter((f) =>
    state[f].every((c) => c === state[f][0]),
  ).length;
  return (
    <svg
      role="img"
      aria-label={`Sơ đồ phẳng Pyraminx: mặt trước ở giữa, trái và phải mở ra hai bên, đáy ở dưới. ${solvedFaces}/4 mặt đồng màu.`}
      viewBox={`${-S - 4} -4 ${2 * S + 8} ${2 * H + 8}`}
      className="block h-auto w-full max-w-md"
    >
      {PYRAMINX_FACES.map((f) =>
        SLOTS.map((slot, i) => (
          <polygon
            key={`${f}${i}`}
            points={triangle(f, slot)
              .map((p) => p.map((v) => v.toFixed(2)).join(","))
              .join(" ")}
            fill={PYRAMINX_HEX[state[f][i]]}
            stroke="#1f2a2e"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        )),
      )}
    </svg>
  );
}
