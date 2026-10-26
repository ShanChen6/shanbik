import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/layout/page-intro";
import { CubeViewport } from "@/features/cube/viewer/cube-viewport";

export const metadata: Metadata = {
  title: "Luyện tập 3×3 — ShanBik",
  description:
    "Xem mô hình Rubik 3×3 tĩnh và tìm hiểu các công cụ luyện tập sắp có trên ShanBik.",
};

export default function PracticePage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Luyện tập 3×3"
        title="Chậm một nhịp. Hiểu thêm một bước."
        description="Không gian dành cho bạn làm quen với từng nước xoay và quan sát khối Rubik theo nhịp riêng."
      />
      <section
        aria-labelledby="practice-title"
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        <div className="min-w-0 rounded-panel border border-border bg-surface p-6 sm:p-8">
          <h2 id="practice-title" className="text-heading">
            Khối 3×3 của bạn
          </h2>
          <p className="mt-3 mb-6 text-muted">
            Quan sát mô hình 3×3 ở góc nhìn ban đầu. Điều khiển tương tác đang
            được chuẩn bị.
          </p>
          <CubeViewport />
        </div>
        <aside
          aria-labelledby="upcoming-title"
          className="min-w-0 rounded-panel border border-border bg-surface p-6 sm:p-8"
        >
          <p className="mb-4 text-sm font-semibold text-accent">
            Đang chuẩn bị
          </p>
          <h2 id="upcoming-title" className="text-xl font-bold">
            Luyện tập theo từng bước
          </h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-muted">
            <li>Tạo chuỗi xáo trộn cho khối 3×3.</li>
            <li>Nhập màu các mặt bằng tay.</li>
            <li>Phát lời giải từng nước đi.</li>
          </ul>
          <p className="mt-5 text-sm text-muted">
            Các công cụ này hiện chưa khả dụng. Bạn có thể khám phá phần giới
            thiệu trước khi bắt đầu.
          </p>
          <Link href="/learn" className="ui-button ui-button--secondary mt-6">
            Tìm hiểu kiến thức cơ bản
          </Link>
        </aside>
      </section>
    </div>
  );
}
