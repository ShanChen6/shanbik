"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { CubeAlgorithm } from "../core/notation";
import { copyScramble } from "./clipboard";
import { createScrambleSession } from "./session";

export function ScramblePanel({
  canApply,
  enqueue,
  load,
}: {
  canApply: boolean;
  enqueue: (moves: CubeAlgorithm) => boolean;
  load?: (moves: CubeAlgorithm) => boolean;
}) {
  const [session] = useState(() => createScrambleSession());
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const text = useRef<HTMLTextAreaElement>(null);
  const create = () => {
    setMessage("");
    setError("");
    try {
      session.generate();
    } catch {
      setError(
        "Chưa tạo được scramble. Hãy thử lại trên trình duyệt hỗ trợ Web Crypto.",
      );
    }
  };
  const copy = async () => {
    if (!snapshot) return;
    const current = snapshot;
    const write = navigator.clipboard?.writeText
      ? (value: string) => navigator.clipboard.writeText(value)
      : undefined;
    const success = await copyScramble(current.scramble.notation, write);
    if (session.getSnapshot()?.id !== current.id) return;
    setMessage(
      success
        ? "Đã sao chép scramble."
        : "Không thể sao chép tự động. Chọn chuỗi rồi dùng Ctrl/Cmd+C hoặc chạm giữ để sao chép.",
    );
    if (!success) {
      text.current?.focus();
      text.current?.select();
    }
  };
  return (
    <section
      aria-label="Scramble 3×3"
      className="mt-4 space-y-3 rounded-panel border border-border p-4"
    >
      <h3 className="text-lg font-semibold">Scramble luyện tập 3×3</h3>
      <p className="text-sm text-muted">
        25 nước ngẫu nhiên để luyện tập. Chuỗi hiển thị trước khi áp dụng; không
        dùng làm scramble thi đấu chính thức.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={create}>
          Tạo scramble mới
        </Button>
        <Button variant="secondary" disabled={!snapshot} onClick={copy}>
          Sao chép scramble
        </Button>
        {load && (
          <Button
            variant="secondary"
            disabled={!snapshot || snapshot.applied || !canApply}
            onClick={() => {
              setError("");
              if (!session.apply(load) && !session.getSnapshot()?.applied)
                setError(
                  "Chưa nạp được. Hãy thoát chuỗi đang mở và chờ hàng đợi trống.",
                );
            }}
          >
            Nạp vào player
          </Button>
        )}
        <Button
          disabled={!snapshot || snapshot.applied || !canApply}
          onClick={() => {
            setError("");
            if (!session.apply(enqueue) && !session.getSnapshot()?.applied)
              setError(
                "Chưa áp dụng được. Hãy chờ hàng đợi trống rồi thử lại.",
              );
          }}
        >
          Áp dụng scramble
        </Button>
      </div>
      {snapshot && (
        <>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Chuỗi scramble
            <textarea
              ref={text}
              className="ui-input min-h-24 w-full resize-y font-mono"
              readOnly
              rows={3}
              value={snapshot.scramble.notation}
              spellCheck={false}
            />
          </label>
          <p role="status" className="text-sm text-muted">
            {snapshot.applied
              ? "Chuỗi đã được nạp một lần. Dùng controls của chuỗi đang mở để phát lại; tạo scramble mới để nạp lần nữa."
              : "Chưa áp dụng. Nạp hoặc áp dụng lên trạng thái hiện tại khi mô hình sẵn sàng, hàng đợi trống và đã thoát chuỗi đang mở."}
          </p>
        </>
      )}
      {message && (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
