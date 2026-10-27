"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  DIFFICULTIES,
  FORMULAS,
  GROUPS,
  filterFormulas,
  type Difficulty,
  type Formula,
  type Group,
} from "./catalog";
import { createFavorites } from "./favorites";
const Preview = dynamic(() => import("./preview"), {
  loading: () => <p role="status">Đang chuẩn bị minh họa…</p>,
});
function CopyFormula({ formula }: { formula: Formula }) {
  const [message, setMessage] = useState("");
  return (
    <>
      <Button
        variant="secondary"
        aria-label={`Copy ${formula.name}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(formula.notation);
            setMessage("Đã copy công thức.");
          } catch {
            setMessage(
              "Không thể copy tự động. Hãy chọn và sao chép chuỗi ký hiệu phía trên.",
            );
          }
        }}
      >
        Copy
      </Button>
      <p role="status" className="text-sm text-muted">
        {message}
      </p>
    </>
  );
}
export function AlgorithmLibrary() {
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState<Group | "">(""),
    [difficulty, setDifficulty] = useState<Difficulty | "">(""),
    [onlyFavorites, setOnlyFavorites] = useState(false),
    [selected, setSelected] = useState<string | null>(null);
  const [store] = useState(() => createFavorites(() => window.localStorage));
  const favorites = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  useEffect(() => {
    store.open();
    return store.close;
  }, [store]);
  const results = filterFormulas(
    FORMULAS,
    query,
    group,
    difficulty,
    onlyFavorites ? favorites.ids : undefined,
  );
  const formula = results.find((f) => f.id === selected);
  return (
    <div className="space-y-6">
      <section
        aria-label="Tìm và lọc công thức"
        className="rounded-panel border border-border bg-surface p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <label className="space-y-2 font-semibold">
            Tìm công thức
            <input
              type="search"
              maxLength={200}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              className="ui-input w-full"
              placeholder="Tên, nhóm hoặc R U R′…"
            />
          </label>
          <label className="space-y-2 font-semibold">
            Nhóm
            <select
              className="ui-input w-full"
              aria-label="Nhóm"
              value={group}
              onChange={(e) => {
                setGroup(e.target.value as Group | "");
                setSelected(null);
              }}
            >
              <option value="">Tất cả nhóm</option>
              {Object.entries(GROUPS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 font-semibold">
            Độ khó
            <select
              className="ui-input w-full"
              aria-label="Độ khó"
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value as Difficulty | "");
                setSelected(null);
              }}
            >
              <option value="">Mọi độ khó</option>
              {Object.entries(DIFFICULTIES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            aria-pressed={onlyFavorites}
            onClick={() => {
              setOnlyFavorites((v) => !v);
              setSelected(null);
            }}
          >
            Yêu thích của tôi ({favorites.ids.length})
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setQuery("");
              setGroup("");
              setDifficulty("");
              setOnlyFavorites(false);
              setSelected(null);
            }}
          >
            Xóa bộ lọc
          </Button>
          <Button
            variant="secondary"
            disabled={!favorites.loaded || !favorites.ids.length}
            onClick={store.clear}
          >
            Xóa tất cả yêu thích
          </Button>
        </div>
        <p
          role="status"
          aria-label="Trạng thái lưu yêu thích"
          className="mt-3 text-sm text-muted"
        >
          {favorites.status === "loading"
            ? "Đang đọc yêu thích…"
            : favorites.status === "unavailable"
              ? "Không thể lưu trên trình duyệt này. Thay đổi chỉ giữ trong phiên hiện tại."
              : favorites.status === "invalid"
                ? "Dữ liệu yêu thích không hợp lệ đã được bỏ qua. Bạn có thể lưu lại lựa chọn mới."
                : "Yêu thích được lưu trên trình duyệt này, không đồng bộ tài khoản."}
        </p>
      </section>
      <p role="status" aria-label="Số công thức">
        {results.length} công thức{onlyFavorites ? " trong yêu thích" : ""}.
      </p>
      {formula && (
        <Preview
          key={formula.id}
          formula={formula}
          onClose={() => {
            setSelected(null);
            document.getElementById(`preview-${formula.id}`)?.focus();
          }}
        />
      )}
      {!results.length && (
        <div className="rounded-panel border border-border p-6">
          <h2 className="text-xl font-bold">Không có công thức phù hợp</h2>
          <p className="mt-2 text-muted">
            Thử đổi từ khóa hoặc xóa bộ lọc. Nếu danh sách yêu thích trống, hãy
            thêm công thức từ tất cả nhóm.
          </p>
        </div>
      )}
      <ul
        aria-label="Danh sách công thức"
        className="grid gap-4 md:grid-cols-2"
      >
        {results.map((item) => (
          <li
            key={item.id}
            className="min-w-0 rounded-panel border border-border bg-surface p-5"
          >
            <h2 className="text-xl font-bold">{item.name}</h2>
            <p className="mt-2 text-sm text-muted">
              3×3 · {item.groups.map((g) => GROUPS[g]).join(" / ")} ·{" "}
              {DIFFICULTIES[item.difficulty]} · {item.moves.length} nước
            </p>
            <p
              className="my-4 rounded-lg bg-surface-subtle p-3 font-mono break-words whitespace-pre-wrap"
              aria-label={`Ký hiệu ${item.name}`}
            >
              {item.notation}
            </p>
            <p className="mb-4 text-sm text-muted">{item.notes}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={!favorites.loaded}
                aria-label={`${favorites.ids.includes(item.id) ? "Bỏ yêu thích" : "Yêu thích"} ${item.name}`}
                aria-pressed={favorites.ids.includes(item.id)}
                onClick={() => store.toggle(item.id)}
              >
                {favorites.ids.includes(item.id)
                  ? "Bỏ yêu thích"
                  : "Yêu thích"}{" "}
              </Button>
              <Button
                variant="secondary"
                aria-label={`Minh họa ${item.name}`}
                id={`preview-${item.id}`}
                aria-expanded={selected === item.id}
                onClick={() =>
                  setSelected(selected === item.id ? null : item.id)
                }
              >
                Minh họa
              </Button>
              <CopyFormula formula={item} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
