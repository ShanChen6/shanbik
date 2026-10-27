"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { FACE_ORDER } from "../cube/core/constants";
import { copyScramble } from "../cube/scramble/clipboard";
import { MEGAMINX_ROW_LENGTH } from "./megaminx/notation";
import {
  applyNxnAlgorithm,
  isNxnSolved,
  parseNxnAlgorithm,
  serializeNxnMove,
  solvedNxn,
  type NxnMove,
} from "./nxn/model";
import { NxnNetView } from "./nxn/net-view";
import { NxnViewport } from "./nxn/nxn-viewport";
import {
  applyPyraminxAlgorithm,
  isPyraminxSolved,
  parsePyraminxAlgorithm,
  serializePyraminxMove,
  solvedPyraminx,
  type PyraminxMove,
} from "./pyraminx/model";
import { PyraminxNetView } from "./pyraminx/net-view";
import { PUZZLE_REGISTRY, type PuzzleId } from "./registry";
import { createScrambleClient } from "./scramble/client";
import type { ScramblePuzzle } from "./scramble/protocol";
const HISTORY_SHOWN = 30;
function ScrambleCard({
  puzzle,
  name,
  onApply,
}: {
  puzzle: ScramblePuzzle;
  name: string;
  onApply?: (scramble: string) => void;
}) {
  const [client] = useState(() => createScrambleClient(puzzle));
  const s = useSyncExternalStore(
    client.subscribe,
    client.getSnapshot,
    client.getServerSnapshot,
  );
  const [message, setMessage] = useState("");
  const text = useRef<HTMLDivElement>(null);
  useEffect(() => () => client.release(), [client]);
  const rows =
    s.scramble && puzzle === "megaminx"
      ? Array.from({ length: 7 }, (_, r) =>
          s
            .scramble!.split(" ")
            .slice(r * MEGAMINX_ROW_LENGTH, (r + 1) * MEGAMINX_ROW_LENGTH)
            .join(" "),
        )
      : s.scramble
        ? [s.scramble]
        : [];
  const copy = async () => {
    if (!s.scramble) return;
    const value = s.scramble;
    const ok = await copyScramble(
      puzzle === "megaminx" ? rows.join("\n") : value,
      navigator.clipboard?.writeText
        ? (v) => navigator.clipboard.writeText(v)
        : undefined,
    );
    if (client.getSnapshot().scramble !== value) return;
    setMessage(
      ok
        ? "Đã sao chép scramble."
        : "Không thể sao chép tự động. Chọn chuỗi rồi dùng Ctrl/Cmd+C hoặc chạm giữ để sao chép.",
    );
    if (!ok && text.current)
      window.getSelection()?.selectAllChildren(text.current);
  };
  return (
    <section
      aria-label={`Scramble ${name}`}
      className="space-y-3 rounded-xl border border-border p-4"
    >
      <h3 className="font-semibold">Scramble {name}</h3>
      <div
        ref={text}
        aria-label="Chuỗi scramble"
        aria-busy={s.status === "generating"}
        className="min-h-12 rounded-lg bg-surface-subtle p-3 font-mono break-words"
      >
        {rows.length
          ? rows.map((row, i) => <p key={i}>{row}</p>)
          : "Chưa có scramble. Chọn Tạo scramble."}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          loading={s.status === "generating"}
          onClick={() => {
            setMessage("");
            client.generate();
          }}
        >
          Tạo scramble
        </Button>
        <Button variant="secondary" disabled={!s.scramble} onClick={copy}>
          Sao chép
        </Button>
        {onApply && (
          <Button
            variant="secondary"
            disabled={!s.scramble || s.status === "generating"}
            onClick={() => onApply(s.scramble!)}
          >
            Áp dụng lên mô hình đã giải
          </Button>
        )}
      </div>
      <p role="status" className="text-sm text-muted">
        {s.status === "generating"
          ? s.cold
            ? "Đang tạo scramble… Lần đầu cần tải bộ sinh trong Worker, có thể mất vài giây."
            : "Đang tạo scramble…"
          : s.status === "error"
            ? s.error === "timeout"
              ? "Tạo scramble quá thời gian chờ. Hãy thử lại."
              : "Chưa tạo được scramble (Worker bị chặn hoặc kết quả không hợp lệ). Hãy thử lại."
            : message}
      </p>
      <p className="text-xs text-muted">
        Do cubing.js tạo và ShanBik kiểm tra ký hiệu trước khi hiển thị. Dùng để
        luyện tập; chưa kiểm định là scramble thi đấu chính thức.
      </p>
    </section>
  );
}
function MoveButtons({
  title,
  tokens,
  onMove,
}: {
  title: string;
  tokens: readonly string[];
  onMove: (token: string) => void;
}) {
  return (
    <div role="group" aria-label={title} className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {tokens.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onMove(t)}
            className="min-h-11 rounded-lg border border-control-border bg-surface font-mono font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-surface-subtle"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
function History({
  moves,
  solved,
  onReset,
}: {
  moves: readonly string[];
  solved: boolean;
  onReset: () => void;
}) {
  return (
    <div className="space-y-2">
      <p
        role="status"
        aria-label="Trạng thái mô hình"
        className="font-semibold"
      >
        {solved ? "Đã giải" : "Chưa giải"} · {moves.length} nước
      </p>
      {moves.length > 0 && (
        <p className="font-mono text-sm break-words text-muted">
          {moves.length > HISTORY_SHOWN && "… "}
          {moves.slice(-HISTORY_SHOWN).join(" ")}
        </p>
      )}
      <Button variant="secondary" disabled={!moves.length} onClick={onReset}>
        Đặt lại trạng thái đã giải
      </Button>
    </div>
  );
}
function NxnPractice({ size, name }: { size: 2 | 4; name: string }) {
  const [moves, setMoves] = useState<readonly NxnMove[]>([]);
  const [wide, setWide] = useState(false);
  const state = applyNxnAlgorithm(solvedNxn(size), moves);
  const push = (text: string) =>
    setMoves((m) => [...m, ...parseNxnAlgorithm(text, size)]);
  const tokens = FACE_ORDER.flatMap((f) => {
    const base = wide ? `${f}w` : f;
    return [base, `${base}'`, `${base}2`];
  });
  const scramble = PUZZLE_REGISTRY[size === 2 ? "2x2" : "4x4"].scramble;
  return (
    <div className="space-y-5">
      {scramble?.kind === "cubing-worker" && (
        <ScrambleCard
          puzzle={scramble.puzzle}
          name={name}
          onApply={(text) => setMoves(parseNxnAlgorithm(text, size))}
        />
      )}
      <NxnViewport state={state} />
      <NxnNetView state={state} />
      <History
        moves={moves.map(serializeNxnMove)}
        solved={isNxnSolved(state)}
        onReset={() => setMoves([])}
      />
      {size === 4 && (
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={wide}
            onChange={(e) => setWide(e.target.checked)}
          />
          Nước rộng (w): xoay hai lớp ngoài
        </label>
      )}
      <MoveButtons
        title={wide ? "Xoay hai lớp ngoài" : "Xoay mặt ngoài"}
        tokens={tokens}
        onMove={push}
      />
    </div>
  );
}
function PyraminxPractice({ name }: { name: string }) {
  const [moves, setMoves] = useState<readonly PyraminxMove[]>([]);
  const state = applyPyraminxAlgorithm(solvedPyraminx(), moves);
  const push = (text: string) =>
    setMoves((m) => [...m, ...parsePyraminxAlgorithm(text)]);
  return (
    <div className="space-y-5">
      <ScrambleCard
        puzzle="pyraminx"
        name={name}
        onApply={(text) => setMoves(parsePyraminxAlgorithm(text))}
      />
      <PyraminxNetView state={state} />
      <p className="text-sm text-muted">
        Cầm mặt xanh lá hướng về bạn, mặt vàng ở đáy. U là đỉnh trên, L/R là hai
        đỉnh dưới phía trước, B là đỉnh sau. Chiều thuận là chiều kim đồng hồ
        khi nhìn thẳng vào đỉnh đó.
      </p>
      <History
        moves={moves.map(serializePyraminxMove)}
        solved={isPyraminxSolved(state)}
        onReset={() => setMoves([])}
      />
      <MoveButtons
        title="Xoay hai lớp (U L R B)"
        tokens={["U", "U'", "L", "L'", "R", "R'", "B", "B'"]}
        onMove={push}
      />
      <MoveButtons
        title="Xoay đỉnh nhỏ (u l r b)"
        tokens={["u", "u'", "l", "l'", "r", "r'", "b", "b'"]}
        onMove={push}
      />
    </div>
  );
}
/** Practice tools on /puzzles/[slug], chosen strictly from the capability registry. */
export function PuzzleWorkbench({
  slug,
  name,
}: {
  slug: PuzzleId;
  name: string;
}) {
  const caps = PUZZLE_REGISTRY[slug];
  const render = caps.render;
  // The section and heading are server-rendered by the loader so
  // #workbench-title links work before this client chunk loads.
  return render?.kind === "nxn" ? (
    <NxnPractice size={render.size} name={name} />
  ) : render?.kind === "pyraminx-net" ? (
    <PyraminxPractice name={name} />
  ) : caps.scramble?.kind === "cubing-worker" ? (
    <ScrambleCard puzzle={caps.scramble.puzzle} name={name} />
  ) : null;
}
