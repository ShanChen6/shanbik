# ShanBik 3×3 — Beta readiness, 27/10/2026

## Kết luận và phạm vi

Chuẩn bị cho **beta giới hạn trên Chromium**, sau khi người duyệt chấp nhận PR và smoke-test deployment của đúng commit. Không coi báo cáo này là chứng nhận WCAG, xác nhận hiệu năng thiết bị thật hoặc cho phép tự merge/deploy. Safari, Firefox, Android/iOS thật và screen reader chưa được kiểm chứng trong môi trường này; các cổng đó phải được ghi kết quả trước khi mở rộng phạm vi hỗ trợ.

Baseline: merge task 10.2 vào `develop`, commit `ef2f520d06470614bbf533c6b57d5287c943da4d`. Candidate là nhánh task 10.3/PR tương ứng; CI của đúng head SHA là nguồn xác nhận cuối. Môi trường local: Node 24, pnpm 11.25.0, production Next.js 16.4.3, Chromium 141.0.7390.37, software WebGL. Không throttle CPU/network; CPU phần cứng không ghi lại.

## Ma trận kiểm tra

| Phần                  | Kiểm tra                                                                                       | Bằng chứng/phạm vi                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Core và lifecycle     | 727 Vitest tests                                                                               | State/notation/move/physical validation, queue/player, solver, capture/reset                       |
| Luồng thật            | Scramble ngẫu nhiên → capture → cubing Worker → load → step/back/play → solved → rewind/reset  | Hai project Playwright: desktop animation thường, mobile viewport 360px/reduced motion             |
| Responsive            | `/`, `/learn`, `/help`, `/practice`; light/dark, 320/360/768/1024/1440px                       | Assert không tràn ngang; 80 lần kiểm tra trong hai project, không thay thế visual review           |
| Accessibility tự động | axe-core với WCAG 2 A/AA, 2.1 A/AA; bốn route × hai theme × 320/1440px × hai project           | 32 scans và audit mobile dialog; zero violations là gate CI, `incomplete` giữ trong JSON để review |
| Bàn phím              | Enter mở menu, Tab giữ focus trong dialog, Escape đóng và trả focus trigger                    | Chromium, kích thước 360px, hai project                                                            |
| Console               | Thu `pageerror`; thêm `console.error` ở ma trận route/theme bình thường                        | Không bỏ qua lỗi bằng filter toàn cục; ca lỗi Worker/context loss được kiểm hành vi riêng          |
| Fallback              | Không WebGL vẫn nhập solved và giải khối chưa solved thật để đọc notation; load player bị khóa | Mock khả năng WebGL, không mock solver; context loss giữ bản nhập, khóa playback/capture           |
| Hiệu năng             | Cold-context local page timing và tổng decoded JS; không tải solver trước yêu cầu              | Guard decoded JS < 3 MiB; không lấy timing CI làm ngưỡng trải nghiệm người dùng                    |
| Visual                | Xem ảnh 320px dark và canvas                                                                   | Header, chữ và viewer vừa khung; không phải bộ visual regression                                   |

Lệnh tái hiện: `pnpm install --frozen-lockfile`, `pnpm exec playwright install --with-deps --only-shell chromium`, `pnpm build`, `pnpm test:e2e`. Xem [hướng dẫn E2E](../testing-e2e.md). Local đã đạt **22/22 E2E** (2,2 phút), 727 unit tests; build/lint/typecheck/format đạt. Suite gồm 22 ca (12 ca cốt lõi đã mở rộng fallback + 10 ca beta). Report/trace khi lỗi và JSON audit/metrics được CI giữ 7 ngày; không commit file generated.

## Lỗi và hành động theo ưu tiên

