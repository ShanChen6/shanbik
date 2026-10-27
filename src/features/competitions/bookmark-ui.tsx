"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  BOOKMARKS_KEY,
  REMINDERS,
  createBookmarks,
  type BookmarkStore,
  type Reminder,
} from "./bookmarks";
import { buildCompetitionIcs, icsFileName } from "./ics";
import type { Competition } from "./schema";
/** One store per page, kept in sync with other tabs via the storage event. */
export function useBookmarks() {
  const [store] = useState(() => createBookmarks(() => window.localStorage));
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  useEffect(() => {
    store.open();
    const onStorage = (e: StorageEvent) => {
      if (e.key === BOOKMARKS_KEY || e.key === null) store.refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      store.close();
    };
  }, [store]);
  return { store, snapshot };
}
export function BookmarkButton({
  store,
  saved,
  disabled,
  competition,
}: {
  store: BookmarkStore;
  saved: boolean;
  disabled: boolean;
  competition: Competition;
}) {
  return (
    <Button
      variant="secondary"
      aria-pressed={saved}
      aria-label={`${saved ? "Bỏ lưu" : "Lưu"} ${competition.name}`}
      disabled={disabled}
      onClick={() => store.toggle(competition.id)}
    >
      {saved ? "Đã lưu" : "Lưu giải"}
    </Button>
  );
}
export const bookmarkStatusText = (status: string) =>
  status === "unavailable"
    ? "Không lưu được trên trình duyệt này; thay đổi chỉ giữ trong trang hiện tại."
    : status === "invalid"
      ? "Dữ liệu giải đã lưu không hợp lệ đã được bỏ qua; lần lưu tới sẽ tạo bản mới."
      : status === "full"
        ? "Đã đủ 200 giải được lưu. Bỏ lưu bớt để thêm giải mới."
        : "Giải đã lưu chỉ nằm trên trình duyệt này, không đồng bộ tài khoản.";
/** Bookmark, reminder lead time and calendar download on the detail page. */
export function CompetitionActions({
  competition,
}: {
  competition: Competition;
}) {
  const { store, snapshot } = useBookmarks();
  const item = snapshot.items.find((b) => b.id === competition.id);
  const [message, setMessage] = useState("");
  const remind: Reminder = item?.remind ?? "1d";
  const download = () => {
    const ics = buildCompetitionIcs(competition, remind, Date.now());
    const url = URL.createObjectURL(
      new Blob([ics], { type: "text/calendar;charset=utf-8" }),
    );
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: icsFileName(competition),
    });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      "Đã tạo tệp lịch. Mở tệp để thêm vào ứng dụng lịch; lời nhắc do ứng dụng lịch trên máy bạn gửi.",
    );
  };
  return (
    <section
      aria-labelledby="actions-title"
      className="space-y-4 rounded-panel border border-border bg-surface p-5 sm:p-8"
    >
      <h2 id="actions-title" className="text-heading">
        Lưu và nhắc lịch
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <BookmarkButton
          store={store}
          saved={!!item}
          disabled={!snapshot.loaded}
          competition={competition}
        />
        <div className="flex min-w-0 flex-col gap-1 text-sm font-semibold">
          <label htmlFor="reminder-lead">Nhắc trong tệp lịch</label>
          <select
            id="reminder-lead"
            className="ui-input min-h-11"
            value={remind}
            disabled={!item}
            onChange={(e) =>
              store.setReminder(competition.id, e.target.value as Reminder)
            }
          >
            {Object.entries(REMINDERS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={download}>Tải tệp lịch (.ics)</Button>
      </div>
      <p className="text-sm text-muted">
        Tệp lịch gồm ngày thi theo lịch nơi tổ chức, mốc mở/đóng đăng ký và các
        buổi thi theo giờ chuẩn quốc tế, nên ứng dụng lịch tự hiển thị đúng giờ
        của bạn.{" "}
        {item
          ? "Lời nhắc dùng mức báo trước đã chọn cho giải đã lưu."
          : "Lưu giải để chọn mức báo trước; mặc định trước 1 ngày."}
        {competition.cancelled && " Giải đã hủy: tệp lịch ghi trạng thái hủy."}
      </p>
      <p
        role="status"
        aria-label="Trạng thái lưu giải"
        className="text-sm text-muted"
      >
        {message ||
          (snapshot.loaded ? bookmarkStatusText(snapshot.status) : "")}
      </p>
      <p className="text-sm">
        Thông tin chưa đúng?{" "}
        <Link
          href={`/competitions/gop-y?id=${competition.id}`}
          className="font-semibold text-primary underline underline-offset-4"
        >
          Báo lỗi thông tin giải này
        </Link>
      </p>
    </section>
  );
}
