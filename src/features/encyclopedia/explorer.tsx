"use client";
import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PUZZLES } from "./catalog";
import { DIFFICULTIES, SHAPES } from "./schema";
import {
  catalogURL,
  filterPuzzles,
  filterQuery,
  readFilters,
  type Filters,
} from "./filters";
import { PuzzleList } from "./puzzle-list";
function FilterFields({
  filters,
  onApply,
}: {
  filters: Filters;
  onApply: (filters: Filters) => void;
}) {
  const id = useId();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onApply(
      readFilters(
        new URLSearchParams({
          q: filters.q,
          shape: String(data.get("shape") ?? ""),
          difficulty: String(data.get("difficulty") ?? ""),
          layers: String(data.get("layers") ?? ""),
        }),
      ),
    );
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <label htmlFor={`${id}-shape`} className="block text-sm font-semibold">
        Hình dạng
      </label>
      <select
        id={`${id}-shape`}
        name="shape"
        defaultValue={filters.shape}
        className="ui-input"
      >
        <option value="">Mọi hình dạng</option>
        {Object.entries(SHAPES).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <label
        htmlFor={`${id}-difficulty`}
        className="block text-sm font-semibold"
      >
        Độ khó tham khảo
      </label>
      <select
        id={`${id}-difficulty`}
        name="difficulty"
        defaultValue={filters.difficulty}
        className="ui-input"
      >
        <option value="">Mọi mức độ</option>
        {Object.entries(DIFFICULTIES).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <label htmlFor={`${id}-layers`} className="block text-sm font-semibold">
        Số lớp NxN
      </label>
      <select
        id={`${id}-layers`}
        name="layers"
        defaultValue={filters.layers}
        className="ui-input"
      >
        <option value="">Mọi số lớp</option>
        {[2, 3, 4, 5].map((size) => (
          <option key={size} value={size}>
            {size} lớp
          </option>
        ))}
        <option value="other">Không áp dụng lưới NxN</option>
      </select>
      <p className="text-xs text-muted">
        Mức độ do ShanBik gợi ý cho việc học, không phải xếp hạng WCA. Skewb và
        các puzzle dị hình không được gán số lớp NxN.
      </p>
      <Button type="submit">Áp dụng bộ lọc</Button>
    </form>
  );
}
export function PuzzleExplorer() {
  const params = useSearchParams(),
    router = useRouter();
  const filters = readFilters(params);
  const query = filterQuery(filters);
  const puzzles = filterPuzzles(PUZZLES, filters);
  const [open, setOpen] = useState(false);
  const searchId = useId();
  useEffect(() => {
    const media = matchMedia("(min-width: 64rem)");
    const close = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);
  const apply = (next: Filters) => {
    setOpen(false);
    router.push(catalogURL(next), { scroll: false });
  };
  return (
    <div className="space-y-6">
      <form
        key={`search-${query}`}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          apply(
            readFilters(
              new URLSearchParams({
                ...filters,
                q: String(data.get("q") ?? ""),
              }),
            ),
          );
        }}
        role="search"
        aria-label="Tìm puzzle"
        className="flex flex-wrap items-end gap-3"
      >
        <label
          htmlFor={searchId}
          className="flex w-full min-w-0 flex-col gap-2 text-sm font-semibold sm:w-auto sm:flex-1"
        >
          Tìm theo tên hoặc mô tả
          <input
            id={searchId}
            type="search"
            name="q"
            maxLength={80}
            defaultValue={filters.q}
            placeholder="Ví dụ: 3×3, Pyraminx, đổi hình"
            className="ui-input min-w-0"
          />
        </label>
        <Button type="submit">Tìm puzzle</Button>
        <Link
          href="/puzzles"
          scroll={false}
          className="ui-button ui-button--secondary"
        >
          Xóa bộ lọc
        </Link>
      </form>
      <div className="lg:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">Lọc puzzle</Button>
          </DialogTrigger>
          <DialogContent
            variant="sheet"
            title="Bộ lọc puzzle"
            description="Chọn hình dạng, mức độ và số lớp rồi áp dụng. Đóng hộp thoại sẽ không đổi bộ lọc đang dùng."
          >
            <FilterFields
              key={`mobile-${query}-${open}`}
              filters={filters}
              onApply={apply}
            />
            <DialogClose asChild>
              <Button variant="ghost" className="mt-3">
                Hủy thay đổi bộ lọc
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
      <p role="status" className="text-sm text-muted">
        {puzzles.length}/{PUZZLES.length} puzzle
        {filters.q ? ` cho “${filters.q}”` : ""}
        {filters.shape ? ` · ${SHAPES[filters.shape]}` : ""}
        {filters.difficulty ? ` · ${DIFFICULTIES[filters.difficulty]}` : ""}
        {filters.layers
          ? ` · ${filters.layers === "other" ? "Không áp dụng NxN" : `${filters.layers} lớp`}`
          : ""}
        .
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside
          aria-label="Bộ lọc danh sách"
          className="hidden rounded-panel border border-border bg-surface p-5 lg:block"
        >
          <h2 className="mb-4 text-lg font-bold">Lọc puzzle</h2>
          <FilterFields
            key={`desktop-${query}`}
            filters={filters}
            onApply={apply}
          />
        </aside>
        {puzzles.length ? (
          <PuzzleList puzzles={puzzles} query={query} />
        ) : (
          <section
            aria-label="Không tìm thấy puzzle"
            className="rounded-panel border border-border p-6"
          >
            <h2 className="text-xl font-semibold">Chưa có puzzle phù hợp</h2>
            <p className="mt-3 text-muted">
              Thử tên ngắn hơn hoặc bỏ bớt bộ lọc. Chưa có kết quả không có
              nghĩa puzzle đó không tồn tại.
            </p>
            <Link
              href="/puzzles"
              className="ui-button ui-button--secondary mt-4"
              scroll={false}
            >
              Xem tất cả puzzle
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
export function CatalogBackLink() {
  const params = useSearchParams();
  return (
    <Link
      href={catalogURL(readFilters(params))}
      className="ui-button ui-button--secondary"
    >
      Về danh sách puzzle
    </Link>
  );
}
