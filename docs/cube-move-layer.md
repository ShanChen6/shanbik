# Move → layer mapping — Task 7.1

## Phạm vi

Adapter `src/features/cube/viewer/move-layer.ts` chuyển CubeMove của core thành mô tả phép xoay cho renderer. Không phụ thuộc React/Three/browser, không giữ state puzzle hoặc gọi applyMove. Chọn cubies từ view-model hiện tại để chuẩn bị cho animation một move ở Task 7.2. Queue ở Task 7.3.

## Quy ước

Thế giới dùng hệ tay phải: +x phải, +y trên, +z trước. Mỗi mặt được nhìn từ bên ngoài; clockwise là −90° quanh pháp tuyến hướng ra ngoài. Camera orbit không đổi quy ước này.

Descriptor dùng trục **dương** của thế giới. `quarterTurns = -layer * move.turns`; `angle = quarterTurns * π/2`. Prime đảo dấu, double nhân đôi góc. Giá trị signed ±π được giữ để hướng nội suy sau này nhất quán.

| Move | Axis | Layer | Angle | Prime | Double |
| ---- | ---- | ----- | ----- | ----- | ------ |
| U    | y    | +1    | −π/2  | +π/2  | −π     |
| R    | x    | +1    | −π/2  | +π/2  | −π     |
| F    | z    | +1    | −π/2  | +π/2  | −π     |
| D    | y    | −1    | +π/2  | −π/2  | +π     |
| L    | x    | −1    | +π/2  | −π/2  | +π     |
| B    | z    | −1    | +π/2  | −π/2  | +π     |

Trục/layer lấy từ FACE_ORIENTATIONS của core. Fixture test ghi bảng kỳ vọng độc lập để phát hiện thay đổi quy ước vô tình. `axisVector` luôn là unit vector dương; góc đã bao gồm dấu layer và notation.

## API

```ts
const cubies = buildCubeViewModel(snapshot);
const turn = getMoveLayer({ face: "R", turns: -1 });
// axis="x", axisIndex=0, layer=1, axisVector=[1,0,0], angle=+π/2
const layer = selectLayerCubies(cubies, turn);
// 9 cubies: 1 center, 4 edges, 4 corners; 21 stickers
```

- `getMoveLayer(move: CubeMove): LayerTurn`: dùng validator AST của notation để từ chối face/turns sai ở runtime. Trả descriptor và axisVector frozen.
- `selectLayerCubies(cubies, turn)`: lọc `position[axisIndex] === layer`, trả mảng frozen chứa các reference gốc. Caller cung cấp view-model hợp lệ từ buildCubeViewModel và descriptor từ getMoveLayer; hàm không validate lại cả model.
- Các hàm không đổi input hoặc snapshot. Core không import viewer.

`CubieView.id` là **tọa độ slot**, ví dụ `1,1,1`, và khớp tên group trong scene `cubie:1,1,1`. Đây không phải định danh vật lý bền vững của một viên Rubik qua nhiều move. Sau khi core commit một move, chọn layer tiếp theo từ snapshot/view-model mới.

## Tích hợp renderer ở Task 7.2

Pivot đặt tại gốc cube, trong cùng hệ tọa độ local của model. Chọn group theo layer hiện tại; xoay pivot bằng `pivot.rotation[turn.axis]` hoặc axis-angle với `turn.axisVector` và `turn.angle`. Phép xoay áp dụng cho vị trí cubie và toàn bộ sticker con, bao gồm pháp tuyến.

`sticker-orientation.ts` chứa Euler XYZ dùng chung cho CubeScene và test hình học: plane local quay mặt +z, sau Euler sẽ trùng outward normal của từng mặt. Scene dùng chính các giá trị đã kiểm chứng; không đổi màu, ánh sáng hoặc camera.

Task 7.2 sẽ quản lý thời gian nội suy, commit core đúng một lần, tháo pivot và snap/reset transform về slot; cần xử lý cancel/reset và reduced motion. Task 7.1 chỉ cung cấp mapping và bằng chứng endpoint, chưa thêm nút xoay mặt hoặc animation trên /practice.

## Kiểm chứng

Chạy `pnpm test`; file `src/features/cube/viewer/move-layer.test.ts` có 65 test:

- Sáu fixture axis/layer/góc, kèm prime và double.
- Sáu layer: đúng 9 cubies/21 stickers, center/edge/corner = 1/4/4, còn 17 cubies đứng yên.
- Sáu kiểm tra Euler sticker thực tế trùng normal của core.
- Immutability và bảy AST sai bị từ chối.
- 36 endpoint Three.js: 18 moves × solved/scrambled. Dựng Group/Object3D theo vị trí cubie và Euler sticker giống scene, gom đúng layer vào pivot tại origin rồi xoay. Kiểm cả 54 vị trí/pháp tuyến/màu sticker, không có slot trùng hoặc sai số vượt 1e−8; đối chiếu snapshot từ applyMove.
- Ba chuỗi nhiều mặt, kiểm endpoint và chọn lại slot sau từng move.

Các test renderer dùng Three.js transform thật trong Node, không cần WebGL và không phải benchmark trình duyệt. Core đã có fixture đối chiếu move engine riêng tại [cube-moves.md](./cube-moves.md). Tổng suite sau Task 7.1 là 286 tests; format, lint, typecheck và production build được kiểm tra trong PR.

Liên quan: [Viewer và camera](./cube-viewer.md), [quy ước state](./cube-state.md), [notation](./cube-notation.md).