| ID         | Ưu tiên                   | Phát hiện                                                                                  | Xử lý/trạng thái                                                                                                                                                                                        |
| ---------- | ------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BETA-001   | P1                        | axe `nested-interactive`: wrapper/canvas mang role image chứa fallback link có thể focus   | Đã sửa: group chứa canvas có tên riêng, canvas không nằm trong tab order, fallback trong canvas chỉ là văn bản; liên kết trợ giúp nằm ở fallback ngoài canvas. CI audit không có exemption cho lỗi này. |
| BETA-002   | P2                        | Fallback chỉ dẫn đọc trợ giúp, bỏ sót khả năng nhập màu và đọc lời giải                    | Đã sửa thông báo và thêm E2E search thật khi không WebGL.                                                                                                                                               |
| BETA-003   | P2                        | Homepage vẫn hẹn công cụ “đang chuẩn bị” dù luồng 3×3 đã có                                | Đã cập nhật nhãn bản thử nghiệm, công cụ hiện có và giới hạn phiên/account/camera.                                                                                                                      |
| BETA-004   | P2                        | Nhóm đếm màu có aria-label trên generic div                                                | Đã thêm role group để tên nhóm có ngữ nghĩa.                                                                                                                                                            |
| GATE-001   | Cổng trước mở rộng hỗ trợ | Chưa có thiết bị thật, Safari/Firefox và screen reader                                     | Chưa xác nhận; chủ phát hành ghi kết quả theo checklist. Không quảng bá đã hỗ trợ các môi trường này.                                                                                                   |
| GATE-002   | Cổng trước rollout        | Chưa kiểm URL Vercel production/preview, cache/CSP/Worker MIME thực tế, quyền bảo vệ nhánh | Chưa thực hiện trên dịch vụ; cần người có quyền xác nhận đúng deployment/commit. Không thay đổi hosting hoặc GitHub settings trong task.                                                                |
| FOLLOW-001 | P2 theo dõi               | Chưa có field CWV, long-session memory/thermal/low-end GPU                                 | Cần đo thiết bị thật và phiên dài; chưa có bằng chứng để cam kết thời gian giải hoặc memory.                                                                                                            |

Không còn lỗi P0/P1 được phát hiện trong ma trận đã kiểm tra sau khi sửa BETA-001. Các cổng chưa kiểm là giới hạn chứng cứ, không được đổi thành “đã pass”.

## Accessibility: giới hạn và review thủ công

Không tắt rule axe để làm xanh CI. Các mục `incomplete` không phải pass tự động; JSON giữ rule và selector. Trong lượt local, axe yêu cầu review contrast cho mũi tên trang chủ được đánh dấu decorative và placeholder thuật toán; nhóm màu đã được sửa semantic. Placeholder dùng token muted trên surface; palette sticker và chữ tên/viết tắt không phụ thuộc theme. Các nút native có focus outline và minimum control 44px theo source; menu keyboard được kiểm thực tế. Chưa kiểm NVDA/VoiceOver, zoom văn bản 200–400% hoặc mọi tổ hợp gesture/screen reader, nên chưa tuyên bố tuân thủ toàn bộ WCAG.

## Hiệu năng và dữ liệu

Raw sample local được lưu tại [beta-readiness-performance.json](../benchmarks/beta-readiness-performance.json), gồm browser/project, thời điểm sample, DCL/load/FCP, decoded script size và danh sách script. Context browser mới, production server local, assets cùng origin, không phải cold process/hardware/network di động. Không dùng số đo cubejs cũ cho cubing.js.

| Mẫu local       |      DCL |     Load |    FCP |      Decoded JS | Solver request trước solve |
| --------------- | -------: | -------: | -----: | --------------: | -------------------------: |
| Desktop         | 158,8 ms | 258,2 ms | 184 ms | 1.544.917 bytes |                          0 |
| Mobile viewport | 218,7 ms | 294,7 ms | 244 ms | 1.544.917 bytes |                          0 |

Guard 3 MiB là ngân sách hồi quy của decoded JavaScript tải trước solve, có dư địa so với baseline khoảng 1,55 MB. Nó không phải network compressed transfer, không đại diện INP/LCP/CLS và không chứng minh tốc độ trên điện thoại. Solver vẫn lazy, làm việc trong Worker và có init/search budget/cancel; render vẫn demand mode với DPR giới hạn theo implementation hiện có. Tối ưu tiếp theo dựa trên profile thiết bị thật thay vì đổi dependency/renderer khi chưa có chứng cứ.

## Phát hành và rollback

Dùng [checklist beta release/rollback](../beta-release-checklist.md). Luồng duyệt: feature → `develop` → smoke-test preview → PR `develop` → `main`. Trước rollout ghi deployment ổn định và SHA để có thể chuyển lại bằng hosting. Không force-push lịch sử; mọi sửa/revert source đi qua PR và CI. Task không merge, publish hoặc deploy.
