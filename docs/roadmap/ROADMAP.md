# ShanBik — roadmap triển khai 26 tuần

## Định hướng

ShanBik là website responsive hỗ trợ học, mô phỏng và luyện tập Rubik. MVP tập trung vào 3x3: cube viewer, scramble, nhập trạng thái bằng tay, solver 3x3 thử nghiệm, phát lời giải, timer và kiến thức cơ bản. Camera nhận dạng, tài khoản, giải đấu và puzzle mở rộng nằm ở các giai đoạn sau.

Mỗi task là một lượt Codex riêng. Chỉ tiếp tục khi task trước đạt tiêu chí nghiệm thu và đã được review. Công nghệ nêu dưới đây là hướng đề xuất; phải kiểm tra repo, khả năng tương thích, tài liệu chính thức, license và hiệu năng trước khi thêm dependency.

## Quy ước task

- Một prompt chỉ triển khai một task.
- Mọi task bắt đầu bằng kiểm tra repo và điều kiện tiên quyết.
- Mọi task kết thúc bằng kiểm tra thực tế, báo cáo kết quả và dừng chờ review.
- Các trạng thái render, scramble và solve được quản lý riêng cho từng puzzle.
- Không hiển thị tính năng chưa hỗ trợ.
- Không tự deploy hoặc công khai beta khi chưa được yêu cầu.

---

# Giai đoạn 0 — Khởi tạo repo

## Task 0 — Nền tảng dự án

**Mục tiêu:** Tạo web app Next.js App Router, TypeScript, Tailwind CSS, cấu hình lint/format/typecheck/test/build, trang chủ khung ShanBik, README và tài liệu kiến trúc. Bắt đầu từ repo trống; không tạo backend, solver hay renderer 3D.

**Nghiệm thu:** dev server chạy; lint, typecheck, test và build đã chạy thật; tài liệu hướng dẫn được cập nhật. Dùng prompt trong `CODEX_START_PROMPT.md`.

---

# Giai đoạn 1 — MVP 3x3 (Tuần 1–10)

## Tuần 1 — Phạm vi và backlog

### Task 1.1 — Đặc tả MVP
- Xác định personas: người mới, cuber luyện tốc độ, người khám phá các loại khối.
- Chốt luồng 3x3; phân biệt solver nhập tay với camera.
- Viết user stories, ngoài phạm vi MVP và chỉ số thành công.
- **Nghiệm thu:** tài liệu phạm vi và user flows trong `docs/product/`.

### Task 1.2 — Backlog và acceptance criteria
- Chuyển yêu cầu thành task có ID, phụ thuộc, scope và cách kiểm tra.
- Xếp thứ tự theo phụ thuộc kỹ thuật.
- **Nghiệm thu:** backlog có thể triển khai từng task độc lập.

## Tuần 2 — Kiến trúc và quy trình

### Task 2.1 — Kiểm kê repo, kiến trúc hiện trạng
- Ghi stack, scripts, cấu trúc, CI và phần còn thiếu.
- **Nghiệm thu:** `docs/architecture/current-state.md` phản ánh đúng repo.

### Task 2.2 — Chất lượng code và CI
- Thiết lập lint, format, typecheck, test, build trong CI bằng package manager hiện tại.
- **Nghiệm thu:** CI chạy được, README có lệnh tương ứng.

### Task 2.3 — ADR kiến trúc
- Ghi quyết định framework, renderer dự kiến, ranh giới logic, testing và các lựa chọn còn mở.
- **Nghiệm thu:** ADR phân biệt rõ quyết định đã chốt và phần cần thử nghiệm.

## Tuần 3 — Design system và khung giao diện

### Task 3.1 — Design tokens và layout responsive
- Tokens màu, typography, spacing, breakpoint, focus và theme.
- **Nghiệm thu:** layout không tràn ngang ở mobile/tablet/desktop.

### Task 3.2 — UI primitives
- Button, Input, Dialog/Sheet, Tabs, Toast, Loading, Empty, Error.
- **Nghiệm thu:** keyboard/focus/disabled state hoạt động.

### Task 3.3 — Khung trang MVP
- Home, luyện tập, học cơ bản, trợ giúp; chỉ placeholder hữu ích.
- **Nghiệm thu:** navigation responsive, không hydration lỗi.

