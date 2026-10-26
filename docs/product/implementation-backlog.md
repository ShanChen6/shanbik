# ShanBik — Backlog triển khai MVP (Task 1.2)

Nguồn yêu cầu: [Đặc tả MVP](./mvp-spec.md) và [Roadmap 26 tuần](../roadmap/ROADMAP.md).

## Cách sử dụng và trạng thái

Đây là kế hoạch triển khai, không phải báo cáo tính năng đã hoàn thành. Task 0 và Task 1.1 đã được merge vào develop; các task trong bảng dưới ở trạng thái **Planned** tại thời điểm lập backlog. Task 1.2 chờ review qua PR.

Mỗi mục là một lượt Codex/PR nhỏ. Tạo branch từ develop; PR vào develop, kiểm thử tích hợp rồi mới PR develop vào main. Không tự merge hoặc chuyển task khi chưa review.

P0: đường găng/độ đúng của beta; P1: UX, hướng dẫn và khả năng sử dụng bắt buộc cho beta; P2: sau beta 3×3. P1 không đồng nghĩa được bỏ khỏi mốc phát hành. Ưu tiên task đã đủ phụ thuộc trước, sau đó P0 trước P1 nếu không chặn nhau.

**Lệnh chuẩn** sau khi có app: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format:check`, `pnpm build`. Chỉ thay đổi tài liệu thì kiểm tra định dạng, liên kết và nội dung; không cần chạy lại build. Trước mỗi task kiểm tra scripts thực tế. Chưa chạy hoặc chưa có test phải ghi rõ, không gọi là pass.

ID roadmap 9.1 được tách thành 9.1a (UI) và 9.1b (validation vật lý); ID khác được giữ nguyên. 1.2 tạo kế hoạch này, không triển khai các task kế tiếp.

## Ma trận thứ tự và truy vết

| ID   | Task                        | Phụ thuộc          | Yêu cầu        | Ưu tiên | Trạng thái |
| ---- | --------------------------- | ------------------ | -------------- | ------- | ---------- |
| 2.1  | Kiểm kê kiến trúc           | 1.2                | Nền tảng       | P0      | Planned    |
| 2.2  | CI và chất lượng code       | 2.1                | Nền tảng       | P0      | Planned    |
| 2.3  | ADR nền tảng                | 2.1                | Nền tảng       | P0      | Planned    |
| 3.1  | Tokens và layout            | 2.3                | Nền tảng       | P1      | Planned    |
| 3.2  | UI primitives               | 3.1                | Nền tảng       | P1      | Planned    |
| 3.3  | Khung trang                 | 3.2                | MVP-08         | P1      | Planned    |
| 4.1  | State model 3×3             | 2.3                | MVP-02         | P0      | Planned    |
| 4.2  | Parser và serializer        | 4.1                | MVP-02         | P0      | Planned    |
| 4.3  | Move engine                 | 4.2                | MVP-02         | P0      | Planned    |
| 5.1  | Viewer tĩnh                 | 3.3, 4.1           | MVP-01         | P0      | Planned    |
| 5.2  | Responsive/lifecycle viewer | 5.1                | MVP-01         | P1      | Planned    |
| 6.1  | Camera controls             | 5.2                | MVP-01         | P1      | Planned    |
| 7.1  | Move → layer mapping        | 4.3, 5.2           | MVP-02         | P0      | Planned    |
| 7.2  | Animation một move          | 7.1                | MVP-02         | P0      | Planned    |
| 7.3  | Move queue                  | 7.2                | MVP-02, MVP-07 | P0      | Planned    |
| 8.1  | Scramble 3×3                | 4.3, 7.3           | MVP-03         | P0      | Planned    |
| 8.2  | Player controls             | 7.3                | MVP-07         | P0      | Planned    |
| 8.3  | Input thuật toán            | 4.2, 8.2           | MVP-02         | P1      | Planned    |
| 9.1a | Nhập màu sáu mặt            | 3.2, 4.1           | MVP-04         | P0      | Planned    |
| 9.1b | Validation tính khả thi     | 9.1a, 4.3          | MVP-05         | P0      | Planned    |
| 9.2  | Solver spike và benchmark   | 4.3, 9.1b          | MVP-06         | P0      | Planned    |
| 9.3  | Worker solver               | 9.2                | MVP-06         | P0      | Planned    |
| 9.4  | Solution → player           | 9.3, 8.2           | MVP-06, MVP-07 | P0      | Planned    |
| 10.1 | Luồng luyện tập hoàn chỉnh  | 8.1, 8.3, 9.4, 6.1 | MVP-01–07      | P0      | Planned    |
| 10.2 | Hướng dẫn nhanh và E2E      | 10.1               | MVP-08         | P1      | Planned    |
| 10.3 | Beta readiness              | 10.2, 2.2          | MVP-01–08      | P0      | Planned    |

## Chi tiết task

### 2.1 — Kiểm kê kiến trúc

- **Mục tiêu/phạm vi:** Ghi stack/scripts, cấu trúc, ranh giới UI/core/renderer/persistence vào docs/architecture/current-state.md.
- **Phụ thuộc:** 1.2.
- **Ngoài phạm vi:** Không đổi framework hoặc viết feature.
- **Nghiệm thu:** Mọi thông tin có đường dẫn chứng minh từ repo; xác định phần thiếu, không gọi scaffold là feature đã hoàn thành.
- **Kiểm tra:** Đọc package.json, lockfile, configs và docs; đối chiếu thủ công.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 2.2 — CI và chất lượng code

- **Mục tiêu/phạm vi:** Workflow PR vào develop/main: install frozen lockfile, lint, typecheck, test, build, format check.
- **Phụ thuộc:** 2.1.
- **Ngoài phạm vi:** Không thêm dịch vụ theo dõi ngoài.
- **Nghiệm thu:** Workflow chạy từ checkout sạch; quyền tối thiểu; ghi rõ Vitest chưa có test ở giai đoạn scaffold.
- **Kiểm tra:** Các lệnh chuẩn + chạy workflow thật trên PR; chưa có check phải ghi chưa chạy.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 2.3 — ADR nền tảng

- **Mục tiêu/phạm vi:** Ghi ADR renderer dự kiến, ranh giới cube core, testing, client/server và Worker.
- **Phụ thuộc:** 2.1.
- **Ngoài phạm vi:** Chưa chốt solver/backend khi chưa có spike.
- **Nghiệm thu:** Quyết định đã chốt và giả thuyết được phân biệt; core không phụ thuộc DOM/WebGL.
- **Kiểm tra:** Review ADR với kiến trúc và roadmap.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 3.1 — Tokens và layout

- **Mục tiêu/phạm vi:** Tokens màu, chữ, spacing, focus; khung header/main/footer responsive.
- **Phụ thuộc:** 2.3.
- **Ngoài phạm vi:** Chưa cube hoặc solver.
- **Nghiệm thu:** Không tràn ngang 360px/tablet/desktop; focus rõ, tương phản đọc được.
- **Kiểm tra:** Lint/typecheck/build; kiểm tra viewport và zoom 200%.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 3.2 — UI primitives

- **Mục tiêu/phạm vi:** Button/input/dialog hoặc sheet/tabs/toast/loading/empty/error cần cho beta.
- **Phụ thuộc:** 3.1.
- **Ngoài phạm vi:** Không thêm component chưa có nhu cầu.
- **Nghiệm thu:** Keyboard/focus/disabled đúng; touch target mục tiêu 44px; dialog trả focus khi đóng.
- **Kiểm tra:** Lệnh chuẩn; kiểm tra bàn phím/touch trong trang demo phù hợp.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 3.3 — Khung trang

- **Mục tiêu/phạm vi:** Home/luyện tập/hướng dẫn/trợ giúp và navigation.
- **Phụ thuộc:** 3.2.
- **Ngoài phạm vi:** Chưa nội dung giáo trình đầy đủ.
- **Nghiệm thu:** Route chạy, mobile menu dùng được; không hydration mismatch.
- **Kiểm tra:** Lệnh chuẩn; smoke navigation.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 4.1 — State model 3×3

- **Mục tiêu/phạm vi:** Solved/reset/clone/schema và quy ước mặt, tâm, tọa độ, serialization.
- **Phụ thuộc:** 2.3.
- **Ngoài phạm vi:** Không React hoặc geometry.
- **Nghiệm thu:** Có nguồn quy ước duy nhất; clone độc lập; dữ liệu sai cấu trúc bị từ chối.
- **Kiểm tra:** Unit Node cho solved/reset/clone/schema.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 4.2 — Parser và serializer

- **Mục tiêu/phạm vi:** U/D/L/R/F/B, prime, double; chuẩn hóa khoảng trắng và lỗi token/vị trí.
- **Phụ thuộc:** 4.1.
- **Ngoài phạm vi:** Chưa notation wide/slice ngoài beta.
- **Nghiệm thu:** Round-trip nhất quán; input sai không thay đổi state.
- **Kiểm tra:** Unit từng token, chuỗi rỗng, sai token và round-trip.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 4.3 — Move engine

- **Mục tiêu/phạm vi:** Áp dụng move/sequence, inverse và solved check.
- **Phụ thuộc:** 4.2.
- **Ngoài phạm vi:** Không animation.
- **Nghiệm thu:** Mỗi move 4 lần và sequence + inverse trả về ban đầu; prime/double đúng.
- **Kiểm tra:** Unit đối chiếu fixture từng mặt và chuỗi nhiều mặt.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 5.1 — Viewer tĩnh

- **Mục tiêu/phạm vi:** 26 cubies, sticker, ánh sáng, camera, client-only viewer.
- **Phụ thuộc:** 3.3, 4.1.
- **Ngoài phạm vi:** Không tự tạo state model thứ hai.
- **Nghiệm thu:** Màu/trục theo core; WebGL failure có thông báo; SSR không khởi tạo canvas.
- **Kiểm tra:** Build; kiểm tra render và fallback.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 5.2 — Responsive/lifecycle viewer

- **Mục tiêu/phạm vi:** Kích thước thích ứng, pixel ratio, reset camera, cleanup.
- **Phụ thuộc:** 5.1.
- **Ngoài phạm vi:** Chưa tối ưu NxN.
- **Nghiệm thu:** Mount/unmount không tăng canvas/listener; cube không bị cắt ở viewport chính.
- **Kiểm tra:** Lệnh chuẩn; kiểm tra remount, mobile và đo tài nguyên đại diện.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 6.1 — Camera controls

- **Mục tiêu/phạm vi:** Orbit/zoom/reset bằng chuột, touch, trackpad và controls thay thế.
- **Phụ thuộc:** 5.2.
- **Ngoài phạm vi:** Không khóa scroll toàn trang.
- **Nghiệm thu:** Giới hạn camera hợp lý; không phụ thuộc hover/gesture; thao tác ngoài canvas vẫn cuộn trang.
- **Kiểm tra:** Kiểm tra touch/trackpad/keyboard và reduced motion.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 7.1 — Move → layer mapping

- **Mục tiêu/phạm vi:** Ánh xạ mặt/trục/layer của core với scene.
- **Phụ thuộc:** 4.3, 5.2.
- **Ngoài phạm vi:** Chưa queue.
- **Nghiệm thu:** Sáu mặt, prime và double đúng theo cùng quy ước; không đảo hướng nhìn.
- **Kiểm tra:** Fixture mapping/hình học và đối chiếu renderer.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 7.2 — Animation một move

- **Mục tiêu/phạm vi:** Animation, commit logic một lần, snap lưới, cancel/reset.
- **Phụ thuộc:** 7.1.
- **Ngoài phạm vi:** Không cập nhật logic theo từng frame React.
- **Nghiệm thu:** Không sai số tích lũy; reset giữa move an toàn; reduced motion vẫn đúng state.
- **Kiểm tra:** Unit transition; kiểm tra hình ảnh sau mỗi move.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 7.3 — Move queue

- **Mục tiêu/phạm vi:** Queue tuần tự, pause/cancel/reset và xử lý thao tác nhanh.
- **Phụ thuộc:** 7.2.
- **Ngoài phạm vi:** Không cho hai nguồn state cạnh tranh.
- **Nghiệm thu:** Chuỗi dài không lệch scene/core; cancel không commit move cũ vào state mới.
- **Kiểm tra:** Test queue/chuỗi dài/cancel và spam controls.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 8.1 — Scramble 3×3

- **Mục tiêu/phạm vi:** Adapter scramble, hiển thị, copy và áp dụng.
- **Phụ thuộc:** 4.3, 7.3.
- **Ngoài phạm vi:** Không quảng bá chuẩn thi đấu khi chưa xác minh.
- **Nghiệm thu:** Scramble parse/apply được; clipboard thất bại có cách copy tay; không tự áp dụng hai lần.
- **Kiểm tra:** Unit adapter; browser clipboard success/denied và state.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 8.2 — Player controls

- **Mục tiêu/phạm vi:** Play/pause/step/rewind/reset snapshot; đánh dấu move.
- **Phụ thuộc:** 7.3.
- **Ngoài phạm vi:** Reset player không đồng nghĩa reset cube solved.
- **Nghiệm thu:** Tiến/lùi/pause giữ state khớp; reset về đầu chuỗi; chuỗi rỗng không gây lỗi.
- **Kiểm tra:** Unit player và browser thao tác nhanh.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 8.3 — Input thuật toán

- **Mục tiêu/phạm vi:** Input, lỗi giữ nội dung, lịch sử phát trong phiên.
- **Phụ thuộc:** 4.2, 8.2.
- **Ngoài phạm vi:** Không cloud hoặc khôi phục sau reload.
- **Nghiệm thu:** Input sai không đổi cube; phát chuỗi mới hủy queue cũ; chuỗi dài không tràn mobile.
- **Kiểm tra:** Unit integration; browser input dài/sai và thay chuỗi.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 9.1a — Nhập màu sáu mặt

- **Mục tiêu/phạm vi:** Lưới sticker, màu tâm cố định, hướng dẫn hướng mặt, sửa màu.
- **Phụ thuộc:** 3.2, 4.1.
- **Ngoài phạm vi:** Không camera.
- **Nghiệm thu:** Có nhãn vị trí/màu; kiểm tra nhập đủ và số lượng; sửa input không mất dữ liệu.
- **Kiểm tra:** Browser keyboard/touch và fixture form thiếu màu.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 9.1b — Validation tính khả thi

- **Mục tiêu/phạm vi:** Kiểm tra màu, cubie inventory, orientation và parity theo representation được chọn.
- **Phụ thuộc:** 9.1a, 4.3.
- **Ngoài phạm vi:** Đủ 9 ô/màu không được coi là đủ hợp lệ.
- **Nghiệm thu:** Từ chối state bất khả thi; phân biệt lỗi có thể hướng dẫn; đầu vào hợp lệ serialize nhất quán.
- **Kiểm tra:** Fixture solved/scramble hợp lệ, duplicate cubie, edge flip, corner twist và parity sai.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 9.2 — Solver spike và benchmark

- **Mục tiêu/phạm vi:** Đánh giá ứng viên, license, bundle, thời gian cold/warm, memory, Worker và cách hủy.
- **Phụ thuộc:** 4.3, 9.1b.
- **Ngoài phạm vi:** Không tự cam kết optimal solution hoặc giải mọi puzzle.
- **Nghiệm thu:** Có kết quả thiết bị đại diện; chốt timeout, fixture coverage và adapter trước tích hợp.
- **Kiểm tra:** Báo cáo docs/decisions/solver-3x3.md với version, thiết bị, đầu vào và số đo tái lập.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 9.3 — Worker solver

- **Mục tiêu/phạm vi:** Worker protocol, snapshot/request ID, loading, timeout/error/retry và cleanup.
- **Phụ thuộc:** 9.2.
- **Ngoài phạm vi:** Không fallback solve nặng trên main thread.
- **Nghiệm thu:** State lỗi không gửi giải; kết quả cũ bị bỏ; UI dùng được khi giải; unmount dọn Worker.
- **Kiểm tra:** Unit protocol và integration cold init/timeout/stale result/retry.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 9.4 — Solution → player

- **Mục tiêu/phạm vi:** Kiểm chứng solution rồi nối player, giữ snapshot gốc.
- **Phụ thuộc:** 9.3, 8.2.
- **Ngoài phạm vi:** Không gọi move list là bài giảng CFOP.
- **Nghiệm thu:** Solution áp dụng về solved; already-solved không sinh move giả; đổi cube vô hiệu solution cũ.
- **Kiểm tra:** Fixture end-to-end core/solver/player và browser step/reset.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 10.1 — Luồng luyện tập hoàn chỉnh

- **Mục tiêu/phạm vi:** Nối scramble/input/validate/solve/player với loading/error/reset nhất quán.
- **Phụ thuộc:** 8.1, 8.3, 9.4, 6.1.
- **Ngoài phạm vi:** Không mở rộng beta sang timer/camera.
- **Nghiệm thu:** Luồng trong mvp-spec hoàn tất; giữ input khi lỗi; reset có ý nghĩa rõ.
- **Kiểm tra:** Regression các luồng A/B/C trong đặc tả.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 10.2 — Hướng dẫn nhanh và E2E

- **Mục tiêu/phạm vi:** Nội dung tiếng Việt về notation, hướng mặt, nhập tay và player; E2E luồng chính.
- **Phụ thuộc:** 10.1.
- **Ngoài phạm vi:** Không giáo trình đầy đủ tuần 12.
- **Nghiệm thu:** Người mới hoàn tất luồng với hướng dẫn; E2E kiểm hành vi, không chỉ mock mọi thành phần solver.
- **Kiểm tra:** Playwright desktop/mobile + phiên thử 5 người theo đặc tả.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

### 10.3 — Beta readiness

- **Mục tiêu/phạm vi:** Regression, accessibility, đo hiệu năng, release/rollback checklist và lỗi ưu tiên.
- **Phụ thuộc:** 10.2, 2.2.
- **Ngoài phạm vi:** Không tự public/deploy beta.
- **Nghiệm thu:** Không P0/P1 chưa có phương án; báo số đo thật và ngoại lệ; fixture solver 100% solved.
- **Kiểm tra:** Lệnh chuẩn, E2E, browser đại diện, kiểm tra WebGL/Worker/clipboard failure; báo cáo beta.
- **Điểm dừng:** báo file thay đổi, bằng chứng kiểm tra, rủi ro còn lại; mở PR vào develop và dừng review.

## Luồng phụ thuộc và các cổng nghiệm thu

1. 2.1 → 2.3 cho kiến trúc; 2.2 thiết lập CI trước khi nghiệm thu release.
2. Nhánh UI: 3.1 → 3.2 → 3.3. Nhánh core: 4.1 → 4.2 → 4.3.
3. Viewer cần UI/core; 5.1 → 5.2 → 7.1 → 7.2 → 7.3. Camera controls 6.1 và player 8.2 cùng nối vào luồng hoàn chỉnh.
4. Nhập tay 9.1a → validation 9.1b → spike 9.2 → Worker 9.3 → player solution 9.4.
5. 10.1 chỉ bắt đầu khi các nhánh đã tích hợp; 10.2 và 10.3 kiểm chứng beta.

| Cổng         | Điều kiện đi tiếp                                  | Bằng chứng                                   |
| ------------ | -------------------------------------------------- | -------------------------------------------- |
| Core         | Move/inverse/serialization đúng                    | Unit fixtures chạy trong Node                |
| Prototype 3D | Scene khớp core sau queue/reset                    | Unit + kiểm tra trình duyệt                  |
| Solver       | Validation vật lý, benchmark và solution về solved | Báo cáo spike, fixture âm/dương, test Worker |
| Beta         | Luồng hoàn chỉnh, UX/P1 đạt, không lỗi chặn        | E2E, thử người dùng, checklist và số đo      |

Không xem test passWithNoTests của Task 0 là nghiệm thu logic. Khi core/solver có mã nghiệp vụ, cần test thực sự cho rủi ro tương ứng.

## Backlog sau beta 3×3 (P2)

Các mục này được giữ ở mức epic để tránh chốt chi tiết trước khi có sản phẩm beta. Task ID và phạm vi gốc vẫn theo roadmap. Khi bắt đầu epic, đọc lại repo, chia task nhỏ và bổ sung acceptance criteria trước khi code.

| Epic / task roadmap        | Phụ thuộc đầu vào                     | Phạm vi                                             | Điều kiện nghiệm thu epic                                      |
| -------------------------- | ------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| 11.1–11.3 Bách khoa        | Beta 3×3 + schema nội dung            | Schema, list/filter, detail 5 puzzle                | Dữ liệu validate, capability rõ, mobile/metadata đúng          |
| 12.1–12.3 Học 3×3          | Core/player ổn định                   | Lesson schema, nội dung theo bước, progress local   | Bài học hoàn chỉnh, viewer đúng, progress qua reload           |
| 13.1–13.3 Công thức        | Parser + content schema               | Taxonomy, search/filter/copy/play, favorites        | Notation validate, search đúng, favorites bền cục bộ           |
| 14.1–14.2 Luyện theo bước  | Lesson + player                       | Move list, seek/reverse/speed/repeat, note          | Viewer/list đồng bộ; thao tác touch/keyboard                   |
| 15.1–15.3 Timer            | Scramble adapter                      | State machine, Space/touch, lưu solve               | Đồng hồ đơn điệu, không duplicate, guest hoạt động             |
| 16.1–16.3 Lịch sử          | Timer local                           | Schema versioned, session, penalty/edit/delete/undo | Migration an toàn, penalty và undo đúng                        |
| 17.1–17.2 Thống kê         | Lịch sử/penalty                       | Best/mean/Ao5/Ao12 và chart                         | Unit DNF/+2 chuẩn, chart có bảng thay thế                      |
| 18.1–18.3 Puzzle expansion | Core/renderer + spike từng puzzle     | Registry, scramble/render 2×2/4×4                   | Render/scramble/solve độc lập; không quảng bá solver thiếu     |
| 19.1–19.3 Puzzle dị hình   | Registry + khảo sát thư viện          | Pyraminx; quyết định Megaminx                       | License/notation/performance có bằng chứng, UI đúng capability |
| 20.1–20.3 Kết nối học tập  | Các epic nội dung/timer               | Search chung, CTA, content audit                    | Không broken link; hoàn tất học → luyện → ghi solve            |
| 21.1–21.2 Giải đấu         | Quyết định lưu nội dung               | Schema/source/timezone/list/detail                  | Nguồn và ngày cập nhật rõ; thời gian không nhầm UTC            |
| 22.1 Quản trị giải đấu     | Auth/RBAC/RLS tối thiểu + schema 21.1 | Admin CRUD và audit                                 | User thường không sửa được dữ liệu; test quyền                 |
| 22.2–22.3 Quan tâm giải    | Dữ liệu giải + local persistence      | Form đề xuất/báo lỗi, bookmark/nhắc lịch local      | Form không sửa record chính; timezone/persistence đúng         |
| 23.1–23.4 Account/sync     | ADR backend + schema local            | Auth, RLS, merge, guest-first                       | Cách ly user A/B; conflict minh bạch; guest vẫn dùng được      |
| 24.1–24.3 Camera beta      | Validation + solver ổn định           | Permission, color sampling, xác nhận tay            | Stream cleanup; không upload video mặc định; fallback tay      |
| 25.1–25.4 Quality audit    | Các năng lực đã triển khai            | SEO/bundle/security/accessibility                   | Số đo thật, không secret, quyền được kiểm thử                  |
| 26.1–26.3 Public beta      | Quality gate + quyết định phát hành   | Regression, rollback, báo cáo                       | Không P0/P1 chưa xử lý; checklist/backup/rollback khả thi      |

**Điều chỉnh phụ thuộc cần lưu ý:** roadmap xếp admin tuần 22 trước account tuần 23. Không triển khai admin CRUD công khai khi chưa có Auth/RBAC/RLS. Khi bắt đầu 22.1, đưa phần auth/quyền tối thiểu của 23.1–23.2 lên trước, hoặc hoãn 22.1 đến sau auth. Quyết định này không kéo account vào beta tuần 10.

## Rủi ro và quyết định chưa chốt

- Solver/renderer/library chỉ chọn sau kiểm tra license, tương thích và benchmark.
- Timeout, fixture coverage, animation duration và thiết bị benchmark được chốt trong spike; không tự đặt làm kết quả đã đo.
- Thử người dùng mục tiêu 4/5 và các chỉ số ở đặc tả là mục tiêu, chưa có kết quả.
- Chưa tạo GitHub Issues hoặc gán ngày lịch cụ thể; task ID trong tài liệu là định danh kế hoạch.

## Checklist Task 1.2

- [x] Có ID, phụ thuộc, phạm vi/ngoài phạm vi, nghiệm thu và cách kiểm tra cho task beta.
- [x] Truy vết MVP-01–08 và ranh giới beta 3×3/Learning & Timer Beta.
- [x] Tách validation vật lý trước solver.
- [x] Ghi backlog sau beta và phụ thuộc auth trước admin.
- [x] Không triển khai tính năng hoặc thêm dependency trong task tài liệu.

Task kế tiếp: **2.1 — Kiểm kê kiến trúc** sau khi tài liệu được review/merge vào develop.
