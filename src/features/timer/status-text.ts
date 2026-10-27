import { HISTORY_LIMIT } from "./database";
import type { HistorySnapshot, UndoEntry } from "./history-store";
import { formatResult, type Penalty } from "./solve";
export function historyStatusText(s: HistorySnapshot): string {
  switch (s.status) {
    case "loading":
      return "Đang mở lịch sử trên trình duyệt…";
    case "ready":
      if (s.busy) return "Đang lưu thay đổi…";
      return "Các lượt được lưu trong IndexedDB của trình duyệt này, không đồng bộ tài khoản.";
    case "full":
      return `Đã đủ ${HISTORY_LIMIT} lượt. Lượt mới chưa được thêm; hãy xóa bớt lượt cũ nếu muốn lưu tiếp.`;
    case "conflict":
      return "ID lượt giải bị trùng với dữ liệu khác. Giữ nguyên bản đã có.";
    case "stale":
      return "Lượt này vừa được thay đổi ở tab khác. Đã tải lại dữ liệu mới nhất và bỏ lịch sử hoàn tác.";
    case "write-failed":
      return "Chưa lưu được thay đổi. Danh sách đã được tải lại từ dữ liệu đang lưu.";
    case "unavailable":
      return s.pending
        ? "Không thể lưu vào trình duyệt. Kết quả hiện chỉ giữ trong bộ nhớ trang; hãy thử lưu lại trước khi rời trang."
        : "Không mở được bộ nhớ trình duyệt. Timer vẫn dùng được nhưng lượt mới chỉ giữ trong bộ nhớ trang.";
  }
}
export function undoText(entry: UndoEntry): string {
  return entry.kind === "delete"
    ? `Hoàn tác xóa lượt ${formatResult(entry.solve)}`
    : `Hoàn tác đổi ${penaltyName(entry.from)} → ${penaltyName(entry.to)}`;
}
export const penaltyName = (p: Penalty) => (p === "none" ? "OK" : p);
