# 10.1 — Hoàn chỉnh luồng luyện tập

## Luồng trong /practice

1. Tạo scramble và áp dụng lên mô hình. Chờ phát xong, hoặc tạm dừng để hoàn tất nước hiện tại.
2. **Lấy màu từ mô hình** sao chép trạng thái đã commit sang bản nhập sáu mặt. Thao tác thay bản nhập hiện tại và bỏ kết quả solver cũ; không thay mô hình hay tự chạy solver. Có thể nhập khối thật bằng tay như trước.
3. **Giải bản nhập** kiểm tra tính khả thi rồi chạy Worker. Loading, hủy, timeout, lỗi và retry dùng controller hiện có; lỗi giữ màu đã nhập. Khối đã solved không tạo nước giả hoặc Worker mới.
4. **Nạp lời giải vào player** thay mô hình bằng snapshot lúc giải và dừng tại bước 0. Phát, tiến/lùi và về đầu chuỗi dùng player hiện có.
5. **Bắt đầu lại buổi tập** dừng solver, hủy animation/hàng đợi, đưa khối về solved và xóa bản nhập (còn sáu tâm), scramble, thuật toán, lịch sử và kết quả trong phiên. Nút ghi rõ dữ liệu sẽ bị xóa. Góc nhìn/theme không thay đổi.

**Đặt lại khối** vẫn chỉ reset mô hình/player. **Về đầu chuỗi** khôi phục snapshot đầu chuỗi. Hai thao tác này không xóa bản nhập tay. Reset toàn bộ phiên là thao tác riêng.

## Trạng thái và ranh giới

- Trạng thái mô hình luôn hiển thị, kể cả khi player đang mở: đang xoay, còn hàng đợi, hoặc đã/chưa solved cùng cursor khi dừng.
- Không lấy màu giữa một animation, khi autoplay còn chạy, khi còn nước chờ, hoặc 3D chưa sẵn sàng. Callback kiểm tra lại snapshot hiện tại trước khi sao chép, không chỉ dựa vào trạng thái disabled của nút.
- Bản nhập được sao chép và đóng băng; sửa bản nhập không đổi mô hình. Reset mô hình không sửa bản nhập đã sao chép.
- Trạng thái solver tách rõ bản nhập với mô hình. Player thay đổi vô hiệu kết quả solver cũ; di chuyển camera không làm mất kết quả.
- Khi 3D chưa sẵn sàng, hướng dẫn nêu rõ nhập/giải vẫn dùng được, còn lấy màu và nạp player cần 3D. Không tự giải đồng bộ hoặc tự áp dụng kết quả.

## Kiểm chứng

727 unit tests: tích hợp scramble → lấy màu → controller init/search/result → nạp → phát → solved → reset với cả animation và reduced motion; gate khi active/pending/unavailable; lấy tại bước dừng; độc lập bản nhập/model; invalid/Worker error giữ dữ liệu; already-solved không có move giả. Test controller dùng port giả, kết quả được kiểm chứng bởi core.

Production Chromium 141 chạy solver cubing.js thật với scramble ngẫu nhiên 25 nước: luồng đầy đủ ở 360px, normal/reduced motion, phát về solved, về đầu chuỗi về trạng thái chưa solved và reset toàn phiên. Kiểm tra input trống báo lỗi, input solved không sinh chuỗi, không pageerror/tràn ngang. Khi giả lập không WebGL, nhập mẫu/giải already-solved vẫn hoạt động và lấy màu bị khóa. Đây là kiểm tra chức năng desktop software WebGL, chưa phải kiểm thử thiết bị di động vật lý hoặc đa trình duyệt.

Bước tiếp theo: **10.2 — Hướng dẫn và E2E**: quick start và bộ Playwright cốt lõi lưu trong repo/CI.
