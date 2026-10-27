"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { createBrowserSolveHistory } from "./history-store";
import { formatResult } from "./solve";
import {
  chronological,
  rollingAverages,
  sessionKey,
  sessions,
  summarize,
  type Stat,
} from "./stats";
import { historyStatusText } from "./status-text";
import { CHART_LIMIT, formatStat, TrendChart } from "./trend-chart";
const ALL = "all";
const dayLabel = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
};
function Tile({
  label,
  value,
  detail,
}: {
  label: string;
  value: Stat | string;
  detail?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-bold tabular-nums">
        {typeof value === "string" && value !== "DNF"
          ? value
          : formatStat(value as Stat)}
      </dd>
      {detail && <dd className="mt-1 text-xs text-muted">{detail}</dd>}
    </div>
  );
}
export function StatsDashboard() {
  const [history] = useState(createBrowserSolveHistory);
  const saved = useSyncExternalStore(
    history.subscribe,
    history.getSnapshot,
    history.getServerSnapshot,
  );
  const [session, setSession] = useState(ALL);
  useEffect(() => {
    history.open();
    return () => history.close();
  }, [history]);
  const days = useMemo(() => sessions(saved.solves), [saved.solves]);
  // A session deleted elsewhere falls back to all solves instead of an empty view.
  const selected = days.some((d) => d.key === session) ? session : ALL;
  const view = useMemo(() => {
    const ordered = chronological(
      selected === ALL
        ? saved.solves
        : saved.solves.filter((s) => sessionKey(s.timestamp) === selected),
    );
    return {
      ordered,
      summary: summarize(ordered),
      ao5: rollingAverages(ordered, 5),
      ao12: rollingAverages(ordered, 12),
    };
  }, [saved.solves, selected]);
  const { ordered, summary, ao5, ao12 } = view,
    start = Math.max(0, ordered.length - CHART_LIMIT),
    when = (ts: number) => new Date(ts).toLocaleString("vi-VN");
  return (
    <div className="space-y-6">
      <section
        aria-label="Bộ lọc thống kê"
        className="flex flex-wrap items-end gap-4 rounded-panel border border-border bg-surface p-4 sm:p-5"
      >
        <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold">
          Puzzle
          <select
            className="ui-input min-h-11"
            defaultValue="3x3"
            aria-describedby="puzzle-note"
          >
            <option value="3x3">3×3</option>
          </select>
          <span id="puzzle-note" className="text-xs font-normal text-muted">
            Timer hiện chỉ hỗ trợ 3×3
          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold">
          Phiên (ngày luyện tập)
          <select
            className="ui-input min-h-11"
            value={selected}
            disabled={!saved.loaded || !days.length}
            onChange={(e) => setSession(e.target.value)}
          >
            <option value={ALL}>Tất cả ({saved.solves.length} lượt)</option>
            {days.map((d) => (
              <option key={d.key} value={d.key}>
                {dayLabel(d.key)} ({d.count} lượt)
              </option>
            ))}
          </select>
        </label>
        <Link href="/timer/history" className="ui-button ui-button--secondary">
          Lịch sử solve
        </Link>
        <p
          role="status"
          aria-label="Trạng thái dữ liệu thống kê"
          className="basis-full text-sm text-muted"
        >
          {historyStatusText(saved)}
        </p>
      </section>
      {!saved.loaded ? (
        <LoadingState label="Đang đọc lịch sử…" />
      ) : !ordered.length ? (
        <EmptyState
          title="Chưa có dữ liệu thống kê"
          description="Bấm giờ vài lượt ở trang Timer. Ao5 cần 5 lượt, Ao12 cần 12 lượt."
        />
      ) : (
        <>
          <section aria-label="Số liệu chính">
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile
                label="Số lượt"
                value={String(summary.count)}
                detail={`${summary.dnf} DNF · ${summary.plusTwo} lượt +2`}
              />
              <Tile label="Tốt nhất" value={summary.best} />
              <Tile
                label="Trung bình"
                value={summary.mean}
                detail="Các lượt hoàn thành, không tính DNF"
              />
              <Tile
                label="Trung bình phiên"
                value={summary.sessionAverage}
                detail="Bỏ 5% tốt nhất và kém nhất; cần ≥ 3 lượt"
              />
              <Tile label="Ao5 hiện tại" value={summary.ao5} />
              <Tile label="Ao5 tốt nhất" value={summary.bestAo5} />
              <Tile label="Ao12 hiện tại" value={summary.ao12} />
              <Tile label="Ao12 tốt nhất" value={summary.bestAo12} />
            </dl>
          </section>
          <section
            aria-labelledby="trend-title"
            className="min-w-0 space-y-3 rounded-panel border border-border bg-surface p-4 sm:p-5"
          >
            <h2 id="trend-title" className="text-heading">
              Xu hướng kết quả
            </h2>
            <p className="text-sm text-muted">
              Thời gian (giây) theo thứ tự lượt; thấp hơn là nhanh hơn.
              {start > 0 &&
                ` Biểu đồ hiển thị ${CHART_LIMIT} lượt gần nhất; bảng có đủ ${ordered.length} lượt.`}
            </p>
            <TrendChart
              solves={ordered.slice(start)}
              ao5={ao5.slice(start)}
              offset={start}
            />
          </section>
          <details className="rounded-panel border border-border bg-surface p-4 sm:p-5">
            <summary className="min-h-11 cursor-pointer font-semibold">
              Bảng dữ liệu thay cho biểu đồ ({ordered.length} lượt)
            </summary>
            <div className="mt-3 max-h-[32rem] overflow-auto">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">
                  Kết quả, Ao5 và Ao12 tại từng lượt
                </caption>
                <thead className="sticky top-0 bg-surface-subtle">
                  <tr>
                    <th scope="col" className="p-2">
                      #
                    </th>
                    <th scope="col" className="p-2">
                      Kết quả
                    </th>
                    <th scope="col" className="p-2">
                      Ao5
                    </th>
                    <th scope="col" className="p-2">
                      Ao12
                    </th>
                    <th scope="col" className="hidden p-2 sm:table-cell">
                      Thời điểm
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((s, i) => (
                    <tr key={s.id} className="border-t border-border">
                      <th scope="row" className="p-2 font-mono">
                        {i + 1}
                      </th>
                      <td className="p-2 font-mono">{formatResult(s)}</td>
                      <td className="p-2 font-mono">{formatStat(ao5[i])}</td>
                      <td className="p-2 font-mono">{formatStat(ao12[i])}</td>
                      <td className="hidden p-2 sm:table-cell">
                        {when(s.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
      <p className="text-sm text-muted">
        +2 cộng 2 giây, DNF tính là kém nhất. Ao5/Ao12 bỏ một lượt tốt nhất và
        một lượt kém nhất; có từ hai DNF trở lên thì là DNF. Trung bình được làm
        tròn đến 0,01 giây. Phiên là các lượt trong cùng một ngày theo giờ máy
        của bạn.
      </p>
    </div>
  );
}
