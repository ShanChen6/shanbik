import {
  EVENTS,
  REGIONS,
  STATUSES,
  statusAt,
  type Competition,
  type EventId,
  type Region,
  type Status,
} from "./schema";
export type CompetitionFilters = Readonly<{
  region: Region | "";
  event: EventId | "";
  status: Status | "";
  /** YYYY-MM in the venue's calendar. */
  month: string;
  /** "1": only competitions bookmarked on this device. */
  saved: "" | "1";
}>;
export const NO_FILTERS: CompetitionFilters = Object.freeze({
  region: "",
  event: "",
  status: "",
  month: "",
  saved: "",
});
/** Unknown or repeated params are ignored; the first value wins. */
export function readCompetitionFilters(
  params: Pick<URLSearchParams, "get">,
): CompetitionFilters {
  const pick = <T extends string>(key: string, allowed: object) => {
    const v = params.get(key) ?? "";
    return (Object.hasOwn(allowed, v) ? v : "") as T | "";
  };
  const month = params.get("month") ?? "";
  return Object.freeze({
    region: pick<Region>("region", REGIONS),
    event: pick<EventId>("event", EVENTS),
    status: pick<Status>("status", STATUSES),
    month: /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : "",
    saved: params.get("saved") === "1" ? "1" : "",
  });
}
export function competitionsURL(filters: CompetitionFilters) {
  const params = new URLSearchParams();
  for (const key of ["region", "event", "status", "month", "saved"] as const)
    if (filters[key]) params.set(key, filters[key]);
  const query = params.toString();
  return `/competitions${query ? `?${query}` : ""}`;
}
export function filterCompetitions(
  list: readonly Competition[],
  f: CompetitionFilters,
  now: number,
  savedIds?: ReadonlySet<string>,
) {
  return list.filter(
    (c) =>
      (!f.region || c.region === f.region) &&
      (!f.event || c.events.includes(f.event)) &&
      (!f.status || statusAt(c, now) === f.status) &&
      (!f.saved || !!savedIds?.has(c.id)) &&
      (!f.month ||
        (c.startDate.slice(0, 7) <= f.month &&
          c.endDate.slice(0, 7) >= f.month)),
  );
}
/** Months (YYYY-MM) that have at least one competition, ascending. */
export function competitionMonths(list: readonly Competition[]) {
  const months = new Set<string>();
  for (const c of list)
    for (let m = c.startDate.slice(0, 7); m <= c.endDate.slice(0, 7);) {
      months.add(m);
      const [y, mo] = m.split("-").map(Number);
      m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
    }
  return [...months].sort();
}
