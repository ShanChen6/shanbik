import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import { PageIntro } from "@/components/layout/page-intro";
import { StatsDashboard } from "@/features/timer/stats-dashboard";
export const metadata: Metadata = pageMetadata({
  title: "Thống kê timer — ShanBik",
  description:
    "Best, mean, Ao5, Ao12 và trung bình phiên từ các lượt bấm giờ 3×3 đã lưu, có biểu đồ xu hướng và bảng dữ liệu.",
  path: "/timer/stats",
  noindex: true,
});
export default function TimerStatsPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Timer 3×3"
        title="Thống kê"
        description="Tính từ lịch sử solve trên trình duyệt này, áp dụng +2 và DNF. Lọc theo phiên để xem từng ngày luyện tập."
      />
      <StatsDashboard />
    </div>
  );
}
