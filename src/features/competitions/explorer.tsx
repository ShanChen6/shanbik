"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useNow } from "./clock";
import {
  competitionMonths,
  competitionsURL,
  filterCompetitions,
  NO_FILTERS,
  readCompetitionFilters,
  type CompetitionFilters,
} from "./filters";
import { formatDateRange } from "./format";
import {
  EVENTS,
  REGIONS,
  STATUSES,
  statusAt,
  type Competition,
  type Status,
} from "./schema";
import { offsetLabel } from "./time";
const STATUS_STYLE: Record<Status, string> = {
  upcoming: "border-info text-info",
  ongoing: "border-success text-success",
  past: "border-border text-muted",
  cancelled: "border-danger text-danger",
};
export function StatusBadge({
  competition,
  now,
}: {
  competition: Competition;
  now: number | null;
}) {
  if (now === null)
    return (
      <span className="text-xs text-muted">Đang xác định trạng thái…</span>
    );
  const s = statusAt(competition, now);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[s]}`}
    >
      {STATUSES[s]}
    </span>
  );
}
export function SampleBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-warning px-2.5 py-0.5 text-xs font-semibold text-warning">
      Dữ liệu mẫu
    </span>
  );
}
const monthLabel = (m: string) =>
  `Tháng ${Number(m.slice(5))}/${m.slice(0, 4)}`;
/** List with region/event/status/month filters kept in the URL. */
export function CompetitionExplorer({
  competitions,
}: {
  competitions: readonly Competition[];
}) {
  const params = useSearchParams(),
    filters = readCompetitionFilters(params),
    now = useNow();
  const set = (next: Partial<CompetitionFilters>) => {
    // replaceState keeps Back for leaving the page; Next syncs useSearchParams.
    window.history.replaceState(
      null,
      "",
      competitionsURL({ ...filters, ...next }),
    );
  };
  // Status filtering needs the clock; until hydration it is not applied.
  const results = filterCompetitions(
    competitions,
    now === null ? { ...filters, status: "" } : filters,
    now ?? 0,
  );
  const active = Object.values(filters).some(Boolean);
  const query = competitionsURL(filters).split("?")[1] ?? "";
  const select = (
    label: string,
    key: keyof CompetitionFilters,
    options: readonly (readonly [string, string])[],
    all: string,
  ) => (
    <div className="flex min-w-0 flex-col gap-1 text-sm font-semibold">
      <label htmlFor={`competition-filter-${key}`}>{label}</label>
      <select
        id={`competition-filter-${key}`}
        className="ui-input min-h-11"
        value={filters[key]}
        onChange={(e) => set({ [key]: e.target.value })}
      >
        <option value="">{all}</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
  return (
    <div className="space-y-6">
      <section
        aria-label="Lọc giải đấu"
        className="grid gap-4 rounded-panel border border-border bg-surface p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4"
      >
        {select("Vùng", "region", Object.entries(REGIONS), "Mọi vùng")}
        {select(
          "Thời gian (giờ địa phương)",
          "month",
          competitionMonths(competitions).map((m) => [m, monthLabel(m)]),
          "Mọi tháng",
        )}
        {select(
          "Nội dung thi",
          "event",
          Object.entries(EVENTS),
          "Mọi nội dung",
        )}
        {select(
          "Trạng thái",
          "status",
          Object.entries(STATUSES),
          "Mọi trạng thái",
        )}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-label="Số giải đấu" className="font-semibold">
          {results.length} giải
          {now === null && filters.status ? " (đang tính trạng thái…)" : ""}
        </p>
        {active && (
          <button
            type="button"
            className="ui-button ui-button--secondary"
            onClick={() => set(NO_FILTERS)}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
      {results.length ? (
        <ul
          aria-label="Danh sách giải đấu"
          className="grid gap-4 md:grid-cols-2"
        >
          {results.map((c) => (
            <li
              key={c.id}
              className="min-w-0 space-y-3 rounded-panel border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap gap-2">
                <StatusBadge competition={c} now={now} />
                {c.sample && <SampleBadge />}
              </div>
              <h2 className="text-lg leading-snug font-bold">
                <Link
                  href={`/competitions/${c.id}${query ? `?${query}` : ""}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {c.name}
                </Link>
              </h2>
              <p className="text-sm">
                <span className="font-semibold">
                  {formatDateRange(c.startDate, c.endDate)}
                </span>{" "}
                <span className="text-muted">
                  (giờ địa phương {c.timeZone},{" "}
                  {offsetLabel(c.timeZone, c.startsAt)})
                </span>
              </p>
              <p className="text-sm text-muted">
                {c.city}, {c.country}
                {REGIONS[c.region] !== c.country && ` · ${REGIONS[c.region]}`}
              </p>
              <ul
                aria-label={`Nội dung thi ${c.name}`}
                className="flex flex-wrap gap-1.5"
              >
                {c.events.map((e) => (
                  <li
                    key={e}
                    className="rounded-md border border-border bg-surface-subtle px-2 py-0.5 text-xs"
                  >
                    {EVENTS[e]}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-panel border border-border bg-surface p-6">
          <h2 className="text-xl font-bold">Không có giải phù hợp</h2>
          <p className="mt-2 text-muted">
            Thử bỏ bớt bộ lọc hoặc chọn tháng khác. Danh sách hiện chỉ gồm dữ
            liệu mẫu.
          </p>
          <button
            type="button"
            className="ui-button ui-button--secondary mt-4"
            onClick={() => set(NO_FILTERS)}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
/** "Về danh sách giải" that keeps the filters the visitor came from. */
export function CompetitionBackLink() {
  const filters = readCompetitionFilters(useSearchParams());
  return (
    <Link
      href={competitionsURL(filters)}
      className="ui-button ui-button--secondary"
    >
      Về danh sách giải
    </Link>
  );
}
