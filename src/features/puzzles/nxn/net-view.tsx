import { FACE_ORDER } from "../../cube/core/constants";
import type { CubeFace } from "../../cube/core/types";
import { COLOR_LABELS, STICKER_COLORS } from "../../cube/viewer/palette";
import type { NxnState } from "./model";
/** Cross net: U above F; L F R B in a row; D below F. Faces seen from outside. */
const CELL: Readonly<Record<CubeFace, readonly [number, number]>> = {
  U: [1, 0],
  L: [0, 1],
  F: [1, 1],
  R: [2, 1],
  B: [3, 1],
  D: [1, 2],
};
const FACE_NAMES: Readonly<Record<CubeFace, string>> = {
  U: "trên",
  D: "dưới",
  F: "trước",
  B: "sau",
  L: "trái",
  R: "phải",
};
export function NxnNetView({ state }: { state: NxnState }) {
  const n = state.size,
    face = 10 * n + 4,
    size = 10;
  return (
    <svg
      role="img"
      aria-label={`Sơ đồ sáu mặt khối ${n}×${n}: ${FACE_ORDER.map(
        (f) =>
          `mặt ${FACE_NAMES[f]} ${new Set(state.faces[f]).size === 1 ? `một màu ${COLOR_LABELS[state.faces[f][0]].toLowerCase()}` : "nhiều màu"}`,
      ).join(", ")}`}
      viewBox={`0 0 ${4 * face} ${3 * face}`}
      className="block h-auto w-full max-w-md"
    >
      {FACE_ORDER.map((f) => {
        const [cx, cy] = CELL[f];
        return (
          <g key={f} transform={`translate(${cx * face + 2} ${cy * face + 2})`}>
            {state.faces[f].map((color, i) => (
              <rect
                key={i}
                x={(i % n) * size}
                y={Math.floor(i / n) * size}
                width={size - 1}
                height={size - 1}
                rx={1.5}
                fill={STICKER_COLORS[color]}
                stroke="#1f2a2e"
                strokeWidth={0.4}
              />
            ))}
            <text
              x={(n * size) / 2}
              y={(n * size) / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={Math.min(6, 2.4 * n)}
              fontWeight={700}
              fill="#1f2a2e"
              opacity={0.55}
              aria-hidden="true"
            >
              {f}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
