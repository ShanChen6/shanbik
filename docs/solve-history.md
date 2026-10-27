# Tuần 16 — Lịch sử solve

## Phạm vi 16.1–16.3

- 16.1: lưu solve trong IndexedDB có version và migration; chuyển dữ liệu localStorage của Tuần 15 sang một lần.
- 16.2: route `/timer/history`, bảng từ 768px, card dưới 768px; dữ liệu còn sau reload và khi mất mạng.
- 16.3: penalty OK/+2/DNF, xóa, hoàn tác nhiều bước trong lần mở trang.

Code: `src/features/timer/database.ts` (schema, migration, repository), `history-store.ts` (snapshot cho React, hàng đợi ghi, undo, đồng bộ tab), `history-list.tsx`, `penalty-control.tsx`. Timer (`timer-panel.tsx`) ghi vào cùng store và cho chọn penalty cho lượt gần nhất.

## Schema và migration (16.1)

Database `shanbik-timer`, version = `MIGRATIONS.length` (hiện là 1). Mỗi bước `MIGRATIONS[i]` nâng version `i → i+1`; `onupgradeneeded` chạy lần lượt từ `oldVersion`, nên trình duyệt ở bất kỳ version cũ nào cũng lên được version mới. Không sửa bước đã phát hành, chỉ thêm bước mới.

Version 1:

| Store    | Key   | Index       | Nội dung                                                       |
| -------- | ----- | ----------- | -------------------------------------------------------------- |
| `solves` | `id`  | `timestamp` | `{id, puzzle:"3x3", durationMs, scramble, timestamp, penalty}` |
| `meta`   | `key` | —           | Đánh dấu migration một lần, ví dụ `legacy-timer-solves-v1`     |

`penalty` là `"none" | "+2" | "DNF"`. `durationMs` luôn là thời gian đo được, penalty không ghi đè nó: +2 cộng 2000 ms vào kết quả, DNF không có kết quả (`resultMs` trả `null`). Hiển thị `14.34+` và `DNF`; khi có penalty, thời gian đo gốc hiện kèm. Record thiếu `penalty` (bản Tuần 15) được hiểu là `"none"`.

Mỗi record đọc lên đều được validate lại (ID, số nguyên, notation, penalty). Record lỗi bị bỏ qua, đếm và thông báo, không bị xóa. Database có version mới hơn app (người dùng quay về bản cũ) thì không hạ version: app báo không mở được bộ nhớ, timer vẫn chạy với kết quả trong bộ nhớ trang.

### Chuyển dữ liệu Tuần 15

Lần đầu mở database, store đọc key `shanbik:timer-solves:v1`:

- Hợp lệ: thêm các ID chưa có trong IndexedDB trong cùng transaction với marker `meta.legacy-timer-solves-v1 = {importedAt, count}`. Bản trong IndexedDB thắng, nên lượt đã sửa/xóa không bị nhập lại sau reload. Thông báo “Đã chuyển N lượt”.
- Không có key: ghi marker với `count: 0`.
- JSON/schema lỗi: không ghi marker, không đụng raw, báo “Bản lưu timer cũ không hợp lệ”; lần mở sau thử lại.
- localStorage bị chặn: bỏ qua, không ghi marker.

Key localStorage cũ được giữ nguyên làm dự phòng (rollback về bản Tuần 15 vẫn đọc được dữ liệu cũ). App không còn ghi localStorage cho solve.

## Ghi, lỗi và nhiều tab

Store giữ snapshot đồng bộ cho `useSyncExternalStore`; server snapshot không đụng browser. Thao tác cập nhật UI ngay rồi xếp hàng ghi tuần tự. Khi còn việc trong hàng, trạng thái hiển thị “Đang lưu thay đổi…”.

- Thêm solve: kiểm tra trùng ID trong bộ nhớ và trong transaction. Trùng y hệt bỏ qua, khác nội dung báo xung đột, không ghi đè. Giới hạn 10000 lượt, không tự xóa lượt cũ.
- Đổi penalty/xóa dùng compare-and-set: chỉ ghi khi record trên disk đúng như lúc người dùng thấy. Nếu tab khác đã đổi, báo “vừa được thay đổi ở tab khác”, tải lại dữ liệu và xóa stack hoàn tác.
- Sau mỗi lần ghi, `BroadcastChannel("shanbik-timer")` báo các tab khác tải lại danh sách. `onversionchange` đóng kết nối để tab mới nâng schema không bị chặn. Store đóng kết nối khi rời trang (an toàn với StrictMode).
- Không mở được IndexedDB: timer vẫn dùng được, lượt mới giữ trong bộ nhớ trang, sửa/xóa bị khóa, có nút Thử lưu lại; retry mở lại database và ghi đúng một lần.
- Ghi penalty/xóa thất bại: báo lỗi và tải lại từ dữ liệu đang lưu, không giả vờ đã lưu.

## Danh sách (16.2)

Mới nhất ở trên; số thứ tự đếm từ lượt cũ nhất nên không đổi khi có lượt mới. Desktop/tablet (≥768px) là bảng có `th scope`, mobile là danh sách card; layout còn lại `display:none` nên không lặp trong cây trợ năng. Hiển thị 50 lượt, có nút xem thêm. Trạng thái rỗng dẫn về Timer.

Offline: IndexedDB không cần mạng, nên trên trang đã tải, ghi/sửa/xóa/hoàn tác vẫn chạy khi mất mạng và còn sau khi có mạng lại và reload. Chưa có service worker, nên mở mới trang lúc mất mạng phụ thuộc cache của trình duyệt; không hứa offline app đầy đủ.

## Penalty, xóa và hoàn tác (16.3)

Nhóm nút OK/+2/DNF (`aria-pressed`) cho từng lượt, và cho lượt gần nhất ở trang Timer. Xóa không hỏi xác nhận vì có nút hoàn tác ngay. Hoàn tác tối đa 20 bước theo thứ tự ngược, chỉ trong lần mở trang hiện tại; hoàn tác xóa khôi phục đúng record, gồm cả penalty. Chưa sửa tay thời gian/scramble: giữ thời gian đo là dữ liệu gốc.

## Kiểm tra

Đã kiểm tra khi review Task 16 (test lịch sử riêng chạy cục bộ, chưa đưa vào repo): migration tạo store/index, không chạy lại, từ chối DB version mới hơn; import một lần, không nhập lại lượt đã xóa, bản IndexedDB thắng, dữ liệu cũ lỗi/bị chặn; record lỗi bị bỏ qua không bị xóa; +2/DNF và định dạng; hoàn tác theo thứ tự, giới hạn 20; compare-and-set giữa hai tab; database không mở được và retry; đóng kết nối; giới hạn 10000. E2E desktop/mobile: migration và reload, bảng/card đúng viewport, +2/DNF/xóa/hoàn tác và reload, penalty nhanh ở Timer, offline, hai tab, trạng thái rỗng, axe light/dark, không tràn ngang 320–1280px.

Trong repo: `timer.test.ts` kiểm tra parser localStorage cũ và record có penalty; `tests/e2e/timer.spec.ts` đọc IndexedDB và chặn IndexedDB để kiểm tra lỗi/retry.

Tuần 17 dùng dữ liệu này cho thống kê — xem [timer-stats.md](./timer-stats.md).
