import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import { Suspense } from "react";
import { PageIntro } from "@/components/layout/page-intro";
import { COMPETITIONS } from "@/features/competitions/data";
import { SuggestionForm } from "@/features/competitions/suggestion-form";
export const metadata: Metadata = pageMetadata({
  title: "Góp ý giải đấu — ShanBik",
  description:
    "Đề xuất giải đấu mới hoặc báo thông tin sai. Góp ý được kiểm tra nguồn trước khi cập nhật dữ liệu.",
  path: "/competitions/gop-y",
});
export default function SuggestionPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Giải đấu"
        title="Đề xuất hoặc báo lỗi."
        description="Gửi giải mới kèm trang chính thức của ban tổ chức, hoặc chỉ ra thông tin chưa đúng. Góp ý không tự thay đổi danh sách giải."
      />
      <Suspense fallback={<p role="status">Đang mở form…</p>}>
        <SuggestionForm competitions={COMPETITIONS} />
      </Suspense>
    </div>
  );
}
