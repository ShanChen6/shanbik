"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { serializeAlgorithm } from "../cube/core";
import { createMoveQueuePlayer } from "../cube/viewer/move-queue";
import { CubeViewport } from "../cube/viewer/cube-viewport";
import { StateDiagram } from "../learn/lessons/state-diagram";
import {
  currentMoveIndex,
  practiceSequence,
  type PracticeSettings,
} from "./practice";
import type { Formula } from "./catalog";
const subscribeMotion = (notify: () => void) => {
  const q = matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", notify);
  return () => q.removeEventListener("change", notify);
};
export function PracticePlayer({
  formula,
  settings,
}: {
  formula: Formula;
  settings: PracticeSettings;
}) {
  const [sequence] = useState(() => practiceSequence(formula, settings));
  const [player] = useState(() => {
    const p = createMoveQueuePlayer(sequence.initial);
    p.loadSequence(sequence.moves, sequence.initial);
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
  const current = currentMoveIndex(
    playback.cursor,
    playback.step,
    !!snapshot.active,
  );
  const list = useRef<HTMLOListElement>(null);
  const currentButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const container = list.current,
      button = currentButton.current;
    if (!container || !button) return;
    const bounds = container.getBoundingClientRect(),
      item = button.getBoundingClientRect();
    if (item.bottom > bounds.bottom)
      container.scrollTop += item.bottom - bounds.bottom + 8;
    else if (item.top < bounds.top)
      container.scrollTop -= bounds.top - item.top + 8;
  }, [current]);
  const controls = (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!ready || busy}
          onClick={() => {
            player.setReducedMotion(reduced);
            if (playback.cursor === sequence.moves.length)
              player.resetPlayback();
            player.play();
          }}
        >
          {playback.cursor === sequence.moves.length
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
        <Button
          variant="secondary"
          disabled={busy || playback.cursor === 0}
          onClick={() => {
            if (!ready) player.seekPlayback(playback.cursor - 1);
            else player.stepBackward();
          }}
        >
          Nước lùi
        </Button>
        <Button
          variant="secondary"
          disabled={busy || playback.cursor === sequence.moves.length}
          onClick={() => {
            if (!ready) player.seekPlayback(playback.cursor + 1);
            else player.stepForward();
          }}
        >
          Nước tiếp
        </Button>
        <Button variant="secondary" onClick={player.resetPlayback}>
          Về trạng thái mẫu
        </Button>
      </div>
      <p role="status" aria-label="Tiến độ minh họa">
        Đã xoay {playback.cursor}/{sequence.moves.length} nước.
      </p>
      <p role="status" aria-label="Nước hiện tại">
        {current === null
          ? "Chưa thực hiện nước nào."
          : `${snapshot.active ? "Đang xoay" : "Đã tới sau"} nước ${current + 1}: ${serializeAlgorithm([sequence.moves[current]])}${snapshot.active && playback.step === -1 ? " (đang hoàn tác)" : ""}.`}
      </p>
      <p className="text-sm text-muted">
        Lượt{" "}
        {Math.max(
          1,
          Math.min(
            settings.repeat,
            Math.ceil(
              (snapshot.active && current !== null
                ? current + 1
                : playback.cursor) / formula.moves.length,
            ),
          ),
        )}
        /{settings.repeat}. Tạm dừng cho nước đang xoay hoàn tất. Chọn vị trí sẽ
        dừng và đưa khối đến đúng sau nước đã chọn.
      </p>
      <label className="block font-semibold">
        Chọn vị trí trong chuỗi
        <input
          className="mt-3 block min-h-11 w-full accent-primary"
          type="range"
          min={0}
          max={sequence.moves.length}
          step={1}
          value={playback.cursor}
          aria-valuetext={`Sau ${playback.cursor}/${sequence.moves.length} nước`}
          onChange={(e) => player.seekPlayback(Number(e.target.value))}
        />
      </label>
      <ol
        ref={list}
        aria-label="Danh sách nước xoay"
        className="flex max-h-64 flex-wrap gap-2 overflow-y-auto rounded-xl border border-border p-3"
      >
        {sequence.moves.map((move, index) => (
          <li key={index}>
            <Button
              ref={index === current ? currentButton : undefined}
              variant="secondary"
              aria-current={index === current ? "step" : undefined}
              data-move-state={
                snapshot.active && index === current
                  ? "active"
                  : index < playback.cursor
                    ? "done"
                    : "pending"
              }
              className={
                index === current
                  ? "border-primary bg-surface-subtle text-primary"
                  : ""
              }
              aria-label={`Đến sau nước ${index + 1}: ${serializeAlgorithm([move])}`}
              onClick={() => player.seekPlayback(index + 1)}
            >
              <span className="text-xs text-muted">{index + 1}.</span>{" "}
              {serializeAlgorithm([move])}
              {index < playback.cursor ? (
                <>
                  <span aria-hidden="true"> ✓</span>
                  <span className="sr-only"> — Đã xong</span>
                </>
              ) : null}
            </Button>
          </li>
        ))}
      </ol>
    </div>
  );
  return (
    <>
      <CubeViewport
        state={snapshot.state}
        animation={snapshot.active}
        moveDurationMs={360 / settings.speed}
        onMoveComplete={player.complete}
        onMoveCancel={player.cancel}
        onReadyChange={setReady}
        fallbackText="Không hiển thị được 3D. Dùng danh sách nước và sơ đồ 2D bên dưới."
        fallback={
          <p role="status" className="p-6 text-muted">
            Không hiển thị được 3D. Bạn vẫn có thể chọn nước, xem sơ đồ 2D, copy
            và lưu dữ liệu. Tải lại trang để thử lại.
          </p>
        }
        moveControls={controls}
      />
      <details className="mt-5">
        <summary className="cursor-pointer py-3 font-semibold">
          Xem sơ đồ trạng thái mẫu 2D
        </summary>
        <h3 className="my-3 font-semibold">
          Trạng thái hiện tại sau các nước đã xong
        </h3>
        <StateDiagram state={snapshot.state} label="Trạng thái hiện tại" />
        <h3 className="my-3 font-semibold">Trạng thái mẫu trước khi phát</h3>
        <StateDiagram
          state={sequence.initial}
          label="Trạng thái mẫu trước công thức"
        />
      </details>
    </>
  );
}
