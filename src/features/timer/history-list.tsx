"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { createBrowserSolveHistory } from "./history-store";
import { PenaltyControl } from "./penalty-control";
import { formatDuration, formatResult, type Solve } from "./solve";
import { historyStatusText, undoText } from "./status-text";
const PAGE = 50;
const when = (solve: Solve) =>
  new Date(solve.timestamp).toLocaleString("vi-VN");
export function HistoryList() {
  const [history] = useState(createBrowserSolveHistory);
  const saved = useSyncExternalStore(
    history.subscribe,
    history.getSnapshot,
    history.getServerSnapshot,
  );
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    history.open();
    return () => history.close();
  }, [history]);
  const total = saved.solves.length,
    visible = saved.solves.slice(0, shown),
    // Attempt numbers count from the oldest solve so they stay put as new ones arrive.
    number = (i: number) => total - i,
    locked = !saved.writable;
  return (
    <div className="space-y-5">
      <section
        aria-label="Trạng thái lịch sử"
        className="space-y-3 rounded-panel border border-border bg-surface p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            role="status"
            aria-label="Số lượt trong lịch sử"
            className="font-semibold"
          >
            {saved.loaded ? `${total} lượt đã lưu` : "Đang đọc…"}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={!saved.undo || !saved.writable}
              onClick={() => history.undo()}
            >
              {saved.undo ? undoText(saved.undo) : "Hoàn tác"}
            </Button>
            <Link href="/timer" className="ui-button ui-button--primary">
              Về timer
            </Link>
          </div>
        </div>
        <p
          role="status"
          aria-label="Trạng thái lưu lịch sử"
          className="text-sm text-muted"
        >
          {historyStatusText(saved)}
        </p>
        {saved.legacy === "imported" && (
          <p className="text-sm">
            Đã chuyển {saved.imported} lượt từ bản lưu timer cũ sang lịch sử
            mới. Bản cũ vẫn được giữ nguyên làm dự phòng.
          </p>
        )}
        {saved.legacy === "invalid" && (
          <p className="text-sm text-warning">
            Bản lưu timer cũ không hợp lệ nên chưa được chuyển. Dữ liệu cũ chưa
            bị xóa.
          </p>
        )}
        {saved.skipped > 0 && (
          <p className="text-sm text-warning">
            Bỏ qua {saved.skipped} bản ghi lỗi trong lịch sử; chúng không bị
            xóa.
          </p>
        )}
        {saved.status === "unavailable" && saved.pending > 0 && (
          <Button variant="secondary" onClick={() => history.retry()}>
            Thử lưu lại
          </Button>
        )}
      </section>
      {!saved.loaded ? (
        <LoadingState label="Đang mở lịch sử…" />
      ) : total === 0 ? (
        <EmptyState
          title="Chưa có lượt giải"
          description="Bấm giờ một lượt ở trang Timer; kết quả sẽ xuất hiện ở đây và vẫn còn sau khi tải lại trang."
        />
      ) : (
        <>
          <table
            aria-label="Lịch sử solve"
            className="hidden w-full border-collapse overflow-hidden rounded-panel border border-border bg-surface text-left md:table"
          >
            <thead className="bg-surface-subtle text-sm">
              <tr>
                <th scope="col" className="p-3">
                  #
                </th>
                <th scope="col" className="p-3">
                  Kết quả
                </th>
                <th scope="col" className="p-3">
                  Penalty
                </th>
                <th scope="col" className="p-3">
                  Scramble
                </th>
                <th scope="col" className="p-3">
                  Thời điểm
                </th>
                <th scope="col" className="p-3">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((solve, i) => (
                <tr key={solve.id} className="border-t border-border align-top">
                  <th scope="row" className="p-3 font-mono">
                    {number(i)}
                  </th>
                  <td className="p-3">
                    <span className="font-mono text-lg font-bold">
                      {formatResult(solve)}
                    </span>
                    {solve.penalty !== "none" && (
                      <span className="block text-xs text-muted">
                        đo được {formatDuration(solve.durationMs)}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <PenaltyControl
                      label={`Penalty lượt ${number(i)}`}
                      value={solve.penalty}
                      disabled={locked}
                      onChange={(p) => history.setPenalty(solve.id, p)}
                    />
                  </td>
                  <td className="max-w-72 p-3 font-mono text-sm break-words">
                    {solve.scramble}
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap">
                    {when(solve)}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="danger"
                      aria-label={`Xóa lượt ${number(i)}`}
                      disabled={locked}
                      onClick={() => history.remove(solve.id)}
                    >
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ol aria-label="Lịch sử solve" className="space-y-3 md:hidden">
            {visible.map((solve, i) => (
              <li
                key={solve.id}
                aria-label={`Lượt ${number(i)}`}
                className="min-w-0 space-y-3 rounded-panel border border-border bg-surface p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-mono text-2xl font-bold">
                    {formatResult(solve)}
                  </p>
                  <p className="text-sm text-muted">#{number(i)}</p>
                </div>
                <p className="text-sm text-muted">
                  {solve.penalty !== "none" &&
                    `Đo được ${formatDuration(solve.durationMs)} · `}
                  {when(solve)}
                </p>
                <p className="font-mono text-sm break-words">
                  {solve.scramble}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <PenaltyControl
                    label={`Penalty lượt ${number(i)}`}
                    value={solve.penalty}
                    disabled={locked}
                    onChange={(p) => history.setPenalty(solve.id, p)}
                  />
                  <Button
                    variant="danger"
                    aria-label={`Xóa lượt ${number(i)}`}
                    disabled={locked}
                    onClick={() => history.remove(solve.id)}
                  >
                    Xóa
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          {shown < total && (
            <Button
              variant="secondary"
              onClick={() => setShown((n) => n + PAGE)}
            >
              Hiển thị thêm {Math.min(PAGE, total - shown)} lượt
            </Button>
          )}
        </>
      )}
      <p className="text-sm text-muted">
        +2 cộng 2 giây vào kết quả, DNF là không hoàn thành; thời gian đo gốc
        luôn được giữ để đổi lại. Xóa không hỏi xác nhận vì có thể hoàn tác ngay
        trong trang này. Hoàn tác chỉ áp dụng cho các thay đổi trong lần mở
        trang hiện tại.
      </p>
    </div>
  );
}
