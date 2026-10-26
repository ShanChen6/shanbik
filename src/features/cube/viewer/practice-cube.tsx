"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { FACE_ORDER } from "../core/constants";
import { serializeAlgorithm } from "../core/notation";
import { isCubeSolved } from "../core/state";
import { CubeViewport } from "./cube-viewport";
import { createSingleMovePlayer } from "./single-move";

const subscribeMotion = (notify: () => void) => {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const moves = FACE_ORDER.flatMap((face) =>
  ([1, -1, 2] as const).map((turns) => ({ face, turns })),
);
const getMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function PracticeCube() {
  const [player] = useState(() => createSingleMovePlayer());
  const snapshot = useSyncExternalStore(
    player.subscribe,
    player.getSnapshot,
    player.getServerSnapshot,
  );
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotion,
    () => true,
  );
  const [moveIndex, setMoveIndex] = useState(3);
  const [ready, setReady] = useState(false);
  useEffect(
    () => () => {
      player.cancel();
    },
    [player],
  );
  useEffect(() => {
    if (reducedMotion && snapshot.active) player.complete(snapshot.active.id);
  }, [player, reducedMotion, snapshot.active]);
  const controls = (
    <section aria-label="Xoay từng mặt" className="mt-4 space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-24 flex-col gap-1 text-sm font-semibold">
          Nước xoay
          <select
            className="ui-input"
            value={moveIndex}
            disabled={!ready || !!snapshot.active}
            onChange={(event) => setMoveIndex(Number(event.target.value))}
          >
            {moves.map((move, index) => (
              <option key={index} value={index}>
                {serializeAlgorithm([move])}
              </option>
            ))}
          </select>
        </label>
        <Button
          disabled={!ready || !!snapshot.active}
          onClick={() => player.start(moves[moveIndex], reducedMotion)}
        >
          Xoay một nước
        </Button>
        <Button
          variant="secondary"
          disabled={!snapshot.active}
          onClick={() => player.cancel()}
        >
          Hủy nước đang xoay
        </Button>
        <Button variant="secondary" onClick={() => player.reset()}>
          Đặt lại khối
        </Button>
      </div>
      <p role="status" className="text-sm text-muted">
        {snapshot.active
          ? `Đang xoay ${serializeAlgorithm([snapshot.active.move])}…`
          : `Đã hoàn tất ${snapshot.completed} nước. ${isCubeSolved(snapshot.state) ? "Khối đang ở trạng thái solved." : "Khối đã thay đổi."}`}
      </p>
      <p className="text-sm text-muted">
        Dấu &apos; xoay ngược, số 2 xoay nửa vòng. Hủy giữ trạng thái trước nước
        đang chạy; đặt lại khối trở về solved.
      </p>
    </section>
  );
  return (
    <CubeViewport
      state={snapshot.state}
      animation={snapshot.active}
      onMoveComplete={player.complete}
      onMoveCancel={player.cancel}
      onReadyChange={setReady}
      moveControls={controls}
    />
  );
}
