"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import {
  MAX_QUERY,
  SEARCH_KINDS,
  searchEntries,
  type SearchEntry,
  type SearchKind,
} from "./match";
const SUGGESTIONS = ["3x3", "Pyraminx", "PLL", "R U R' U'", "U'"];
const SECTIONS = [
  { href: "/puzzles", label: "Bách khoa puzzle" },
  { href: "/learn", label: "Học cơ bản" },
  { href: "/algorithms", label: "Thư viện công thức" },
];
/**
 * Live search over puzzles, lessons and formulas. The query is kept in
 * `?q=` with history.replaceState so results can be shared or reloaded.
 * Keyboard: ↓ from the box enters the results, ↑/↓/Home/End move between
 * them, Escape returns to the box.
 */
export function UnifiedSearch({ index }: { index: readonly SearchEntry[] }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(() =>
    (params.get("q") ?? "").slice(0, MAX_QUERY),
  );
  const input = useRef<HTMLInputElement>(null),
    list = useRef<HTMLDivElement>(null),
    statusId = useId();
  const groups = searchEntries(index, query),
    total = groups.puzzle.length + groups.lesson.length + groups.formula.length,
    trimmed = query.trim();
  const update = (value: string) => {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.pathname + url.search);
  };
  const links = () =>
    Array.from(
      list.current?.querySelectorAll<HTMLAnchorElement>("a[data-result]") ?? [],
    );
  const onBoxKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && total) {
      e.preventDefault();
      links()[0]?.focus();
    }
  };
  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const all = links(),
      at = all.indexOf(document.activeElement as HTMLAnchorElement);
    const go = (i: number) => {
      e.preventDefault();
      all[Math.max(0, Math.min(all.length - 1, i))]?.focus();
    };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") {
      if (at <= 0) {
        e.preventDefault();
        input.current?.focus();
      } else go(at - 1);
    } else if (e.key === "Home" && at >= 0) go(0);
    else if (e.key === "End" && at >= 0) go(all.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      input.current?.focus();
    }
  };
  return (
    <div className="space-y-6">
      <form
        role="search"
        aria-label="Tìm trong ShanBik"
        className="rounded-panel border border-border bg-surface p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          links()[0]?.focus();
        }}
      >
        <label className="block space-y-2 font-semibold">
          Tìm puzzle, bài học hoặc công thức
          <input
            ref={input}
            type="search"
            name="q"
            value={query}
            maxLength={MAX_QUERY}
            autoComplete="off"
            aria-describedby={statusId}
            onChange={(e) => update(e.target.value)}
            onKeyDown={onBoxKey}
            className="ui-input w-full"
            placeholder="Ví dụ: 3x3, PLL, R U R′ U′"
          />
        </label>
        <p className="mt-3 text-sm text-muted">
          Không cần gõ dấu. Nhấn ↓ để đi vào kết quả, ↑/↓ để chuyển, Esc để quay
          lại ô tìm.
        </p>
      </form>
      <p id={statusId} role="status" className="font-semibold">
        {!trimmed
          ? "Nhập từ khóa để tìm trong bách khoa, bài học và thư viện công thức."
          : total
            ? `${total} kết quả cho “${trimmed}”.`
            : `Không tìm thấy kết quả cho “${trimmed}”.`}
      </p>
      {total > 0 ? (
        <div ref={list} onKeyDown={onListKey} className="space-y-6">
          {(Object.keys(SEARCH_KINDS) as SearchKind[]).map(
            (kind) =>
              groups[kind].length > 0 && (
                <section
                  key={kind}
                  aria-labelledby={`search-${kind}`}
                  className="space-y-3"
                >
                  <h2 id={`search-${kind}`} className="text-heading">
                    {SEARCH_KINDS[kind]}{" "}
                    <span className="text-base font-normal text-muted">
                      ({groups[kind].length})
                    </span>
                  </h2>
                  <ul className="space-y-2">
                    {groups[kind].map((e) => (
                      <li key={e.id}>
                        <Link
                          data-result
                          href={e.href}
                          className="block min-w-0 rounded-xl border border-border bg-surface p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <span className="block font-semibold text-primary">
                            {e.title}
                          </span>
                          <span className="mt-1 block text-sm break-words text-muted">
                            {e.detail}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ),
          )}
        </div>
      ) : (
        <section
          aria-label="Gợi ý tìm kiếm"
          className="space-y-4 rounded-panel border border-border bg-surface p-5 sm:p-6"
        >
          <p className="text-muted">
            {trimmed
              ? "Thử một từ khóa ngắn hơn, tên puzzle khác hoặc chuỗi ký hiệu như R U R′ U′."
              : "Gợi ý:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  update(s);
                  input.current?.focus();
                }}
                className="min-h-11 rounded-full border border-control-border bg-surface px-4 font-mono text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted">Hoặc duyệt theo mục:</p>
          <ul className="flex flex-wrap gap-3">
            {SECTIONS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="ui-button ui-button--secondary">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
