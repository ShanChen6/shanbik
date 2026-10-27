import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { HistoryList } from "@/features/timer/history-list";
export const metadata: Metadata = {
  title: "Lịch sử solve — ShanBik",
  description:
    "Xem lại các lượt bấm giờ 3×3 đã lưu trên trình duyệt, đánh +2/DNF, xóa và hoàn tác.",
};
export default function SolveHistoryPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Timer 3×3"
        title="Lịch sử solve"
        description="Mọi lượt dừng ở Timer được lưu trong trình duyệt này, kể cả khi tải lại trang hoặc mất mạng. Chỉnh penalty, xóa và hoàn tác ngay trong danh sách."
      />
      <HistoryList />
    </div>
  );
}
