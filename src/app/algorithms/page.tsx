import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import { Suspense } from "react";
import { PageIntro } from "@/components/layout/page-intro";
import { AlgorithmLibrary } from "@/features/algorithms/library";
import { LearningPath } from "@/features/puzzles/learning-path";
export const metadata: Metadata = pageMetadata({
  title: "Thư viện công thức 3×3 — ShanBik",
  description:
    "Tìm công thức Rubik 3×3 theo tên, nhóm, ký hiệu và độ khó. Copy, xem minh họa và lưu yêu thích trên trình duyệt.",
  path: "/algorithms",
});
export default function AlgorithmsPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Thư viện công thức"
        title="Tìm, thử và ghi nhớ từng chuỗi xoay."
        description="Bộ mẫu 3×3 cho Beginner và CFOP: F2L, OLL, PLL. Chọn công thức phù hợp để copy, xem minh họa hoặc lưu vào danh sách yêu thích."
      />
      <p className="mb-6 max-w-3xl text-muted">
        Đây là bộ mẫu, chưa bao gồm toàn bộ trường hợp F2L/OLL/PLL. Độ khó mang
        tính gợi ý. Ký hiệu hỗ trợ U/D/L/R/F/B, dấu ′ và 2; giữ nguyên hướng
        khối khi thực hiện. Chọn Minh họa rồi Phát công thức để xem; trang không
        tự phát.
      </p>
      <Suspense fallback={<p role="status">Đang mở thư viện…</p>}>
        <AlgorithmLibrary />
      </Suspense>
      <p className="mt-8 text-sm text-muted">
        Tham khảo tầng cuối:{" "}
        <a
          href="https://www.cubeskills.com/uploads/pdf/tutorials/2-look-last-layer.pdf"
          className="underline underline-offset-4"
        >
          CubeSkills — Last Layer
        </a>
        . Mô tả và trạng thái minh họa được biên soạn cho ShanBik.
      </p>
      <div className="mt-8">
        <LearningPath puzzle="3x3" current="formulas" />
      </div>
    </div>
  );
}
