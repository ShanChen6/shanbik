import Link from "next/link";

export function QuickStart() {
  return (
    <section
      id="quick-start"
      aria-labelledby="quick-start-title"
      className="content-width mb-10 scroll-mt-24 space-y-4 rounded-panel border border-border bg-surface p-6"
    >
      <h2 id="quick-start-title" className="text-heading">
        Bắt đầu nhanh
      </h2>
      <p className="text-muted">
        Thử một vòng luyện tập trên mô hình trước, sau đó nhập màu khối thật nếu
        muốn.
      </p>
      <ol className="list-decimal space-y-4 pl-5 text-muted">
        <li>
          <strong>Tạo khối để luyện.</strong> Trong trang luyện tập, nhấn Tạo
          scramble mới rồi Áp dụng scramble. Chờ đủ 25/25 bước. Muốn dừng sớm,
          nhấn Tạm dừng phát và chờ nước đang chạy hoàn tất.
        </li>
        <li>
          <strong>Lấy màu hoặc nhập tay.</strong> Kéo xuống Nhập màu sáu mặt,
          nhấn Lấy màu từ mô hình. Nút này thay bản nhập hiện tại bằng màu của
          mô hình đang dừng. Với khối thật, giữ trắng U trên và xanh lá F trước,
          rồi tô theo hướng ghi ở từng mặt. Tâm cố định; đủ 9 ô mỗi màu vẫn cần
          kiểm tra tính khả thi.
        </li>
        <li>
          <strong>Giải bản nhập.</strong> Nhấn Giải bản nhập. Lần đầu có bước
          khởi tạo; bạn có thể Hủy tìm lời giải. Khi lỗi, bản nhập vẫn còn để
          sửa hoặc thử lại. Khối đã solved không cần nước đi. Chờ lời giải đã
          kiểm chứng rồi chọn Nạp lời giải vào player.
        </li>
        <li>
          <strong>Xem lời giải.</strong> Nạp sẽ thay mô hình bằng bản nhập lúc
          gửi và dừng ở bước 0. Cuộn lên player, chọn Phát chuỗi hoặc Bước
          tiếp/Bước lùi. Khi hoàn tất, trạng thái mô hình báo đã solved. Đây là
          chuỗi nước giải, không phải bài giảng CFOP.
        </li>
      </ol>
      <div className="space-y-2 text-sm text-muted">
        <p>
          <strong>Về đầu chuỗi:</strong> khôi phục bản nhập lúc nạp để xem lại
          lời giải.
        </p>
        <p>
          <strong>Đặt lại khối:</strong> đưa mô hình về solved, đóng chuỗi; bản
          nhập tay vẫn giữ.
        </p>
        <p>
          <strong>Bắt đầu lại buổi tập:</strong> đưa khối về solved và xóa bản
          nhập, scramble, thuật toán, lịch sử cùng lời giải trong phiên.
        </p>
        <p>
          Nếu 3D không dùng được, bạn vẫn có thể nhập màu và tìm lời giải để
          đọc. Lấy màu mô hình và phát player cần WebGL. Tải lại hoặc rời trang
          có thể làm mất dữ liệu phiên; chưa có lưu tài khoản.
        </p>
      </div>
      <Link href="/practice" className="ui-button ui-button--primary">
        Mở trang luyện tập
      </Link>
    </section>
  );
}
