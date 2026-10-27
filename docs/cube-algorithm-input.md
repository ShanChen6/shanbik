# Input thuật toán — Task 8.3

Trên `/practice`, nhập các move U/R/F/D/L/B, prime hoặc double, cách nhau bằng khoảng trắng/xuống dòng. Nhấn **Phát thuật toán** để nạp và phát bằng cùng player của Task 8.2. Không tự phát khi gõ hoặc chọn lịch sử.

## Hợp đồng

- Parse toàn bộ trước khi gọi player; không chạy prefix hợp lệ của input sai. Giữ nguyên nội dung nhập kể cả lỗi, whitespace và Unicode prime.
- Chấp nhận 1–256 move. Chuỗi rỗng/quá dài bị từ chối trước khi thay state. Lỗi hiển thị vị trí và nút focus/select vùng lỗi; danh sách chỉ hiển thị tám lỗi đầu để tránh kéo dài trang vô hạn.
- Chuỗi mới thay active/pending/playback cũ tại state đã commit gần nhất. Nước đang animation chưa hoàn tất bị hủy, completion ID cũ không thể ghi state mới. Không tự reset solved. Player vẫn hỗ trợ tiến/lùi, pause và trở về snapshot vừa nạp.
- Renderer chưa sẵn sàng thì không phát, vẫn nhập/chọn lịch sử được. Form dùng nút submit; Enter trong textarea xuống dòng bình thường, không có phím tắt toàn cục.
- Lịch sử chỉ thêm sau khi player chấp nhận phát, gồm cả lần phát có thể bị hủy sau đó. Giữ 20 lần gần nhất, mới nhất trước; chọn chỉ điền nội dung, nhấn Phát để chạy lại. Xóa lịch sử không đổi input hoặc khối.
- State nằm trong component client, không localStorage/cloud/cookie. Reload hoặc unmount thực sự sẽ xóa lịch sử; navigation giữ component của Next có thể giữ phiên.

## Module

- `algorithm-input/session.ts`: validation adapter và cập nhật lịch sử immutable; không sở hữu puzzle state.
- `algorithm-input/algorithm-panel.tsx`: form, lỗi/select, phản hồi và lịch sử trong phiên.
- `viewer/practice-cube.tsx`: nối vào `loadSequence`/`play` của state owner hiện có.

## Kiểm tra

Unit integration dùng parser và player thực: input sai/rỗng/quá 256 không gọi callback, vị trí lỗi, thay FIFO khi đang chạy, callback cũ không commit, thay bước lùi, invalid input giữ nguyên playback, đúng 256 move với reduced motion, callback từ chối và giới hạn lịch sử immutable. Chạy `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm format:check`.

Đã chạy Chromium 141 software WebGL trên GitHub Actions (run 40439411970): input sai giữ nguyên nội dung và ảnh canvas giống từng pixel; chọn lỗi bằng bàn phím chọn đúng offset; lịch sử chỉ điền lại; 256 move chạy hoàn tất; token sai dài 3.000 ký tự và lịch sử dài không tràn ngang ở 360×800; thay chuỗi trong animation; reset snapshot; xóa lịch sử không đổi player; reload xóa phiên. Không có pageerror. Tổng 410 unit tests đạt, cùng lint/typecheck/format và production build.

Chưa kiểm tra Safari/Firefox hoặc thiết bị mobile vật lý. Browser dùng emulation/software WebGL, không phải benchmark FPS/heap.

Tiếp theo: **9.1a — Nhập màu sáu mặt**. Validation khả thi vật lý thuộc 9.1b; tính năng này chỉ nhập notation.
