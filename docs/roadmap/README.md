# ShanBik — bộ tài liệu chuyển roadmap cho Codex

Bộ tài liệu này dành cho dự án website Rubik ShanBik bắt đầu từ repository trống.

## Cách dùng

1. Tạo repository GitHub `ShanBik` (hoặc tên bạn chọn), clone về máy và mở thư mục repo trong Codex.
2. Chép `ROADMAP.md` và `CODEX_START_PROMPT.md` vào thư mục gốc repo, ví dụ `docs/roadmap/`.
3. Mở `CODEX_START_PROMPT.md` trong Codex và yêu cầu thực hiện **Task 0**.
4. Review thay đổi, chạy các lệnh kiểm tra, commit khi đạt yêu cầu.
5. Mỗi lần sau chỉ yêu cầu Codex triển khai đúng **một task** theo `ROADMAP.md`. Không giao toàn bộ roadmap trong một prompt.

## Nguyên tắc triển khai

- Dự án bắt đầu từ số 0; không giả định đã có code hoặc cấu hình.
- Mỗi task có một mục tiêu kỹ thuật, phạm vi rõ và tiêu chí nghiệm thu.
- Codex phải đọc repo thực tế trước mỗi task, dùng đúng package manager và quy ước đang có.
- Nếu task phụ thuộc vào quyết định chưa được xác minh, Codex cần làm spike/tài liệu quyết định trước, không tự chốt thư viện.
- Không đưa secret vào source control.
- Đây là website responsive; không triển khai native app.
