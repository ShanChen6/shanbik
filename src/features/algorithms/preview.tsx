"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { PracticePlayer } from "./practice-player";
import { SPEEDS, createPracticeStorage, maxRepeats } from "./practice";
import type { Formula } from "./catalog";
export default function FormulaPreview({
  formula,
  onClose,
}: {
  formula: Formula;
  onClose: () => void;
}) {
  const [resetVersion, setResetVersion] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    title.current?.scrollIntoView({ block: "start" });
  }, []);
  const [store] = useState(() =>
    createPracticeStorage(formula, () => window.localStorage),
  );
  const saved = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  useEffect(() => {
    store.open();
    return store.close;
  }, [store]);
  const settings = saved.settings;
  return (
    <section
      aria-label="Minh họa công thức"
      className="mt-6 min-w-0 rounded-panel border border-border bg-surface p-4 sm:p-6"
    >
      <h2 ref={title} tabIndex={-1} className="text-heading scroll-mt-6">
        {formula.name}
      </h2>
      <Button variant="secondary" onClick={onClose}>
        Đóng minh họa
      </Button>
      <p className="mt-3 mb-4 text-muted">
        Giữ tâm trắng ở U, xanh lá ở F. Một lượt xuôi đưa trạng thái mẫu về khối
        đã giải; chiều đảo đi từ khối đã giải về mẫu. Các lượt lặp nối tiếp trên
        khối hiện tại, không tự đặt lại giữa lượt. Đây không phải lời giải cho
        khối bất kỳ.
      </p>
      <div className="my-4 grid gap-4 sm:grid-cols-3">
        <label className="space-y-2 font-semibold">
          Tốc độ
          <select
            aria-label="Tốc độ"
            className="ui-input w-full"
            disabled={!saved.loaded}
            value={settings.speed}
            onChange={(e) => store.update({ speed: Number(e.target.value) })}
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 font-semibold">
          Chiều xoay
          <select
            aria-label="Chiều xoay"
            className="ui-input w-full"
            disabled={!saved.loaded}
            value={settings.direction}
            onChange={(e) =>
              store.update({
                direction: e.target.value as "forward" | "reverse",
              })
            }
          >
            <option value="forward">Xuôi</option>
            <option value="reverse">Đảo chuỗi</option>
          </select>
        </label>
        <label className="space-y-2 font-semibold">
          Số lượt lặp
          <select
            aria-label="Số lượt lặp"
            className="ui-input w-full"
            disabled={!saved.loaded}
            value={settings.repeat}
            onChange={(e) => store.update({ repeat: Number(e.target.value) })}
          >
            {Array.from({ length: maxRepeats(formula) }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} lượt
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mb-4 text-sm text-muted">
        Đổi chiều hoặc số lượt đưa khối về đầu chuỗi và dừng phát. Đổi tốc độ áp
        dụng từ nước tiếp theo. Với giảm chuyển động, nước xoay được thực hiện
        ngay.
      </p>
      {saved.loaded ? (
        <PracticePlayer
          key={`${settings.direction}:${settings.repeat}:${resetVersion}`}
          formula={formula}
          settings={settings}
        />
      ) : (
        <p role="status">Đang đọc dữ liệu luyện tập…</p>
      )}
      <div className="mt-6 space-y-4 rounded-xl border border-border p-4">
        <label className="block space-y-2 font-semibold">
          Ghi chú của tôi
          <textarea
            aria-label="Ghi chú của tôi"
            className="ui-input block min-h-32 w-full"
            maxLength={2000}
            disabled={!saved.loaded}
            value={settings.note}
            onChange={(e) => store.update({ note: e.target.value })}
          />
        </label>
        <p className="text-xs text-muted">
          {settings.note.length}/2000 ký tự. Ghi chú chỉ lưu trên trình duyệt
          này.
        </p>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            disabled={!saved.loaded}
            checked={settings.completed}
            onChange={(e) => store.update({ completed: e.target.checked })}
          />
          Tôi đã luyện xong công thức này
        </label>
        <p className="text-sm text-muted">
          Bạn tự đánh dấu hoàn thành; phát hết chuỗi không tự thay đổi lựa chọn
          này.
        </p>
        <Button
          variant="secondary"
          disabled={!saved.loaded}
          onClick={() => {
            store.clear();
            setResetVersion((v) => v + 1);
          }}
        >
          Xóa dữ liệu luyện tập công thức này
        </Button>
        <p
          role="status"
          aria-label="Trạng thái lưu luyện tập"
          className="text-sm text-muted"
        >
          {saved.status === "loading"
            ? "Đang đọc dữ liệu…"
            : saved.status === "unavailable"
              ? "Không thể lưu trên trình duyệt này. Thay đổi chỉ giữ trong phiên hiện tại."
              : saved.status === "invalid"
                ? "Đã bỏ qua dữ liệu luyện tập không hợp lệ hoặc công thức đã thay đổi."
                : "Ghi chú, hoàn thành và tùy chọn được lưu trên trình duyệt này."}
        </p>
      </div>
    </section>
  );
}
