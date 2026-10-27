"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { CubeViewport } from "../../cube/viewer/cube-viewport";
import { createMoveQueuePlayer } from "../../cube/viewer/move-queue";
import { serializeCubeState } from "../../cube/core/serialization";
import type { LessonStep } from "./schema";
const subscribeMotion = (notify: () => void) => {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const getMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export function LessonStepViewer({ step }: { step: LessonStep }) {
  const [player] = useState(() => {
    const value = createMoveQueuePlayer(step.before);
    value.loadSequence(step.moves, step.before);
    return value;
  });
  const snapshot = useSyncExternalStore(
    player.subscribe,
    player.getSnapshot,
    player.getServerSnapshot,
  );
  const reduced = useSyncExternalStore(subscribeMotion, getMotion, () => true);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    player.setReducedMotion(reduced);
  }, [player, reduced]);
  useEffect(
    () => () => {
      player.cancel();
    },
    [player],
  );
  const playback = snapshot.playback!,
    busy = !!snapshot.active || playback.playing;
  const atEnd =
    playback.cursor === step.moves.length &&
    serializeCubeState(snapshot.state) === serializeCubeState(step.after);
  const run = (command: () => unknown) => {
    if (!ready) return;
    player.setReducedMotion(reduced);
    command();
  };
  const controls = (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!ready || busy || !step.moves.length}
          onClick={() =>
            run(() => {
              if (playback.cursor === step.moves.length) player.resetPlayback();
              player.play();
            })
          }
        >
          {playback.cursor === step.moves.length && step.moves.length
            ? "Phát lại minh họa"
            : "Phát minh họa"}
        </Button>
        <Button
          variant="secondary"
          disabled={!playback.playing}
          onClick={player.pausePlayback}
        >
          Tạm dừng minh họa
        </Button>
        <Button
          variant="secondary"
          disabled={!ready || busy || playback.cursor === step.moves.length}
          onClick={() => run(player.stepForward)}
        >
          Nước tiếp
        </Button>
        <Button
          variant="secondary"
          disabled={!ready || busy || playback.cursor === 0}
          onClick={() => run(player.stepBackward)}
        >
          Nước lùi
        </Button>
        <Button variant="secondary" onClick={player.resetPlayback}>
          Về trước bước
        </Button>
      </div>
      <p
        role="status"
        aria-label="Trạng thái minh họa"
        className="text-sm text-muted"
      >
        Đã xoay {playback.cursor}/{step.moves.length} nước.
        {snapshot.active
          ? " Đang xoay."
          : !step.moves.length
            ? " Bước quan sát giữ nguyên trạng thái."
            : atEnd
              ? " Đã tới trạng thái sau của bước."
              : " Đang ở vị trí đã dừng."}
      </p>
      <p className="text-xs text-muted">
        Minh họa chỉ chạy thuật toán của bước hiện tại. Về trước bước khôi phục
        trạng thái đầu bước; đổi bước hủy nước đang chạy. Vị trí lưu là bước
        đang đọc, không lưu nước xoay hoặc đánh dấu hoàn thành.
      </p>
    </div>
  );
  return (
    <section
      aria-label="Minh họa bước học"
      className="min-w-0 rounded-xl border border-border p-3"
    >
      <h3 className="mb-3 font-semibold">Minh họa 3D của bước</h3>
      <CubeViewport
        state={snapshot.state}
        animation={snapshot.active}
        onMoveComplete={player.complete}
        onMoveCancel={player.cancel}
        onReadyChange={setReady}
        moveControls={controls}
        fallbackText="Mô hình 3D không khả dụng. Đọc hướng dẫn và sơ đồ màu 2D của bài bên dưới."
        fallback={
          <div
            role="status"
            className="flex min-h-64 flex-col justify-center gap-3 p-5 text-center"
          >
            <p className="font-semibold">Không thể hiển thị mô hình 3D</p>
            <p className="text-sm text-muted">
              Bạn vẫn có thể đọc hướng dẫn, đối chiếu sơ đồ màu 2D và lưu vị trí
              đang đọc. Tải lại trang để thử khởi tạo 3D lại.
            </p>
          </div>
        }
      />
    </section>
  );
}
