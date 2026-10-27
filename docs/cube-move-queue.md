# Move queue — Task 7.3

## Phạm vi

`move-queue.ts` là chủ sở hữu duy nhất của state đã commit, move đang chạy và FIFO chờ. PracticeCube dùng một instance qua useSyncExternalStore. Renderer Task 7.2 nhận active ID và báo complete; queue commit bằng core applyMove rồi cấp move kế tiếp trong cùng transaction.

Task này nối các move từ selector vào hàng đợi, có pause/resume/cancel/reset và xử lý thao tác nhanh. Nhập chuỗi notation, step/rewind và lịch sử player tiếp tục ở 8.x.

## State và hành vi

Snapshot immutable có `{state, active, pending, completed, paused}`. Pending chỉ chứa các move chưa bắt đầu; completed đếm số move đã commit từ lần reset gần nhất. ID active tăng dần và không tái sử dụng sau cancel/reset.

| Thao tác               | Hành vi                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------ |
| enqueue(moves)         | Validate toàn bộ batch rồi copy/freeze AST, nối FIFO; tự chạy nếu idle và chưa pause |
| complete(id)           | Đúng ID mới commit; cấp active kế tiếp cùng lúc với state mới                        |
| pause()                | Nước đang chạy hoàn tất, pending chờ tại ranh giới kế tiếp                           |
| resume()               | Tiếp tục pending; nhấn lặp khi đang chạy không tạo active mới                        |
| cancel()               | Hủy active chưa commit, xóa pending và pause; giữ state/completed đã commit          |
| cancel(id)             | Chỉ xử lý nếu ID khớp active hiện tại                                                |
| reset()                | Trở về solved, xóa active/pending/pause và completed=0                               |
| setReducedMotion(true) | Commit active ngay; tiêu thụ pending theo thứ tự nếu chưa pause                      |

Callback cũ/trùng không thể commit, bỏ qua move mới hoặc hủy queue sau restart. Không có timer/promise scheduler trong store; khi animation dừng, pending không chạy ngầm. `single-move.ts` giữ alias createSingleMovePlayer cho API start cũ và hàm nội suy; alias tạo cùng loại state owner. start vẫn từ chối khi busy/paused, còn UI dùng enqueue.

## Giới hạn và reduced motion

- Tối đa **256 move chưa hoàn tất**, gồm active + pending. Batch vượt giới hạn trả false và snapshot không đổi; không enqueue một phần. Batch AST sai throw theo validator core, không đổi state.
- Pending và từng move là frozen copy, không bị thay đổi khi caller sửa input. Batch rỗng là no-op.
- Reduced motion xử lý pending bằng vòng lặp giới hạn, giữ nguyên thứ tự, publish một snapshot cuối thay vì React render từng move. Pause vẫn giữ pending; resume mới tiêu thụ tiếp. Chuyển preference giữa move cũng chỉ commit active một lần.
- Không lưu matrix/rotation vào puzzle state. Mỗi move kế tiếp dựng slot từ snapshot core mới và dùng pivot riêng như Task 7.2.

## UI

- Selector luôn đổi được khi scene sẵn sàng; **Thêm vào hàng đợi** dùng được cả khi đang xoay hoặc đang pause.
- **Dừng sau nước này** / **Tiếp tục hàng đợi** là native buttons; pause có trạng thái chờ rõ trong status. **Hủy hàng đợi** giữ những move đã commit. **Đặt lại khối** đưa về solved.
- Status thông báo move hiện tại, số hoàn tất và số chờ. Preview chỉ hiển thị 24 move đầu để giới hạn DOM. Thêm quá 256 move báo lỗi; khi có chỗ trống hoặc hủy/reset, thông báo không còn hiển thị.
- Rời route, unmount hoặc mất context gọi cancel để xóa cả phần chờ. Nút enqueue/pause disabled khi viewer không sẵn sàng. Các controls dùng Tab/Enter/Space; không thêm handler keyboard toàn trang.

## Kiểm chứng

- Tổng **351 tests**, gồm 19 test queue mới: FIFO từng prefix, enqueue nhanh trong khi active, pause/resume tại ranh giới, spam pause/resume, callback trùng/cũ, cancel/restart/reset, immutable input, capacity/invalid batch atomicity, notification atomicity và reduced motion.
- Test dài chạy **2.000 transaction completion** theo các batch tối đa 200 move, gồm 1.000 move và nghịch đảo; cuối cùng khớp snapshot ban đầu. Đây là test store, không phải benchmark animation/FPS.
- Chromium software WebGL: chuỗi 26 move với pause, thêm move khi paused rồi resume hoàn tất về solved. Ảnh tại paused boundary khớp renderer reference tức thời theo cùng prefix; ảnh cuối giống từng pixel với ảnh đầu. Chỉ tạo tám GPU buffers và tái sử dụng trong chuỗi.
- Browser: cancel sau một commit rồi restart có ảnh khớp reference; reset giữa queue, 300 clicks bị giới hạn ở 256 move, Enter/Space pause/resume, reduced motion khi paused, route hide và context loss đều đạt. Sau route trở lại và ổn định, không có draw thêm trong 250 ms idle; mobile 360×800 không tràn ngang, không pageerror.
- Development /ui-preview, ba lần removal thật trong khi có active và năm move pending: buffers tạo/xóa 8/8 mỗi chu kỳ, tổng 24/24 và live=0. Canvas/viewport listeners=0, resize/resolution/reduced-motion listener về baseline=0, không tiếp tục draw hoặc có pageerror sau removal.

Browser emulation/software WebGL không thay thế kiểm tra điện thoại thật, Safari/Firefox, FPS hoặc heap toàn bộ browser. Các lệnh chuẩn và CI được báo trong PR.

## Chạy lại

1. `pnpm test`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
2. /practice: chọn nhiều move khác nhau và thêm liên tục; kiểm đúng FIFO và chỉ một layer xoay mỗi lần.
3. Bấm Dừng sau nước này, chờ active hoàn tất, thêm move khi paused rồi Tiếp tục. Hình ảnh/state giữ nguyên trong lúc đang dừng.
4. Hủy hoặc reset giữa một queue; bắt đầu queue mới và chờ lâu hơn duration cũ để chắc chắn callback cũ không thay đổi kết quả.
5. Đổi reduced motion lúc đang chạy và lúc paused; kiểm pending được giữ đến resume nếu đang pause.
6. Rời route hoặc /ui-preview Hiện/Ẩn mô hình thử giữa queue, kiểm tài nguyên và pending không tiếp tục chạy ngầm.

Task 8.1 đã nối [scramble luyện tập](./cube-scramble.md) vào queue. Bước tiếp theo: **8.2 — Player controls**. Liên quan: [animation một move](./cube-single-move.md), [mapping](./cube-move-layer.md), [viewer/camera](./cube-viewer.md).
