# ShanBik

Website học, mô phỏng và luyện tập Rubik. Đã có nền tảng giao diện, UI primitives, khung trang MVP và cube core 3×3 (state, notation, move engine). Trang luyện tập đã hiển thị mô hình 3×3 tĩnh; chưa có điều khiển hoặc animation move.

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

`pnpm test` chạy Vitest trong Node cho cube core: snapshot, validation cấu trúc, state serialization, notation, move engine và inverse. Từ Task 4.1 không còn passWithNoTests; thiếu toàn bộ test sẽ làm lệnh thất bại.

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

## CI

Workflow `.github/workflows/ci.yml` chạy trên PR vào `develop`/`main` và push lên hai nhánh này. Check **Quality checks** lần lượt chạy install frozen lockfile → format → lint → typecheck → Vitest → production build.

Node lấy từ `.nvmrc`, pnpm lấy từ `packageManager`. Workflow chỉ cần `contents: read`, không cần secret hay dịch vụ ngoài. PR vào `main` phải đến từ `develop` của chính repo này.

Từ Task 4.1, Vitest có test state model và không còn `passWithNoTests`. CI xanh hiện kiểm chứng những hành vi đã có test, chưa chứng minh renderer hoặc solver chưa được triển khai; xem backlog Task 4.x/9.x.

Để CI thực sự chặn merge, chủ repo cần đặt **Quality checks** là required status check trong Branch protection/Rulesets cho `develop` và `main`. Workflow không tự bật bảo vệ nhánh và không tự merge/deploy. Khi chọn check trong GitHub, dùng tên xuất hiện sau lần chạy đầu.

Nếu CI lỗi: mở Actions hoặc Checks của PR, xem bước lỗi và chạy lại đúng lệnh tương ứng ở local. Không sửa lockfile để né lỗi frozen install; cập nhật lockfile bằng pnpm nếu manifest thực sự thay đổi.

Task tiếp theo: **5.2 — Responsive và lifecycle viewer** trong docs/roadmap/ROADMAP.md.

Tài liệu giao diện: [Tokens và layout](docs/design-system.md).

UI primitives: [Hướng dẫn sử dụng](docs/ui-primitives.md). Trang `/ui-preview` chỉ mở khi `pnpm dev`; production trả 404.

Các route và điều hướng: [Khung trang MVP](docs/routes.md).

Cube core: [Quy ước và API](docs/cube-state.md).

Notation: [Cú pháp và API thuật toán](docs/cube-notation.md).

Move engine: [API và fixture đối chiếu](docs/cube-moves.md).

Viewer 3D tĩnh: [Thiết kế, kiểm tra và giới hạn](docs/cube-viewer.md).
