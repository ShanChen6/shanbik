"use client";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Competition } from "./schema";
import {
  DRAFT_KEY,
  EMPTY_DRAFT,
  MAX_DETAILS,
  buildIssue,
  parseDraft,
  serializeDraft,
  validateSuggestion,
  type SuggestionDraft,
  type SuggestionErrors,
} from "./suggestion";
const LABELS: Record<keyof SuggestionDraft, string> = {
  kind: "Loại góp ý",
  competitionId: "Giải cần báo lỗi",
  name: "Tên giải",
  url: "Đường dẫn nguồn (https)",
  startDate: "Ngày bắt đầu (giờ địa phương)",
  endDate: "Ngày kết thúc (giờ địa phương)",
  city: "Thành phố",
  details: "Chi tiết",
  contact: "Liên hệ (không bắt buộc, sẽ công khai)",
};
function readDraft(): SuggestionDraft {
  try {
    return parseDraft(window.localStorage.getItem(DRAFT_KEY)) ?? EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}
/**
 * Public suggestion/correction form. It never changes competition data:
 * a valid draft becomes a prefilled public GitHub issue for maintainers to
 * verify. The draft autosaves on this device so nothing is lost on errors.
 */
export function SuggestionForm({
  competitions,
}: {
  competitions: readonly Competition[];
}) {
  const params = useSearchParams();
  const [draft, setDraft] = useState<SuggestionDraft>(() => {
    const saved = readDraft(),
      id = params.get("id") ?? "";
    return competitions.some((c) => c.id === id)
      ? { ...saved, kind: "correction", competitionId: id }
      : saved;
  });
  const [errors, setErrors] = useState<SuggestionErrors>({});
  const [issue, setIssue] = useState<ReturnType<typeof buildIssue> | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const summary = useRef<HTMLDivElement>(null);
  const update = (patch: Partial<SuggestionDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setIssue(null);
    try {
      window.localStorage.setItem(DRAFT_KEY, serializeDraft(next));
      setMessage("");
    } catch {
      setMessage(
        "Không lưu được bản nháp trên trình duyệt này; đừng rời trang trước khi gửi.",
      );
    }
  };
  const field = (
    key: keyof SuggestionDraft,
    input: (props: {
      id: string;
      "aria-invalid": boolean;
      "aria-describedby"?: string;
    }) => ReactNode,
    hint?: string,
  ) => {
    const id = `suggest-${key}`,
      error = errors[key];
    const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
      .filter(Boolean)
      .join(" ");
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={id} className="text-sm font-semibold">
          {LABELS[key]}
        </label>
        {input({
          id,
          "aria-invalid": !!error,
          "aria-describedby": describedBy || undefined,
        })}
        {hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}
      </div>
    );
  };
  const text = (key: keyof SuggestionDraft, type = "text") =>
    field(key, (p) => (
      <input
        {...p}
        type={type}
        className="ui-input min-h-11"
        value={draft[key]}
        onChange={(e) => update({ [key]: e.target.value })}
      />
    ));
  const submit = () => {
    const found = validateSuggestion(draft, competitions);
    setErrors(found);
    if (Object.keys(found).length) {
      setIssue(null);
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    setIssue(buildIssue(draft, competitions));
  };
  const copy = async () => {
    if (!issue) return;
    try {
      await navigator.clipboard.writeText(`${issue.title}\n\n${issue.body}`);
      setMessage("Đã sao chép nội dung góp ý.");
    } catch {
      setMessage(
        "Không sao chép tự động được; hãy chọn và sao chép nội dung bên dưới.",
      );
    }
  };
  const errorList = Object.entries(errors) as [keyof SuggestionDraft, string][];
  return (
    <form
      noValidate
      aria-label="Góp ý giải đấu"
      className="space-y-5 rounded-panel border border-border bg-surface p-5 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">{LABELS.kind}</legend>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["new", "Đề xuất giải mới"],
              ["correction", "Báo lỗi thông tin giải"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="kind"
                value={value}
                checked={draft.kind === value}
                onChange={() => {
                  update({ kind: value });
                  setErrors({});
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {errorList.length > 0 && (
        <div
          ref={summary}
          tabIndex={-1}
          role="alert"
          className="rounded-xl border border-danger p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <p className="font-semibold">
            Chưa gửi được, cần sửa {errorList.length} mục:
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {errorList.map(([key, msg]) => (
              <li key={key}>
                <a href={`#suggest-${key}`} className="underline">
                  {LABELS[key]}
                </a>
                : {msg}
              </li>
            ))}
          </ul>
        </div>
      )}
      {draft.kind === "correction" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {field("competitionId", (p) => (
            <select
              {...p}
              className="ui-input min-h-11"
              value={draft.competitionId}
              onChange={(e) => update({ competitionId: e.target.value })}
            >
              <option value="">Chọn giải…</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ))}
          {text("url", "url")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {text("name")}
          {text("city")}
          {text("startDate", "date")}
          {text("endDate", "date")}
          <div className="sm:col-span-2">{text("url", "url")}</div>
        </div>
      )}
      {field(
        "details",
        (p) => (
          <textarea
            {...p}
            rows={5}
            maxLength={MAX_DETAILS + 10}
            className="ui-input w-full"
            value={draft.details}
            onChange={(e) => update({ details: e.target.value })}
          />
        ),
        draft.kind === "correction"
          ? "Ghi thông tin đang sai và thông tin đúng, kèm nguồn nếu có."
          : "Nội dung thi, địa điểm, lịch hoặc ghi chú khác (không bắt buộc).",
      )}
      {field(
        "contact",
        (p) => (
          <input
            {...p}
            className="ui-input min-h-11"
            value={draft.contact}
            onChange={(e) => update({ contact: e.target.value })}
          />
        ),
        "Góp ý được đăng thành GitHub issue công khai. Đừng nhập số điện thoại hoặc email nếu không muốn công khai.",
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Kiểm tra và tạo góp ý</Button>
        <Button
          variant="secondary"
          onClick={() => {
            update(EMPTY_DRAFT);
            setErrors({});
          }}
        >
          Xóa bản nháp
        </Button>
      </div>
      <p role="status" className="text-sm text-muted">
        {message || "Bản nháp tự lưu trên trình duyệt này cho tới khi bạn xóa."}
      </p>
      {issue && (
        <section
          aria-label="Góp ý đã sẵn sàng"
          className="space-y-3 rounded-xl border border-success p-4"
        >
          <p className="font-semibold">
            Góp ý hợp lệ. Bước cuối: gửi trên GitHub.
          </p>
          <p className="text-sm text-muted">
            ShanBik không sửa dữ liệu trực tiếp từ form này. Người duy trì sẽ
            kiểm tra nguồn trước khi cập nhật. Cần tài khoản GitHub để gửi.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={issue.href}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-button ui-button--primary"
            >
              Mở GitHub để gửi
            </a>
            <Button variant="secondary" onClick={copy}>
              Sao chép nội dung
            </Button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-lg bg-surface-subtle p-3 text-xs whitespace-pre-wrap">
            {`${issue.title}\n\n${issue.body}`}
          </pre>
        </section>
      )}
    </form>
  );
}
