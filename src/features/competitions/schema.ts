import {
  isTime,
  isTimeZone,
  nextDate,
  parseDate,
  startOfLocalDay,
  zonedToUtc,
} from "./time";
/** WCA event IDs (Regulation 9b) with ShanBik labels. */
export const EVENTS = {
  "333": "3×3",
  "222": "2×2",
  "444": "4×4",
  "555": "5×5",
  "333oh": "3×3 một tay",
  "333bf": "3×3 bịt mắt",
  pyram: "Pyraminx",
  minx: "Megaminx",
  skewb: "Skewb",
  sq1: "Square-1",
  clock: "Clock",
} as const;
export const REGIONS = {
  "viet-nam": "Việt Nam",
  asia: "Châu Á (ngoài Việt Nam)",
  europe: "Châu Âu",
  americas: "Châu Mỹ",
  oceania: "Châu Đại Dương",
  africa: "Châu Phi",
} as const;
/**
 * Where a record comes from. Records are entered by hand from a page that
 * may be cited; ShanBik has no scraper. `sample` records are fictional
 * fixtures for UI and tests and must say so.
 */
export const SOURCE_KINDS = {
  organizer: "Trang của ban tổ chức",
  "official-listing": "Danh sách giải chính thức",
  sample: "Dữ liệu mẫu (không phải giải thật)",
} as const;
export type EventId = keyof typeof EVENTS;
export type Region = keyof typeof REGIONS;
export type LocalTime = Readonly<{ date: string; time: string }>;
export type Session = Readonly<{
  date: string;
  start: string;
  end: string;
  title: string;
  event: EventId | null;
  /** Derived UTC instants (ms). */
  startsAt: number;
  endsAt: number;
}>;
export type Competition = Readonly<{
  id: string;
  name: string;
  sample: boolean;
  region: Region;
  country: string;
  city: string;
  venue: string;
  timeZone: string;
  /** Local calendar dates at the venue, inclusive. */
  startDate: string;
  endDate: string;
  cancelled: boolean;
  events: readonly EventId[];
  schedule: readonly Session[];
  registration: Readonly<{
    opens: LocalTime;
    closes: LocalTime;
    opensAt: number;
    closesAt: number;
  }> | null;
  source: Readonly<{
    kind: keyof typeof SOURCE_KINDS;
    title: string;
    url: string | null;
    /** Date the source was read (YYYY-MM-DD). */
    retrievedAt: string;
  }>;
  /** Date this record was last edited in ShanBik (YYYY-MM-DD). */
  updatedAt: string;
  /** Derived: first local midnight and the midnight after the last day, UTC ms. */
  startsAt: number;
  endsAt: number;
}>;
export const MAX_DAYS = 14;
function fail(path: string): never {
  throw Error(`Invalid competition data: ${path}`);
}
const rec = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, path: string, max = 200) => {
  if (typeof v !== "string" || !v.trim() || v.length > max) fail(path);
  return v.trim();
};
const date = (v: unknown, path: string) => {
  if (!parseDate(v)) fail(path);
  return v as string;
};
function local(v: unknown, zone: string, path: string) {
  if (!rec(v)) fail(path);
  const d = date(v.date, `${path}.date`);
  if (!isTime(v.time)) fail(`${path}.time`);
  try {
    return {
      value: { date: d, time: v.time as string },
      at: zonedToUtc(d, v.time as string, zone),
    };
  } catch {
    fail(`${path}.nonexistent`);
  }
}
const midnight = (d: string, zone: string) => {
  try {
    return startOfLocalDay(d, zone);
  } catch {
    // A few zones skip midnight on DST days; the day then starts at 01:00.
    return zonedToUtc(d, "01:00", zone);
  }
};
/** Validates authoring data at import/build time; output is deeply frozen. */
export function parseCompetitions(input: unknown): readonly Competition[] {
  if (!Array.isArray(input)) fail("entries");
  const ids = new Set<string>();
  const out = input.map((v: unknown, i: number): Competition => {
    const p = `entries[${i}]`;
    if (!rec(v)) fail(p);
    const id = text(v.id, `${p}.id`, 80);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ids.has(id)) fail(`${p}.id`);
    ids.add(id);
    if (typeof v.sample !== "boolean" || typeof v.cancelled !== "boolean")
      fail(`${p}.flags`);
    if (!Object.hasOwn(REGIONS, String(v.region))) fail(`${p}.region`);
    if (!isTimeZone(v.timeZone)) fail(`${p}.timeZone`);
    const zone = v.timeZone as string;
    const startDate = date(v.startDate, `${p}.startDate`),
      endDate = date(v.endDate, `${p}.endDate`);
    if (endDate < startDate) fail(`${p}.endDate`);
    let days = 1;
    for (let d = startDate; d !== endDate; d = nextDate(d))
      if (++days > MAX_DAYS) fail(`${p}.endDate`);
    if (!Array.isArray(v.events) || !v.events.length) fail(`${p}.events`);
    const events = v.events as unknown[];
    if (
      new Set(events).size !== events.length ||
      !events.every((e) => Object.hasOwn(EVENTS, String(e)))
    )
      fail(`${p}.events`);
    if (!Array.isArray(v.schedule)) fail(`${p}.schedule`);
    const schedule = (v.schedule as unknown[]).map((s, k): Session => {
      const sp = `${p}.schedule[${k}]`;
      if (!rec(s)) fail(sp);
      const d = date(s.date, `${sp}.date`);
      if (d < startDate || d > endDate) fail(`${sp}.date`);
      if (!isTime(s.start) || !isTime(s.end) || s.end <= s.start)
        fail(`${sp}.time`);
      const ev = s.event ?? null;
      if (ev !== null && !events.includes(ev)) fail(`${sp}.event`);
      let startsAt: number, endsAt: number;
      try {
        startsAt = zonedToUtc(d, s.start as string, zone);
        endsAt = zonedToUtc(d, s.end as string, zone);
      } catch {
        fail(`${sp}.nonexistent`);
      }
      if (endsAt <= startsAt) fail(`${sp}.time`);
      return {
        date: d,
        start: s.start as string,
        end: s.end as string,
        title: text(s.title, `${sp}.title`, 120),
        event: ev as EventId | null,
        startsAt,
        endsAt,
      };
    });
    for (let k = 1; k < schedule.length; k++)
      if (schedule[k].startsAt < schedule[k - 1].startsAt)
        fail(`${p}.schedule.order`);
    const startsAt = midnight(startDate, zone),
      endsAt = midnight(nextDate(endDate), zone);
    let registration: Competition["registration"] = null;
    if (v.registration !== undefined && v.registration !== null) {
      if (!rec(v.registration)) fail(`${p}.registration`);
      const opens = local(
          v.registration.opens,
          zone,
          `${p}.registration.opens`,
        ),
        closes = local(v.registration.closes, zone, `${p}.registration.closes`);
      if (closes.at <= opens.at || closes.at > startsAt)
        fail(`${p}.registration.order`);
      registration = {
        opens: opens.value,
        closes: closes.value,
        opensAt: opens.at,
        closesAt: closes.at,
      };
    }
    if (!rec(v.source)) fail(`${p}.source`);
    const kind = String(v.source.kind);
    if (!Object.hasOwn(SOURCE_KINDS, kind)) fail(`${p}.source.kind`);
    // Provenance: a real record cites an https page; a sample cites none.
    if ((kind === "sample") !== v.sample) fail(`${p}.source.sample`);
    let url: string | null = null;
    if (kind === "sample") {
      if (v.source.url !== null) fail(`${p}.source.url`);
    } else {
      try {
        const u = new URL(String(v.source.url));
        if (u.protocol !== "https:" || u.username || u.password)
          fail(`${p}.source.url`);
        url = u.href;
      } catch {
        fail(`${p}.source.url`);
      }
    }
    const retrievedAt = date(v.source.retrievedAt, `${p}.source.retrievedAt`),
      updatedAt = date(v.updatedAt, `${p}.updatedAt`);
    if (updatedAt < retrievedAt) fail(`${p}.updatedAt`);
    return {
      id,
      name: text(v.name, `${p}.name`, 120),
      sample: v.sample as boolean,
      region: v.region as Region,
      country: text(v.country, `${p}.country`, 80),
      city: text(v.city, `${p}.city`, 80),
      venue: text(v.venue, `${p}.venue`, 160),
      timeZone: zone,
      startDate,
      endDate,
      cancelled: v.cancelled as boolean,
      events: events as EventId[],
      schedule,
      registration,
      source: {
        kind: kind as keyof typeof SOURCE_KINDS,
        title: text(v.source.title, `${p}.source.title`, 160),
        url,
        retrievedAt,
      },
      updatedAt,
      startsAt,
      endsAt,
    };
  });
  const freeze = (x: unknown): unknown => {
    if (x && typeof x === "object") {
      Object.values(x).forEach(freeze);
      Object.freeze(x);
    }
    return x;
  };
  return freeze(
    out.sort((a, b) => a.startsAt - b.startsAt || a.id.localeCompare(b.id)),
  ) as readonly Competition[];
}
export type Status = "upcoming" | "ongoing" | "past" | "cancelled";
export const STATUSES: Readonly<Record<Status, string>> = {
  upcoming: "Sắp diễn ra",
  ongoing: "Đang diễn ra",
  past: "Đã kết thúc",
  cancelled: "Đã hủy",
};
/** Status at instant `now`, using the venue's calendar days. */
export function statusAt(c: Competition, now: number): Status {
  if (c.cancelled) return "cancelled";
  if (now < c.startsAt) return "upcoming";
  return now < c.endsAt ? "ongoing" : "past";
}
export type RegistrationStatus = "not-open" | "open" | "closed";
export function registrationAt(
  c: Competition,
  now: number,
): RegistrationStatus | null {
  if (!c.registration || c.cancelled) return null;
  if (now < c.registration.opensAt) return "not-open";
  return now < c.registration.closesAt ? "open" : "closed";
}
