# ADR 0001 — Nền tảng web và ranh giới client/server

- Ngày: 26/10/2026.
- Trạng thái: **Ghi nhận nền tảng đã triển khai; chính sách boundary chờ review PR**.
- Phạm vi: Task 2.3; chỉ tài liệu, chưa triển khai năng lực mới.

## Bối cảnh

Repo đã dùng Next.js App Router, React, TypeScript, Tailwind và pnpm. Sản phẩm là website responsive, beta ưu tiên guest. Chưa có renderer, solver hoặc backend.

## Quyết định / hướng đề xuất

Giữ web app một package hiện tại; không chuyển monorepo hoặc native app. Phiên bản lấy từ package.json và lockfile, không chép version vào quyết định như cam kết nâng cấp.

Route/layout/nội dung tĩnh dùng Server Components mặc định. Chỉ tạo client boundary nhỏ cho state tương tác, viewer, timer hoặc browser API. Không truy cập window, storage hoặc WebGL khi server render. Dữ liệu render ban đầu phải xác định để tránh hydration mismatch.

Giữ nguyên cacheComponents/partialPrefetching hiện có trong next.config.ts ở task tài liệu này. Đây không phải quyết định cache dữ liệu cá nhân: state luyện tập và lịch sử user không được cache dùng chung. Khi có fetch/backend cần đánh giá và ghi chính sách cache theo route/dữ liệu trước khi code.

## Phương án khác

SPA React riêng: thêm router/build setup, chưa có nhu cầu đổi nền tảng. Native app: ngoài phạm vi. Monorepo/API riêng: tăng vận hành khi chưa có backend requirement.

## Hệ quả

Tận dụng scaffold/CI đã có; cần phân biệt server và browser khi thêm scene/Worker. Không suy ra đã có ISR, offline hoặc hosting production. Đọc docs Next cài trong node_modules trước mỗi thay đổi theo AGENTS.md.

## Kiểm chứng và điều kiện xem xét lại

Task 3.3 xác minh build/hydration và navigation. Khi có auth/data động, review lại cache và SSR. Nếu framework cản Worker/renderer ở spike thì mở ADR thay thế, không tự đổi stack.

## Nguồn trong repository

- [Kiến trúc hiện trạng](../architecture/current-state.md) (snapshot Task 2.1; CI đã bổ sung ở Task 2.2).
- [Đặc tả MVP](../product/mvp-spec.md).
- [Backlog](../product/implementation-backlog.md).
- [Cấu hình package](../../package.json), [Next](../../next.config.ts), [Vitest](../../vitest.config.mts), [CI](../../.github/workflows/ci.yml).
