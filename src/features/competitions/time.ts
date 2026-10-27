/**
 * Wall-clock ↔ instant conversion for IANA zones with Intl only. Event data
 * stores local dates/times plus the venue zone; UTC instants are derived,
 * never typed by hand, so a schedule cannot silently drift by an offset.
 */
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function isTimeZone(zone: unknown): zone is string {
  if (
    typeof zone !== "string" ||
    !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$|^UTC$/.test(zone)
  )
    return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
export function parseDate(value: unknown): [number, number, number] | null {
  if (typeof value !== "string") return null;
  const m = DATE.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(y, mo - 1, d));
  return check.getUTCFullYear() === y &&
    check.getUTCMonth() === mo - 1 &&
    check.getUTCDate() === d
    ? [y, mo, d]
    : null;
}
export const isTime = (value: unknown): value is string =>
  typeof value === "string" && TIME.test(value);
/** Offset of `zone` at instant `ms`, in minutes east of UTC. */
export function offsetMinutes(zone: string, ms: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(ms)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}
/**
 * UTC instant of a local wall time in `zone`. Throws for times that do not
 * exist (spring-forward gap); for repeated times (fall-back) the earlier
 * instant is used, matching how organisers usually mean it.
 */
export function zonedToUtc(date: string, time: string, zone: string): number {
  const d = parseDate(date);
  if (!d || !isTime(time) || !isTimeZone(zone))
    throw Error("Invalid local time");
  const [h, mi] = time.split(":").map(Number);
  const naive = Date.UTC(d[0], d[1] - 1, d[2], h, mi);
  const candidates = [
    naive - offsetMinutes(zone, naive - 14 * 3600000) * 60000,
    naive - offsetMinutes(zone, naive + 14 * 3600000) * 60000,
  ]
    .filter((ms) => naive - offsetMinutes(zone, ms) * 60000 === ms)
    .sort((a, b) => a - b);
  if (!candidates.length) throw Error("Nonexistent local time");
  return candidates[0];
}
/** "UTC+09:00" style label for the zone's offset at `ms`. */
export function offsetLabel(zone: string, ms: number): string {
  const m = offsetMinutes(zone, ms),
    sign = m < 0 ? "−" : "+",
    abs = Math.abs(m);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}
/** Start of the given local calendar day in `zone`, as a UTC instant. */
export const startOfLocalDay = (date: string, zone: string) =>
  zonedToUtc(date, "00:00", zone);
/** Day after `date` (YYYY-MM-DD). */
export function nextDate(date: string): string {
  const d = parseDate(date)!;
  return new Date(Date.UTC(d[0], d[1] - 1, d[2] + 1))
    .toISOString()
    .slice(0, 10);
}
