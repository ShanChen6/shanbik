import { REMINDERS } from "../competitions/bookmarks";
import { formatResult } from "../timer/solve";
import { SyncError } from "./engine";
import {
  KIND_LABELS,
  decodeBookmark,
  decodeSolve,
  type SyncKind,
} from "./kinds";
/** Human-readable side of a conflict ("undefined" = deleted/absent). */
export function describeValue(
  kind: SyncKind,
  key: string,
  value: string | undefined,
): string {
  if (value === undefined) return "Đã xoá / không có";
  try {
    if (kind === "solves") {
      const s = decodeSolve(key, value);
      return `${formatResult(s)} · ${new Date(s.timestamp).toLocaleString("vi-VN")}`;
    }
    if (kind === "bookmarks")
      return `Đã lưu · ${REMINDERS[decodeBookmark(value).remind]}`;
    return "Có trong danh sách yêu thích";
  } catch {
    return "Dữ liệu không đọc được";
  }
}
const STAGES = {
  consent: "Cần bạn đồng ý trước lần đồng bộ đầu tiên trên thiết bị này.",
  fetch: "Không tải được dữ liệu từ tài khoản",
  read: "Không đọc được dữ liệu đang lưu trên thiết bị",
  push: "Không gửi được thay đổi lên tài khoản",
  apply:
    "Không ghi được dữ liệu vào thiết bị (có thể đã chạm giới hạn lưu trữ)",
} as const;
/** Transparent error text: what failed, for which data, and that retry is safe. */
export function describeSyncError(error: unknown): string {
  if (!(error instanceof SyncError))
    return "Đồng bộ thất bại vì lỗi không xác định. Dữ liệu trên thiết bị không bị xoá; thử lại.";
  if (error.stage === "consent") return STAGES.consent;
  const kind = error.kind ? ` (${KIND_LABELS[error.kind]})` : "";
  return `${STAGES[error.stage]}${kind}. Phần đã đồng bộ được giữ nguyên; bấm “Thử lại” để tiếp tục — thử lại không tạo bản trùng.`;
}
