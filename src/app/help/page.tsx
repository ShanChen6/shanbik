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
    question: "Dùng timer với khối thật thế nào?",
    answer:
      "Mở Timer trong menu hoặc Bấm giờ với khối thật ở trang Luyện tập. Chuẩn bị khối theo scramble 25 nước, chọn quan sát 15 giây nếu muốn. Chạm giữ vùng timer hoặc focus vùng đó, giữ Space 0,3 giây đến khi sẵn sàng rồi thả. Khi đang chạy, nhấn Space/chạm vùng timer để dừng và lưu; có thể dùng các nút Bắt đầu/Dừng nếu không muốn giữ. Space chỉ tác động khi vùng timer có focus. Quan sát quá 15 giây chỉ nhắc, chưa tự áp dụng +2/DNF. Hủy hoặc rời trang trước khi dừng không lưu lượt; đổi tab vẫn tính thời gian đã trôi qua. Kết quả và lượt gần nhất giữ qua reload nếu trình duyệt cho phép lưu. Nếu báo lỗi lưu, giữ trang và chọn Thử lưu lại. Chọn OK/+2/DNF cho lượt vừa giải, hoặc mở Xem lịch sử solve để đổi penalty, xóa và hoàn tác các lượt cũ; +2 cộng 2 giây, DNF là không hoàn thành, thời gian đo gốc vẫn được giữ. Trang Thống kê tính tốt nhất, trung bình, Ao5, Ao12 và trung bình phiên (theo ngày), có biểu đồ xu hướng và bảng dữ liệu; Ao5/Ao12 bỏ một lượt tốt nhất và một kém nhất, hai DNF trở lên là DNF; scramble hiện là random-move luyện tập, không phải scramble thi đấu chính thức.",
  },
  {
    question: "Luyện 2×2, 4×4, Pyraminx hoặc Megaminx thế nào?",
    answer:
      "Mở Bách khoa, chọn puzzle rồi chọn Thực hành. Tạo scramble để luyện với khối thật; lần đầu có thể mất vài giây vì bộ sinh chạy trong Worker. Với 2×2 và 4×4, áp dụng scramble lên mô hình 3D và sơ đồ sáu mặt, hoặc xoay từng nước bằng nút; 4×4 có tùy chọn nước rộng (w). Pyraminx dùng sơ đồ phẳng bốn mặt với nút U/L/R/B và đỉnh nhỏ u/l/r/b; cầm mặt xanh lá hướng về bạn, mặt vàng ở đáy. Megaminx hiện chỉ có scramble bảy dòng theo WCA. Các puzzle này chưa có tìm lời giải, nhập trạng thái hay timer; scramble dùng để luyện tập, chưa kiểm định là scramble thi đấu chính thức.",
  },
  {
    question: "Xem lịch giải đấu ở đâu?",
    answer:
      "Mở Giải đấu trong menu. Lọc theo vùng, tháng, nội dung thi hoặc trạng thái; bộ lọc nằm trên URL để chia sẻ. Ngày giờ ghi theo giờ địa phương nơi tổ chức kèm múi giờ; trang chi tiết có thêm cột UTC và giờ theo múi giờ máy bạn. Hiện danh sách chỉ là dữ liệu mẫu để thử giao diện, chưa phải giải thật; khi có giải thật, mỗi giải ghi nguồn và ngày cập nhật. Luôn kiểm tra trang của ban tổ chức trước khi đăng ký. Bấm Lưu giải để giữ trên trình duyệt này và lọc Chỉ giải đã lưu; ở trang chi tiết, chọn mức báo trước rồi Tải tệp lịch (.ics) để ứng dụng lịch trên máy nhắc bạn. Thấy thông tin sai hoặc muốn đề xuất giải, dùng form Góp ý: nội dung được kiểm tra trước khi cập nhật và gửi dưới dạng GitHub issue công khai.",
  },
  {
    question: "Tìm và lưu công thức ở đâu?",
    answer:
      "Mở Công thức trong menu hoặc Thư viện công thức ở Học cơ bản. Tìm theo tên, biệt danh, nhóm hoặc chuỗi ký hiệu; có thể gõ không dấu. Kết hợp nhóm và độ khó, rồi chọn Copy, Minh họa hoặc Yêu thích. Minh họa không tự chạy: chọn Phát công thức để đưa trạng thái mẫu về khối đã giải. Yêu thích của tôi là danh sách riêng trên trình duyệt hiện tại, được giữ qua tải lại nếu bộ nhớ cho phép. Xóa bộ lọc không xóa yêu thích; Xóa tất cả yêu thích chỉ xóa danh sách này. Khi copy bị chặn, chọn chuỗi ký hiệu để sao chép thủ công. Trong minh họa, dùng Nước tiếp/lùi, thanh Chọn vị trí hoặc nút từng nước để xem khối sau nước đó. Tab và phím mũi tên/Home/End dùng được trên thanh vị trí. Chọn tốc độ, chiều đảo và số lượt lặp; đổi chiều/lượt sẽ về đầu và dừng. Lặp nối tiếp trên khối hiện tại. Ghi chú, tùy chọn và dấu hoàn thành do bạn chọn được lưu riêng từng công thức, không tự đánh dấu khi phát xong. Xóa dữ liệu luyện tập công thức này không xóa yêu thích. Bộ mẫu chưa bao gồm toàn bộ trường hợp F2L/OLL/PLL.",
  },
  {
    question: "Tôi mở bài học U và U′ ở đâu?",
    answer:
      "Vào Học cơ bản rồi chọn Mở bài U và U′. Bài gồm ba bước quan sát, U và U′, có hướng dẫn và sơ đồ màu trước/sau. Dùng Bước trước, Bước tiếp hoặc Chọn bước học; URL giữ bước đang xem để mở lại hoặc chia sẻ. Dùng Phát minh họa để xem 3D, Nước tiếp/lùi để xem từng nước và Về trước bước để khôi phục đầu bước. Trang tự lưu bước đang đọc trên thiết bị này; mở lại bài để tiếp tục, hoặc Xóa vị trí đã lưu để bắt đầu lại. URL có bước hợp lệ được ưu tiên. Không tự đánh dấu hoàn thành; hướng dẫn và sơ đồ 2D vẫn dùng được khi không có WebGL hoặc bộ nhớ bị chặn.",
  },
  {
    question: "Bách khoa có nghĩa tôi đã chơi được mọi loại Rubik chưa?",
    answer:
      "Bách khoa giới thiệu tám puzzle và cho tìm theo tên, hình dạng, mức độ hoặc số lớp NxN. Mỗi trang chi tiết ghi rõ từng tính năng đã có/chưa có. 3×3 có đủ luyện tập, solver và nhập ảnh. 2×2, 4×4 và Pyraminx có scramble cùng mô hình hoặc sơ đồ để xoay từng nước; Megaminx có scramble. Các loại còn lại là nội dung tham khảo; chưa puzzle nào ngoài 3×3 có solver. Ký hiệu của puzzle khác không mặc nhiên chạy được trong player 3×3. Mức độ là gợi ý học của ShanBik, không phải xếp hạng WCA.",
  },
  {
    question: "Có thể nhập Rubik bằng ảnh không?",
    answer:
      "Trong trang luyện tập, mở Nhập từ ảnh — 3×3. Chọn sáu ảnh JPEG/PNG/WebP đúng tâm U/R/F/D/L/B, chỉnh bốn góc bao quanh mỗi mặt và xoay thứ tự ô nếu cần. Nhận màu từ sáu ảnh, kiểm tra/sửa preview rồi xác nhận chuyển sang bản nhập; sau đó kiểm tra hoặc giải như nhập tay. Ảnh chỉ xử lý trong trình duyệt, không gửi lên máy chủ. Ô chưa rõ giữ trống; nhận dạng chưa chứng minh có thể giải. Chưa hỗ trợ live camera, tự tìm khối trong ảnh hoặc nhận puzzle khác.",
  },
  {
    question: "Làm sao luyện từ scramble đến lời giải?",
    answer:
      "Tạo và áp dụng scramble, chờ phát xong hoặc tạm dừng. Ở phần nhập màu, nhấn Lấy màu từ mô hình để thay bản nhập bằng trạng thái đang dừng, rồi Giải bản nhập. Nạp lời giải vào player và chọn Phát chuỗi hoặc Bước tiếp. Bạn cũng có thể nhập màu khối thật bằng tay. Về đầu chuỗi giữ snapshot lúc nạp; Đặt lại khối chỉ đưa mô hình về solved. Bắt đầu lại buổi tập xóa bản nhập, scramble, thuật toán, lịch sử và lời giải trong phiên, đồng thời reset khối. Khi 3D chưa sẵn sàng, nhập màu và tìm lời giải vẫn sử dụng được.",
  },
  {
    question: "Tôi có thể làm gì ở thời điểm hiện tại?",
    answer:
      "Bạn có thể xoay góc nhìn và zoom mô hình 3×3, đọc kiến thức nhập môn và chọn giao diện sáng hoặc tối. Bạn có thể thêm từng move vào hàng đợi, dừng sau nước đang chạy rồi tiếp tục, hủy hàng đợi hoặc đặt lại khối. Bạn có thể tạo, sao chép và áp dụng scramble luyện tập 25 nước. Player hỗ trợ phát/dừng, tiến/lùi từng bước và về đầu chuỗi. Bạn cũng có thể nhập thuật toán để phát và chọn lại từ lịch sử trong phiên. Bạn có thể nhập màu sáu mặt, kiểm tra ô thiếu và số lượng màu. Bạn có thể tìm lời giải từ bản nhập màu; lời giải được kiểm chứng trước khi hiển thị. Nhấn Nạp lời giải vào player để thay mô hình bằng bản nhập lúc gửi và phát lời giải từng bước. Về đầu chuỗi khôi phục bản nhập; Đặt lại khối trở về solved. Ngoài ra có Timer với lịch sử, +2/DNF và thống kê Ao5/Ao12, thư viện công thức, bài học từng bước và trang Tìm kiếm cho puzzle, bài học, công thức.",
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
      "Không bắt buộc. Lịch sử bấm giờ, công thức yêu thích, ghi chú và vị trí đọc bài học được lưu trên trình duyệt bạn đang dùng; xóa dữ liệu trang web sẽ xóa chúng. Nếu bản triển khai bật tài khoản, bạn có thể đăng nhập ở trang Tài khoản để đồng bộ lịch sử giải 3×3, công thức yêu thích và giải đã lưu giữa các thiết bị. Đồng bộ chỉ chạy khi bạn bấm, và mục khác nhau ở hai nơi luôn được hỏi lại.",
  },
  {
    question: "Tôi có cần bật camera để giải Rubik không?",
    answer:
      "Có thể giải khối từ bản nhập màu bằng tay; chưa có quét camera. Công cụ giải nhận trạng thái nhập bằng tay; camera là một khả năng riêng được xem xét sau.",
  },
  {
    question: "Làm sao đổi giao diện?",
    answer:
      "Trên máy tính, bấm công tắc ngày/đêm cạnh chữ Giao diện ở đầu trang. Trên màn hình nhỏ, mở Menu rồi bấm công tắc. Lần đầu, giao diện theo cài đặt sáng/tối của máy; sau khi bấm, lựa chọn Sáng hoặc Tối được lưu trên trình duyệt của bạn nếu trình duyệt cho phép lưu trữ.",
  },
  {
    question: "Tôi có thể dùng bàn phím không?",
    answer:
      "Dùng Tab hoặc Shift+Tab để di chuyển giữa các liên kết và nút, Enter để mở liên kết, Escape để đóng menu. Liên kết Bỏ qua điều hướng ở đầu trang giúp đi thẳng đến nội dung. Ở trang Tìm kiếm, nhấn ↓ từ ô tìm để vào kết quả, ↑/↓/Home/End để chuyển và Esc để quay lại ô tìm.",
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
