# Player controls — Task 8.2

## Cách dùng

Tạo scramble rồi chọn **Nạp vào player** để xem từng bước, hoặc **Áp dụng scramble** để nạp và phát ngay. Cả hai dùng cùng cơ chế apply-once của Task 8.1.

Player có Phát chuỗi, Tạm dừng phát, Bước tiếp, Bước lùi, Về đầu chuỗi, Thoát chuỗi và Đặt lại khối. Pause hoàn tất move đang chạy rồi dừng. Tiến/lùi chỉ nhận một transaction khi đứng yên; mọi callback cũ bị từ chối bằng ID.

**Về đầu chuỗi** khôi phục snapshot khối lúc nạp chuỗi, có thể là trạng thái chưa solved. **Đặt lại khối** đưa về solved và đóng chuỗi. **Thoát chuỗi** giữ các bước đã commit để xoay tự do. Đọc status N/M và token có aria-current=step để biết bước đang chạy hoặc bước kế tiếp.

## State owner và invariant

createMoveQueuePlayer tiếp tục là nguồn state duy nhất. Snapshot bổ sung playback hoặc null:

- moves: bản sao AST immutable, tối đa 256 move.
- initial: snapshot core immutable lúc nạp.
- cursor: số move của prefix đã commit.
- playing: yêu cầu tự phát tiếp sau move hiện tại.
- step: 1, -1 hoặc 0 cho transaction đang chạy.

Ở trạng thái đứng yên, state luôn bằng applyAlgorithm(initial, moves.slice(0, cursor)). Bước tiếp áp dụng moves[cursor]. Bước lùi dùng invertMove(moves[cursor-1]); cursor chỉ thay đổi lúc commit. Renderer vẫn dùng pivot Task 7.2, không lấy matrix float làm state.

loadSequence validate toàn batch trước khi thay chuỗi; hủy active/pending cũ và chụp baseline từ state đã commit. ID không tái sử dụng. Một chuỗi đang mở khóa nguồn FIFO thủ công; thoát chuỗi mới dùng lại enqueue/start/pause/resume thủ công. Không có store puzzle thứ hai.

## API

| Method              | Kết quả                                                                           |
| ------------------- | --------------------------------------------------------------------------------- |
| loadSequence(moves) | Nạp immutable sequence, baseline hiện tại, cursor=0; chuỗi sai không đổi snapshot |
| play()              | Phát từ cursor tới cuối, không tự lặp ở cuối                                      |
| pausePlayback()     | Dừng tại ranh giới sau active move                                                |
| stepForward()       | Tiến một move khi idle và còn bước                                                |
| stepBackward()      | Animate inverse một move khi idle và cursor>0                                     |
| resetPlayback()     | Hủy active, khôi phục initial và cursor=0; giữ moves để phát lại                  |
| exitPlayback()      | Hủy active, giữ state đã commit và đóng chuỗi                                     |
| reset()             | Solved, xóa cả queue và playback                                                  |

Chuỗi rỗng nạp được; play/step là no-op an toàn. Khi reduced motion bật, play tiêu thụ phần còn lại theo thứ tự; step vẫn chỉ di chuyển một bước. Đổi preference giữa backward step commit inverse một lần rồi dừng. Rời route/mất context hủy transaction chưa commit và giữ prefix/sequence ở trạng thái dừng để có thể tiếp tục.

## UI và phạm vi

Controls là native buttons, dùng Tab/Enter/Space; không bắt phím toàn trang. Token list wrap theo chiều rộng, đánh dấu active/next/done/pending và cập nhật tại transaction boundaries. Không có React setState theo frame.

Scramble đã nạp vẫn được đánh dấu đã dùng; replay bằng controls của sequence đang mở là thao tác player riêng. Muốn nạp lại từ panel thì tạo generation mới và thoát chuỗi cũ. Nhập notation tùy ý và lịch sử phiên thuộc Task 8.3.

## Kiểm chứng

playback.test.ts đối chiếu mọi prefix khi tiến/lùi ở cả animation transaction và reduced motion; kiểm pause, reset baseline chưa solved, reset solved, spam, callbacks cũ, thay chuỗi, chuỗi rỗng, ownership, route cancellation và snapshot immutable. Các test queue/scramble trước đó vẫn chạy.

Runtime local ngừng khả dụng giữa tác vụ. Phần UI và test mới được hoàn thiện qua GitHub Actions. Runner đã chạy lint/typecheck, **399 tests** (16 test player mới) và production build thành công.

Browser QA dùng Playwright 1.56.1 / Chromium 141.0.7390.37, software WebGL trên GitHub runner:

- Khởi tạo baseline bằng R từ solved rồi nạp scramble, hình ảnh không đổi và baseline chưa solved.
- Tiến một bước, lùi về baseline và pause sau một bước đều khớp từng pixel với renderer reference.
- Phát đủ 25 move khớp reference phát cùng notation tức thời; reduced motion cho cùng endpoint.
- Về đầu chuỗi giữ baseline chưa solved, khác với Đặt lại khối; reset giữa forward/backward và 20 clicks step chỉ nhận một transaction.
- Enter/Space, move highlight, viewport 360×800 không overflow, exit giữ state, route cancellation và context loss đều đạt; không có pageerror. Đã xem ảnh panel mobile.
- Job và script QA tạm được xóa khỏi tree cuối; workflow CI chính giữ nguyên.

Đây là Chromium/software WebGL trong CI, chưa phải kiểm tra Safari/Firefox hoặc thiết bị touch vật lý.

Tiếp theo: **8.3 — Input thuật toán**. Xem [queue](./cube-move-queue.md), [scramble](./cube-scramble.md), [animation](./cube-single-move.md).
