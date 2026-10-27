# 12.3 — Viewer minh họa và tiến độ local

## Sử dụng

Mở `/learn/lessons/lam-quen-u-va-u-prime` từ Học cơ bản hoặc Bách khoa 3×3. Mỗi bước có viewer riêng, khởi tạo từ `step.before`, chỉ phát `step.moves`; trạng thái cuối đối chiếu `step.after`.

- Không tự phát khi mở bài. Bước quan sát không có nước xoay.
- Phát minh họa / Phát lại, Tạm dừng, Nước tiếp, Nước lùi và Về trước bước dùng chung move queue hiện có. Tạm dừng cho nước đang chạy hoàn tất.
- Về trước bước phục hồi snapshot đầu bước, không đặt mặc định về khối đã giải.
- Đổi bước hủy player cũ; callback cũ không tác động player mới. Không thay đổi practice player.
- Reduced motion commit nước ngay, giữ đúng thứ tự và trạng thái.
- Nếu WebGL không có hoặc mất context, hướng dẫn và sơ đồ 2D vẫn đọc được. Tải lại để thử 3D lại.

## Lưu và khôi phục

Key: `shanbik:lesson-progress:${lesson.id}:v${lesson.contentVersion}`. Chỉ lưu JSON gồm `schemaVersion: 1`, `lessonId`, `contentVersion`, `stepId`. Không lưu cube, thuật toán, nước đang chạy hay completion.

URL có `step` hợp lệ được ưu tiên rồi lưu vị trí đó. URL không có step khôi phục bước đã lưu. Step URL không hợp lệ hiển thị bước đầu kèm thông báo và không ghi đè vị trí hợp lệ cũ.

Đọc storage sau hydration, trước khi ghi; viewer chờ đọc xong để tránh khởi tạo sai bước. ID/version khác, JSON hỏng, quá lớn hoặc step không còn tồn tại bị bỏ qua. Đổi contentVersion tách key nên không dùng nhầm tiến độ cũ.

Storage bị chặn, hết quota hoặc đọc/ghi/xóa lỗi không chặn bài học. UI báo không thể lưu và giữ vị trí trong bộ nhớ của trang. Xóa vị trí chỉ xóa key bài/phiên bản hiện tại, chuyển về bước đầu; không xóa theme hoặc dữ liệu khác.

Dữ liệu nằm trên trình duyệt hiện tại, không đồng bộ tài khoản. Không đồng bộ trực tiếp giữa các tab; lần ghi cuối thắng, tải lại để đọc giá trị mới. Các key phiên bản cũ được giữ nguyên.

## Kiểm thử

Unit: parse dữ liệu, cách ly version/lesson, lỗi storage, vòng đời đóng/mở, reset đúng baseline, endpoint, callback animation cũ và reduced motion. E2E desktop/mobile: khôi phục qua reload, ưu tiên URL, URL sai, xóa, dữ liệu hỏng, quota/storage chặn, phát lại/reset/đổi bước, mất context và không có WebGL. Các gate lint/typecheck/format/build và toàn bộ E2E chạy trước review.
