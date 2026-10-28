import { FACE_ORDER } from "../../cube/core/constants";
import type { CubeState } from "../../cube/core/types";
import {
  COLOR_ABBREVIATIONS,
  COLOR_LABELS,
  STICKER_COLORS,
  stickerTextColor,
} from "../../cube/viewer/palette";
export function StateDiagram({
  state,
  label,
}: {
  state: CubeState;
  label: string;
}) {
  return (
    <figure
      aria-label={label}
      className="min-w-0 rounded-xl border border-border bg-surface-subtle p-3"
    >
      <figcaption className="mb-3 font-semibold">{label}</figcaption>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FACE_ORDER.map((face) => (
          <div key={face} className="min-w-0">
            <h4 className="mb-1 text-sm font-semibold">{face}</h4>
            <ol
              aria-label={`Mặt ${face} — ${label}`}
              className="grid grid-cols-3 gap-1"
            >
              {state.faces[face].map((color, index) => (
                <li
                  key={index}
                  aria-label={`Hàng ${Math.floor(index / 3) + 1}, cột ${(index % 3) + 1}: ${COLOR_LABELS[color]}`}
                  className="flex aspect-square items-center justify-center rounded-sm border border-black/40 text-xs font-semibold"
                  style={{
                    backgroundColor: STICKER_COLORS[color],
                    color: stickerTextColor(color),
                  }}
                >
                  {COLOR_ABBREVIATIONS[color]}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </figure>
  );
}
