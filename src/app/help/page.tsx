import { QuickStart } from "@/features/cube/practice/quick-start";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = {
  title: "Trợ giúp — ShanBik",
  description:
    "Thông tin về các tính năng đang xây dựng, tài khoản, giao diện và cách dùng ShanBik.",
};
const questions = [
  {
    question: "Làm sao luyện từ scramble đến lời giải?",
    answer:
      "Tạo và áp dụng scramble, chờ phát xong hoặc tạm dừng. Ở phần nhập màu, nhấn Lấy màu từ mô hình để thay bản nhập bằng trạng thái đang dừng, rồi Giải bản nhập. Nạp lời giải vào player và chọn Phát chuỗi hoặc Bước tiếp. Bạn cũng có thể nhập màu khối thật bằng tay. Về đầu chuỗi giữ snapshot lúc nạp; Đặt lại khối chỉ đưa mô hình về solved. Bắt đầu lại buổi tập xóa bản nhập, scramble, thuật toán, lịch sử và lời giải trong phiên, đồng thời reset khối. Khi 3D chưa sẵn sàng, nhập màu và tìm lời giải vẫn sử dụng được.",
  },
  {
    question: "Tôi có thể làm gì ở thời điểm hiện tại?",
    answer:
      "Bạn có thể xoay góc nhìn và zoom mô hình 3×3, đọc kiến thức nhập môn và chọn giao diện sáng hoặc tối. Bạn có thể thêm từng move vào hàng đợi, dừng sau nước đang chạy rồi tiếp tục, hủy hàng đợi hoặc đặt lại khối. Bạn có thể tạo, sao chép và áp dụng scramble luyện tập 25 nước. Player hỗ trợ phát/dừng, tiến/lùi từng bước và về đầu chuỗi. Bạn cũng có thể nhập thuật toán để phát và chọn lại từ lịch sử trong phiên. Bạn có thể nhập màu sáu mặt, kiểm tra ô thiếu và số lượng màu. Bạn có thể tìm lời giải từ bản nhập màu; lời giải được kiểm chứng trước khi hiển thị. Nhấn Nạp lời giải vào player để thay mô hình bằng bản nhập lúc gửi và phát lời giải từng bước. Về đầu chuỗi khôi phục bản nhập; Đặt lại khối trở về solved.",
  },
  {
    question: "Làm sao xoay và zoom mô hình 3D?",
    answer:
      "Dùng các nút Xoay, Phóng to, Thu nhỏ và Đặt lại góc nhìn bằng chuột hoặc Tab rồi Enter/Space. Muốn dùng gesture, chọn Bật kéo và zoom: kéo bằng chuột/một ngón tay, dùng bánh xe/trackpad hoặc chụm hai ngón tay trong khung. Tắt chế độ này để cuộn trang qua khung. Thao tác ngoài khung vẫn cuộn trang bình thường.",
  },
  {
    question: "Scramble được áp dụng như thế nào?",
    answer:
      "Tạo scramble mới chỉ hiển thị chuỗi 25 nước. Sao chép để luyện trên khối thật hoặc áp dụng một lần lên trạng thái mô hình hiện tại khi hàng đợi trống và không tạm dừng. Nạp vào player để tiến/lùi hoặc phát lại. Về đầu chuỗi khôi phục trạng thái lúc nạp; Đặt lại khối đưa về solved và đóng chuỗi. Nếu clipboard bị chặn, chọn chuỗi rồi dùng Ctrl/Cmd+C hoặc chạm giữ để copy tay. Đây là scramble luyện tập, không dùng cho thi đấu chính thức.",
  },
  {
    question: "Nhập thuật toán và lịch sử hoạt động thế nào?",
    answer:
      "Nhập 1–256 move U/R/F/D/L/B, thêm dấu prime hoặc 2, ngăn cách bằng khoảng trắng hay xuống dòng. Nhấn Phát thuật toán để chạy. Input sai được giữ lại và không đổi khối; nút Chọn vị trí lỗi giúp sửa đúng chỗ. Chuỗi mới thay phần chưa hoàn tất của chuỗi cũ từ trạng thái đã hoàn tất gần nhất. Lịch sử giữ tối đa 20 lần phát được chấp nhận trong phiên; chọn một mục chỉ điền lại nội dung, tải lại trang sẽ xóa lịch sử.",
  },
  {
    question: "Tôi nhập màu khối thật như thế nào?",
    answer:
      "Ở Nhập màu sáu mặt, giữ tâm trắng U trên và xanh lá F trước. Mỗi lưới nhìn từ ngoài mặt đó, đặt mặt kề ghi ở cạnh trên lên trên rồi đọc trái sang phải, trên xuống dưới; không phản chiếu mặt B. Chọn màu tô rồi nhấn ô, chọn Xóa ô để bỏ màu. Tâm cố định. Kiểm tra khối báo ô thiếu/số màu, rồi kiểm tra bộ màu cubie, hướng cạnh/góc và parity; giữ nguyên nội dung để sửa. Đủ 9 ô mỗi màu chưa chứng minh khối có thể giải. Bản nhập không đổi mô hình và không lưu qua reload; có thể giải bản nhập trong trình duyệt sau khi kiểm tra khả thi. Sửa màu hoặc rời trang sẽ bỏ kết quả cũ.",
  },
  {
    question: "Tôi có cần tạo tài khoản không?",
    answer:
      "Hiện bạn không cần tài khoản để xem các trang này. Các công cụ luyện tập cơ bản cũng được định hướng sử dụng mà không cần đăng nhập.",
  },
  {
    question: "Tôi có cần bật camera để giải Rubik không?",
    answer:
      "Có thể giải khối từ bản nhập màu bằng tay; chưa có quét camera. Công cụ giải nhận trạng thái nhập bằng tay; camera là một khả năng riêng được xem xét sau.",
  },
  {
    question: "Làm sao đổi giao diện?",
    answer:
      "Trên máy tính, dùng mục Giao diện ở đầu trang. Trên màn hình nhỏ, mở Menu rồi chọn Sáng, Tối hoặc Hệ thống. Lựa chọn được lưu trên trình duyệt của bạn nếu trình duyệt cho phép lưu trữ.",
  },
  {
    question: "Tôi có thể dùng bàn phím không?",
    answer:
      "Dùng Tab hoặc Shift+Tab để di chuyển giữa các liên kết và nút, Enter để mở liên kết, Escape để đóng menu. Liên kết Bỏ qua điều hướng ở đầu trang giúp đi thẳng đến nội dung.",
  },
];
export default function HelpPage() {
  return (
    <div className="site-container pb-16 sm:pb-24">
      <PageIntro
        eyebrow="Trợ giúp"
        title="Một chút hướng dẫn, trước khi bắt đầu."
        description="Tìm hiểu những gì đang có và cách khám phá ShanBik thoải mái hơn."
      />
      <QuickStart />
      <section aria-labelledby="faq-title" className="content-width">
        <h2 id="faq-title" className="text-heading mb-6">
          Câu hỏi thường gặp
        </h2>
        <dl className="grid gap-4">
          {questions.map((item) => (
            <div
              key={item.question}
              className="rounded-panel border border-border bg-surface p-6"
            >
              <dt className="text-lg font-bold">{item.question}</dt>
              <dd className="text-body mt-3 text-muted">{item.answer}</dd>
            </div>
          ))}
        </dl>
        <Link href="/" className="ui-button ui-button--secondary mt-8">
          Về trang chủ
        </Link>
      </section>
    </div>
  );
}