## Tuần 4 — Cube core và notation

### Task 4.1 — Mô hình trạng thái 3x3
- Trạng thái solved, reset, clone và kiểm tra cấu trúc.
- **Nghiệm thu:** chạy unit test Node, không phụ thuộc DOM/WebGL.

### Task 4.2 — Parser/serializer notation
- `U D L R F B`, prime, `2`; lỗi chỉ token/vị trí sai.
- **Nghiệm thu:** test notation hợp lệ, rỗng và sai.

### Task 4.3 — Áp dụng move
- Thực thi move và chuỗi move trên state.
- **Nghiệm thu:** thuật toán rồi nghịch đảo trả về trạng thái ban đầu.

## Tuần 5 — Viewer 3D tĩnh

### Task 5.1 — CubeViewport
- Đánh giá rồi dùng Three.js/R3F nếu phù hợp; render 26 cubies và màu mặt.
- **Nghiệm thu:** scene client-only, có WebGL fallback.

### Task 5.2 — Responsive và lifecycle
- Kích thước, camera reset, pixel ratio, mount/unmount.
- **Nghiệm thu:** không rò rỉ canvas/listener, hiển thị tốt trên viewport chính.

## Tuần 6 — Điều khiển camera

### Task 6.1 — Chuột, touch, trackpad
- Orbit/zoom có giới hạn, không khóa scroll toàn trang.
- **Nghiệm thu:** có nút reset và phương án dùng không cần gesture.

## Tuần 7 — Move animation đồng bộ logic

### Task 7.1 — Ánh xạ move sang layer
- Ánh xạ sáu mặt với trục/layer của scene.
- **Nghiệm thu:** từng mặt, prime và double turn kiểm chứng đúng.

### Task 7.2 — Animation một move
- Animation, khóa thao tác xung đột, cập nhật logic một lần, reset an toàn.
- **Nghiệm thu:** state và scene thống nhất sau move.

### Task 7.3 — Queue và chuỗi dài
- Hàng đợi move, cancel/reset và giới hạn cập nhật UI.
- **Nghiệm thu:** chuỗi nhanh không làm cubie lệch hoặc nhảy.

## Tuần 8 — Scramble và controls

### Task 8.1 — Scramble 3x3
- Thử thư viện phù hợp, adapter riêng, copy/display.
- **Nghiệm thu:** scramble parse được và tạo state hợp lệ.

### Task 8.2 — Play/pause/step/rewind/reset
- Move hiện tại, tổng bước và trạng thái phát.
- **Nghiệm thu:** tiến/lùi/reset cho kết quả đúng.

### Task 8.3 — Nhập thuật toán
- Input notation, lỗi dễ sửa, lịch sử phát lại trong phiên.
- **Nghiệm thu:** input dài dùng được trên mobile.

## Tuần 9 — Nhập state và solver POC

### Task 9.1 — UI nhập màu thủ công
- Sáu mặt, chọn/sửa màu và kiểm tra số lượng.
- **Nghiệm thu:** state chưa đủ hoặc không hợp lệ không chuyển sang solver.

### Task 9.2 — Spike solver
- So sánh cubejs và ứng viên phù hợp: đúng, hiệu năng, bundle, license, Worker, trạng thái bất khả thi.
- **Nghiệm thu:** báo cáo benchmark/đề xuất; chưa tích hợp sản phẩm.

### Task 9.3 — Solver trong Web Worker
- Tích hợp solver được chọn, trả lời solution hoặc lỗi.
- **Nghiệm thu:** UI không bị khóa; có test state hợp lệ và bất khả thi.

### Task 9.4 — Phát lời giải
- Nối solution vào move player.
- **Nghiệm thu:** áp dụng lời giải đưa cube về solved.

## Tuần 10 — MVP beta

### Task 10.1 — Hoàn chỉnh luồng luyện tập
- Scramble → nhập/giải → phát lời giải → reset.
- **Nghiệm thu:** loading/error/solved nhất quán.

### Task 10.2 — Hướng dẫn và E2E
- Quick start và Playwright cho luồng cốt lõi.
- **Nghiệm thu:** người mới có thể theo hướng dẫn hoàn thành luồng.

