import { getPublishedLessons } from "@/features/learn/lessons/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = {
  title: "Học Rubik cơ bản — ShanBik",
  description:
    "Làm quen với khối 3×3 và học ký hiệu U/U′ từng bước qua hướng dẫn cùng sơ đồ màu trước/sau.",
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
      {getPublishedLessons()[0] && (
        <div className="mb-6">
          <Link
            href={`/learn/lessons/${getPublishedLessons()[0].slug}`}
            className="ui-button ui-button--primary"
          >
            Mở bài U và U′
          </Link>
        </div>
      )}
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
          Bài học từng bước
        </h2>
        <p className="text-body mt-3 max-w-2xl text-muted">
          Bắt đầu với bài tập đọc ký hiệu U và U′. Mỗi bước có hướng dẫn và sơ
          đồ màu trước/sau để bạn đối chiếu với khối thật.
        </p>
        <ul aria-label="Danh sách bài học" className="mt-5 space-y-4">
          {getPublishedLessons().map((lesson) => (
            <li
              key={lesson.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <h3 className="text-lg font-bold">
                <Link
                  href={`/learn/lessons/${lesson.slug}`}
                  className="text-primary underline underline-offset-4"
                >
                  {lesson.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm text-muted">{lesson.summary}</p>
              <p className="mt-2 text-xs text-muted">
                {lesson.steps.length} bước · Minh họa 3D và sơ đồ 2D · Tự lưu vị
                trí đọc
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/practice" className="ui-button ui-button--primary">
            Khám phá khu vực luyện tập
          </Link>
          <Link href="/puzzles" className="ui-button ui-button--secondary">
            Khám phá các loại puzzle
          </Link>
          <Link href="/algorithms" className="ui-button ui-button--secondary">
            Thư viện công thức
          </Link>
          <Link href="/help" className="ui-button ui-button--secondary">
            Cần trợ giúp?
          </Link>
        </div>
      </section>
    </div>
  );
}
