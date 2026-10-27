"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { canCaptureModel, captureModel, modelStatus } from "../practice/flow";
import { createSolverController } from "../solver/controller";
import { loadSolution } from "../solver/load-solution";
import { Button } from "@/components/ui/button";
import { FaceInputPanel } from "../face-input/face-input-panel";
import { FACE_ORDER } from "../core/constants";
import { serializeAlgorithm, type CubeAlgorithm } from "../core/notation";
import { isCubeSolved } from "../core/state";
import { AlgorithmPanel } from "../algorithm-input/algorithm-panel";
import { ScramblePanel } from "../scramble/scramble-panel";
import { PlaybackControls } from "./playback-controls";
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
  const [solver] = useState(() =>
    createSolverController({
      createWorker: () =>
        new Worker("/solver-worker/solver.worker.js", { type: "module" }),
    }),
  );
  useEffect(() => {
    let previous = player.getSnapshot();
    return player.subscribe(() => {
      const next = player.getSnapshot();
      if (
        next.state !== previous.state ||
        next.playback !== previous.playback ||
        next.active !== previous.active
      )
        solver.invalidate();
      previous = next;
    });
  }, [player, solver]);
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
  const [sessionRevision, setSessionRevision] = useState(0);
  const [sessionNotice, setSessionNotice] = useState("");
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
  const loadScramble = (batch: CubeAlgorithm, autoplay = false) => {
    const current = player.getSnapshot();
    if (
      !ready ||
      current.active ||
      current.pending.length ||
      current.paused ||
      current.playback
    )
      return false;
    player.setReducedMotion(reducedMotion);
    if (!player.loadSequence(batch)) return false;
    if (autoplay) player.play();
    return true;
  };
  const controls = (
    <>
      <PlaybackControls
        player={player}
        snapshot={snapshot}
        ready={ready}
        reducedMotion={reducedMotion}
      />
      <AlgorithmPanel
        key={`algorithm-${sessionRevision}`}
        ready={ready}
        play={(batch) => {
          if (!ready) return false;
          player.setReducedMotion(reducedMotion);
          if (!player.loadSequence(batch)) return false;
          setQueueError("");
          return player.play();
        }}
      />
      <ScramblePanel
        key={`scramble-${sessionRevision}`}
        canApply={
          ready && !outstanding && !snapshot.paused && !snapshot.playback
        }
        enqueue={(batch) => loadScramble(batch, true)}
        load={(batch) => loadScramble(batch)}
      />
      {!snapshot.playback && (
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
              onClick={() =>
                snapshot.paused ? player.resume() : player.pause()
              }
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
            Đã hoàn tất {snapshot.completed} nước. Còn chờ{" "}
            {snapshot.pending.length} nước.
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
            Dấu &apos; xoay ngược, số 2 xoay nửa vòng. Dừng sau nước này giữ
            phần chờ để tiếp tục. Hủy bỏ nước chưa commit và toàn bộ phần chờ;
            đặt lại khối trở về solved.
          </p>
        </section>
      )}
    </>
  );
  return (
    <>
      <section
        aria-label="Luồng luyện tập"
        className="mb-6 space-y-3 rounded-panel border border-border p-4"
      >
        <h3 className="text-lg font-semibold">Buổi luyện tập 3×3</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Tạo và áp dụng scramble; chờ phát xong hoặc tạm dừng.</li>
          <li>
            Lấy màu từ mô hình ở phần nhập bên dưới, hoặc nhập khối thật bằng
            tay.
          </li>
          <li>Giải bản nhập, nạp lời giải rồi phát hoặc tiến/lùi từng bước.</li>
          <li>
            Về đầu chuỗi để xem lại; bắt đầu lại buổi tập để xóa dữ liệu phiên.
          </li>
        </ol>
        <p role="status" aria-label="Trạng thái mô hình" className="text-sm">
          {modelStatus(snapshot)}
        </p>
        {!ready && (
          <p className="text-sm text-muted">
            3D chưa sẵn sàng. Nhập màu và tìm lời giải vẫn sử dụng được; lấy màu
            và nạp vào player cần mô hình sẵn sàng.
          </p>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            solver.release();
            player.reset();
            setQueueError("");
            setSessionRevision((value) => value + 1);
            setSessionNotice(
              "Đã bắt đầu buổi tập mới: khối solved, bản nhập trống, đã xóa scramble, thuật toán, lịch sử và lời giải trong phiên.",
            );
          }}
        >
          Bắt đầu lại buổi tập
        </Button>
        <p className="text-sm text-muted">
          Thao tác này xóa bản nhập màu, scramble, thuật toán, lịch sử và lời
          giải hiện tại.
        </p>
        {sessionNotice && (
          <p role="status" className="text-sm text-muted">
            {sessionNotice}
          </p>
        )}
      </section>
      <CubeViewport
        state={snapshot.state}
        animation={snapshot.active}
        onMoveComplete={player.complete}
        onMoveCancel={player.cancel}
        onReadyChange={setReady}
        moveControls={controls}
      />
      <FaceInputPanel
        key={`input-${sessionRevision}`}
        canCapture={canCaptureModel(snapshot, ready)}
        capture={() => captureModel(player, ready)}
        solver={solver}
        canLoad={ready}
        onLoad={(solution) => {
          if (!ready || solver.getSnapshot().result !== solution) return false;
          const loaded = loadSolution(player, solution);
          if (loaded) setQueueError("");
          return loaded;
        }}
      />
    </>
  );
}