### Task 10.3 — Beta readiness
- Responsive, console, accessibility, fallback và hiệu năng.
- **Nghiệm thu:** báo cáo beta, lỗi ưu tiên, checklist deploy/rollback.

---

## Ưu tiên bổ sung trước task 11 — Nhập ảnh 3×3

Theo xác nhận của người dùng: xây nền tảng ảnh dùng chung, kiểm chứng adapter 3×3 trước khi sang task 11.

- IMG.1: Decoder local, giới hạn tệp, geometry/sample points và color classifier không phụ thuộc CubeState.
- IMG.2: Upload sáu ảnh, crop bốn góc theo phối cảnh, xoay thứ tự, hiệu chuẩn sáu tâm và review/sửa màu.
- IMG.3: Chuyển rõ ràng sang manual draft, giữ validation khả thi/solver/player hiện có; kiểm stale decode, cleanup và E2E.
- **Nghiệm thu:** ảnh → review → validation → solver → player; ô chưa rõ được sửa tay, trạng thái bất khả thi bị chặn; không quảng bá hỗ trợ puzzle khác khi chưa có adapter/capability.
- Xem [thiết kế, hướng dẫn và giới hạn ảnh](../cube-image-input.md). Camera live ở tuần 24 sẽ tái sử dụng nền tảng khi phù hợp; chưa triển khai live camera trong scope này.

# Giai đoạn 2 — Học, bách khoa, công thức và timer (Tuần 11–20)

## Tuần 11 — Bách khoa puzzle

### Task 11.1 — Schema và dữ liệu puzzle
- Schema: tên, slug, hình dạng, layer, độ khó, notation, mô tả, liên kết, capability.
- **Nghiệm thu:** validate dữ liệu mẫu 3x3, 2x2, 4x4, Pyraminx, Megaminx.

### Task 11.2 — Danh sách và filter
- Search/filter theo hình dạng, độ khó, layer.
- **Nghiệm thu:** filter mobile dạng sheet, trạng thái URL/navigation phù hợp.

### Task 11.3 — Trang chi tiết
- Nội dung, capability, bài học liên quan, metadata.
- **Nghiệm thu:** ít nhất 5 entry; không quảng bá tính năng thiếu.

## Tuần 12 — Hướng dẫn giải 3x3

### Task 12.1 — Schema lesson
- Mục tiêu, bước, thuật toán, trạng thái trước/sau.
- **Nghiệm thu:** một lesson mẫu được validate.

### Task 12.2 — Giao diện bài học
- Nội dung theo bước, điều hướng trước/tiếp.
- **Nghiệm thu:** đọc và thao tác tốt trên mobile.

### Task 12.3 — Viewer và tiến độ local
- Minh họa thuật toán, lưu vị trí học cục bộ.
- **Nghiệm thu:** refresh không mất tiến độ cùng trình duyệt.

## Tuần 13 — Thư viện công thức

### Task 13.1 — Taxonomy/schema
- Beginner, CFOP, F2L, OLL, PLL; tên, notation, độ khó, ghi chú.
- **Nghiệm thu:** dữ liệu mẫu được kiểm tra bằng parser.

### Task 13.2 — Search/filter công thức
- Card, copy, play, filter mobile.
- **Nghiệm thu:** tìm theo tên/nhóm/thuật toán.

### Task 13.3 — Favorites local
- Lưu yêu thích và danh sách riêng.
- **Nghiệm thu:** tồn tại qua reload, xử lý dữ liệu lỗi.

## Tuần 14 — Thực hành thuật toán

### Task 14.1 — Move list đồng bộ viewer
- Play/pause/step/seek, move hiện tại.
- **Nghiệm thu:** hai hiển thị luôn đồng bộ.

### Task 14.2 — Tốc độ, lặp, ghi chú
- Chỉnh tốc độ, reverse/repeat, ghi chú/hoàn thành local.
- **Nghiệm thu:** thao tác touch/keyboard và khôi phục dữ liệu.

## Tuần 15 — Timer

### Task 15.1 — Timer state machine
- Ready/inspection/running/stopped, performance clock.
- **Nghiệm thu:** test transition và không ghi solve trùng.

### Task 15.2 — UI timer
- Số lớn, Space/touch, tránh bắt phím khi đang nhập.
- **Nghiệm thu:** sử dụng được trên mobile và desktop.

