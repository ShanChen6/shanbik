# ADR 0008 — Quản trị dữ liệu giải đấu khi chưa có backend

- Ngày: 27/10/2026.
- Trạng thái: **Chấp nhận cho giai đoạn chưa có Auth**; xem lại ở Task 23.
- Phạm vi: Task 22.1–22.2.

## Bối cảnh

Task 22.1 yêu cầu Admin CRUD có bảo vệ server/database và audit log; 22.2 yêu cầu form công khai không sửa trực tiếp bản ghi. ShanBik chưa có backend, đăng nhập hay database (ADR 0006); backlog đã ghi không mở admin CRUD công khai khi chưa có Auth/RBAC/RLS. Người duy trì chọn: không thêm backend ở tuần 22, hoãn CRUD.

## Quyết định

1. **Quản trị = Pull Request vào repo.** Thêm/sửa/xóa giải là sửa `src/features/competitions/data.ts` trên nhánh, mở PR vào `develop`. Quyền ghi là quyền push/merge của GitHub (chỉ collaborator); người dùng thường không có đường sửa dữ liệu.
2. **Audit log = lịch sử git + PR.** Mỗi thay đổi có tác giả, thời điểm, diff và thảo luận review; `updatedAt`/`source.retrievedAt` trong bản ghi cho người đọc biết độ mới.
3. **Kiểm tra bắt buộc ở CI.** `parseCompetitions` chạy khi build/test: múi giờ, ngày, lịch, nguồn https cho bản ghi thật, cờ mẫu, id dành riêng (`gop-y`). Dữ liệu sai làm CI đỏ, không lên trang.
4. **Góp ý công khai không sửa dữ liệu (22.2).** `/competitions/gop-y` validate, lưu nháp trên máy, rồi tạo GitHub issue điền sẵn (repo công khai) hoặc cho sao chép nội dung. Người duy trì kiểm tra nguồn rồi mới mở PR sửa dữ liệu.

## Phương án khác

- Supabase Auth + RLS ngay: đúng hướng dài hạn nhưng kéo Task 23 lên trước, cần project/khóa môi trường mà phiên này không cấu hình và không kiểm thử được trên mạng hiện có.
- Route handler + mật khẩu môi trường: không phải RBAC thật, cần lưu trữ bền phía server, rủi ro lộ mật khẩu chung.

## Hệ quả

- Không có trang `/admin`; test "admin/non-admin" của 22.1 chưa áp dụng được. Bảo vệ hiện tại dựa trên quyền GitHub và review.
- Góp ý cần tài khoản GitHub và là công khai; form cảnh báo không nhập thông tin cá nhân.
- Khi có Auth (Task 23): thay file bằng bảng có RLS (đọc công khai, ghi theo vai trò), bảng audit append-only, giữ `parseCompetitions` làm validator dùng chung, chuyển form sang bảng `submissions` chỉ-ghi; viết test quyền user A/B và admin/non-admin trước khi bật.

## Đề xuất kèm theo

Bật Branch protection cho `develop`/`main` (CONTRIBUTING.md) và cân nhắc `CODEOWNERS` cho `src/features/competitions/data.ts` để mọi thay đổi dữ liệu giải cần review.
