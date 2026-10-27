import Link from "next/link";
import { DIFFICULTIES, SHAPES, type Puzzle } from "./schema";
export function PuzzleMark({ puzzle }: { puzzle: Puzzle }) {
  const size = puzzle.layers ?? 1;
  return (
    <div
      aria-hidden="true"
      className="flex h-32 items-center justify-center rounded-xl border border-border bg-surface-subtle text-primary"
    >
      <svg
        viewBox="0 0 100 100"
        className="h-24 w-24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {puzzle.shape === "tetrahedron" ? (
          <path d="M50 9 94 88H6ZM50 9V60L94 88M50 60 6 88" />
        ) : puzzle.shape === "dodecahedron" ? (
          <path d="M50 6 94 38 77 91H23L6 38ZM50 24 76 43 66 73H34L24 43ZM50 6V24M94 38 76 43M77 91 66 73M23 91 34 73M6 38 24 43" />
        ) : puzzle.shape === "shapeshifter" ? (
          <>
            <path d="M14 12H80V36H14ZM6 40H94V60H6ZM24 64H90V88H24" />
            <path d="M45 12V36M53 64V88M6 50H94" />
          </>
        ) : (
          <>
            <rect x="10" y="10" width="80" height="80" rx="4" />
            {puzzle.layers ? (
              Array.from({ length: size - 1 }, (_, index) => {
                const at = 10 + ((index + 1) * 80) / size;
                return (
                  <g key={index}>
                    <path d={`M${at} 10V90M10 ${at}H90`} />
                  </g>
                );
              })
            ) : (
              <path d="M50 10 90 50 50 90 10 50Z" />
            )}
          </>
        )}
      </svg>
    </div>
  );
}
export function PuzzleList({
  puzzles,
  query = "",
}: {
  puzzles: readonly Puzzle[];
  query?: string;
}) {
  return (
    <ul
      aria-label="Danh sách puzzle"
      className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {puzzles.map((puzzle) => (
        <li
          key={puzzle.slug}
          className="min-w-0 rounded-panel border border-border bg-surface p-5"
        >
          <PuzzleMark puzzle={puzzle} />
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
            <span>{SHAPES[puzzle.shape]}</span>
            <span>· {DIFFICULTIES[puzzle.difficulty]}</span>
            <span>
              · {puzzle.layers ? `${puzzle.layers} lớp NxN` : "Không gán N"}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-bold">
            <Link
              href={`/puzzles/${puzzle.slug}${query ? `?${query}` : ""}`}
              className="rounded-sm underline decoration-border underline-offset-4 hover:text-primary"
            >
              {puzzle.name}
            </Link>
          </h2>
          <p className="mt-3 text-sm text-muted">{puzzle.summary}</p>
          <p
            className={`mt-4 text-sm font-semibold ${puzzle.capabilities.viewer.status === "available" ? "text-success" : "text-muted"}`}
          >
            {puzzle.capabilities.viewer.status === "available"
              ? "Có công cụ luyện tập trên ShanBik"
              : "Hiện có nội dung tham khảo"}
          </p>
        </li>
      ))}
    </ul>
  );
}