### Task 15.3 — Lưu solve local
- Thời gian, scramble, puzzle, timestamp.
- **Nghiệm thu:** persistence và chống duplicate.

## Tuần 16 — Lịch sử solve

### Task 16.1 — Schema và migration local
- Versioned IndexedDB/local database.
- **Nghiệm thu:** schema có migration ban đầu.

### Task 16.2 — Danh sách lịch sử
- Desktop bảng, mobile card.
- **Nghiệm thu:** solve vẫn có khi reload/offline.

### Task 16.3 — Penalty và undo
- +2, DNF, chỉnh sửa, xóa, undo.
- **Nghiệm thu:** test dữ liệu và penalty chính xác.

## Tuần 17 — Thống kê

### Task 17.1 — Hàm thống kê
- Best, mean, Ao5, Ao12, session average, DNF/+2.
- **Nghiệm thu:** hàm thuần có test bộ dữ liệu chuẩn.

### Task 17.2 — Dashboard chart
- Số liệu, trend, filter session/puzzle.
- **Nghiệm thu:** responsive, có bảng thay thế chart.

## Tuần 18 — 2x2 và 4x4

### Task 18.1 — Puzzle capability registry
- Khai báo riêng render/scramble/solve.
- **Nghiệm thu:** UI không hiển thị hành động không hỗ trợ.

### Task 18.2 — Scramble 2x2/4x4
- Adapter thư viện đã xác minh.
- **Nghiệm thu:** scramble đúng loại puzzle, test notation.

### Task 18.3 — Renderer 2x2/4x4
- Mở rộng renderer, đo draw calls/performance.
- **Nghiệm thu:** chạy ổn trên thiết bị đại diện.

## Tuần 19 — Pyraminx/Megaminx

### Task 19.1 — Spike puzzle dị hình
- Đánh giá model, notation, scramble, viewer, solver, license.
- **Nghiệm thu:** quyết định ghi bằng chứng.

### Task 19.2 — Pyraminx
- Nội dung, scramble và viewer theo capability được xác minh.
- **Nghiệm thu:** thao tác mobile được, không hiện solve thiếu hỗ trợ.

### Task 19.3 — Quyết định Megaminx
- Triển khai phần đã xác minh hoặc chuyển milestone.
- **Nghiệm thu:** quyết định kỹ thuật và backlog rõ.

## Tuần 20 — Kết nối sản phẩm học tập

### Task 20.1 — Search tổng hợp
- Puzzle, bài học, công thức.
- **Nghiệm thu:** keyboard navigation và empty state.

### Task 20.2 — Luồng học → luyện tập
- Liên kết encyclopedia, lesson, algorithm viewer, timer.
- **Nghiệm thu:** navigation liên tục, capability đúng.

### Task 20.3 — Content/regression audit
- Broken links, dữ liệu, mobile flows.
- **Nghiệm thu:** báo cáo vấn đề ưu tiên.

---

# Giai đoạn 3 — Giải đấu, tài khoản, camera và beta (Tuần 21–26)

## Tuần 21 — Giải đấu

### Task 21.1 — Schema và provenance
- Thông tin giải, thời gian/múi giờ, nguồn, ngày cập nhật.
- **Nghiệm thu:** validation và dữ liệu mẫu; không scrape trái phép.

### Task 21.2 — List/detail/filter
- Lọc vùng/ngày/nội dung, trạng thái sự kiện.
- **Nghiệm thu:** giờ địa phương/UTC rõ, responsive.

## Tuần 22 — Quản trị và quan tâm

### Task 22.1 — Admin CRUD và quyền
- Bảo vệ server/database, audit log phù hợp.
- **Nghiệm thu:** test admin/non-admin.

### Task 22.2 — Form đề xuất/báo lỗi
- Public submission không sửa trực tiếp record.
- **Nghiệm thu:** validation, giữ dữ liệu khi lỗi.

### Task 22.3 — Bookmark/reminder local
- Bookmark và nhắc lịch trên thiết bị.
- **Nghiệm thu:** timezone và persistence chính xác.

## Tuần 23 — Tài khoản và cloud sync

### Task 23.1 — Schema, merge policy, threat model
- Dữ liệu solve/favorites/progress/preferences và guest-first.
- **Nghiệm thu:** tài liệu conflict/ownership được review.

