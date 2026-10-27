import {
  serializeAlgorithm,
  tryParseAlgorithm,
  type CubeAlgorithm,
} from "../core/notation";
import { MAX_QUEUE_MOVES } from "../viewer/move-queue";

export const MAX_HISTORY = 20;
export type HistoryEntry = Readonly<{ id: number; notation: string }>;
export type InputIssue = Readonly<{
  message: string;
  start: number;
  end: number;
}>;

/** Validate the entire input before the callback can replace any player work. */
export function submitAlgorithm(
  text: string,
  play: (moves: CubeAlgorithm) => boolean,
) {
  const parsed = tryParseAlgorithm(text);
  if (!parsed.valid) return { accepted: false as const, issues: parsed.issues };
  if (!parsed.moves.length || parsed.moves.length > MAX_QUEUE_MOVES) {
    return {
      accepted: false as const,
      issues: [
        {
          message: `Nhập từ 1 đến ${MAX_QUEUE_MOVES} move.`,
          start: 0,
          end: text.length,
        },
      ],
    };
  }
  if (!play(parsed.moves))
    return {
      accepted: false as const,
      issues: [
        {
          message: "Khối chưa sẵn sàng. Hãy thử lại khi mô hình đã tải.",
          start: 0,
          end: 0,
        },
      ],
    };
  return {
    accepted: true as const,
    notation: serializeAlgorithm(parsed.moves),
    issues: [],
  };
}

export function rememberAlgorithm(
  history: readonly HistoryEntry[],
  notation: string,
  id: number,
): readonly HistoryEntry[] {
  return Object.freeze(
    [Object.freeze({ id, notation }), ...history].slice(0, MAX_HISTORY),
  );
}
