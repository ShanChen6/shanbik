"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CubeAlgorithm } from "../core/notation";
import { MAX_QUEUE_MOVES } from "../viewer/move-queue";
import {
  rememberAlgorithm,
  submitAlgorithm,
  type HistoryEntry,
  type InputIssue,
} from "./session";

export function AlgorithmPanel({
  ready,
  play,
}: {
  ready: boolean;
  play: (moves: CubeAlgorithm) => boolean;
}) {
  const id = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const sequenceId = useRef(0);
  const [text, setText] = useState("");
  const [issues, setIssues] = useState<readonly InputIssue[]>([]);
  const [history, setHistory] = useState<readonly HistoryEntry[]>([]);
  const [status, setStatus] = useState("");
  const submit = () => {
    const result = submitAlgorithm(text, play);
    setIssues(result.issues);
    if (!result.accepted) {
      setStatus("");
      return;
    }
    const entryId = ++sequenceId.current;
    setHistory((current) =>
      rememberAlgorithm(current, result.notation, entryId),
    );
    setStatus(
      "Đã nạp và phát thuật toán. Chuỗi đang chạy trước đó đã được thay thế.",
    );
  };
  return (
    <section
      aria-label="Nhập thuật toán"
      className="mt-4 min-w-0 space-y-3 rounded-panel border border-border p-4"
    >
      <h3 className="text-lg font-semibold">Nhập thuật toán</h3>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="min-w-0 space-y-3"
      >
        <label htmlFor={id} className="block text-sm font-semibold">
          Thuật toán 3×3
        </label>
        <textarea
          id={id}
          ref={input}
          rows={4}
          value={text}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-invalid={issues.length ? true : undefined}
          aria-describedby={`${id}-hint ${id}-errors`}
          className="ui-input block w-full min-w-0 resize-y whitespace-pre-wrap break-words"
          placeholder="R U R' U'"
          onChange={(event) => {
            setText(event.target.value);
            setIssues([]);
            setStatus("");
          }}
        />
        <p id={`${id}-hint`} className="text-sm text-muted">
          Dùng U/R/F/D/L/B, dấu &apos; hoặc 2; ngăn cách bằng khoảng trắng hoặc
          xuống dòng. Tối đa {MAX_QUEUE_MOVES} move. Phát chuỗi mới hủy phần
          chưa hoàn tất của chuỗi cũ, bắt đầu từ trạng thái đã hoàn tất hiện
          tại.
        </p>
        <div id={`${id}-errors`}>
          {issues.length > 0 && (
            <div role="alert" className="space-y-2 text-sm text-danger">
              <p>Chưa phát. Hãy sửa nội dung:</p>
              <ul className="space-y-2">
                {issues.slice(0, 8).map((issue, index) => (
                  <li
                    key={index}
                    className="break-words [overflow-wrap:anywhere]"
                  >
                    {issue.message}
                    {issue.end > issue.start && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          input.current?.focus();
                          input.current?.setSelectionRange(
                            issue.start,
                            issue.end,
                          );
                        }}
                      >
                        Chọn vị trí lỗi {index + 1}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {issues.length > 8 && (
                <p>
                  Còn {issues.length - 8} lỗi. Sửa các lỗi trên rồi kiểm tra
                  lại.
                </p>
              )}
            </div>
          )}
        </div>
        <Button type="submit" disabled={!ready}>
          Phát thuật toán
        </Button>
      </form>
      <p role="status" className="text-sm text-muted">
        {status ||
          (!ready
            ? "Mô hình chưa sẵn sàng; bạn vẫn có thể nhập nội dung."
            : "Nội dung chỉ được áp dụng khi nhấn Phát thuật toán.")}
      </p>
      <h4 className="font-semibold">Lịch sử phát trong phiên</h4>
      <p className="text-sm text-muted">
        Tối đa 20 lần phát được chấp nhận, mới nhất ở trên. Không lưu sau khi
        tải lại trang. Chọn một mục chỉ điền lại nội dung.
      </p>
      {history.length ? (
        <>
          <ol aria-label="Lịch sử thuật toán" className="min-w-0 space-y-2">
            {history.map((entry) => (
              <li key={entry.id} className="min-w-0">
                <Button
                  variant="secondary"
                  className="h-auto max-w-full whitespace-normal text-left [overflow-wrap:anywhere]"
                  onClick={() => {
                    setText(entry.notation);
                    setIssues([]);
                    setStatus(
                      "Đã điền từ lịch sử. Nhấn Phát thuật toán để chạy.",
                    );
                    input.current?.focus();
                  }}
                >
                  {entry.notation}
                </Button>
              </li>
            ))}
          </ol>
          <Button variant="ghost" onClick={() => setHistory([])}>
            Xóa lịch sử
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">
          Chưa có thuật toán được phát trong phiên này.
        </p>
      )}
    </section>
  );
}
