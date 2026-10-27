# Tuần 15 — Timer 3×3

## Phạm vi 15.1–15.3

Route `/timer`, liên kết menu/footer và từ `/practice` qua **Bấm giờ với khối thật**. Không phụ thuộc viewer/WebGL hoặc solver.

- 15.1: state machine `ready → inspection? → running → stopped`, clock đơn điệu, giữ/thả, hủy và chống stop lặp.
- 15.2: số lớn, Space có focus, pointer/touch capture, điều khiển native bằng nút Bắt đầu/Dừng, quan sát 15 giây tùy chọn.
- 15.3: lưu solve local version 1 gồm ID, thời gian ms, scramble, puzzle và timestamp dừng; hiển thị số lượt và lượt gần nhất qua reload.

Scramble 25 nước dùng random-move generator hiện có; người dùng áp lên khối thật trước khi đo. Không gọi là scramble thi đấu. Không tự thay scramble sau khi dừng; chọn Scramble mới cho lượt tiếp theo. Quan sát là nhắc nhở luyện tập, quá 15 giây không tự kết thúc hoặc ghi +2/DNF.

## Điều khiển

Focus vùng timer rồi giữ Space tối thiểu 300 ms; thả khi báo sẵn sàng để vào quan sát hoặc chạy. Trong quan sát, giữ/thả lần nữa để bắt đầu tính giờ. Khi đang chạy, press dừng ngay; release của lần dừng không bắt đầu lượt tiếp. Key repeat, pointer phụ và input đồng thời bị chặn.

Touch chỉ dùng vùng timer với pointer capture; pointercancel/lost capture/blur hủy giữ, không khởi động nhầm. Timer pad không xử lý click giả lập của Space lần thứ hai. Các nút Bắt đầu quan sát/Bắt đầu tính giờ/Dừng và lưu là phương án không cần hold, dùng được bằng Tab/Enter và công nghệ hỗ trợ. Không có shortcut Space toàn trang; nhập liệu, checkbox, theme và menu không điều khiển timer.

Hủy hoặc unmount/rời route bỏ lượt chưa dừng. Blur chỉ bỏ hold, không dừng clock. Đổi tab/background vẫn tính khoảng thời gian trôi qua, khi quay lại hiển thị từ clock hiện tại. Reload trước khi dừng không khôi phục lượt đang chạy. Mở lại luôn ready, không tự chạy. Cấu hình quan sát là trạng thái phiên.

## Clock và record

`performance.now()` là nguồn thời lượng; mỗi tick/stop lấy hiệu tuyệt đối so với lúc bắt đầu, không cộng frame hoặc interval. Tick phục vụ hiển thị, stop chốt thời lượng độc lập với số frame. Clock lùi/NaN không làm thời gian âm hoặc giảm. Timestamp dùng `Date.now()` riêng, thay đổi wall clock không đổi thời lượng.

Giữ 300 ms và thời gian quan sát không tính vào solve. Duration là ms nguyên không âm; hiển thị cắt xuống centisecond, từ một phút dùng `m:ss.cc`. Thông báo trạng thái tách khỏi số đếm (`aria-live=off`) để không đọc từng frame.

ID được tạo một lần khi bắt đầu attempt; stop cập nhật state trước khi gọi lưu. Stop/release lặp không có callback thứ hai. Store còn deduplicate bằng ID, không deduplicate theo thời gian/scramble vì hai lượt thật có thể giống nhau. ID trùng nhưng nội dung khác không được ghi đè.

## Persistence và lỗi

Key `shanbik:timer-solves:v1`, record `{version:1,solves:[{id,puzzle:"3x3",durationMs,scramble,timestamp}]}`. Validate schema, integer/range, notation parser, ID và giới hạn record. Constructor/getServerSnapshot không đọc browser/clock/random. Đọc sau hydration, chỉ ghi khi có solve mới hoặc người dùng retry; không ghi mảng rỗng đè dữ liệu lúc mount.

JSON/version/record lỗi bị bỏ qua, thông báo và giữ nguyên raw đến khi người dùng ghi lượt mới. Mỗi save đọc lại disk, hợp nhất theo ID với các record trong bộ nhớ rồi ghi; tránh đè các lượt đã được tab khác lưu trước lần đọc. LocalStorage không có transaction: hai tab ghi đồng thời vẫn có thể race, chưa đồng bộ realtime. Tuần 16 đã thay phần lưu này bằng IndexedDB có transaction và migration — xem [solve-history.md](./solve-history.md); key này giờ chỉ được đọc một lần để chuyển dữ liệu.

Lỗi factory/read/quota/write giữ kết quả mới trong bộ nhớ trang, hiển thị cảnh báo và nút Thử lưu lại. Retry hợp nhất/dedup, không tạo lượt thứ hai. Read lỗi không ghi đè dữ liệu disk chưa đọc được. Chỉ ghi key timer, không thay theme/favorites/lesson progress. Store đóng/mở an toàn với StrictMode và chặn write sau close.

Giới hạn 1000 lượt và raw 3 MB, không âm thầm xóa lượt cũ. Khi đầy, lượt mới chưa được thêm; kết quả vừa dừng vẫn hiển thị. Trạng thái “bộ nhớ hiện tại” không bảo đảm lưu bền khi có cảnh báo. Dữ liệu chỉ cùng origin/trình duyệt, chưa đồng bộ tài khoản. Chưa có xóa/undo/history đầy đủ/export ở mốc này; không hứa offline reload nếu app chưa được cache.

## Kiểm tra và phần tiếp theo

Unit fake clock kiểm tra hold threshold, inspection, stop một lần, hủy/unmount, clock gap/lùi/wall clock, UUID lỗi, schema, corruption, retry/quota/read fail, duplicate/collision, merge disk và giới hạn giữ dữ liệu cũ. E2E desktop/mobile kiểm tra Space, touch thật qua Chromium touch input, pointer cancel, inspection với browser clock, focus guard, route leave, native Enter, persistence/reload, dữ liệu lỗi, retry và không cần WebGL. Beta audit có `/timer` ở cả light/dark và các breakpoint.

Các gate format/lint/typecheck/unit/build/E2E chạy trước review. Feature → PR develop; không tự merge/deploy.

Tiếp theo **16.1 — Schema và migration local**: chuyển sang versioned IndexedDB/local database, rồi danh sách lịch sử và penalty/undo trong 16.2–16.3. Thống kê thuộc tuần 17.
