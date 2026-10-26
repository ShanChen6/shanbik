# ShanBik

Website học, mô phỏng và luyện tập Rubik. Hiện hoàn thành nền tảng Task 0 và trang chủ “Đang xây dựng”.

## Môi trường

- Node.js 24 LTS (xem `.nvmrc`).
- pnpm 11.25.0 (khai báo `packageManager`).

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Mở http://localhost:3000.

## Kiểm tra

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
pnpm start
```

`pnpm test` chạy Vitest; Task 0 chưa có logic nghiệp vụ nên chưa có test case. Các task cube tiếp theo bổ sung test có ý nghĩa.

## Cấu trúc

- `src/app`: App Router và trang chủ.
- `src/components`: component dùng chung.
- `src/features`: cube, timer, learn, encyclopedia, competitions, account.
- `src/lib`, `src/styles`: tiện ích và style chung.
- `docs/architecture.md`: ranh giới kiến trúc và quyết định còn mở.
- `docs/roadmap/`: roadmap và prompt triển khai.

Chưa cần biến môi trường trong Task 0. File `.env*` bị bỏ qua; chỉ commit ví dụ đã loại secret.

## Quy trình phát triển

Nhánh task được tạo từ `develop`, PR vào `develop` để review/kiểm tra, sau đó PR `develop` vào `main` khi phát hành. Xem CONTRIBUTING.md.

Task tiếp theo: **1.1 — Đặc tả MVP** trong docs/roadmap/ROADMAP.md.
