import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import { Suspense } from "react";
import { PageIntro } from "@/components/layout/page-intro";
import { buildSearchIndex } from "@/features/search/build-index";
import { UnifiedSearch } from "@/features/search/unified-search";
export const metadata: Metadata = pageMetadata({
  title: "Tìm kiếm — ShanBik",
  description:
    "Tìm puzzle trong bách khoa, bài học từng bước và công thức 3×3 theo tên, nhóm hoặc chuỗi ký hiệu.",
  path: "/search",
  noindex: true,
});
export default function SearchPage() {
  // Only the small serializable index reaches the client, not the catalogs.
  const index = buildSearchIndex();
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Tìm kiếm"
        title="Tìm trong ShanBik."
        description="Một ô tìm cho bách khoa puzzle, bài học và thư viện công thức."
      />
      <Suspense fallback={<p role="status">Đang đọc từ khóa…</p>}>
        <UnifiedSearch index={index} />
      </Suspense>
    </div>
  );
}
