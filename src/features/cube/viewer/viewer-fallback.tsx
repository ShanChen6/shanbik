import Link from "next/link";

export function ViewerFallback() {
  return (
    <div
      role="status"
      className="flex h-full min-h-64 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <p className="font-semibold">Không thể hiển thị mô hình 3D</p>
      <p className="max-w-sm text-sm text-muted">
        WebGL có thể chưa khả dụng hoặc kết nối đồ họa đã bị gián đoạn. Bạn vẫn
        có thể đọc phần học cơ bản và trợ giúp.
      </p>
      <Link href="/help" className="ui-button ui-button--secondary mt-2">
        Xem trợ giúp
      </Link>
    </div>
  );
}
