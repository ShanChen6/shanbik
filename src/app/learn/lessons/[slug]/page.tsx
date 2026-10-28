import { isCubeSolved } from "@/features/cube/core/state";
import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/layout/page-intro";
import {
  getPublishedLesson,
  getPublishedLessons,
} from "@/features/learn/lessons/catalog";
import { LessonReader } from "@/features/learn/lessons/lesson-reader";
import { LearningPath } from "@/features/puzzles/learning-path";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbs } from "@/config/seo";
import { absoluteUrl } from "@/config/site";
export const ensureStatic = "navigation";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return getPublishedLessons().map((lesson) => ({ slug: lesson.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = getPublishedLesson((await params).slug);
  if (!lesson) notFound();
  return pageMetadata({
    title: `${lesson.title} — Học Rubik ShanBik`,
    description: lesson.summary,
    path: `/learn/lessons/${lesson.slug}`,
    type: "article",
  });
}
export default async function LessonPage({ params }: Props) {
  const lesson = getPublishedLesson((await params).slug);
  if (!lesson) notFound();
  return (
    <div className="site-container pb-16 sm:pb-24">
      <JsonLd
        data={{
          "@graph": [
            {
              "@type": "LearningResource",
              name: lesson.title,
              description: lesson.summary,
              inLanguage: "vi",
              learningResourceType: "Bài học",
              url: absoluteUrl(`/learn/lessons/${lesson.slug}`),
              isAccessibleForFree: true,
            },
            breadcrumbs([
              ["Học cơ bản", "/learn"],
              [lesson.title, `/learn/lessons/${lesson.slug}`],
            ]),
          ],
        }}
      />
      <PageIntro
        eyebrow="Bài học 3×3"
        title={lesson.title}
        description={lesson.summary}
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/learn" className="ui-button ui-button--secondary">
          Về trang học
        </Link>
        <Link href="/puzzles/3x3" className="ui-button ui-button--ghost">
          Tìm hiểu khối 3×3
        </Link>
      </div>
      <section
        aria-labelledby="lesson-objectives"
        className="mb-6 space-y-3 rounded-panel border border-border bg-surface p-5"
      >
        <h2 id="lesson-objectives" className="text-xl font-semibold">
          Sau bài này, bạn sẽ tập
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-muted">
          {lesson.objectives.map((goal) => (
            <li key={goal.id}>{goal.description}</li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          {lesson.prerequisiteIds.length
            ? "Bài tiên quyết:"
            : "Không cần bài học tiên quyết."}
        </p>
        {lesson.prerequisiteIds.length > 0 && (
          <ul>
            {lesson.prerequisiteIds.map((id) => {
              const required = getPublishedLessons().find(
                (item) => item.id === id,
              )!;
              return (
                <li key={id}>
                  <Link
                    className="text-primary underline"
                    href={`/learn/lessons/${required.slug}`}
                  >
                    {required.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-sm text-muted">
          Trạng thái khởi đầu:{" "}
          {isCubeSolved(lesson.initialState)
            ? "khối 3×3 đã solved."
            : "đối chiếu đủ sáu mặt với sơ đồ trước ở bước đầu."}
        </p>
        <p className="text-sm text-muted">
          Bạn có thể phát minh họa 3D của từng bước và đối chiếu sơ đồ màu 2D.
          Vị trí đang đọc tự lưu trên trình duyệt này; bước hợp lệ trong URL
          được ưu tiên khi mở liên kết. Việc xem một bước không tự đánh dấu hoàn
          thành kỹ năng.
        </p>
      </section>
      <Suspense fallback={<p role="status">Đang mở bước học…</p>}>
        <LessonReader
          key={`${lesson.id}:${lesson.contentVersion}`}
          lesson={lesson}
        />
      </Suspense>
      <div className="mt-8">
        <LearningPath puzzle={lesson.puzzleId} current="lesson" />
      </div>
    </div>
  );
}
