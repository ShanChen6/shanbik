"use client";
import { Button } from "@/components/ui/button";
import { serializeAlgorithm } from "../core/notation";
import type { createMoveQueuePlayer, MoveSnapshot } from "./move-queue";

export function PlaybackControls({
  player,
  snapshot,
  ready,
  reducedMotion,
}: {
  player: ReturnType<typeof createMoveQueuePlayer>;
  snapshot: MoveSnapshot;
  ready: boolean;
  reducedMotion: boolean;
}) {
  const playback = snapshot.playback;
  if (!playback) return null;
  const activeIndex = snapshot.active
    ? playback.cursor + (playback.step === -1 ? -1 : 0)
    : playback.cursor;
  const busy = !!snapshot.active || playback.playing;
  const run = (command: () => unknown) => {
    player.setReducedMotion(reducedMotion);
    command();
  };
  return (
    <section
      aria-label="Player chuỗi"
      className="mt-4 space-y-3 rounded-panel border border-border p-4"
    >
      <h3 className="text-lg font-semibold">Phát từng bước</h3>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Điều khiển player"
      >
        <Button
          disabled={!ready || busy || playback.cursor === playback.moves.length}
          onClick={() => run(player.play)}
        >
          Phát chuỗi
        </Button>
        <Button
          variant="secondary"
          disabled={!playback.playing}
          onClick={() => player.pausePlayback()}
        >
          Tạm dừng phát
        </Button>
        <Button
          variant="secondary"
          disabled={!ready || busy || playback.cursor === playback.moves.length}
          onClick={() => run(player.stepForward)}
        >
          Bước tiếp
        </Button>
        <Button
          variant="secondary"
          disabled={!ready || busy || playback.cursor === 0}
          onClick={() => run(player.stepBackward)}
        >
          Bước lùi
        </Button>
        <Button variant="secondary" onClick={() => player.resetPlayback()}>
          Về đầu chuỗi
        </Button>
        <Button variant="secondary" onClick={() => player.exitPlayback()}>
          Thoát chuỗi
        </Button>
        <Button variant="secondary" onClick={() => player.reset()}>
          Đặt lại khối
        </Button>
      </div>
      <p role="status" className="text-sm text-muted">
        Đã thực hiện {playback.cursor}/{playback.moves.length} bước.
        {snapshot.active
          ? ` Đang ${playback.step === -1 ? "lùi" : "xoay"} bước ${activeIndex + 1}.`
          : playback.playing
            ? " Đang phát."
            : " Đang dừng."}
      </p>
      <ol
        aria-label="Các bước của chuỗi"
        className="flex flex-wrap gap-2 text-sm"
      >
        {playback.moves.map((move, index) => {
          const current = index === activeIndex;
          return (
            <li
              key={index}
              aria-current={current ? "step" : undefined}
              data-state={
                current
                  ? snapshot.active
                    ? "active"
                    : "next"
                  : index < playback.cursor
                    ? "done"
                    : "pending"
              }
              className={`rounded-sm border px-2 py-1 ${current ? "border-accent font-semibold text-accent" : "border-border text-muted"}`}
            >
              {index + 1}. {serializeAlgorithm([move])}
            </li>
          );
        })}
      </ol>
      {!playback.moves.length && (
        <p className="text-sm text-muted">Chuỗi rỗng. Không có bước để phát.</p>
      )}
      <p className="text-sm text-muted">
        Tạm dừng hoàn tất nước đang chạy rồi dừng. Về đầu chuỗi khôi phục khối
        lúc nạp; Đặt lại khối trở về solved. Thoát chuỗi giữ các bước đã hoàn
        tất để xoay tự do.
      </p>
    </section>
  );
}
