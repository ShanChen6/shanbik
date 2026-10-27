import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/layout/page-intro";
import { PuzzleExplorer } from "@/features/encyclopedia/explorer";
export const metadata: Metadata = {
  title: "Bách khoa puzzle — ShanBik",
  description:
    "Khám phá tám loại Rubik và puzzle xoay: hình dạng, ký hiệu và tính năng thực sự có trên ShanBik.",
};
export default function PuzzlesPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Bách khoa puzzle"
        title="Nhiều hình dạng. Mỗi khối một cách khám phá."
        description="Tìm hiểu đặc điểm và ký hiệu trước khi chọn một loại puzzle để học."
      />
      <p className="mb-6 max-w-3xl text-sm text-muted">
        Danh sách là nội dung tham khảo. Hiện công cụ 3D, scramble, giải và nhập
        ảnh trên ShanBik chỉ hỗ trợ 3×3. Hình minh họa là biểu tượng, không phải
        mô hình tương tác.
      </p>
      <Suspense fallback={<p role="status">Đang đọc bộ lọc puzzle…</p>}>
        <PuzzleExplorer />
      </Suspense>
    </div>
  );
}
