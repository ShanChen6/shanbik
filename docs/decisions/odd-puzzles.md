# Pyraminx và Megaminx — spike, triển khai và quyết định (Tuần 19)

Ngày: 27/10/2026. Thư viện: cubing.js **0.66.1** (đã là dependency từ Task 9.3, license `MPL-2.0 OR GPL-3.0-or-later`; NOTICE tại `public/licenses/cubing-NOTICE.txt`, không thêm package mới).

## 19.1 — Spike

| Tiêu chí             | Pyraminx                                                                                           | Megaminx                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Model trong thư viện | `puzzles.pyraminx` KPuzzle: EDGES 6, CORNERS 4 (tâm trục), CORNERS2 4 (đỉnh nhỏ)                   | `puzzles.megaminx` KPuzzle: CORNERS 20, EDGES 30, CENTERS 12                                                |
| Notation             | WCA 12e `U L R B` (hai lớp) và `u l r b` (đỉnh), `'`; KPuzzle nhận trực tiếp                       | WCA 12d scramble `R++ R-- D++ D-- U U'`; KPuzzle nhận trực tiếp                                             |
| Scramble             | `randomScrambleForEvent("pyram")`, engine WASM twips; Node 120/168/219 ms, Chromium lần đầu ~0,5 s | `randomScrambleForEvent("minx")`, twips; Node 14/5/4 ms, Chromium lần đầu ~0,35 s; 7 dòng × (10 R/D + U/U′) |
| Viewer               | cubing.js có TwistyPlayer (web component, chunk 3D ~60 KB + three.js riêng)                        | như bên trái                                                                                                |
| Solver               | `solvePyraminx`: 5/5 lời giải về đúng pattern gốc (`isIdentical`), 11–66 ms, 12–16 nước            | `solveMegaminx`: 2/2 lời giải **không** về pattern gốc (156–160 nước, 0,4–0,6 s)                            |

Ghi chú: số đo Node là một lần chạy trên máy cloud, không phải benchmark thiết bị. Chunk WASM twips dùng chung cho 2×2/Pyraminx/Megaminx khoảng 670 KB chưa nén, chỉ tải trong Worker khi người dùng bấm Tạo scramble lần đầu.

### Quyết định viewer

Không dùng TwistyPlayer: thêm một renderer/three.js thứ hai và web component khó đồng bộ với theme, camera và kiểm thử của dự án. Thay vào đó ShanBik có **model facelet riêng** cho Pyraminx (`pyraminx/model.ts`) dựng bằng hình học số nguyên: bốn đỉnh nằm trên các góc xen kẽ của hình lập phương, mỗi nước là phép quay 120° đúng bằng hoán vị toạ độ có dấu; đỉnh nhỏ cắt ở trọng số 6, lớp ở trọng số 3. Hiển thị là sơ đồ phẳng SVG (`pyraminx/net-view.tsx`).

Bằng chứng model: mỗi nước bậc 3; đỉnh nhỏ giao hoán với mọi nước hai lớp; một nước đỉnh đổi 3 sticker, một nước lớp đổi 12; đảo chuỗi trả về trạng thái đã giải. Đối chiếu KPuzzle trên 60 chuỗi ngẫu nhiên: độ xoắn từng đỉnh nhỏ và từng tâm trục khớp **theo từng đỉnh** (sau khi ánh xạ đỉnh từ các nước đơn), chu trình hoán vị cạnh và số cạnh đúng chỗ đúng hướng khớp.

Quy ước cầm (WCA 12e): mặt xanh lá hướng về người giải, mặt vàng ở đáy; U là đỉnh trên, L/R hai đỉnh dưới phía trước, B đỉnh sau; chiều thuận là chiều kim đồng hồ khi nhìn thẳng vào đỉnh. Màu mặt F xanh lá, L đỏ, R xanh dương, D vàng.

## 19.2 — Pyraminx

Trên `/puzzles/pyraminx` → **Thực hành**: tạo scramble trong Worker (kiểm tra grammar 6–20 nước, chỉ `ULRBulrb` và `'`), sao chép, áp dụng lên trạng thái đã giải, 16 nút `U U′ … b b′` cao tối thiểu 44 px cho thao tác chạm, lịch sử nước và đặt lại. Sơ đồ có mô tả trợ năng số mặt đồng màu.

Không hiện solve: dù `solvePyraminx` đúng trong spike, nối vào cần chuyển trạng thái facelet ↔ KPattern và kiểm chứng như solver 3×3; registry để `solve: null`. Chưa có mô hình 3D Pyraminx.

## 19.3 — Megaminx

Triển khai phần đã xác minh: **chỉ scramble**. Validator `megaminx/notation.ts` yêu cầu đúng 7 dòng, mỗi dòng 10 nước R/D xen kẽ bắt đầu bằng R, kết thúc U hoặc U′. UI hiển thị từng dòng, sao chép giữ xuống dòng. Bách khoa: viewer/solver "Chưa có".

Chuyển sang milestone sau (backlog):

1. **Model Megaminx** riêng (12 mặt × 11 sticker) với kiểm chứng KPuzzle như Pyraminx, rồi sơ đồ phẳng hai "bông hoa". Điều kiện: chu trình/độ xoắn khớp KPuzzle, nước R++/D++ đúng định nghĩa WCA (xoay mọi thứ trừ một mặt).
2. **Solver Megaminx**: không dùng `solveMegaminx` 0.66.1 cho tới khi kết quả về đúng pattern gốc (spike thất bại 2/2); cần điều tra quy ước hướng/tâm hoặc phiên bản thư viện mới.
3. **Solver Pyraminx/2×2**: adapter facelet → KPattern, kiểm chứng lời giải trên model ShanBik trước khi hiển thị, Worker và timeout như Task 9.3.
4. **Mô hình 3D Pyraminx**: chỉ khi có lý do sản phẩm; sơ đồ phẳng đáp ứng thao tác mobile hiện tại.
5. Timer cho 2×2/4×4/Pyraminx/Megaminx: cần mở rộng `Solve.puzzle` và validation scramble theo registry (hiện timer chỉ 3×3).

## Kiểm tra

Đã kiểm tra khi review (test model/scramble/E2E riêng chạy cục bộ, chưa đưa vào repo): các bằng chứng model ở trên; scramble thật từ cubing.js cho cả bốn puzzle qua grammar đúng loại và bị grammar loại khác từ chối; E2E Pyraminx (nút chạm, lịch sử, scramble Worker, không canvas, không nút giải) và Megaminx (7 dòng đúng mẫu, sao chép), axe và không tràn ngang trên 320–1280 px. Audit beta trong repo có `/puzzles/pyraminx` và `/puzzles/megaminx`.
