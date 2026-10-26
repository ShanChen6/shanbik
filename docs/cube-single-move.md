# Animation một move — Task 7.2

## Phạm vi và cách dùng

Trang /practice có dropdown đủ 18 biến thể U/R/F/D/L/B, prime và double, nút **Xoay một nước**, **Hủy nước đang xoay**, **Đặt lại khối** và trạng thái hoàn tất. Controls nằm ngay dưới canvas, trước nhóm camera. Selector và nút xoay bị khóa trong lúc chạy hoặc khi scene chưa sẵn sàng/WebGL không khả dụng. Camera vẫn dùng độc lập. Đặt lại góc nhìn chỉ đổi camera; Đặt lại khối trở về solved.

Mỗi lần chạy một move, chưa có queue hoặc player chuỗi thuật toán; các phần này tiếp tục ở 7.3/8.x. Không thêm dependency hoặc đổi lockfile.

## Nguồn state duy nhất

`single-move.ts` cung cấp createSingleMovePlayer(initial?) và immutable snapshot `{state, active, completed}`. React dùng useSyncExternalStore, chỉ nhận cập nhật ở ranh giới transaction; frame không publish snapshot hoặc setState React.

| Thao tác                     | Kết quả                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| start khi idle               | Validate/copy AST, cấp ID tăng dần, active chứa move; state chưa đổi     |
| start khi busy               | Trả false, không queue                                                   |
| complete đúng ID             | Gọi core applyMove một lần, commit state mới, xóa active, tăng completed |
| complete cũ/trùng            | Trả false, không đổi snapshot                                            |
| cancel đúng ID hoặc cancel() | Xóa active; giữ state đã commit trước đó                                 |
| reset()                      | Xóa active, state solved, completed=0; không tái sử dụng ID              |
| start reduced motion         | Commit trực tiếp một lần, không tạo active animation                     |

ID cũ không thể commit hoặc cancel move mới sau reset. API không giữ một model puzzle mutable thứ hai. Server snapshot ổn định cho SSR/hydration; placeholder không tạo canvas trên server.

## Renderer và snap

CubeModel đọc snapshot đã commit rồi chọn chín cubies theo [move-layer mapping](./cube-move-layer.md). Chỉ các group được chọn nằm dưới AnimatedLayer pivot tại origin; 17 cubies còn lại giữ nguyên. Group/mesh tiếp tục dùng chung geometry/material của model.

AnimatedLayer dùng useFrame với demand rendering, duration 360 ms và smoothstep. Góc được gán từ progress tuyệt đối, không cộng dồn rotation theo frame. Delta đầu sau idle được bỏ qua để không nhảy tới endpoint do clock đã nghỉ lâu. Mỗi frame đang chạy gọi invalidate; endpoint được gán đúng turn.angle rồi gọi onMoveComplete(id) một lần, sau đó dừng frame loop.

Khi state mới được commit, React bỏ pivot tạm và dựng lại slot từ core: position nguyên −1/0/1, rotation cubie bằng zero và Euler sticker theo từng mặt. Vì ID là tọa độ slot, các group chuyển parent được remount về transform chuẩn; geometry/material vẫn được tái sử dụng. Không lấy kết quả float của animation làm input move tiếp theo.

CubeViewport nhận `state`, `animation`, `onMoveComplete`, `onMoveCancel` và `onReadyChange`; caller điều khiển phải cung cấp callbacks ổn định. PracticeCube nối player với renderer và UI, đặt controls qua slot moveControls của viewport. CubeViewport không tự áp dụng logic move.

## Hủy, vòng đời và reduced motion

- Hủy giữa move: xóa active, bỏ pivot, trả hình ảnh về snapshot trước move; không tăng completed.
- Reset giữa move: bỏ pivot rồi hiển thị solved; completion cũ bị từ chối bằng ID.
- Rời route/unmount: PracticeCube và CubeViewport cleanup cancel; R3F tự bỏ subscription useFrame. Cleanup trùng là an toàn vì cancel idempotent. Cleanup không đặt trên pivot mới mount để tránh React StrictMode hủy nhầm move vừa bắt đầu.
- Context loss/error boundary: báo not-ready, cancel active và hiển thị fallback; nút xoay disabled. Geometry/material và event listener tiếp tục theo ownership đã ghi trong viewer docs.
- Media query prefers-reduced-motion được subscribe/unsubscribe đúng lifecycle. Khi bật từ đầu, start commit tức thời; khi đổi sang reduce giữa move, complete move hiện tại một lần rồi bỏ pivot. State cuối giống đường animation.

## Kiểm tra và bằng chứng

- Suite **332 tests**, thêm 46 test: 18 move commit-once, 18 reduced-motion equivalents, overlapping input, reset/stale IDs, cancel, subscriptions, 120 move/inverse transactions, malformed AST và bốn góc nội suy ±π/2/±π. Format/lint/typecheck/build được kiểm tra trong PR.
- Chromium 153 software WebGL production: đủ 18 endpoint animation so với renderer reduced-motion tức thời. Mỗi cặp canvas PNG giống từng pixel; ảnh giữa R khác endpoint và đã được xem để xác nhận layer đang xoay. Mỗi scene giữ 8 GPU buffers trong quá trình thử.
- Cancel/reset giữa animation, nhập nhanh 12 lần chỉ commit một move, đổi reduced motion giữa move, rời route rồi quay lại, mất context giữa move và WebGL không khả dụng đều đạt. Không có pageerror; không draw thêm trong 250 ms idle sau khi trở lại route.
- Chuỗi 12 move rồi 12 move nghịch đảo qua animation thực: state solved, ảnh canvas cuối giống từng pixel với ban đầu; chỉ tạo tổng cộng 8 buffers và tái sử dụng xuyên suốt 24 move, không pageerror.
- Mobile viewport 360×800: controls dùng được, đã xem ảnh và không tràn ngang.
- Development /ui-preview với StrictMode: ba lần removal thật giữa animation, mỗi lần tạo/xóa 8 buffers (tổng 24/24), live=0, canvas/viewport listeners=0; resize/resolution/reduced-motion listeners về baseline=0. Sau cleanup không tiếp tục draw trong khoảng kiểm tra 200 ms; không pageerror.

Các kiểm tra này dùng software WebGL và browser emulation, không phải benchmark FPS trên điện thoại thật hoặc heap audit toàn bộ browser. Safari/Firefox và thiết bị vật lý vẫn cần kiểm tra riêng.

## Chạy lại

1. `pnpm test`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
2. /practice: thử đủ 18 lựa chọn, xem layer giữa move và endpoint; thử move rồi nghịch đảo để về solved.
3. Khi status đang xoay: hủy, reset, đổi route, thử gửi nhiều lệnh. Completed chỉ tăng khi move hoàn tất.
4. DevTools Rendering → Emulate prefers-reduced-motion: kiểm start tức thời và thay đổi preference giữa move. So sánh endpoint với animation thường.
5. /ui-preview khi pnpm dev: Hiện/Ẩn mô hình thử giữa animation để kiểm removal thật; production vẫn trả 404 cho fixture.

Tiếp theo: **7.3 — Move queue**. Liên quan: [viewer/camera](./cube-viewer.md), [move engine](./cube-moves.md).
