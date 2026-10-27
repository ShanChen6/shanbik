# Solver 3×3 — spike, benchmark và quyết định Task 9.2

> **Cập nhật Task 9.3:** Người dùng đã chọn **cubing.js** để phù hợp lộ trình đa puzzle/3D. Lựa chọn cubejs bên dưới là kết luận lịch sử của spike, đã được thay thế trong implementation. Xem [Worker solver](../cube-worker-solver.md). Số đo cubejs không đại diện cho cubing.js.

Ngày khảo sát: 2026-10-27. Trạng thái: **chọn snapshot nguồn MIT cubejs 1.3.2 cho adapter thử nghiệm ở 9.3**, chưa thêm solver vào sản phẩm. Không cam kết lời giải tối ưu hoặc thành công cho mọi đầu vào trước khi có timeout/fixture gates.

## 1. Ứng viên, nguồn và license

Metadata registry đã ghi tại [solver-candidates.json](../benchmarks/solver-candidates.json), gồm version, integrity và số byte unpacked. Unpacked size là kích thước package trên đĩa, **không phải bundle/browser transfer**.

| Ứng viên đã khảo sát | License metadata            |    Unpacked | Quyết định                                                                                                                                                                            |
| -------------------- | --------------------------- | ----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cubejs 1.3.2         | MIT                         |   100.293 B | Chọn: URFDLB tương thích core, solver two-phase JS; package có dependency npm 6, chọn vendor nguồn thay vì thêm package vào app; dễ bọc trong dedicated Worker của dự án              |
| min2phase 0.0.1      | GPL-3.0-or-later            |   343.645 B | Chưa chọn: cần quyết định phân phối GPL và adapter qua alg/kpuzzle 0.9.x; không đưa vào app trong spike                                                                               |
| cubing 0.66.1        | MPL-2.0 OR GPL-3.0-or-later | 2.147.445 B | Chưa chọn: nền tảng rộng hơn nhu cầu; metadata cho phép lựa chọn MPL nhưng phải kiểm tra license từng solver chunk/transitive trước tích hợp; chưa benchmark performance ứng viên này |

**Phát hiện dependency quan trọng:** package cubejs 1.3.2 khai báo `npm:^6.0.0` (lock spike resolve 6.14.18, kèm nhiều bundled packages). Dependency này không được import bởi solver, nhưng sẽ làm cây dependency ứng dụng phình ra nếu thêm package nguyên trạng. Metafile bundle thực tế chỉ chứa `index.js`, `lib/cube.js`, `lib/solve.js`; không có npm trong browser Worker.

**Chốt phân phối ở 9.3:** không thêm cubejs npm package vào root app. Vendor đúng ba file JS nêu trên và LICENSE MIT từ bản 1.3.2 đã benchmark; giữ notice, ghi version/tarball integrity và đối chiếu SHA-256 trong registry snapshot. Không sửa thuật toán; cập nhật vendor phải có diff review và chạy lại corpus/benchmark. Harness vẫn cài nguyên package trong thư mục cô lập (ignore scripts), không che giấu dependency upstream. Cách này là quyết định kỹ thuật trước tích hợp; source vendor production chưa được thêm ở task này.

Chỉ cubejs được benchmark đầy đủ; không suy ra ứng viên chưa đo chậm hơn. Không coi GPL/MPL là license bị cấm. Quyết định hiện tại ưu tiên wrapper nhỏ và nghĩa vụ MIT đơn giản; khi ship worker phải kèm copyright/license upstream. Đã đọc LICENSE trong package cài thực tế. Không sao chép solver source vào core.

