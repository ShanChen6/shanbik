import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import Link from "next/link";
import { PageIntro } from "@/components/layout/page-intro";
import { PracticeCube } from "@/features/cube/viewer/practice-cube";
import { LearningPath } from "@/features/puzzles/learning-path";

export const metadata: Metadata = pageMetadata({
  title: "Luyện tập 3×3 — ShanBik",
  description:
    "Mô phỏng Rubik 3×3, phát thuật toán, tạo scramble và nhập màu sáu mặt trên ShanBik.",
  path: "/practice",
});

export default function PracticePage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Luyện tập 3×3"
        title="Chậm một nhịp. Hiểu thêm một bước."
        description="Không gian dành cho bạn làm quen với từng nước xoay và quan sát khối Rubik theo nhịp riêng."
      />
      <p className="mb-6">
        <Link
          href="/help#quick-start"
          className="font-semibold text-accent underline underline-offset-4"
        >
          Hướng dẫn bắt đầu nhanh
        </Link>
      </p>
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
            <li>Lấy màu từ mô hình đang dừng hoặc nhập khối thật bằng tay.</li>
            <li>Giải bản nhập và phát lời giải từng bước.</li>
            <li>Nhập và phát chuỗi thuật toán của bạn.</li>
            <li>Nhập màu sáu mặt, kiểm tra số lượng màu và tính khả thi.</li>
            <li>Tạo scramble và điều khiển phát từng bước.</li>
          </ul>
          <p className="mt-5 text-sm text-muted">
            Nhập màu giữ riêng với mô hình đang phát. Bạn có thể kiểm tra và tìm
            lời giải từ bản nhập, rồi nạp vào player để phát, tiến/lùi từng bước
            và về đầu chuỗi.
          </p>
          <Link href="/timer" className="ui-button ui-button--primary mt-6">
            Bấm giờ với khối thật
          </Link>
          <Link href="/learn" className="ui-button ui-button--secondary mt-6">
            Tìm hiểu kiến thức cơ bản
          </Link>
        </aside>
      </section>
      <div className="mt-8">
        <LearningPath puzzle="3x3" current="practice" />
      </div>
    </div>
  );
}
