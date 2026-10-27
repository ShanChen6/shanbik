import { parseDate } from "./time";
const two = (n: number) => String(n).padStart(2, "0");
/** Venue calendar dates, e.g. "07–08/11/2026" or "30/11 – 01/12/2026". */
export function formatDateRange(start: string, end: string): string {
  const [y1, m1, d1] = parseDate(start)!,
    [y2, m2, d2] = parseDate(end)!;
  if (start === end) return `${two(d1)}/${two(m1)}/${y1}`;
  if (y1 === y2 && m1 === m2) return `${two(d1)}–${two(d2)}/${two(m1)}/${y1}`;
  if (y1 === y2) return `${two(d1)}/${two(m1)} – ${two(d2)}/${two(m2)}/${y1}`;
  return `${two(d1)}/${two(m1)}/${y1} – ${two(d2)}/${two(m2)}/${y2}`;
}
/** Weekday and date of a venue calendar date, without time-zone shifts. */
export function formatLocalDay(date: string): string {
  const [y, m, d] = parseDate(date)!;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(Date.UTC(y, m - 1, d));
}
/** An instant shown in `zone` (venue, UTC or the viewer's zone). */
export function formatInstant(ms: number, zone?: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: zone,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(ms);
}
export const viewerZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;
