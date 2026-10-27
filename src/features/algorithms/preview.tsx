"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  applyAlgorithm,
  createSolvedCubeState,
  invertAlgorithm,
} from "../cube/core";
import { createMoveQueuePlayer } from "../cube/viewer/move-queue";
import { CubeViewport } from "../cube/viewer/cube-viewport";
import { StateDiagram } from "../learn/lessons/state-diagram";
import type { Formula } from "./catalog";
const subscribeMotion = (notify: () => void) => {
  const q = matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", notify);
  return () => q.removeEventListener("change", notify);
};
export default function FormulaPreview({
  formula,
  onClose,
}: {
  formula: Formula;
  onClose: () => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    title.current?.scrollIntoView({ block: "start" });
  }, []);
  const [before] = useState(() =>
    applyAlgorithm(createSolvedCubeState(), invertAlgorithm(formula.moves)),
  );
  const [player] = useState(() => {
    const p = createMoveQueuePlayer(before);
    p.loadSequence(formula.moves, before);
    return p;
  });
  const snapshot = useSyncExternalStore(
    player.subscribe,
    player.getSnapshot,
    player.getServerSnapshot,
  );
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
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
    busy = playback.playing || !!snapshot.active;
  return (
    <section
      aria-label="Minh họa công thức"
      className="mt-6 min-w-0 rounded-panel border border-border bg-surface p-4 sm:p-6"
    >
      <h2 ref={title} tabIndex={-1} className="text-heading scroll-mt-6">
        {formula.name}
      </h2>
      <Button variant="secondary" onClick={onClose}>
        Đóng minh họa
      </Button>
      <p className="mt-3 mb-4 text-muted">
        Giữ tâm trắng ở U, xanh lá ở F. Trạng thái mẫu được tạo bằng chuỗi đảo
        từ khối đã giải; phát hết công thức sẽ đưa mẫu này về khối đã giải. Đây
        không phải nhận diện hay lời giải cho khối bất kỳ.
      </p>
      <CubeViewport
        state={snapshot.state}
        animation={snapshot.active}
        onMoveComplete={player.complete}
        onMoveCancel={player.cancel}
        onReadyChange={setReady}
        fallbackText="Không hiển thị được 3D. Xem sơ đồ trạng thái mẫu bên dưới."
        fallback={
          <p role="status" className="p-6 text-muted">
            Không hiển thị được 3D. Bạn vẫn có thể xem sơ đồ mẫu, copy và lưu
            yêu thích. Tải lại trang để thử lại.
          </p>
        }
        moveControls={
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!ready || busy}
                onClick={() => {
                  player.setReducedMotion(reduced);
                  if (playback.cursor === formula.moves.length)
                    player.resetPlayback();
                  player.play();
                }}
              >
                {playback.cursor === formula.moves.length
                  ? "Phát lại công thức"
                  : "Phát công thức"}
              </Button>
              <Button
                variant="secondary"
                disabled={!playback.playing}
                onClick={player.pausePlayback}
              >
                Tạm dừng
              </Button>
              <Button variant="secondary" onClick={player.resetPlayback}>
                Về trạng thái mẫu
              </Button>
            </div>
            <p role="status" aria-label="Tiến độ minh họa">
              Đã xoay {playback.cursor}/{formula.moves.length} nước.
            </p>
          </div>
        }
      />
      <details className="mt-5">
        <summary className="cursor-pointer py-3 font-semibold">
          Xem sơ đồ trạng thái mẫu 2D
        </summary>
        <h3 className="my-3 font-semibold">Trạng thái mẫu trước khi phát</h3>
        <StateDiagram state={before} label="Trạng thái mẫu trước công thức" />
      </details>
    </section>
  );
}
