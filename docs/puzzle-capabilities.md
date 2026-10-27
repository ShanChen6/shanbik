# Tuần 18 — 2×2, 4×4 và registry capability

## Phạm vi 18.1–18.3

- 18.1: registry khai báo riêng render/scramble/solve cho từng puzzle; UI và bách khoa chỉ đọc từ đây.
- 18.2: scramble 2×2/4×4 qua adapter cubing.js trong Worker, kiểm tra bằng grammar NxN của ShanBik.
- 18.3: model NxN và renderer 3D dùng instancing, kèm sơ đồ sáu mặt; đo draw call và độ trễ.

Người dùng mở **Bách khoa → Rubik 2×2/4×4 → Thực hành** (`/puzzles/2x2#workbench-title`). 3×3 giữ nguyên `/practice`. Pyraminx/Megaminx dùng cùng cơ chế, xem [quyết định tuần 19](./decisions/odd-puzzles.md).

## 18.1 — Registry

`src/features/puzzles/registry.ts` chỉ chứa dữ liệu, không import renderer/Worker/cubing.js:

| Puzzle               | render                       | scramble                           | solve               |
| -------------------- | ---------------------------- | ---------------------------------- | ------------------- |
| 3×3                  | `cube-3x3` → `/practice`     | `random-move-3x3` (25 nước, local) | `cubing-3x3-worker` |
| 2×2                  | `nxn` size 2 (3D + sơ đồ)    | `cubing-worker` 2x2 (engine twips) | —                   |
| 4×4                  | `nxn` size 4 (3D + sơ đồ)    | `cubing-worker` 4x4 (port TNoodle) | —                   |
| Pyraminx             | `pyraminx-net` (sơ đồ phẳng) | `cubing-worker` pyraminx (twips)   | —                   |
| Megaminx             | —                            | `cubing-worker` megaminx (twips)   | —                   |
| 5×5, Skewb, Square-1 | —                            | —                                  | —                   |

Ràng buộc:

- `parseCatalog` so trạng thái viewer/scramble/solver của từng bài bách khoa với registry **theo cả hai chiều**: đánh dấu "Đã có" khi chưa có adapter, hoặc ẩn một adapter đã có, đều làm build/test thất bại. Nhập ảnh và player vẫn chỉ cho 3×3; bài học vẫn gắn với manifest bài đã xuất bản.
- Trang `/puzzles/[slug]` lấy nút **Luyện tập 3×3** từ `render.kind === "cube-3x3"` và chỉ hiện **Thực hành** khi registry có scramble Worker hoặc render NxN/Pyraminx. 5×5/Skewb/Square-1 không có khu vực này. Không puzzle nào ngoài 3×3 có nút giải.
- Thư viện có hỗ trợ (cubing.js có scramble cho 5×5, Skewb, Square-1 và solver 2×2/Pyraminx) không tự làm capability khả dụng; muốn mở phải thêm adapter, test và cập nhật registry cùng lúc.

## 18.2 — Scramble Worker

- `scramble/protocol.ts`: map puzzle → event cubing (`222`, `444`, `pyram`, `minx`), timeout 60 s.
- `scramble/scramble.worker.ts`: gọi `randomScrambleForEvent`, kiểm tra kết quả bằng `validateScramble` trước khi gửi về; lỗi trả `ok:false`, không trả chuỗi thô.
- `tools/build-solver-worker.mjs` thêm entry `scramble.worker` vào cùng đồ thị chunk với solver (`public/solver-worker/`, có NOTICE cubing.js). Không bundle cubing.js vào trang.
- `scramble/client.ts`: tạo Worker khi người dùng bấm lần đầu, dùng lại; một request tại một thời điểm; bỏ reply sai ID; timeout/lỗi Worker thì terminate và cho thử lại; host kiểm tra lại grammar; rời trang thì terminate.
- `scramble/validate.ts`: 2×2 chỉ nhận nước mặt ngoài (4–30 nước); 4×4 nhận mặt ngoài và `Xw` (30–60 nước, không quá 2 lớp); kết quả phải parse được bởi model ShanBik, không parse được bởi grammar puzzle khác.

Nguồn scramble đọc từ mã cubing.js 0.66.1: `222` dùng engine WASM twips; `444` là bản port TNoodle (scramble 3×3 nối với hậu tố `$randomState`). ShanBik chưa tự kiểm định phân phối, nên UI ghi "để luyện tập; chưa kiểm định là scramble thi đấu chính thức".

