"use client";
import { useEffect, useRef, useState } from "react";
import { formatDuration, formatResult, resultMs, type Solve } from "./solve";
import type { Stat } from "./stats";
export const CHART_LIMIT = 200;
const M = { top: 32, right: 16, bottom: 32, left: 52 },
  HEIGHT = 280;
export const formatStat = (s: Stat) =>
  s === null ? "—" : s === "DNF" ? "DNF" : formatDuration(s);
/** Round tick steps in ms (1-2-5 series) giving at most ~5 gridlines. */
function ticks(min: number, max: number): number[] {
  const span = Math.max(max - min, 100),
    raw = span / 4,
    mag = 10 ** Math.floor(Math.log10(raw)),
    step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!,
    out: number[] = [];
  // Ticks always enclose the data: first ≤ min, last ≥ max.
  let v = Math.floor(min / step) * step;
  do {
    out.push(v);
    v += step;
  } while (out.length < 2 || out.at(-1)! < max);
  return out;
}
export function TrendChart({
  solves,
  ao5,
  offset,
}: {
  /** Chronological solves to plot. */
  solves: readonly Solve[];
  ao5: readonly Stat[];
  /** Attempt number of the first plotted solve, minus one. */
  offset: number;
}) {
  const box = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(0),
    [active, setActive] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWidth(Math.floor(el.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const n = solves.length,
    values = [
      ...solves.map(resultMs),
      ...ao5.map((s) => (typeof s === "number" ? s : null)),
    ].filter((v): v is number => v !== null),
    yTicks = values.length
      ? ticks(Math.min(...values), Math.max(...values))
      : [0, 1000],
    y0 = yTicks[0],
    y1 = yTicks.at(-1)!,
    plotW = Math.max(width - M.left - M.right, 1),
    plotH = HEIGHT - M.top - M.bottom,
    x = (i: number) => M.left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW),
    y = (ms: number) => M.top + plotH - ((ms - y0) / (y1 - y0 || 1)) * plotH,
    xTicks = [
      ...new Set([0, Math.round((n - 1) / 2), n - 1].filter((i) => i >= 0)),
    ];
  // Ao5 as separate line segments so unavailable/DNF averages leave gaps.
  const segments: string[] = [];
  let current = "";
  ao5.forEach((s, i) => {
    if (typeof s === "number")
      current += `${current ? "L" : "M"}${x(i).toFixed(1)},${y(s).toFixed(1)}`;
    else if (current) {
      segments.push(current);
      current = "";
    }
  });
  if (current) segments.push(current);
  const pick = (clientX: number) => {
    const rect = box.current!.getBoundingClientRect(),
      i = Math.round(((clientX - rect.left - M.left) / plotW) * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, n === 1 ? 0 : i)));
  };
  const tip = active !== null && active < n ? active : null;
  return (
    <div className="space-y-3">
      <ul
        aria-label="Chú giải biểu đồ"
        className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
      >
        <li className="flex items-center gap-2">
          <svg width="12" height="12" aria-hidden="true">
            <circle cx="6" cy="6" r="4" className="fill-chart-1" />
          </svg>
          Từng lượt
        </li>
        <li className="flex items-center gap-2">
          <svg width="20" height="12" aria-hidden="true">
            <line
              x1="0"
              x2="20"
              y1="6"
              y2="6"
              strokeWidth="2"
              className="stroke-chart-2"
            />
          </svg>
          Ao5
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="font-bold text-muted">
            ×
          </span>
          DNF (đặt ở mép trên)
        </li>
      </ul>
      <div ref={box} className="relative w-full">
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            tabIndex={0}
            aria-label={`Biểu đồ ${n} lượt gần nhất theo thứ tự thời gian. Dùng phím mũi tên để xem từng lượt; bảng dữ liệu bên dưới có cùng số liệu.`}
            className="block touch-pan-y rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onPointerMove={(e) => pick(e.clientX)}
            onPointerDown={(e) => pick(e.clientX)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              const step =
                e.key === "ArrowRight"
                  ? 1
                  : e.key === "ArrowLeft"
                    ? -1
                    : e.key === "End"
                      ? n
                      : e.key === "Home"
                        ? -n
                        : 0;
              if (!step) return;
              e.preventDefault();
              setActive((a) =>
                Math.min(
                  n - 1,
                  Math.max(0, (a ?? n - 1) + (a === null ? 0 : step)),
                ),
              );
            }}
          >
            {yTicks.map((t) => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={M.left + plotW}
                  y1={y(t)}
                  y2={y(t)}
                  className="stroke-chart-grid"
                  strokeWidth="1"
                />
                <text
                  x={M.left - 8}
                  y={y(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted text-xs tabular-nums"
                >
                  {formatDuration(t)}
                </text>
              </g>
            ))}
            {xTicks.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={HEIGHT - 10}
                textAnchor={
                  i === 0 && n > 1
                    ? "start"
                    : i === n - 1 && n > 1
                      ? "end"
                      : "middle"
                }
                className="fill-muted text-xs tabular-nums"
              >
                #{offset + i + 1}
              </text>
            ))}
            {tip !== null && (
              <line
                x1={x(tip)}
                x2={x(tip)}
                y1={M.top}
                y2={M.top + plotH}
                className="stroke-muted"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}
            {segments.map((d) => (
              <path
                key={d}
                d={d}
                fill="none"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="stroke-chart-2"
              />
            ))}
            {solves.map((s, i) => {
              const ms = resultMs(s);
              return ms === null ? (
                <text
                  key={s.id}
                  x={x(i)}
                  y={M.top - 14}
                  textAnchor="middle"
                  className="fill-muted text-sm font-bold"
                >
                  ×
                </text>
              ) : (
                <circle
                  key={s.id}
                  cx={x(i)}
                  cy={y(ms)}
                  r={tip === i ? 6 : 4}
                  strokeWidth="2"
                  className="fill-chart-1 stroke-surface"
                />
              );
            })}
          </svg>
        )}
        {tip !== null && width > 0 && (
          <div
            role="status"
            aria-label="Chi tiết lượt trên biểu đồ"
            className="pointer-events-none absolute top-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-[var(--shadow-panel)]"
            style={
              x(tip) > width / 2
                ? { right: width - x(tip) + 12 }
                : { left: x(tip) + 12 }
            }
          >
            <p className="font-semibold">Lượt #{offset + tip + 1}</p>
            <p className="tabular-nums">
              Kết quả: <strong>{formatResult(solves[tip])}</strong>
            </p>
            <p className="tabular-nums">Ao5: {formatStat(ao5[tip])}</p>
          </div>
        )}
      </div>
    </div>
  );
}
