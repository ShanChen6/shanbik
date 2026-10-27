# Task 13 — Thư viện công thức

> Cập nhật tuần 14: minh họa đã có move list, seek, tốc độ, đảo/lặp và ghi chú/hoàn thành local. Xem [thực hành thuật toán](./algorithm-practice.md). Phần dưới ghi lại phạm vi task 13.

## Phạm vi 13.1–13.3

Route `/algorithms` có metadata, liên kết từ navigation desktop/mobile/footer, Học cơ bản và đọc thêm của Bách khoa 3×3.

- 13.1: catalog 3×3, ID ổn định, tên/aliases, notation, nhóm, độ khó, ghi chú. Validator kiểm tra runtime, trùng ID, taxonomy và notation bằng parser core trước khi xuất dữ liệu immutable.
- 13.2: card, tìm tên/alias/nhóm/notation/ghi chú không dấu, Unicode prime và khoảng trắng; lọc nhóm và độ khó kết hợp, empty state, copy và preview.
- 13.3: yêu thích local, danh sách riêng qua nút **Yêu thích của tôi**, thêm/bỏ/xóa danh sách. Không có danh sách đặt tên tùy ý ở mốc này.

Bộ khởi đầu gồm 6 mẫu: trigger phải/trái, chèn cặp F2L bên phải, dấu thập OLL, Sune và T perm. Beginner và CFOP là nhóm phương pháp; F2L/OLL/PLL thuộc CFOP. Mẫu có thể nằm trong nhiều nhóm. Độ khó là gợi ý của ShanBik, không phải chuẩn thi đấu. Chưa phải bộ 41 F2L/57 OLL/21 PLL đầy đủ.

Notation hiện chỉ dùng U/D/L/R/F/B với prime hoặc 2, 1–256 nước. Không âm thầm nhận wide/slice/rotation. Khi bổ sung công thức phải kiểm tra parser, taxonomy, nguồn và điều kiện áp dụng. Không coi parser hợp lệ là bằng chứng công thức giải được mọi khối.

## Minh họa

Chỉ tải preview khi người dùng chọn Minh họa, chỉ một viewer hoạt động. Khởi tạo bằng inverse của công thức áp lên solved; phát chuỗi từ mẫu này sẽ về solved. UI ghi rõ hướng trắng U/xanh lá F và giới hạn này. Không dùng khối practice, không suy luận case từ khối người dùng và không autoplay.

Play/replay, pause (kết thúc nước hiện tại), reset về trạng thái mẫu dùng queue hiện có. Đổi công thức, đóng preview, đổi tìm kiếm/bộ lọc hủy player cũ; callback cũ không tác động viewer mới. Đóng preview trả focus về nút mở. Reduced motion commit ngay. Chọn preview chuyển focus đến tiêu đề để người dùng mobile không phải tìm bên dưới các card.

WebGL lỗi vẫn có sơ đồ 2D của mẫu, copy, tìm/lọc và yêu thích. Copy gọi Clipboard API khi nhấn; lỗi/quyền chặn hiển thị hướng dẫn chọn chuỗi thủ công. Không đọc clipboard của người dùng trong ứng dụng.

Chưa có move list, seek, tốc độ, repeat hay ghi chú cá nhân — thuộc task 14.

## Lưu yêu thích

Key `shanbik:algorithm-favorites:v1`, payload `{version:1,ids:[...]}` chỉ lưu ID. Không lưu thuật toán, ảnh, cube hoặc completion. Đọc sau hydration rồi mới cho ghi; không ghi rỗng đè lên dữ liệu trong lần mount. Store đóng/mở an toàn với StrictMode.

JSON sai, version không hỗ trợ, kiểu dữ liệu sai hoặc quá lớn bị bỏ qua và thông báo; không tự ghi đè dữ liệu lỗi trước thao tác người dùng. ID đã gỡ khỏi catalog được lọc, trùng ID được gộp. Xóa tất cả chỉ remove key riêng của thư viện, không đụng theme, tiến độ bài học hay bản nhập.

Storage factory/get/set/remove lỗi không chặn thao tác, giữ thay đổi trong bộ nhớ và báo không lưu được. Không đồng bộ tài khoản hoặc tab đang mở; lần ghi cuối thắng, reload đọc lại. Bộ lọc và preview là trạng thái phiên, không lưu qua reload. Yêu thích giữ qua reload cùng origin và trình duyệt; khác domain deploy là bộ nhớ riêng.

## Nguồn nội dung

Đối chiếu thuật toán tầng cuối với [CubeSkills — Last Layer, Feliks Zemdegs và Andy Klise](https://www.cubeskills.com/uploads/pdf/tutorials/2-look-last-layer.pdf), bỏ ngoặc phân nhóm để phù hợp parser. Ghi chú là nội dung tự biên soạn; trạng thái mẫu sinh từ core, không sao chép hình case của nguồn. Trigger/chèn cặp là ví dụ luyện thao tác, không tuyên bố hoàn chỉnh phương pháp.

## Kiểm tra

Unit kiểm tra dữ liệu tác giả, taxonomy, search, giao các bộ lọc, bất biến tầng dưới của mẫu OLL/PLL, endpoint/reset của viewer, SSR và dữ liệu/storage lỗi. Browser tests desktop/mobile kiểm tra discovery, search không dấu/prime, clipboard và fallback, bộ lọc/empty state, yêu thích qua reload/xóa/corruption/storage chặn, WebGL fallback, preview play/reset/đổi/hủy. Beta audit thêm route thư viện để kiểm tra light/dark, accessibility và responsive.

Gate: format, lint, typecheck, unit, production build và toàn bộ E2E. Luồng feature → develop → main, dừng tại PR develop để review.