Số đo (Node 22, desktop, một lần): 2×2 208/9/16 ms; 4×4 4.422/687/1.159 ms (lần đầu dựng bảng). Trên Chromium production, lần đầu 4×4 khoảng 4,8 s gồm tải Worker; UI báo "Lần đầu cần tải bộ sinh trong Worker, có thể mất vài giây".

## 18.3 — Model và renderer NxN

`nxn/model.ts` là model facelet hình học cho mọi N: sticker nằm ở toạ độ nguyên (đơn vị nhân đôi), một nước quay mọi sticker thuộc các lớp được chọn −90° quanh pháp tuyến mặt. Grammar WCA 12a: `R`, `R'`, `R2`, `Rw`, `nRw` (2 ≤ n < N); 2×2 chỉ mặt ngoài; không nhận slice trong, rotation hay ký hiệu thường.

Kiểm chứng: với N = 3, model khớp core 3×3 đã xác minh từng sticker qua 300 nước ngẫu nhiên; với 2×2/4×4, chu trình hoán vị và số góc bị xoắn khớp KPuzzle `2x2x2`/`4x4x4` của cubing.js trên 40 chuỗi ngẫu nhiên mỗi loại; nước rộng 4×4 dịch chuyển các wing tương ứng. Mỗi nước có bậc 4, đảo chuỗi trả về trạng thái đã giải, mỗi màu luôn đủ N² sticker.

`nxn/nxn-scene.tsx`: một `InstancedMesh` cho 6N² sticker và một hộp thân, nên **2 draw call cho mọi N** (scene 3×3 hiện có: 26 thân + 54 sticker = 80 mesh). Màu cập nhật tại chỗ mỗi nước; khối cùng kích thước 3 đơn vị như 3×3 nên dùng chung camera fit, nút xoay/zoom và chế độ kéo-zoom. Chưa có hoạt ảnh xoay lớp cho NxN (3×3 vẫn có). Không WebGL hoặc mất context: báo rõ, **sơ đồ sáu mặt** (`nxn/net-view.tsx`, SVG) vẫn cập nhật và luôn hiển thị cạnh mô hình.

Canvas ghi `data-draw-calls`, `data-triangles`, `data-frames` của frame trước để QA/benchmark đọc.

### Hiệu năng

Raw: [benchmarks/nxn-renderer.json](./benchmarks/nxn-renderer.json). Chromium 153 headless, WebGL phần mềm (SwiftShader), production build.

| Puzzle | Viewport | CPU     | Draw calls | Triangles | Nước → frame p50/p95/max (ms) | Xoay camera → frame p50/p95 (ms) |
| ------ | -------- | ------- | ---------: | --------: | ----------------------------- | -------------------------------- |
| 2×2    | 1280×900 | 1×      |          2 |     1.212 | 60,6 / 73,5 / 101,7           | 57,4 / 65,9                      |
| 4×4    | 1280×900 | 1×      |          2 |     4.812 | 60,9 / 73,2 / 84,2            | 59,3 / 64,2                      |
| 2×2    | 360×800  | 4× chậm |          2 |     1.212 | 118,1 / 152,9 / 355,9         | 96,6 / 146,0                     |
| 4×4    | 360×800  | 4× chậm |          2 |     4.812 | 127,5 / 166,8 / 422,2         | 94,7 / 141,6                     |

Độ trễ gồm cả thao tác click của Playwright và cập nhật React, không chỉ GPU; dùng để so sánh tương đối. 4×4 gần như bằng 2×2 và bằng thao tác camera (không đổi state), tức chi phí vẽ không tăng đáng kể theo N. CPU 4× là proxy qua CDP, **chưa phải điện thoại thật**; đo Safari iOS/Android tầm trung vẫn là cổng trước public beta như các renderer khác.

## Kiểm tra

Đã kiểm tra khi review (test riêng của tuần 18 chạy cục bộ, chưa đưa vào repo): grammar NxN hợp lệ/không hợp lệ và round-trip; N = 3 khớp core; bậc nước, đảo chuỗi, số sticker; đối chiếu KPuzzle 2×2/4×4; scramble thật từ cubing.js đúng grammar đúng puzzle và sai grammar puzzle khác; client Worker (lười tạo, dùng lại, reply cũ, sai grammar, timeout, release, constructor lỗi). E2E desktop/mobile: chỉ hiện hành động có trong registry, scramble Worker → áp dụng → nút xoay → đặt lại, 2 draw call, fallback không WebGL, axe và không tràn ngang.

Trong repo: `catalog.test.ts` kiểm tra bách khoa khớp registry hai chiều; `tests/e2e/beta.spec.ts` thêm bốn trang puzzle vào audit route/theme.
