"use client";
import { Button } from "@/components/ui/button";
import type { SolverSnapshot, createSolverController } from "./controller";
import type { SolverErrorCode } from "./protocol";
const MESSAGES: Record<SolverErrorCode, string> = {
  INVALID_INPUT:
    "Khối chưa hợp lệ. Hãy kiểm tra và sửa bản nhập màu trước khi giải.",
  INIT_TIMEOUT:
    "Khởi tạo quá 60 giây. Đã dừng lần giải; hãy chờ rồi thử lại. Bản nhập vẫn giữ nguyên.",
  SOLVE_TIMEOUT:
    "Tìm lời giải quá 10 giây. Đã dừng lần giải; hãy chờ rồi thử lại. Bản nhập vẫn giữ nguyên.",
  WORKER_ERROR:
    "Không khởi chạy được bộ giải trong trình duyệt. Hãy kiểm tra trình duyệt hoặc thử lại; bản nhập vẫn giữ nguyên.",
  INVALID_RESULT:
    "Lời giải nhận được không vượt qua kiểm chứng. Không áp dụng lên khối. Bạn có thể thử lại.",
  RETRY_LATER:
    "Vừa dừng một lần giải. Hãy chờ một chút rồi thử lại để tránh khởi tạo liên tiếp.",
};
export function SolverPanel({
  controller,
  snapshot,
  onSolve,
  canLoad,
  onLoad,
}: {
  controller: ReturnType<typeof createSolverController>;
  snapshot: SolverSnapshot;
  onSolve: () => void;
  canLoad: boolean;
  onLoad: () => void;
}) {
  const busy =
    snapshot.status === "initializing" || snapshot.status === "solving";
  return (
    <section
      aria-label="Giải khối 3×3"
      className="min-w-0 space-y-3 rounded-panel border border-border p-4"
    >
      <h4 className="font-semibold">Tìm lời giải 3×3</h4>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onSolve} disabled={busy || snapshot.retryAt > 0}>
          {snapshot.status === "error" || snapshot.status === "cancelled"
            ? "Thử giải lại"
            : "Giải bản nhập"}
        </Button>
        <Button
          variant="secondary"
          disabled={!busy}
          onClick={() => controller.cancel()}
        >
          Hủy tìm lời giải
        </Button>
      </div>
      <p role="status" className="text-sm text-muted">
        {snapshot.status === "initializing"
          ? "Đang khởi tạo solver… Lần đầu có thể mất tới 60 giây. Bạn vẫn có thể sửa màu hoặc hủy."
          : snapshot.status === "solving"
            ? "Đang tìm lời giải… Tối đa 10 giây sau khi khởi tạo."
            : snapshot.status === "already-solved"
              ? "Khối đã solved. Không cần chạy solver và không có nước đi giả."
              : snapshot.status === "success"
                ? `Đã kiểm chứng lời giải ${snapshot.result!.moves.length} nước về solved trên bản nhập lúc gửi.`
                : snapshot.status === "cancelled"
                  ? "Đã hủy tìm lời giải. Bản nhập vẫn được giữ nguyên."
                  : "Giải từ bản nhập màu, không dùng trạng thái mô hình đang phát."}
        {snapshot.retryAt > 0
          ? " Đang chờ khoảng 2 giây trước khi có thể khởi tạo lại."
          : ""}
      </p>
      {snapshot.error && (
        <p role="alert" className="text-sm text-danger">
          {MESSAGES[snapshot.error]}
        </p>
      )}
      {snapshot.status === "success" && snapshot.result && (
        <>
          <p
            className="break-words text-sm [overflow-wrap:anywhere]"
            aria-label="Lời giải đã kiểm chứng"
          >
            {snapshot.result.notation}
          </p>
          <Button disabled={!canLoad} onClick={onLoad}>
            Nạp lời giải vào player
          </Button>
          <p className="text-sm text-muted">
            Nạp sẽ thay mô hình và chuỗi hiện tại bằng bản nhập lúc gửi cùng lời
            giải này, rồi dừng ở bước 0. Về đầu chuỗi khôi phục bản nhập đó. Đây
            là chuỗi nước giải, không phải bài giảng CFOP.
            {!canLoad ? " Cần mô hình 3D sẵn sàng để nạp." : ""}
          </p>
        </>
      )}
    </section>
  );
}
