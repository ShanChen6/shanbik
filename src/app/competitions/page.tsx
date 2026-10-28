import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import { Suspense } from "react";
import Link from "next/link";
import { PageIntro } from "@/components/layout/page-intro";
import { COMPETITIONS } from "@/features/competitions/data";
import { CompetitionExplorer } from "@/features/competitions/explorer";
export const metadata: Metadata = pageMetadata({
  title: "Giải đấu — ShanBik",
  description:
    "Lịch giải đấu Rubik theo vùng, tháng, nội dung thi và trạng thái, với giờ địa phương và UTC rõ ràng.",
  path: "/competitions",
});
export default function CompetitionsPage() {
  const sample = COMPETITIONS.every((c) => c.sample);
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Giải đấu"
        title="Lịch giải đấu Rubik."
        description="Lọc theo vùng, tháng, nội dung thi và trạng thái. Ngày giờ ghi theo giờ địa phương nơi tổ chức, kèm múi giờ."
      />
      {sample && (
        <p
          role="note"
          className="mb-6 rounded-panel border border-warning bg-surface p-4 text-sm"
        >
          <strong>Dữ liệu mẫu.</strong> Các giải dưới đây là giải hư cấu để thử
          giao diện, không phải lịch thi thật. ShanBik chưa đăng giải thật; khi
          có, mỗi giải sẽ ghi nguồn và ngày cập nhật.
        </p>
      )}
      <Suspense fallback={<p role="status">Đang đọc bộ lọc…</p>}>
        <CompetitionExplorer competitions={COMPETITIONS} />
      </Suspense>
      <p className="mt-8 text-sm text-muted">
        Biết một giải chưa có trong danh sách?{" "}
        <Link
          href="/competitions/gop-y"
          className="font-semibold text-primary underline underline-offset-4"
        >
          Đề xuất giải mới
        </Link>
        . Đề xuất được kiểm tra nguồn trước khi đưa vào dữ liệu.
      </p>
    </div>
  );
}
