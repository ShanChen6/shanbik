import { createFaceDraft } from "../face-input/draft";
import { isCubeSolved } from "../core/state";
import type { MoveSnapshot, createMoveQueuePlayer } from "../viewer/move-queue";

export function canCaptureModel(snapshot: MoveSnapshot, ready: boolean) {
  return (
    ready &&
    !snapshot.active &&
    !snapshot.pending.length &&
    !snapshot.playback?.playing
  );
}

/** Capture only a settled committed position; never a half-rendered move. */
export function captureModel(
  player: ReturnType<typeof createMoveQueuePlayer>,
  ready: boolean,
) {
  const snapshot = player.getSnapshot();
  return canCaptureModel(snapshot, ready)
    ? createFaceDraft(snapshot.state)
    : null;
}

export function modelStatus(snapshot: MoveSnapshot) {
  if (snapshot.active || snapshot.playback?.playing)
    return "Mô hình đang xoay. Chờ hoặc tạm dừng trước khi lấy màu.";
  if (snapshot.pending.length)
    return "Còn nước trong hàng đợi. Hoàn tất hoặc hủy trước khi lấy màu.";
  const state = isCubeSolved(snapshot.state)
    ? "Mô hình đã solved."
    : "Mô hình chưa solved.";
  if (snapshot.playback)
    return `${state} Đang dừng ở bước ${snapshot.playback.cursor}/${snapshot.playback.moves.length}.`;
  return state;
}
