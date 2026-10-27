# ShanBik — Content/regression audit (Task 20.3), 27/10/2026

## Phạm vi và cách làm

Audit sau Tuần 15–20 (timer, lịch sử, thống kê, puzzle mới, search, lộ trình học), trên production build `next build` + `next start`, Chromium headless, WebGL phần mềm. Không thay thế kiểm tra Safari/Firefox, thiết bị thật hay screen reader.

| Phần         | Cách kiểm                                                                                                                                                | Kết quả                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Link nội bộ  | `node tools/audit-site.mjs <url>`: BFS từ các route chính + mọi route prerender trong `.next/prerender-manifest.json`, đọc `href`/`id` trong HTML server | 19 trang 200; 0 link hỏng; sau sửa AUD-001 còn 0 anchor thiếu  |
| Link ngoài   | Script liệt kê 6 URL (CubeSkills PDF, WCA 12a/12c/12d/12e/12h)                                                                                           | **Chưa kiểm được**: proxy môi trường trả 403 cho cả hai domain |
| Dữ liệu      | Validator catalog chạy lúc build/test: bách khoa ↔ registry hai chiều, bài học, công thức (parser), lịch sử IndexedDB                                    | Đạt; build lỗi nếu dữ liệu sai                                 |
| Nội dung     | Rà câu mô tả tính năng trên trang chủ, trợ giúp, bách khoa, `routes.md` so với tính năng đã có                                                           | Phát hiện AUD-002…AUD-005                                      |
| Luồng mobile | Bộ E2E project `chromium-mobile` (360×800, touch, reduced motion): timer, lịch sử, thống kê, workbench, search, lộ trình, encyclopedia, beta audit       | Xem mục Kiểm chứng                                             |

## Vấn đề theo ưu tiên

Không có P0/P1.

| ID      | Ưu tiên | Phát hiện                                                                                                                                                                                                      | Trạng thái                                                                                                     |
| ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| AUD-001 | P2      | `#workbench-title` không có trong HTML server sau khi workbench chuyển sang tải lười (`ssr:false`): mở `/puzzles/2x2#workbench-title` từ trang khác không cuộn tới Thực hành; lộ trình học mới dùng anchor này | **Đã sửa**: loader render section + tiêu đề ở server, chỉ công cụ bên trong tải lười; audit còn 0 anchor thiếu |
| AUD-002 | P2      | Trang chủ ghi "Dữ liệu giữ trong phiên" trong khi lịch sử bấm giờ, yêu thích, ghi chú và vị trí đọc đã lưu trên trình duyệt                                                                                    | **Đã sửa** câu trong hero                                                                                      |
| AUD-003 | P2      | Trợ giúp ghi "Hiện chỉ 3×3 có công cụ luyện tập" — sai từ Tuần 18–19                                                                                                                                           | **Đã sửa**: liệt kê đúng 2×2/4×4/Pyraminx/Megaminx, không solver ngoài 3×3                                     |
| AUD-004 | P3      | Trợ giúp "Tôi có thể làm gì" và "tài khoản" không nhắc timer/thống kê/search và nơi lưu dữ liệu; bàn phím chưa nói phím trong Search                                                                           | **Đã sửa** ba câu trả lời                                                                                      |
| AUD-005 | P3      | `docs/routes.md`: `/practice` ghi "Chưa timer"; thiếu `/search`                                                                                                                                                | **Đã sửa**                                                                                                     |
| AUD-006 | P3      | Nhãn hero "MVP 3×3 — bản thử nghiệm" hẹp hơn phạm vi hiện tại (đã có 2×2/4×4/Pyraminx/Megaminx)                                                                                                                | Mở: cần quyết định cách gọi phiên bản/thương hiệu trước public beta (Task 26)                                  |
| AUD-007 | P3      | Link ngoài (CubeSkills, WCA) chưa kiểm được trạng thái/anchor trong môi trường này                                                                                                                             | Mở: chạy `tools/audit-site.mjs` + kiểm tay link ngoài ở môi trường có mạng trước public beta                   |
| AUD-008 | P3      | Timer, lịch sử và thống kê chỉ 3×3; puzzle khác có scramble nhưng không bấm giờ được                                                                                                                           | Mở: backlog đã ghi ở [quyết định tuần 19](../decisions/odd-puzzles.md) (mở rộng `Solve.puzzle` theo registry)  |
| AUD-009 | P3      | Desktop header không còn chỗ cho mục chữ thứ tám; search dùng nút kính lúp                                                                                                                                     | Chấp nhận; xem lại khi tái cấu trúc điều hướng (account/giải đấu sẽ thêm mục)                                  |

## Kiểm chứng

- `tools/audit-site.mjs` trước sửa: 19 trang, 0 link hỏng, 8 anchor thiếu (AUD-001); sau sửa: 0/0.
- Format, lint, typecheck, unit test và toàn bộ E2E desktop/mobile chạy trên build có các sửa chữa trên; số liệu cuối ghi trong commit/PR của tuần 20.
- Chưa kiểm: link ngoài, Safari/Firefox, Android/iOS thật, screen reader.

Lệnh tái hiện: `pnpm build && pnpm start`, rồi `node tools/audit-site.mjs http://127.0.0.1:3000 --json audit.json` (exit code 1 nếu có link nội bộ hỏng).
