import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = {
  title: "Học Rubik cơ bản — ShanBik",
  description:
    "Làm quen với khối 3×3, ký hiệu các mặt và cách học từng bước trên ShanBik.",
};
const topics = [
  {
    title: "Làm quen với khối",
    text: "Khối 3×3 có sáu mặt. Mỗi mặt có một ô tâm, giúp bạn nhận biết màu của mặt đó.",
  },
  {
    title: "Đọc ký hiệu các mặt",
    text: "U là mặt trên, D mặt dưới, L mặt trái, R mặt phải, F mặt trước và B mặt sau. Giữ cùng hướng nhìn khi đọc các ký hiệu.",
  },
  {
    title: "Học từng bước nhỏ",
    text: "Quan sát một nước đi, thử làm theo, rồi quay lại xem khi cần. Bạn không cần ghi nhớ mọi công thức ngay từ đầu.",
  },
];
export default function LearnPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Học cơ bản"
        title="Bắt đầu bằng việc hiểu khối."
        description="Một vài ý nhỏ để làm quen trước khi khám phá những bài học chi tiết."
      />
      <section aria-labelledby="learn-title">
        <h2 id="learn-title" className="text-heading mb-6">
          Ba điểm bắt đầu
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {topics.map((topic, index) => (
            <li
              key={topic.title}
              className="rounded-panel border border-border bg-surface p-6 sm:p-8"
            >
              <p
                aria-hidden="true"
                className="mb-5 font-mono font-semibold text-accent"
              >
                0{index + 1}
              </p>
              <h3 className="text-xl font-bold">{topic.title}</h3>
              <p className="text-body mt-3 text-muted">{topic.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section
        aria-labelledby="lessons-title"
        className="mt-10 rounded-panel border border-border bg-surface-subtle p-6 sm:p-8"
      >
        <h2 id="lessons-title" className="text-heading">
          Bài học chi tiết đang được chuẩn bị
        </h2>
        <p className="text-body mt-3 max-w-2xl text-muted">
          Hướng dẫn giải và minh họa công thức sẽ được bổ sung sau. Những nội
          dung trên là phần giới thiệu, chưa phải một khóa học giải Rubik đầy
          đủ.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/practice" className="ui-button ui-button--primary">
            Khám phá khu vực luyện tập
          </Link>
          <Link href="/puzzles" className="ui-button ui-button--secondary">
            Khám phá các loại puzzle
          </Link>
          <Link href="/help" className="ui-button ui-button--secondary">
            Cần trợ giúp?
          </Link>
        </div>
      </section>
    </div>
  );
}
