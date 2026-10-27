# ShanBik

Website học, mô phỏng và luyện tập Rubik. Đã có nền tảng giao diện, UI primitives, khung trang MVP và cube core 3×3 (state, notation, move engine). Trang luyện tập có mô hình 3×3 với điều khiển camera bằng nút, chuột/touch/trackpad; có animation, hàng đợi FIFO, pause/resume và hủy/reset an toàn; có tạo/copy/áp dụng scramble luyện tập 25 nước; player có play/pause, tiến/lùi và khôi phục snapshot đầu chuỗi; có nhập thuật toán, lỗi giữ nội dung và lịch sử phát trong phiên; có lưới nhập màu sáu mặt, tâm cố định, kiểm tra đủ ô/số lượng màu và tính khả thi cubie/hướng/parity.

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

Task tiếp theo: **16.1 — Schema và migration local** trong docs/roadmap/ROADMAP.md.

Tài liệu giao diện: [Tokens và layout](docs/design-system.md).

UI primitives: [Hướng dẫn sử dụng](docs/ui-primitives.md). Trang `/ui-preview` chỉ mở khi `pnpm dev`; production trả 404.

Các route và điều hướng: [Khung trang MVP](docs/routes.md).

Cube core: [Quy ước và API](docs/cube-state.md).

Notation: [Cú pháp và API thuật toán](docs/cube-notation.md).

Move engine: [API và fixture đối chiếu](docs/cube-moves.md).

Viewer 3D và camera: [Thiết kế, kiểm tra và giới hạn](docs/cube-viewer.md).

Move → layer: [Quy ước trục, góc xoay và kiểm chứng renderer](docs/cube-move-layer.md).

Animation một move: [State, lifecycle và kiểm chứng](docs/cube-single-move.md).

Move queue: [FIFO, pause/resume và giới hạn](docs/cube-move-queue.md).

Scramble 3×3: [Adapter, copy và apply một lần](docs/cube-scramble.md).

Player: [Controls, snapshot và reset](docs/cube-player.md).

Input thuật toán và lịch sử: [Task 8.3](docs/cube-algorithm-input.md).

Nhập màu sáu mặt và hướng giữ khối: [Task 9.1a](docs/cube-face-input.md).

Validation tính khả thi: [Task 9.1b](docs/cube-feasibility.md).

Spike/benchmark lịch sử (Task 9.3 đã chọn cubing.js thay cubejs): [quyết định 9.2](docs/decisions/solver-3x3.md), [harness tái lập](tools/solver-spike/README.md).

Giải bản nhập 3×3 bằng cubing.js trong Worker, có kiểm chứng/cancel/timeout/retry: [Task 9.3](docs/cube-worker-solver.md). Nạp snapshot gốc cùng lời giải để phát tiến/lùi/reset: [Task 9.4](docs/cube-solution-player.md).

Luồng luyện tập, lấy màu mô hình và reset phiên: [Task 10.1](docs/cube-practice-flow.md).

Hướng dẫn người dùng: `/help#quick-start`. Bộ Playwright production và lệnh chạy/CI: [Task 10.2](docs/testing-e2e.md).

Beta 3×3: [báo cáo và giới hạn kiểm chứng](docs/reports/beta-readiness-2026-10-27.md), [checklist phát hành/rollback](docs/beta-release-checklist.md). Chưa tự phát hành hoặc mở rộng phạm vi trình duyệt.

Nhập ảnh tĩnh 3×3 (ưu tiên trước task 11): [cách dùng, kiến trúc mở rộng và giới hạn](docs/cube-image-input.md). Mở “Nhập từ ảnh — 3×3” ở trang luyện tập.

Bách khoa tám puzzle, bộ lọc URL và capability thực tế: [Tuần 11](docs/puzzle-encyclopedia.md). Mở `/puzzles`.

Schema bài học và sample đã kiểm chứng: [Task 12.1](docs/lesson-schema.md).

Bài mẫu đã có giao diện đọc từng bước: `/learn/lessons/lam-quen-u-va-u-prime` — [Task 12.2](docs/lesson-ui.md).

Viewer minh họa theo bước và lưu vị trí đọc cục bộ: [Task 12.3](docs/lesson-viewer-progress.md).

Thư viện công thức `/algorithms`: tìm/lọc, copy, minh họa và danh sách yêu thích local — [Task 13](docs/algorithm-library.md).

Thực hành theo nước, seek, tốc độ, đảo/lặp và ghi chú/hoàn thành local trong minh họa công thức: [Tuần 14](docs/algorithm-practice.md).

Timer 3×3 tại `/timer`: Space/touch, quan sát tùy chọn và lưu lượt giải local — [Tuần 15](docs/timer.md).
