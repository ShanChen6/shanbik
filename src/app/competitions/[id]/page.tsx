import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/layout/page-intro";
import { COMPETITIONS, getCompetition } from "@/features/competitions/data";
import {
  LiveStatus,
  ViewerTime,
  ViewerZone,
} from "@/features/competitions/detail-client";
import {
  CompetitionBackLink,
  SampleBadge,
} from "@/features/competitions/explorer";
import {
  formatDateRange,
  formatInstant,
  formatLocalDay,
} from "@/features/competitions/format";
import { EVENTS, REGIONS, SOURCE_KINDS } from "@/features/competitions/schema";
import { offsetLabel } from "@/features/competitions/time";
// Block an unknown-id shell until static generation can return a real 404.
export const ensureStatic = "navigation";
type Props = { params: Promise<{ id: string }> };
export function generateStaticParams() {
  return COMPETITIONS.map(({ id }) => ({ id }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getCompetition((await params).id);
  if (!c) notFound();
  return {
    title: `${c.name} — Giải đấu ShanBik`,
    description: `${formatDateRange(c.startDate, c.endDate)} tại ${c.city}, ${c.country}.${c.sample ? " Dữ liệu mẫu, không phải giải thật." : ""}`,
  };
}
export default async function CompetitionPage({ params }: Props) {
  const c = getCompetition((await params).id);
  if (!c) notFound();
  const offset = offsetLabel(c.timeZone, c.startsAt);
  return (
    <div className="site-container space-y-6 pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Giải đấu"
        title={c.name}
        description={`${formatDateRange(c.startDate, c.endDate)} · ${c.city}, ${c.country}`}
      />
      <div className="flex flex-wrap gap-3">
        <Suspense
          fallback={
            <Link
              href="/competitions"
              className="ui-button ui-button--secondary"
            >
              Về danh sách giải
            </Link>
          }
        >
          <CompetitionBackLink />
        </Suspense>
      </div>
      {c.sample && (
        <p
          role="note"
          className="rounded-panel border border-warning bg-surface p-4 text-sm"
        >
          <SampleBadge /> Giải hư cấu dùng để thử giao diện; không đăng ký hay
          tham dự được.
        </p>
      )}
      <section
        aria-labelledby="overview-title"
        className="space-y-4 rounded-panel border border-border bg-surface p-5 sm:p-8"
      >
        <h2 id="overview-title" className="text-heading">
          Thông tin chung
        </h2>
        <LiveStatus competition={c} />
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Ngày thi (giờ địa phương)</dt>
            <dd className="mt-1 text-muted">
              {formatLocalDay(c.startDate)}
              {c.endDate !== c.startDate && ` – ${formatLocalDay(c.endDate)}`}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Múi giờ nơi tổ chức</dt>
            <dd className="mt-1 text-muted">
              {c.timeZone} ({offset} vào ngày đầu)
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Địa điểm</dt>
            <dd className="mt-1 text-muted">
              {c.venue}, {c.city}, {c.country}
              {REGIONS[c.region] !== c.country && ` · ${REGIONS[c.region]}`}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Nội dung thi</dt>
            <dd className="mt-1 text-muted">
              {c.events.map((e) => EVENTS[e]).join(", ")}
            </dd>
          </div>
        </dl>
        {c.cancelled && (
          <p className="font-semibold text-danger">
            Giải đã bị hủy. Lịch bên dưới (nếu có) chỉ để tham khảo.
          </p>
        )}
      </section>
      {c.registration && (
        <section
          aria-labelledby="registration-title"
          className="space-y-3 rounded-panel border border-border bg-surface p-5 sm:p-8"
        >
          <h2 id="registration-title" className="text-heading">
            Đăng ký
          </h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {(
              [
                ["Mở", c.registration.opensAt],
                ["Đóng", c.registration.closesAt],
              ] as const
            ).map(([label, ms]) => (
              <div key={label}>
                <dt className="font-semibold">{label}</dt>
                <dd className="mt-1 text-muted">
                  {formatInstant(ms, c.timeZone)} giờ địa phương
                  <br />
                  {formatInstant(ms, "UTC")} UTC
                  <br />
                  <ViewerTime ms={ms} /> theo <ViewerZone />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section
        aria-labelledby="schedule-title"
        className="min-w-0 space-y-3 rounded-panel border border-border bg-surface p-5 sm:p-8"
      >
        <h2 id="schedule-title" className="text-heading">
          Lịch thi
        </h2>
        <p className="text-sm text-muted">
          Giờ địa phương theo {c.timeZone}; cột UTC và giờ của bạn được quy đổi
          tự động, kể cả ngày đổi giờ mùa hè.
        </p>
        {c.schedule.length ? (
          <div
            // Narrow screens scroll the table sideways; keyboard users need focus to scroll.
            role="region"
            aria-label="Bảng lịch thi, cuộn ngang trên màn hình hẹp"
            tabIndex={0}
            className="overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <caption className="sr-only">Lịch thi {c.name}</caption>
              <thead className="bg-surface-subtle">
                <tr>
                  <th scope="col" className="p-2">
                    Nội dung
                  </th>
                  <th scope="col" className="p-2">
                    Giờ địa phương
                  </th>
                  <th scope="col" className="p-2">
                    UTC
                  </th>
                  <th scope="col" className="p-2">
                    Giờ của bạn (<ViewerZone />)
                  </th>
                </tr>
              </thead>
              <tbody>
                {c.schedule.map((s) => (
                  <tr
                    key={`${s.date}${s.start}${s.title}`}
                    className="border-t border-border align-top"
                  >
                    <th scope="row" className="p-2 font-semibold">
                      {s.title}
                    </th>
                    <td className="p-2">
                      {formatLocalDay(s.date)}, {s.start}–{s.end}
                      <span className="block text-xs text-muted">
                        {offsetLabel(c.timeZone, s.startsAt)}
                      </span>
                    </td>
                    <td className="p-2">
                      {formatInstant(s.startsAt, "UTC")}–
                      {formatInstant(s.endsAt, "UTC").split(" ").at(-1)}
                    </td>
                    <td className="p-2">
                      <ViewerTime ms={s.startsAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">Chưa có lịch thi chi tiết.</p>
        )}
      </section>
      <section
        aria-labelledby="source-title"
        className="space-y-3 rounded-panel border border-border bg-surface p-5 sm:p-8"
      >
        <h2 id="source-title" className="text-heading">
          Nguồn và cập nhật
        </h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-semibold">Loại nguồn</dt>
            <dd className="mt-1 text-muted">{SOURCE_KINDS[c.source.kind]}</dd>
          </div>
          <div>
            <dt className="font-semibold">Ngày đọc nguồn</dt>
            <dd className="mt-1 text-muted">
              {formatDateRange(c.source.retrievedAt, c.source.retrievedAt)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">ShanBik cập nhật</dt>
            <dd className="mt-1 text-muted">
              {formatDateRange(c.updatedAt, c.updatedAt)}
            </dd>
          </div>
        </dl>
        <p className="text-sm">
          {c.source.url ? (
            <a
              href={c.source.url}
              className="font-semibold text-primary underline underline-offset-4"
            >
              {c.source.title}
            </a>
          ) : (
            c.source.title
          )}
        </p>
        <p className="text-xs text-muted">
          Thông tin được nhập tay từ nguồn được trích dẫn, không tự động thu
          thập. Luôn kiểm tra trang chính thức của ban tổ chức trước khi đi thi.
        </p>
      </section>
    </div>
  );
}
