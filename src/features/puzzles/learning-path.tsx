import Link from "next/link";
import { FORMULAS } from "../algorithms/catalog";
import { getPuzzle } from "../encyclopedia/catalog";
import { PUBLISHED_LESSON_LINKS } from "../learn/lessons/publication";
import { capabilitiesOf, type PuzzleId } from "./registry";
export type PathStep =
  "encyclopedia" | "lesson" | "formulas" | "practice" | "timer";
type Item = Readonly<{
  step: PathStep;
  label: string;
  detail: string;
  href: string;
}>;
/**
 * Learn → practise steps for one puzzle, built only from the capability
 * registry and published content, so a step appears only when it exists.
 * Server component: it reads the catalogs.
 */
export function learningPath(id: PuzzleId): readonly Item[] {
  const puzzle = getPuzzle(id),
    caps = capabilitiesOf(id),
    lessons = PUBLISHED_LESSON_LINKS.filter((l) => l.puzzleId === id),
    items: Item[] = [];
  if (!puzzle) return items;
  items.push({
    step: "encyclopedia",
    label: "Tìm hiểu",
    detail: `Đặc điểm và ký hiệu ${puzzle.name}`,
    href: `/puzzles/${id}`,
  });
  if (lessons.length)
    items.push({
      step: "lesson",
      label: "Học từng bước",
      detail:
        lessons.length === 1 ? lessons[0].title : `${lessons.length} bài học`,
      href: lessons.length === 1 ? lessons[0].href : "/learn",
    });
  if (FORMULAS.some((f) => f.puzzle === id))
    items.push({
      step: "formulas",
      label: "Công thức",
      detail: "Tìm, xem minh họa và luyện theo nước",
      href: "/algorithms",
    });
  if (caps.render?.kind === "cube-3x3")
    items.push({
      step: "practice",
      label: "Luyện trên mô hình",
      detail: "Scramble, nhập màu, giải và phát lời giải",
      href: caps.render.route,
    });
  else if (caps.render || caps.scramble)
    items.push({
      step: "practice",
      label: "Thực hành",
      detail: caps.render
        ? "Scramble và mô hình xoay từng nước"
        : "Scramble để luyện với khối thật",
      href: `/puzzles/${id}#workbench-title`,
    });
  if (caps.timer)
    items.push({
      step: "timer",
      label: "Bấm giờ",
      detail: "Timer, lịch sử và thống kê",
      href: caps.timer.route,
    });
  return items;
}
export function LearningPath({
  puzzle,
  current,
}: {
  puzzle: PuzzleId;
  current: PathStep;
}) {
  const items = learningPath(puzzle),
    name = getPuzzle(puzzle)?.name ?? puzzle;
  if (items.length < 2) return null;
  return (
    <nav
      aria-label={`Lộ trình ${name}`}
      className="rounded-panel border border-border bg-surface p-5 sm:p-6"
    >
      <h2 className="text-lg font-semibold">Lộ trình {name}</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item, i) => {
          const here = item.step === current;
          const body = (
            <>
              <span className="block text-xs font-semibold text-muted">
                Bước {i + 1}
                {here ? " · đang xem" : ""}
              </span>
              <span className="mt-1 block font-semibold">{item.label}</span>
              <span className="mt-1 block text-sm text-muted">
                {item.detail}
              </span>
            </>
          );
          return (
            <li key={item.step} className="min-w-0">
              {here ? (
                <div
                  aria-current="step"
                  className="h-full rounded-xl border-2 border-primary bg-surface-subtle p-3"
                >
                  {body}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className="block h-full rounded-xl border border-border p-3 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
