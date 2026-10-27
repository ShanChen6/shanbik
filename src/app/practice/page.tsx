import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/layout/page-intro";
import { PracticeCube } from "@/features/cube/viewer/practice-cube";

export const metadata: Metadata = {
  title: "Luyện tập 3×3 — ShanBik",
  description:
    "Mô phỏng Rubik 3×3, phát thuật toán, tạo scramble và nhập màu sáu mặt trên ShanBik.",
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
            Quan sát khối 3×3 từ nhiều góc bằng nút hoặc thao tác kéo và zoom.
          </p>
          <PracticeCube />
        </div>
        <aside
          aria-labelledby="upcoming-title"
          className="min-w-0 rounded-panel border border-border bg-surface p-6 sm:p-8"
        >
          <p className="mb-4 text-sm font-semibold text-accent">Cách bắt đầu</p>
          <h2 id="upcoming-title" className="text-xl font-bold">
            Các công cụ luyện tập
          </h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-muted">
            <li>Nhập và phát chuỗi thuật toán của bạn.</li>
            <li>Nhập màu sáu mặt, kiểm tra ô thiếu và số lượng màu.</li>
            <li>Tạo scramble và điều khiển phát từng bước.</li>
          </ul>
          <p className="mt-5 text-sm text-muted">
            Nhập màu giữ riêng với mô hình đang phát. Kiểm tra tính khả thi của
            khối và công cụ giải sẽ được bổ sung ở các bước tiếp theo.
          </p>
          <Link href="/learn" className="ui-button ui-button--secondary mt-6">
            Tìm hiểu kiến thức cơ bản
          </Link>
        </aside>
      </section>
    </div>
  );
}