Nguồn chính: [cubejs README/API](https://github.com/ldez/cubejs), [cubejs LICENSE](https://github.com/ldez/cubejs/blob/master/LICENSE), [min2phase README](https://github.com/cubing/min2phase.js), [cubing package manifest](https://github.com/cubing/cubing.js/blob/main/package.json). Đối chiếu version chính xác bằng npm registry snapshot đã lưu; API/docs branch mới hơn không được dùng để tự thay version pin.

## 2. Phương pháp tái lập

Lệnh và giới hạn harness: [tools/solver-spike/README.md](../../tools/solver-spike/README.md). Package/lock riêng, không thay package.json hoặc pnpm-lock của ứng dụng. Có workflow **Solver spike benchmark** chạy thủ công, không chạy benchmark nặng trên mọi PR.

Đã đo trên Linux 6.18.55, Intel Xeon Platinum 8573C, 9 logical CPU được môi trường báo, RAM khoảng 9,73 GiB; Node 24.22.1 và Chromium 141.0.7390.37 headless. Đây là môi trường desktop/cloud đại diện cho browser Worker, không phải laptop/điện thoại của người dùng. Hai process browser riêng: JIT bình thường (1280×900), và V8 `--jitless` (360×800) làm proxy engine giới hạn. Jitless không được quy đổi thành hệ số CPU/mobile vật lý.

40 fixtures cố định: solved, 18 single moves, 12 chuỗi seed dài 25 và 8 chuỗi seed dài 40, superflip. Seed 0x53424b; đầu vào serialization và lời giải nằm trong raw report. Có sáu fixture bị chặn trước worker: thiếu ô, edge flip, corner twist, parity, duplicate edge, mirrored corner. Solved trả chuỗi rỗng và không khởi tạo solver. Mỗi lời giải phải parse qua core và áp dụng lên snapshot gốc để về solved; không chỉ tin solver tự xác nhận.

Cold: fresh Worker cho mỗi mẫu, HTTP loopback no-store (không gồm WAN/CDN latency); gồm tải/parse worker và init tables. Warm: cùng Worker đã init, đo riêng search và round-trip gồm messaging/kiểm chứng. N cold nhỏ (3/2); p95 nearest-rank của cold chính là max, không phải thống kê thiết bị rộng. Thứ tự fixture giữ cố định, không phải benchmark randomized interleaving.

## 3. Số đo thực tế

Raw: [solver-3x3.json](../benchmarks/solver-3x3.json). Tổng **156/156 lời giải về solved**, không pageerror; không có lời giải giả cho solved/invalid.

| Chỉ số                                       |               Desktop JIT |          Engine jitless |
| -------------------------------------------- | ------------------------: | ----------------------: |
| Cold samples                                 |                         3 |                       2 |
| Cold p50 / max                               |          2.202 / 2.693 ms |      39.006 / 39.556 ms |
| Init tables p50 / max                        |          2.187 / 2.504 ms |      38.989 / 39.543 ms |
| Warm search samples                          |                       117 |                      39 |
| Warm search p50 / p95 / max                  | 18,4 / 222,9 / 1.216,1 ms | 63,4 / 696,7 / 841,1 ms |
| Warm round-trip p95 / max                    |        223,3 / 1.221,6 ms |        697,5 / 841,7 ms |
| Worker heap used sau init / warm             |         26,54 / 30,47 MiB |       17,46 / 17,66 MiB |
| Worker heap total sau warm                   |                 51,75 MiB |               50,25 MiB |
| Heartbeat interval p95 / max (mục tiêu 20ms) |           21,4 / 358,8 ms |         20,5 / 341,3 ms |

Dấu chấm trong số nguyên là phân cách hàng nghìn; dấu phẩy là phần thập phân. Jitless init chậm rõ rệt, nhưng warm max nhỏ hơn JIT trong tập này; không suy ra tốc độ trên điện thoại từ một hệ số. Heartbeat cho thấy trang vẫn chạy khi Worker bận, nhưng có interval tới ~359ms: không tuyên bố không jank hay FPS 3D đạt chuẩn. Đây là trang harness đơn giản, chưa phải UI luyện tập đầy đủ.

CDP Runtime.getHeapUsage lấy snapshot khi Worker idle sau init/warm, không đo peak/native/process RSS hoặc pin/battery. Main JS heap thay đổi khoảng 2,23→2,29 MB ở profile desktop; không có phép suy ra RSS đã được giải phóng chỉ từ số này.

Bundle minified esbuild target ES2022: Worker **18.934 B raw / 7.034 B gzip / 6.232 B Brotli**; host harness gồm core/gates/fixtures **12.269 / 4.920 / 4.450 B**. Đây là bundle spike độc lập; chưa phải kích thước chunk Next cuối cùng. Tables được sinh trong Worker, không tải một blob bảng lớn. Solver chưa được import vào route sản phẩm nên không thêm payload solver vào bundle hiện tại.

## 4. Hủy và timeout

Prototype Worker chạy init/search đồng bộ, không có cooperative abort/progress trong cubejs. Gửi một message cancel tới Worker đang bận không đủ; host phải gọi `Worker.terminate()`, vô hiệu generation/request và bỏ reply cũ. Điều này làm mất tables; lần retry phải cold init lại.

| Phép thử                                      |               Desktop |   Jitless |
| --------------------------------------------- | --------------------: | --------: |
| Host nhận cancellation lúc init               |               38,5 ms |   12,1 ms |
| CDP không còn Worker target sau init cancel   |              2.059 ms |  2.052 ms |
| Host nhận cancellation lúc search             |                2,0 ms |    0,6 ms |
| CDP không còn Worker target sau search cancel |                112 ms |    205 ms |
| Deadline 1ms được chèn để kiểm tra timeout    | trả TIMEOUT sau 2,4ms | sau 1,5ms |

Sau cancel, target cũ biến mất trong phép đo; sau timeout, retry khởi tạo mới và lời giải được core kiểm chứng. Response cancel và target cleanup là hai mốc khác nhau; không cam kết giải phóng RAM/CPU tức thì. Kết quả sai/rỗng cho trạng thái chưa solved bị gate từ chối.

### Chốt cho 9.3

- `INIT_TIMEOUT_MS = 60_000`: cao hơn cold max 39,6s của proxy chậm; cần trạng thái khởi tạo rõ ràng, có hủy. Đây là budget lựa chọn từ spike, không bảo đảm mọi máy init kịp.
- `SOLVE_TIMEOUT_MS = 10_000` sau ready: headroom so với search max 1,22s; quá budget terminate và trả lỗi retry, không block main thread hoặc fallback sync.
- Budget danh nghĩa đường cold 70s gồm hai giai đoạn (chưa tính thao tác người dùng); timer host có thể trễ khi tab bị throttle/suspend, không phải hard real-time. Không quảng bá “giải trong X giây” từ mẫu này.
- Một Worker/scheduler sở hữu một request hiện hành. Không tạo worker cho từng click hoặc tự retry vô hạn; disable/coalesce lệnh lặp, latest request thay request cũ bằng cancel, rate-limit churn/cancel/retry trong UI. Không tự sinh nhiều Worker init đồng thời.
- Reuse Worker đã ready khi tiếp tục luyện tập; cancel/timeout/unmount/context đổi vô hiệu ID, terminate, dọn timer/listener. Không giả định `terminate()` giữ được tables.

## 5. Adapter và cổng trước tích hợp

Domain API dự kiến: `solve(validatedSnapshot) -> Promise<verifiedSolution>`; snapshot lấy từ `validateCubeFeasibility`. Worker nhận serialization URFDLB 54 ký tự, không nhận object renderer hoặc state mutable. Worker production cần kiểm schema và feasibility lại trước Cube.fromString; spike worker chỉ là prototype với gate host, không được copy nguyên thành production adapter.

Protocol chốt: init(generationId) → ready; solve(generationId,requestId,serialization) → result(generationId,requestId,serialization,algorithm) hoặc error. Host giữ snapshot/fingerprint gốc; bỏ mọi reply không trùng generation + request + fingerprint hiện hành. Cancel là host operation + terminate. Không progress % giả vì upstream không cung cấp tiến độ search.

Lỗi typed: INVALID_INPUT, INIT_TIMEOUT, SOLVE_TIMEOUT, WORKER_ERROR, INVALID_RESULT, CANCELLED. Không nhận empty solution là thành công trừ khi snapshot đã solved trước khi gọi solver. Parse toàn bộ output chỉ chấp nhận grammar URFDLB/prime/double; áp dụng lại về solved trước publish. Max depth upstream thử ở 22, không cam kết optimal; cap output theo giới hạn player, không nhận partial solution sau lỗi.

Cổng 9.3: fixture corpus phải 100% được xác minh về solved trong test; invalid/solved không gửi giải; browser phải còn dùng được, timeout/cancel/stale/retry được kiểm tra, cleanup và Next production worker bundle qua test. 9.4 mới nối verified solution vào player; không gọi solver move list là bài giảng CFOP.

## 6. Giới hạn và điểm dừng

Chưa đo Safari/Firefox/mobile vật lý, peak/RSS/battery hoặc CWV/FPS của trang 3D. Trước beta, cần đo cold/warm/memory trên ít nhất một điện thoại Android tầm trung và Safari iOS, điều chỉnh budget nếu không phù hợp; không gán kết quả jitless là đo thiết bị này. Đã chạy smoke trên production build Next 16.4.3/Turbopack + Chromium 141 (Actions run 40444908805): module Worker import CommonJS cubejs từ package cô lập, init, solve R, core xác minh về solved, cancel rồi retry thành công; không pageerror. Route/probe/workflow tạm đã gỡ khỏi cây cuối. Đây là chứng minh compatibility, không phải production lifecycle đầy đủ hoặc số đo chunk Next cuối cùng.

542 tests hiện có và format/lint/typecheck đạt; CI cuối được ghi tại PR. Chưa triển khai solver UI/Worker production trong 9.2.

Tiếp theo: **9.3 — Worker solver**, dùng quyết định trên và giữ khả năng thay adapter.
