# Worker solver — Task 9.3

## Lựa chọn thư viện

Theo lựa chọn mới của người dùng, dùng **cubing.js 0.66.1** qua `experimentalSolve3x3x3IgnoringCenters`, không dùng vendor cubejs. Dependency pin trong package.json/pnpm-lock. Quyết định cubejs ở 9.2 được thay thế cho implementation; số đo cubejs giữ làm dữ liệu lịch sử, không gán sang cubing.js. Chưa thay renderer R3F hoặc triển khai các puzzle khác trong task 9.3.

Cubing.js dùng Reid orbit order khác core. `cubing-engine.ts` ánh xạ ep/eo và cp/co từ validation; tâm cố định và orientationMod=1. Unit so sánh toàn bộ 18 move trên solved/mixed fixtures với `puzzles["3x3x3"].kpuzzle().defaultPattern().applyAlg(...)`. Không suy luận model từ thuật toán scramble vì đầu vào có thể là bản nhập tay bất kỳ.

## Thành phần

- `solver/protocol.ts`: schema và giới hạn message, ID/generation/fingerprint, timeout init 60s, search 10s, cooldown retry 2s, output tối đa 256 move/2048 ký tự.
- `solver/runtime.ts`: worker boundary async; kiểm schema, deserialize và feasibility trước engine; init coalesced, search một lần tại một thời điểm; lỗi typed, không trả stack/partial result. Solved bỏ qua engine.
- `solver/cubing-engine.ts`: adapter KPattern và API search. Init warmup default pattern để nạp search/tables; user input đã solved được chặn ở host nên không tạo Worker.
- `solver/solver.worker.ts`: outer dedicated Worker sở hữu runtime. Cubing.js tạo search Worker con; terminate outer để hủy cây Worker, bỏ generation cũ ngay ở host. Không chạy search trên main thread.
- `solver/controller.ts`: external store, lazy create/reuse Worker ready, request ID không tái sử dụng, snapshot immutable, timeout, cleanup, cooldown, stale-reply gate.
- `solver/verify-solution.ts`: parse toàn bộ output theo grammar core, cap, áp dụng lên snapshot gốc và yêu cầu solved. Cả runtime và host đều kiểm chứng.
- `solver/solver-panel.tsx` + face input: giải bản nhập, init/search/cancel/error/retry, hiển thị notation đã kiểm chứng và phân biệt already-solved. Chưa nối player (9.4).

## Worker assets và build

`tools/build-solver-worker.mjs` dùng esbuild 0.25.12 tạo module Worker graph vào public/solver-worker (ignored, luôn xóa/rebuild thư mục generated). Hai entry có tên ổn định solver.worker.js và search-worker-entry.js để import.meta.resolve/new URL trong cubing.js hoạt động native. Các chunk còn lại lazy-load cùng origin. `pnpm dev` và `pnpm build` chạy script trước Next; không cần CDN hoặc bundle solver vào trang practice lúc mở trang.

Giữ sourcemap có sourcesContent, linked legal notices, manifest version/sizes và public/licenses/cubing-NOTICE.txt cùng MPL/GPL license upstream. Không thay file thư viện trong node_modules. pnpm explicitly skips esbuild postinstall (`allowBuilds.esbuild:false`); dùng optional platform binary đã pin. Build/typecheck/lint không cần chạy lifecycle script từ esbuild.

## Lifecycle và lỗi

Host validate lại input trước bất kỳ message giải nào. Invalid/solved không tạo Worker mới; solved trả zero move. Cùng snapshot đang pending được coalesce; đổi input vô hiệu request cũ. Edit khi đang init/search terminate, xóa kết quả và chờ cooldown trước retry; edit khi idle/đã success có thể tái dùng tables ready. Kết quả sai generation/request/serialization bị bỏ, không publish. Malformed hoặc không chứng minh về solved thì INVALID_RESULT, không đưa vào player.

Timeout init/search riêng; cancel/timeout/postMessage error/Worker error đều dọn timer/listener và terminate. Không tự retry vô hạn, không fallback search đồng bộ. Worker constructor bị chặn được báo lỗi có thể thử lại. UI giữ màu đã nhập; lỗi không tự đổi cube, không reset solved và không áp dụng một phần thuật toán.

Effect cleanup gọi release khi route unmount/Activity hide; API release idempotent và dùng lại được sau StrictMode effect replay. Counters không reset nên callback cũ không thể ghi lần mới. Cooldown dọn khi release, không có timer cập nhật UI sau unmount.

Budget 60s/10s kế thừa làm giới hạn bảo vệ, không phải cam kết hiệu năng của cubing.js. Đo thực tế adapter mới được ghi tại PR/browser evidence; đo mobile vật lý và Safari/Firefox vẫn là cổng trước beta. UI không hiển thị phần trăm tiến độ giả.

## Kiểm tra và phạm vi

Unit dùng fake Worker/clock kiểm tra cold/warm, spam, stale IDs/fingerprint, invalid replacement, init/search timeout, cancel, cooldown/retry, constructor/postMessage/messageerror, wrong result, cleanup/StrictMode và snapshot. Runtime/adapter tests kiểm input trực tiếp, kiểu kết quả, lỗi async và mapping các fixture độc lập.

Browser production cần chạy solver thật trên corpus 9.2 + oracle core, rồi kiểm UI invalid/solved không tạo Worker, hủy/retry, edit và route cleanup gồm Worker con, timeout host, mobile không overflow và ảnh cube không đổi. Không dùng mock cho lời giải trong corpus.

Hỗ trợ nhiều puzzle/3D của cubing.js là hướng mở rộng được chọn. Registry capability render/scramble/solve cho từng puzzle và thay renderer sẽ là phạm vi riêng; solver 9.3 chỉ nhận 3×3 theo representation hiện tại.

Tiếp theo: **9.4 — Solution → player**.
