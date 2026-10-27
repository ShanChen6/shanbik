"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { generatePracticeScramble } from "../cube/scramble/generate";
import { createTimer, INSPECTION_MS } from "./machine";
import { createBrowserSolveHistory } from "./history-store";
import { PenaltyControl } from "./penalty-control";
import { formatDuration, formatResult } from "./solve";
import { historyStatusText } from "./status-text";
export function TimerPanel() {
  const [history] = useState(createBrowserSolveHistory);
  const saved = useSyncExternalStore(
    history.subscribe,
    history.getSnapshot,
    history.getServerSnapshot,
  );
  const [timer] = useState(() =>
    createTimer({
      now: () => performance.now(),
      wallNow: () => Date.now(),
      newId: () => crypto.randomUUID(),
      onSolve: history.add,
    }),
  );
  const snapshot = useSyncExternalStore(
    timer.subscribe,
    timer.getSnapshot,
    timer.getServerSnapshot,
  );
  const [error, setError] = useState("");
  const lock = useRef<number | "keyboard" | null>(null);
  const action = (fn: () => unknown) => {
    try {
      setError("");
      fn();
    } catch {
      lock.current = null;
      timer.cancelPress();
      setError(
        "Chưa thực hiện được thao tác. Hãy thử lại trên trình duyệt hỗ trợ Web Crypto.",
      );
    }
  };
  const generate = () =>
    action(() => timer.prepare(generatePracticeScramble().notation));
  useEffect(() => {
    history.open();
    timer.open();
    if (!timer.getSnapshot().scramble) {
      try {
        timer.prepare(generatePracticeScramble().notation);
      } catch {
        /* The retry button stays available. */
      }
    }
    return () => {
      timer.close();
      history.close();
    };
  }, [history, timer]);
  const ticking =
    snapshot.phase === "inspection" ||
    snapshot.phase === "running" ||
    snapshot.pressed;
  useEffect(() => {
    if (!ticking) return;
    let frame = 0,
      alive = true;
    const tick = () => {
      if (!alive) return;
      timer.tick();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [timer, ticking]);
  useEffect(() => {
    const clear = () => {
      lock.current = null;
      timer.cancelPress();
    };
    window.addEventListener("blur", clear);
    return () => window.removeEventListener("blur", clear);
  }, [timer]);
  const busy =
    snapshot.phase === "inspection" ||
    snapshot.phase === "running" ||
    snapshot.pressed;
  const enabled = saved.loaded && !!snapshot.scramble;
  const phaseText =
    snapshot.phase === "running"
      ? "Đang tính giờ"
      : snapshot.phase === "inspection"
        ? "Đang quan sát"
        : snapshot.phase === "stopped"
          ? "Đã dừng"
          : "Sẵn sàng";
  const hint = snapshot.armed
    ? "Đã sẵn sàng — thả để bắt đầu."
    : snapshot.pressed
      ? "Giữ thêm để sẵn sàng…"
      : snapshot.phase === "running"
        ? "Nhấn Space hoặc chạm vùng timer để dừng và lưu."
        : snapshot.phase === "inspection"
          ? "Giữ rồi thả Space/chạm để bắt đầu tính giờ."
          : "Giữ Space/chạm 0,3 giây rồi thả để bắt đầu.";
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
      <section
        aria-label="Timer 3×3"
        className="min-w-0 space-y-5 rounded-panel border border-border bg-surface p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-heading">Lượt giải của bạn</h2>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={snapshot.inspectionEnabled}
              disabled={busy || !saved.loaded}
              onChange={(e) => timer.setInspection(e.target.checked)}
            />
            Quan sát 15 giây
          </label>
        </div>
        <div className="rounded-xl border border-border bg-surface-subtle p-4">
          <h3 className="font-semibold">Scramble 3×3</h3>
          <p
            aria-label="Scramble timer"
            className="mt-2 font-mono break-words whitespace-pre-wrap"
          >
            {snapshot.scramble || "Chọn Scramble mới để chuẩn bị."}
          </p>
          <Button
            className="mt-3"
            variant="secondary"
            disabled={busy || !saved.loaded}
            onClick={generate}
          >
            Scramble mới
          </Button>
          <p className="mt-3 text-xs text-muted">
            25 nước random-move để luyện tập, không phải scramble thi đấu chính
            thức. Áp dụng lên khối thật trước khi bấm giờ.
          </p>
        </div>
        <p
          role="status"
          aria-label="Trạng thái timer"
          className="font-semibold text-primary"
        >
          {phaseText}
          {snapshot.armed ? " · Đã sẵn sàng thả" : ""}
        </p>
        <button
          type="button"
          aria-label="Vùng bấm timer"
          aria-describedby="timer-hint"
          disabled={!enabled}
          className={`min-h-52 w-full touch-none rounded-panel border-2 p-4 select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${snapshot.armed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface-subtle text-foreground"}`}
          onClick={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.code !== "Space") return;
            e.preventDefault();
            if (e.repeat || lock.current !== null) return;
            lock.current = "keyboard";
            action(timer.press);
          }}
          onKeyUp={(e) => {
            if (e.code !== "Space") return;
            e.preventDefault();
            if (lock.current !== "keyboard") return;
            lock.current = null;
            action(timer.release);
          }}
          onBlur={() => {
            lock.current = null;
            timer.cancelPress();
          }}
          onPointerDown={(e) => {
            if (!e.isPrimary || e.button !== 0 || lock.current !== null) return;
            e.preventDefault();
            lock.current = e.pointerId;
            e.currentTarget.focus();
            e.currentTarget.setPointerCapture(e.pointerId);
            action(timer.press);
          }}
          onPointerUp={(e) => {
            if (lock.current !== e.pointerId) return;
            e.preventDefault();
            lock.current = null;
            action(timer.release);
          }}
          onPointerCancel={() => {
            lock.current = null;
            timer.cancelPress();
          }}
          onLostPointerCapture={() => {
            lock.current = null;
            timer.cancelPress();
          }}
        >
          <span
            role="timer"
            aria-live="off"
            aria-label="Thời gian hiện tại"
            className="block font-mono text-[clamp(2.5rem,12vw,7rem)] leading-tight font-bold break-all tabular-nums"
          >
            {snapshot.phase === "inspection"
              ? Math.max(0, 15 - Math.floor(snapshot.inspectionMs / 1000))
              : formatDuration(snapshot.elapsedMs)}
          </span>
          <span className="mt-3 block text-sm">
            {snapshot.phase === "inspection"
              ? "giây quan sát"
              : "hiển thị đến 0,01 giây"}
          </span>
        </button>
        <p id="timer-hint" className="text-sm text-muted">
          {hint} Space chỉ hoạt động khi vùng timer đang có focus; không bắt
          phím khi bạn nhập liệu hoặc dùng menu.
        </p>
        {snapshot.phase === "inspection" &&
          snapshot.inspectionMs >= INSPECTION_MS && (
            <p role="status" className="font-semibold text-accent">
              Đã qua 15 giây quan sát. Timer vẫn chờ bạn bắt đầu; chưa tự áp
              dụng +2 hoặc DNF.
            </p>
          )}
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={
              !enabled || snapshot.pressed || snapshot.phase === "running"
            }
            onClick={() => action(timer.start)}
          >
            {snapshot.phase === "inspection" || !snapshot.inspectionEnabled
              ? "Bắt đầu tính giờ"
              : "Bắt đầu quan sát"}
          </Button>
          <Button
            variant="secondary"
            disabled={snapshot.phase !== "running"}
            onClick={() => action(timer.stop)}
          >
            Dừng và lưu
          </Button>
          <Button
            variant="secondary"
            disabled={!busy || snapshot.phase === "stopped"}
            onClick={() => {
              lock.current = null;
              timer.cancel();
            }}
          >
            Hủy lượt
          </Button>
        </div>
        <p className="text-sm text-muted">
          Các nút Bắt đầu/Dừng là cách thay thế không cần giữ. Hủy hoặc rời
          trang khi chưa dừng sẽ không ghi lượt giải. Đổi tab không dừng đồng
          hồ; khi quay lại, thời gian vẫn bao gồm khoảng đã trôi qua.
        </p>
        {error && (
          <p role="alert" className="text-warning">
            {error}
          </p>
        )}
        {snapshot.result && (
          <section
            aria-label="Kết quả vừa dừng"
            className="space-y-2 rounded-xl border border-border p-4"
          >
            <h3 className="font-semibold">Kết quả vừa dừng</h3>
            <p className="font-mono text-3xl font-bold">
              {formatDuration(snapshot.result.durationMs)}
            </p>
            <p className="text-sm text-muted">
              {snapshot.result.durationMs} ms · 3×3 ·{" "}
              {new Date(snapshot.result.timestamp).toLocaleString("vi-VN")}
            </p>
            <p className="font-mono text-sm break-words">
              {snapshot.result.scramble}
            </p>
          </section>
        )}
      </section>
      <aside
        aria-label="Lưu kết quả timer"
        className="min-w-0 space-y-4 rounded-panel border border-border bg-surface p-5"
      >
        <h2 className="text-heading">Kết quả local</h2>
        <p role="status" aria-label="Số lượt giải">
          {saved.solves.length} lượt trong bộ nhớ hiện tại.
        </p>
        <p
          role="status"
          aria-label="Trạng thái lưu timer"
          className="text-sm text-muted"
        >
          {historyStatusText(saved)}
        </p>
        {saved.solves[0] && (
          <section
            aria-label="Lượt gần nhất"
            className="space-y-2 rounded-xl border border-border p-4"
          >
            <h3 className="font-semibold">Lượt gần nhất trong bộ nhớ</h3>
            <p className="font-mono text-3xl font-bold">
              {formatResult(saved.solves[0])}
            </p>
            {saved.solves[0].penalty !== "none" && (
              <p className="text-sm text-muted">
                Đo được {formatDuration(saved.solves[0].durationMs)}
              </p>
            )}
            <PenaltyControl
              label="Penalty lượt gần nhất"
              value={saved.solves[0].penalty}
              disabled={!saved.writable || busy || saved.pending > 0}
              onChange={(p) => history.setPenalty(saved.solves[0].id, p)}
            />
            <p className="text-sm text-muted">
              3×3 ·{" "}
              {new Date(saved.solves[0].timestamp).toLocaleString("vi-VN")}
            </p>
            <p className="font-mono text-xs break-words">
              {saved.solves[0].scramble}
            </p>
          </section>
        )}
        <Button
          variant="secondary"
          disabled={saved.status !== "unavailable" || !saved.pending}
          onClick={() => history.retry()}
        >
          Thử lưu lại
        </Button>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/timer/history"
            className="ui-button ui-button--secondary"
          >
            Xem lịch sử solve
          </Link>
          <Link href="/timer/stats" className="ui-button ui-button--secondary">
            Thống kê
          </Link>
        </div>
        <p className="text-sm text-muted">
          Mỗi lượt lưu thời gian, scramble, puzzle, thời điểm dừng và penalty.
          Bấm dừng nhiều lần không ghi trùng. Chọn +2/DNF cho lượt vừa giải ở
          đây, hoặc sửa, xóa và hoàn tác trong lịch sử. Thống kê có best, mean,
          Ao5, Ao12 và biểu đồ xu hướng.
        </p>
      </aside>
    </div>
  );
}
