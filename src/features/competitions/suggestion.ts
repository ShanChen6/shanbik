import { formatDateRange } from "./format";
import type { Competition } from "./schema";
import { parseDate } from "./time";
export const ISSUE_URL = "https://github.com/ShanChen6/shanbik/issues/new";
export const DRAFT_KEY = "shanbik:competition-suggestion-draft:v1";
export const MAX_DETAILS = 2000;
/** Keeps the prefilled issue URL well under common URL limits. */
const MAX_BODY = 6000;
export type SuggestionKind = "new" | "correction";
export type SuggestionDraft = {
  kind: SuggestionKind;
  competitionId: string;
  name: string;
  url: string;
  startDate: string;
  endDate: string;
  city: string;
  details: string;
  contact: string;
};
export const EMPTY_DRAFT: SuggestionDraft = {
  kind: "new",
  competitionId: "",
  name: "",
  url: "",
  startDate: "",
  endDate: "",
  city: "",
  details: "",
  contact: "",
};
export type SuggestionErrors = Partial<Record<keyof SuggestionDraft, string>>;
const https = (value: string) => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
};
/** Field errors in Vietnamese; empty object means the draft can be sent. */
export function validateSuggestion(
  d: SuggestionDraft,
  known: readonly Competition[],
): SuggestionErrors {
  const e: SuggestionErrors = {};
  const t = (k: keyof SuggestionDraft) => d[k].trim();
  if (d.kind === "correction") {
    if (!known.some((c) => c.id === d.competitionId))
      e.competitionId = "Chọn giải cần báo lỗi.";
    if (t("details").length < 10)
      e.details = "Mô tả thông tin sai và thông tin đúng (ít nhất 10 ký tự).";
    if (t("url") && !https(t("url"))) e.url = "Nguồn phải là đường dẫn https.";
  } else {
    if (!t("name")) e.name = "Nhập tên giải.";
    else if (t("name").length > 120) e.name = "Tên giải tối đa 120 ký tự.";
    if (!https(t("url")))
      e.url = "Cần đường dẫn https tới trang chính thức của ban tổ chức.";
    if (!parseDate(t("startDate"))) e.startDate = "Chọn ngày bắt đầu.";
    if (!parseDate(t("endDate"))) e.endDate = "Chọn ngày kết thúc.";
    else if (!e.startDate && t("endDate") < t("startDate"))
      e.endDate = "Ngày kết thúc không được trước ngày bắt đầu.";
    if (!t("city")) e.city = "Nhập thành phố tổ chức.";
  }
  if (t("details").length > MAX_DETAILS)
    e.details = `Tối đa ${MAX_DETAILS} ký tự.`;
  if (t("contact").length > 120) e.contact = "Tối đa 120 ký tự.";
  return e;
}
/** Prefilled GitHub issue; nothing is written to the competition data. */
export function buildIssue(
  d: SuggestionDraft,
  known: readonly Competition[],
): { title: string; body: string; href: string } {
  const c = known.find((x) => x.id === d.competitionId);
  const title =
    d.kind === "correction"
      ? `[Giải đấu] Báo lỗi: ${c?.name ?? d.competitionId}`
      : `[Giải đấu] Đề xuất: ${d.name.trim()}`;
  const lines =
    d.kind === "correction"
      ? [
          `**Giải:** ${c?.name ?? d.competitionId} (\`${d.competitionId}\`)`,
          c
            ? `**Ngày đang ghi:** ${formatDateRange(c.startDate, c.endDate)}`
            : "",
          d.url.trim() ? `**Nguồn xác nhận:** ${d.url.trim()}` : "",
          "",
          "**Thông tin cần sửa:**",
          d.details.trim(),
        ]
      : [
          `**Tên giải:** ${d.name.trim()}`,
          `**Ngày (giờ địa phương):** ${d.startDate} → ${d.endDate}`,
          `**Thành phố:** ${d.city.trim()}`,
          `**Trang chính thức:** ${d.url.trim()}`,
          "",
          d.details.trim() ? `**Ghi chú:**\n${d.details.trim()}` : "",
        ];
  if (d.contact.trim())
    lines.push("", `**Liên hệ (công khai):** ${d.contact.trim()}`);
  lines.push(
    "",
    "_Gửi từ form góp ý ShanBik. Dữ liệu chỉ được sửa sau khi người duy trì kiểm tra nguồn._",
  );
  let body = lines.filter((l, i, a) => l || a[i - 1]).join("\n");
  if (body.length > MAX_BODY) body = body.slice(0, MAX_BODY) + "\n…";
  const href = `${ISSUE_URL}?${new URLSearchParams({ title, body })}`;
  return { title, body, href };
}
export function parseDraft(raw: string | null): SuggestionDraft | null {
  if (!raw || raw.length > 10_000) return null;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    if (!v || typeof v !== "object" || v.version !== 1) return null;
    const draft = { ...EMPTY_DRAFT };
    for (const key of Object.keys(EMPTY_DRAFT) as (keyof SuggestionDraft)[]) {
      const value = (v.draft as Record<string, unknown> | undefined)?.[key];
      if (typeof value === "string")
        (draft[key] as string) = value.slice(0, MAX_DETAILS + 10);
    }
    if (draft.kind !== "new" && draft.kind !== "correction") draft.kind = "new";
    return draft;
  } catch {
    return null;
  }
}
export const serializeDraft = (d: SuggestionDraft) =>
  JSON.stringify({ version: 1, draft: d });
