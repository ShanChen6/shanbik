# ADR 0006 — Guest-first, persistence và backend

- Ngày: 26/10/2026.
- Trạng thái: **Guest-first theo đặc tả; storage/backend chưa chốt**.
- Phạm vi: Task 2.3; chỉ tài liệu, chưa triển khai năng lực mới.

## Bối cảnh

Beta tuần 10 không cần tài khoản hoặc cloud. Timer/history/progress và sync xuất hiện ở mốc sau. Roadmap nêu Supabase/Firebase như phương án, chưa có benchmark/schema/ADR chọn cuối.

## Quyết định / hướng đề xuất

MVP 3×3 dùng state trong phiên, không hứa khôi phục sau reload. Không yêu cầu login để scramble/nhập tay/giải. Chưa tạo backend, API auth, DB, env credential hoặc SDK cloud.

Khi đến local history, đánh giá IndexedDB (Dexie là ứng viên) cho dữ liệu solve có cấu trúc; localStorage phù hợp tùy chọn nhỏ khi có nhu cầu. Dữ liệu lưu phải có validation/version/migration; UI không truy cập storage rải rác, dùng repository/adapter của domain.

Đồng bộ cloud cần policy ownership, merge/conflict minh bạch, guest fallback và test user A/B trước bật. Supabase PostgreSQL/Auth/RLS là ứng viên roadmap, Firebase là phương án so sánh; không tự coi một bên đã được chọn.

Admin CRUD giải đấu phải có Auth/RBAC/RLS tương ứng trước, dù thứ tự tuần ban đầu đặt admin trước tài khoản. Không đưa service credential vào browser hoặc Git.

## Phương án khác

Cloud bắt buộc từ đầu: chặn guest và tăng cấu hình không cần cho beta. localStorage cho toàn bộ lịch sử lớn: cần đánh giá giới hạn/đồng thời trước chọn. Tự xây backend đầy đủ: chưa có nhu cầu biện minh vận hành.

## Hệ quả

Guest-first giảm phụ thuộc dịch vụ nhưng dữ liệu phiên có thể mất khi reload. Task local persistence cần UX rõ và migration; sync là tính năng riêng, không ghi đè local âm thầm.

## Kiểm chứng và điều kiện xem xét lại

Task 15–16 quyết định local persistence/schema; Task 23.1–23.2 quyết định backend/auth/quyền trước sync. Nâng phần auth tối thiểu lên trước 22.1 hoặc hoãn admin. Cập nhật ADR khi có quyết định và bằng chứng, không cài SDK trong task tài liệu.

## Cập nhật Tuần 16 (27/10/2026)

Local persistence cho solve đã chốt: IndexedDB native (database `shanbik-timer`, migration theo version, transaction, compare-and-set), không thêm Dexie vì nhu cầu hiện tại chỉ là một store và vài truy vấn. Dữ liệu localStorage Tuần 15 được nhập một lần và giữ nguyên làm dự phòng. localStorage vẫn dùng cho tùy chọn nhỏ (theme, favorites, tiến độ bài học). Backend/sync vẫn để Task 23.x. Chi tiết: [solve-history.md](../solve-history.md).

## Cập nhật Tuần 21 (27/10/2026)

Dữ liệu giải đấu lưu dạng file versioned trong repo, validate lúc build, sửa qua commit/review; không form công khai, không scrape. Quản trị CRUD giữ điều kiện có Auth/RBAC/RLS trước (Task 22.1). Chi tiết: [competitions.md](../competitions.md).

## Nguồn trong repository

- [Kiến trúc hiện trạng](../architecture/current-state.md) (snapshot Task 2.1; CI đã bổ sung ở Task 2.2).
- [Đặc tả MVP](../product/mvp-spec.md).
- [Backlog](../product/implementation-backlog.md).
- [Cấu hình package](../../package.json), [Next](../../next.config.ts), [Vitest](../../vitest.config.mts), [CI](../../.github/workflows/ci.yml).
