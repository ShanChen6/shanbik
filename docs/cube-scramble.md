# Scramble luyện tập 3×3 — Task 8.1

## Cách dùng và phạm vi

Trên /practice, **Tạo scramble mới** tạo chuỗi 25 move rồi hiển thị trong textarea readonly. **Sao chép scramble** dùng clipboard; **Áp dụng scramble** gửi chuỗi vào FIFO Task 7.3. Tạo/copy không tự thay đổi khối. Áp dụng lên trạng thái đã commit hiện tại, khi scene sẵn sàng và queue trống, không paused; không tự reset solved.

Đây là **random-move để luyện tập**, không cam kết uniform random-state hoặc scramble thi đấu chính thức. Adapter chỉ hỗ trợ 3×3 và notation U/R/F/D/L/B, prime, double. Nhập thuật toán/playback controls đầy đủ tiếp tục ở 8.2/8.3.

## Thử thư viện và lựa chọn

Đã thử `cubing@0.66.1` ngoài dependency của repo với `randomScrambleForEvent("333")`: ba mẫu trên Node 24.22.1 đều có 21 token thuộc grammar core. Thời gian wall-clock trong lần thử lần lượt 191/42/19 ms; đây chỉ là số đo Node local, không phải benchmark mobile/browser/bundle.

Nguồn chính: [cubing/scramble](https://js.cubing.net/cubing/scramble/). Tài liệu mô tả API async và generation trong Worker. Metadata npm phiên bản đã thử ghi engine Node >=22.3.0, license `MPL-2.0 OR GPL-3.0-or-later`. Chưa tích hợp/đo Worker hoặc bundle thư viện trong Next browser, nên không coi spike Node là chứng nhận production browser.

MVP-03 cho phép scramble luyện tập trước khi xác minh random-state/thi đấu. Task này chọn adapter local random-move để đáp ứng phạm vi đó; không thêm dependency, lockfile, worker hoặc solver. Khi cần random-state, thay adapter sau khi kiểm tra tích hợp Worker/browser và hiệu năng riêng; UI/session/queue không cần giữ một puzzle model khác.

## Các module

| File trong src/features/cube/scramble | Vai trò                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| generate.ts                           | Sinh 25 move, serialize qua core; injectable RNG để test                                   |
| session.ts                            | Snapshot hiển thị, generation ID và cờ đã gửi; không sở hữu puzzle state                   |
| clipboard.ts                          | Chờ writeText hoàn tất rồi trả success/failure, không báo thành công khi API thiếu/bị chặn |
| scramble-panel.tsx                    | UI tạo/copy/apply, textarea copy tay và phản hồi                                           |

PracticeCube giữ queue hiện có; callback apply đọc lại snapshot queue ngay lúc nhấn để chặn stale UI khi queue vừa bận hoặc paused. ScramblePanel không import renderer hoặc queue implementation.

## Generator

- Mỗi bước chọn một mặt trong các mặt có axis khác move trước, rồi chọn turns từ 1/−1/2. Tránh mặt lặp hoặc hai mặt đối nhau liên tiếp; giữ đúng 25 move.
- Production RNG dùng Web Crypto getRandomValues với rejection sampling trên Uint32, bỏ phần dư trước modulo để tránh modulo bias trong lựa chọn chỉ số. Không gọi RNG ở SSR hoặc khi chỉ đọc trang.
- generatePracticeScramble(randomIndex?) trả object frozen `{kind:"random-move-3x3", moves, notation}`; move và array đều frozen. Nguồn RNG test phải trả integer trong range hoặc generator throw.
- Không dùng Math.random fallback khi Web Crypto không khả dụng. UI báo lỗi tạo và giữ nguyên chuỗi trước đó cùng cờ đã gửi.
- Các move sinh ra parse được qua notation core; áp dụng bằng move engine tạo state có cấu trúc hợp lệ và inverse trả đúng trạng thái ban đầu. Không có tuyên bố phân phối uniform trên toàn bộ cube states.

## Apply một lần

createScrambleSession có snapshot `{id, scramble, applied}` hoặc null. Generate chỉ publish presentation snapshot mới. Apply khóa reentrancy đồng bộ, gọi enqueue đúng một batch rồi đánh dấu applied khi queue chấp nhận. Queue từ chối/throw thì không tiêu thụ scramble, có thể thử lại.

Cờ applied gắn với **lần tạo**, không dựa vào so sánh chuỗi. Khi đã gửi, cờ vẫn giữ sau cancel/reset cube: queue có thể đã commit một phần, nên gửi lại toàn chuỗi có thể lặp prefix. Muốn áp dụng lần khác, tạo generation mới. Nếu tạo mới trong callback enqueue, kết quả apply cũ không đánh dấu generation mới là đã dùng. Không có React effect tự enqueue.

## Clipboard

Sao chép chỉ thông báo thành công sau khi promise writeText resolve. Khi API thiếu hoặc reject, giữ toàn bộ notation hiển thị, focus/select textarea và hướng dẫn Ctrl/Cmd+C hoặc chạm giữ trên touch. Không dùng execCommand và không báo success giả.

Copy async giữ generation ID: nếu người dùng tạo scramble mới trước khi promise cũ hoàn tất, không hiển thị kết quả copy cũ cho chuỗi mới. Text readonly vẫn chọn/copy tay được ngay cả khi WebGL không có; chỉ nút áp dụng bị disabled khi renderer không sẵn sàng.

## Bằng chứng kiểm tra

- Tổng **383 tests**, thêm 32 test cho tám seed notation/state/inverse, tránh axis lặp, đủ 18 face/turn variants trong tập test, immutable data, RNG range/rejection sampling, generation-only, apply-once/spam/reset/cancel, capacity retry, reduced motion và clipboard kết quả đúng.
- Chromium 153 software WebGL: RNG native sinh 25 token; ảnh khối trước/sau generation giống từng pixel. Tạo và copy không tăng completed.
- Clipboard permission thực: write/read được cấp quyền trả đúng toàn bộ notation; Browser permission denied làm write reject, UI chọn toàn bộ text và thông báo copy tay, không báo success.
- 12 clicks Apply chỉ enqueue một batch, completed=25. Ảnh sau 25 move animation giống từng pixel với reference phát cùng notation qua queue reduced-motion từng move; tổng tám GPU buffers được tái sử dụng.
- Apply disabled khi queue bận/paused và sau khi đã gửi, kể cả cancel/reset; generate mới mở lại khi queue sẵn sàng. Lỗi RNG giữ chuỗi/cờ trước đó. Copy promise cũ không thông báo cho generation mới.
- Viewport 360×800: đã xem panel, không tràn ngang. WebGL disabled vẫn tạo/đọc scramble được và apply bị disabled. Không có pageerror trong các kịch bản đã chạy.

Kiểm tra browser là emulation/software WebGL, chưa thay thế Safari/Firefox/mobile vật lý hoặc benchmark FPS/heap. Chạy lại bằng các lệnh chuẩn README, rồi thử clipboard granted/denied, generate trong lúc queue chạy, nhấn Apply nhanh và cancel/reset sau khi gửi.

Tiếp theo: **8.2 — Player controls**. Liên quan: [queue](./cube-move-queue.md), [notation](./cube-notation.md), [MVP spec](./product/mvp-spec.md).