### Task 23.2 — Auth và database policies
- Supabase Auth/RLS nếu quyết định đã chốt; service key server-side.
- **Nghiệm thu:** user A không đọc/sửa data user B.

### Task 23.3 — Auth UI
- Đăng ký/đăng nhập/logout/khôi phục.
- **Nghiệm thu:** guest vẫn dùng timer/cube.

### Task 23.4 — Merge và sync
- Đồng bộ local/cloud, lỗi và retry minh bạch.
- **Nghiệm thu:** không ghi đè âm thầm; test conflict.

## Tuần 24 — Camera scan

### Task 24.1 — Permission và stream lifecycle
- Camera sau, chọn camera, stop stream khi rời màn.
- **Nghiệm thu:** từ chối quyền có fallback nhập tay.

### Task 24.2 — Màu 9 ô và chỉnh tay
- Canvas/ImageData trước; OpenCV.js chỉ sau benchmark.
- **Nghiệm thu:** xác nhận/sửa màu trước khi solver nhận state; xử lý local.

### Task 24.3 — Camera test suite
- Ánh sáng, sai màu, permission, switch camera, unmount.
- **Nghiệm thu:** stream dừng đúng; state yếu được báo rõ.

## Tuần 25 — SEO, performance, security, accessibility

### Task 25.1 — Metadata/SEO
- Metadata, canonical, OG, sitemap, robots, structured data.
- **Nghiệm thu:** nội dung indexable, metadata hợp lệ.

### Task 25.2 — Bundle và lazy loading
- Tải scene/solver/camera theo nhu cầu.
- **Nghiệm thu:** đo bundle; fallback WebGL/WASM.

### Task 25.3 — Security audit
- Secrets, input validation, rate limiting, headers, DB access.
- **Nghiệm thu:** báo cáo rủi ro và test quyền.

### Task 25.4 — Accessibility/responsive audit
- Keyboard, focus, contrast, screen reader cơ bản, reduced motion, zoom 200%.
- **Nghiệm thu:** lỗi được sửa hoặc ghi ticket có bước tái hiện.

## Tuần 26 — Public beta readiness

### Task 26.1 — Regression toàn hệ thống
- Học, cube, solver, timer, giải đấu, tài khoản, camera.
- **Nghiệm thu:** không còn P0/P1 chưa có phương án.

### Task 26.2 — Release/rollback checklist
- Migrations, env var names, smoke tests, backup, rollback, cảnh báo.
- **Nghiệm thu:** tài liệu phát hành có thể làm theo.

### Task 26.3 — Báo cáo beta và roadmap sau 6 tháng
- Tổng hợp acceptance, lỗi, số đo thực tế và KPI cần theo dõi.
- **Nghiệm thu:** phân biệt rõ kết quả đo với mục tiêu.

---

## Mốc phát hành

| Mốc | Task | Kết quả |
|---|---|---|
| Prototype 3D | Tuần 1–7 | Cube 3x3 hiển thị, điều khiển camera và xoay mặt đúng |
| MVP 3x3 Beta | Tuần 8–10 | Scramble, solver thử nghiệm, phát lời giải |
| Learning & Timer Beta | Tuần 11–17 | Bách khoa, bài học, công thức, timer, lịch sử, thống kê |
| Puzzle Expansion | Tuần 18–20 | Puzzle mở rộng với capability được công bố rõ |
| Account & Tournament Beta | Tuần 21–23 | Giải đấu, tài khoản, đồng bộ guest/local |
| Public Beta | Tuần 24–26 | Camera beta, SEO, accessibility, hiệu năng và release readiness |

## Rủi ro cần theo dõi

- Solver, scramble và renderer là các năng lực độc lập.
- Không cam kết giải mọi NxN khi chưa có solver, benchmark và test đáng tin cậy.
- Camera chịu ảnh hưởng ánh sáng, phản chiếu và hướng khối; luôn cho sửa thủ công.
- 3D có thể nặng trên mobile; tải động, giới hạn pixel ratio và có fallback.
- Dữ liệu giải đấu cần nguồn, ngày cập nhật và quy trình xác minh.
- Supabase/Firebase, thư viện solver và thư viện puzzle chỉ được chốt sau khi kiểm tra phù hợp, license và thử nghiệm.
