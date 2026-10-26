"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { FACE_ORDER } from "../core/constants";
import { serializeAlgorithm } from "../core/notation";
import { isCubeSolved } from "../core/state";
import { CubeViewport } from "./cube-viewport";
import { createMoveQueuePlayer, MAX_QUEUE_MOVES } from "./move-queue";

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
  const [player] = useState(() => createMoveQueuePlayer());
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
  const [queueError, setQueueError] = useState("");
  useEffect(
    () => () => {
      player.cancel();
    },
    [player],
  );
  useEffect(() => {
    player.setReducedMotion(reducedMotion);
  }, [player, reducedMotion]);
  const outstanding = snapshot.pending.length + (snapshot.active ? 1 : 0);
  const addMove = () => {
    player.setReducedMotion(reducedMotion);
    setQueueError(
      player.enqueue([moves[moveIndex]])
        ? ""
        : `Hàng đợi đã đạt ${MAX_QUEUE_MOVES} nước. Hãy chờ hoặc hủy hàng đợi.`,
    );
  };
  const controls = (
    <section aria-label="Xoay từng mặt" className="mt-4 space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-24 flex-col gap-1 text-sm font-semibold">
          Nước xoay
          <select
            className="ui-input"
            value={moveIndex}
            disabled={!ready}
            onChange={(event) => setMoveIndex(Number(event.target.value))}
          >
            {moves.map((move, index) => (
              <option key={index} value={index}>
                {serializeAlgorithm([move])}
              </option>
            ))}
          </select>
        </label>
        <Button disabled={!ready} onClick={addMove}>
          Thêm vào hàng đợi
        </Button>
        <Button
          variant="secondary"
          disabled={!outstanding && !snapshot.paused}
          onClick={() => {
            player.cancel();
            setQueueError("");
          }}
        >
          Hủy hàng đợi
        </Button>
        <Button
          variant="secondary"
          disabled={!ready || (!outstanding && !snapshot.paused)}
          onClick={() => (snapshot.paused ? player.resume() : player.pause())}
        >
          {snapshot.paused ? "Tiếp tục hàng đợi" : "Dừng sau nước này"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            player.reset();
            setQueueError("");
          }}
        >
          Đặt lại khối
        </Button>
      </div>
      <p role="status" className="text-sm text-muted">
        {snapshot.active
          ? `Đang xoay ${serializeAlgorithm([snapshot.active.move])}. `
          : snapshot.paused
            ? "Hàng đợi đang dừng. "
            : "Sẵn sàng. "}
        Đã hoàn tất {snapshot.completed} nước. Còn chờ {snapshot.pending.length}{" "}
        nước.
        {snapshot.paused && snapshot.active
          ? " Sẽ dừng khi nước hiện tại hoàn tất."
          : ""}
        {!snapshot.active &&
          (isCubeSolved(snapshot.state)
            ? " Khối đang ở trạng thái solved."
            : " Khối đã thay đổi.")}
      </p>
      {queueError && outstanding >= MAX_QUEUE_MOVES && (
        <p role="alert" className="text-sm text-danger">
          {queueError}
        </p>
      )}
      {snapshot.pending.length > 0 && (
        <p
          aria-label="Các nước đang chờ"
          className="break-words text-sm text-muted"
        >
          {serializeAlgorithm(snapshot.pending.slice(0, 24))}
          {snapshot.pending.length > 24 ? " …" : ""}
        </p>
      )}
      <p className="text-sm text-muted">
        Dấu &apos; xoay ngược, số 2 xoay nửa vòng. Dừng sau nước này giữ phần
        chờ để tiếp tục. Hủy bỏ nước chưa commit và toàn bộ phần chờ; đặt lại
        khối trở về solved.
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
