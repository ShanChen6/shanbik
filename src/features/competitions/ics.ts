import type { Reminder } from "./bookmarks";
import { EVENTS, type Competition } from "./schema";
import { nextDate } from "./time";
const TRIGGER: Record<Reminder, string | null> = {
  none: null,
  "1h": "-PT1H",
  "1d": "-P1D",
  "7d": "-P7D",
};
/** RFC 5545 §3.3.11 TEXT escaping. */
const esc = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
const utc = (ms: number) =>
  new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
const day = (date: string) => date.replace(/-/g, "");
/** RFC 5545 §3.1: fold lines longer than 75 octets, never inside a UTF-8 sequence. */
function fold(line: string): string {
  const out: string[] = [];
  let current = "",
    bytes = 0;
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    if (bytes + size > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}
function alarm(remind: Reminder, text: string): string[] {
  const trigger = TRIGGER[remind];
  return trigger
    ? [
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${esc(text)}`,
        `TRIGGER:${trigger}`,
        "END:VALARM",
      ]
    : [];
}
/**
 * Calendar file for one competition: the whole event as all-day dates in
 * the venue's calendar, plus registration and schedule sessions as UTC
 * instants so any calendar app shows them in its own zone.
 */
export function buildCompetitionIcs(
  c: Competition,
  remind: Reminder,
  now: number,
): string {
  const stamp = utc(now),
    where = `${c.venue}, ${c.city}, ${c.country}`,
    note = [
      `Giờ địa phương: ${c.timeZone}.`,
      `Nội dung: ${c.events.map((e) => EVENTS[e]).join(", ")}.`,
      c.sample
        ? "Dữ liệu mẫu ShanBik, không phải giải thật."
        : `Nguồn: ${c.source.url}`,
      "Kiểm tra trang của ban tổ chức trước khi đi thi.",
    ].join(" ");
  const event = (uid: string, lines: string[], extra: string[] = []) => [
    "BEGIN:VEVENT",
    `UID:${uid}@shanbik`,
    `DTSTAMP:${stamp}`,
    ...lines,
    `LOCATION:${esc(where)}`,
    `STATUS:${c.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    ...extra,
    "END:VEVENT",
  ];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ShanBik//Giai dau//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...event(
      c.id,
      [
        `DTSTART;VALUE=DATE:${day(c.startDate)}`,
        // DTEND of an all-day event is exclusive.
        `DTEND;VALUE=DATE:${day(nextDate(c.endDate))}`,
        `SUMMARY:${esc(c.name)}`,
        `DESCRIPTION:${esc(note)}`,
      ],
      alarm(remind, `${c.name} sắp diễn ra`),
    ),
  ];
  if (c.registration) {
    const r = c.registration;
    lines.push(
      ...event(
        `${c.id}-registration-opens`,
        [
          `DTSTART:${utc(r.opensAt)}`,
          `DTEND:${utc(r.opensAt + 15 * 60_000)}`,
          `SUMMARY:${esc(`Mở đăng ký: ${c.name}`)}`,
        ],
        alarm(remind, `Sắp mở đăng ký ${c.name}`),
      ),
      ...event(`${c.id}-registration-closes`, [
        `DTSTART:${utc(r.closesAt - 15 * 60_000)}`,
        `DTEND:${utc(r.closesAt)}`,
        `SUMMARY:${esc(`Đóng đăng ký: ${c.name}`)}`,
      ]),
    );
  }
  c.schedule.forEach((s, i) =>
    lines.push(
      ...event(`${c.id}-session-${i + 1}`, [
        `DTSTART:${utc(s.startsAt)}`,
        `DTEND:${utc(s.endsAt)}`,
        `SUMMARY:${esc(`${s.title} — ${c.name}`)}`,
      ]),
    ),
  );
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
export const icsFileName = (c: Competition) => `${c.id}.ics`;
