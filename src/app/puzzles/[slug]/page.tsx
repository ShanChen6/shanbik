import type { Metadata } from "next";
import { pageMetadata } from "@/config/site";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageIntro } from "@/components/layout/page-intro";
import { getPuzzle, PUZZLES } from "@/features/encyclopedia/catalog";
import {
  CAPABILITIES,
  DIFFICULTIES,
  SHAPES,
  type CapabilityKey,
} from "@/features/encyclopedia/schema";
import { PuzzleMark } from "@/features/encyclopedia/puzzle-list";
import { CatalogBackLink } from "@/features/encyclopedia/explorer";
import {
  capabilitiesOf,
  hasWorkbench,
  isPuzzleId,
} from "@/features/puzzles/registry";
import { PuzzleWorkbenchLoader } from "@/features/puzzles/workbench-loader";
import { LearningPath } from "@/features/puzzles/learning-path";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbs } from "@/config/seo";
// Block serving an unknown fallback shell until static generation can return a real 404.
export const ensureStatic = "navigation";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return PUZZLES.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const puzzle = getPuzzle((await params).slug);
  if (!puzzle) notFound();
  return pageMetadata({
    title: `${puzzle.name} — Bách khoa ShanBik`,
    description: puzzle.summary,
    path: `/puzzles/${puzzle.slug}`,
    type: "article",
  });
}
export default async function PuzzlePage({ params }: Props) {
  const puzzle = getPuzzle((await params).slug);
  if (!puzzle) notFound();
  const render = capabilitiesOf(puzzle.slug).render,
    workbench = isPuzzleId(puzzle.slug) && hasWorkbench(puzzle.slug);
  return (
    <div className="site-container pb-16 sm:pb-24">
      <JsonLd
        data={breadcrumbs([
          ["Bách khoa", "/puzzles"],
          [puzzle.name, `/puzzles/${puzzle.slug}`],
        ])}
      />
      <PageIntro
        eyebrow="Bách khoa puzzle"
        title={puzzle.name}
        description={puzzle.summary}
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <Suspense
          fallback={
            <Link href="/puzzles" className="ui-button ui-button--secondary">
              Về danh sách puzzle
            </Link>
          }
        >
          <CatalogBackLink />
        </Suspense>
        {render?.kind === "cube-3x3" && (
          <Link href={render.route} className="ui-button ui-button--primary">
            Luyện tập 3×3
          </Link>
        )}
        {workbench && (
          <a href="#workbench-title" className="ui-button ui-button--primary">
            Thực hành {puzzle.name}
          </a>
        )}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="min-w-0 space-y-8 rounded-panel border border-border bg-surface p-5 sm:p-8">
          <section aria-labelledby="overview-title">
            <h2 id="overview-title" className="text-heading">
              Đặc điểm
            </h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-semibold">Hình dạng</dt>
                <dd className="mt-1 text-muted">{SHAPES[puzzle.shape]}</dd>
              </div>
              <div>
                <dt className="font-semibold">Số lớp NxN</dt>
                <dd className="mt-1 text-muted">
                  {puzzle.layers ?? "Không áp dụng"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Độ khó tham khảo</dt>
                <dd className="mt-1 text-muted">
                  {DIFFICULTIES[puzzle.difficulty]}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">
              Mức độ do ShanBik gợi ý cho việc học, không phải xếp hạng chính
              thức.
            </p>
            {puzzle.description.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-muted">
                {paragraph}
              </p>
            ))}
          </section>
          <section aria-labelledby="notation-title">
            <h2 id="notation-title" className="text-heading">
              Ký hiệu tham khảo
            </h2>
            <p className="mt-4 text-muted">{puzzle.notation.summary}</p>
            <ul
              aria-label="Ví dụ ký hiệu"
              className="my-4 flex flex-wrap gap-2"
            >
              {puzzle.notation.examples.map((example) => (
                <li
                  key={example}
                  className="rounded-sm border border-border bg-surface-subtle px-3 py-2 font-mono"
                >
                  {example}
                </li>
              ))}
            </ul>
            <a
              href={puzzle.notation.source.href}
              className="font-semibold text-primary underline underline-offset-4"
            >
              {puzzle.notation.source.title}
            </a>
            <p className="mt-3 text-xs text-muted">
              Các ví dụ minh họa ký hiệu, không phải thuật toán giải hoặc
              scramble để thi đấu.
            </p>
          </section>
          <section aria-labelledby="capabilities-title">
            <h2 id="capabilities-title" className="text-heading">
              Tính năng trên ShanBik
            </h2>
            <p className="mt-3 text-sm text-muted">
              Chỉ đánh dấu đã có khi tính năng đã nối vào sản phẩm. Thư viện có
              hỗ trợ puzzle không tự làm các mục này khả dụng.
            </p>
            <dl className="mt-4 divide-y divide-border">
              {(Object.keys(CAPABILITIES) as CapabilityKey[]).map((key) => (
                <div key={key} className="py-3">
                  <dt className="flex flex-wrap items-center gap-2 font-semibold">
                    {CAPABILITIES[key]}
                    <span
                      className={`rounded-sm border px-2 py-1 text-xs ${puzzle.capabilities[key].status === "available" ? "border-success text-success" : "border-border text-muted"}`}
                    >
                      {puzzle.capabilities[key].status === "available"
                        ? "Đã có"
                        : "Chưa có"}
                    </span>
                  </dt>
                  <dd className="mt-2 text-sm text-muted">
                    {puzzle.capabilities[key].note}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="lessons-title">
            <h2 id="lessons-title" className="text-heading">
              Bài học liên quan
            </h2>
            {puzzle.relatedLessons.length ? (
              <ul>
                {puzzle.relatedLessons.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.title}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-muted">
                Chưa có bài học giải từng bước cho {puzzle.name} trên ShanBik.
              </p>
            )}
            {!!puzzle.relatedReading.length && (
              <>
                <h3 className="mt-4 font-semibold">Đọc thêm để bắt đầu</h3>
                <ul className="mt-2 space-y-3">
                  {puzzle.relatedReading.map((link) => (
                    <li key={link.href}>
                      <Link
                        className="font-semibold text-primary underline underline-offset-4"
                        href={link.href}
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </article>
        <aside
          aria-label="Minh họa puzzle"
          className="min-w-0 space-y-3 rounded-panel border border-border bg-surface p-5"
        >
          <PuzzleMark puzzle={puzzle} />
          <p className="text-sm text-muted">
            Biểu tượng hình dạng, không phải viewer có thể xoay. Khả năng luyện
            tập được liệt kê riêng bên cạnh.
          </p>
        </aside>
      </div>
      {workbench && isPuzzleId(puzzle.slug) && (
        <div className="mt-6">
          <PuzzleWorkbenchLoader slug={puzzle.slug} name={puzzle.name} />
        </div>
      )}
      {isPuzzleId(puzzle.slug) && (
        <div className="mt-6">
          <LearningPath puzzle={puzzle.slug} current="encyclopedia" />
        </div>
      )}
    </div>
  );
}
