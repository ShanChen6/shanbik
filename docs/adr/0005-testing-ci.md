# ADR 0005 — Kiến trúc kiểm thử và CI

- Ngày: 26/10/2026.
- Trạng thái: **Ghi nhận CI đã triển khai; mở rộng test theo domain chờ review**.
- Phạm vi: Task 2.3; chỉ tài liệu, chưa triển khai năng lực mới.

## Bối cảnh

Có ESLint/Prettier/TypeScript/Vitest và GitHub Actions. Vitest Node cho phép không có test; chưa có logic nghiệp vụ hoặc Playwright.

## Quyết định / hướng đề xuất

Giữ pnpm và frozen lockfile cho kiểm tra tái lập. Lint/typecheck/format không thay thế test hành vi.

Core dùng Vitest Node với fixture có ý nghĩa: moves/inverse/serialization, state bất khả thi, queue và thống kê khi có domain. Test adapter/Worker cho conversion, lỗi, stale results và cleanup. Thêm Playwright khi có luồng browser ở Task 10.2, có thể sớm hơn nếu rủi ro UI cần; không cài trong Task 2.3.

Test E2E phải có ít nhất luồng dùng core/solver thật khi khả thi; không mock toàn bộ đường giải rồi gọi đó là bằng chứng solver đúng. Không viết test chỉ phản chiếu implementation hoặc test placeholder để CI xanh.

CI hiện có Quality checks: frozen install → format → lint → typecheck → Vitest → build trên PR/push develop/main. PR main kiểm source develop cùng repo. Workflow không bật Branch protection; required checks phải cấu hình riêng trong GitHub.

passWithNoTests chỉ là ngoại lệ scaffold; khi có test domain đầu tiên phải bỏ hoặc siết chính sách này trong task liên quan. Không coi test exit 0 nhưng 0 case là feature được nghiệm thu.

## Phương án khác

Chỉ manual: không bảo vệ tính đúng move/solver khi refactor. Chỉ E2E: chậm và khó chỉ nguyên nhân. Ép coverage phần trăm trước khi có nghiệp vụ: dễ khuyến khích test không có ích.

## Hệ quả

Cần phối hợp unit/adapter/browser. CI xanh chỉ phản ánh các check đã cấu hình. Đo hiệu năng và usability trên thiết bị/người dùng thật là gate riêng, không suy ra từ build.

## Kiểm chứng và điều kiện xem xét lại

Task 4.x tạo test core thực sự; 7.x queue; 9.x Worker/solver; 10.x E2E/regression. Quy trình develop → main theo CONTRIBUTING.md; thay đổi gate CI cần review cùng task tính năng.

## Nguồn trong repository

- [Kiến trúc hiện trạng](../architecture/current-state.md) (snapshot Task 2.1; CI đã bổ sung ở Task 2.2).
- [Đặc tả MVP](../product/mvp-spec.md).
- [Backlog](../product/implementation-backlog.md).
- [Cấu hình package](../../package.json), [Next](../../next.config.ts), [Vitest](../../vitest.config.mts), [CI](../../.github/workflows/ci.yml).
