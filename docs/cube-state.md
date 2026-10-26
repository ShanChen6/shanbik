# Cube 3×3 — State model và quy ước

Task 4.1. Mã tại `src/features/cube/core/`, TypeScript thuần, không React/DOM/WebGL, renderer, solver hoặc persistence. Unit test chạy môi trường Node. Đây là nền tảng dữ liệu, chưa là mô phỏng có thể thao tác trên trang luyện tập.

## Representation

`CubeState` có đúng một thuộc tính `faces`, chứa đúng sáu mặt, mỗi mặt là tuple readonly 9 màu. Thứ tự canonical là **U R F D L B**. State do factory/clone/deserialize tạo là snapshot mới, freeze ở root, dictionary và từng mảng mặt. Dữ liệu của caller không được giữ chung tham chiếu.

Chọn facelet để nhập màu/serialize dễ kiểm tra. Chưa chọn representation nội bộ cho solver; adapter có thể chuyển facelet sang cubie sau spike. Freeze không còn được bảo đảm sau JSON/structuredClone; gọi `createCubeState(dto)` ở biên nhận để validate và tạo snapshot mới.

| Mặt | Ý nghĩa | Màu tâm cố định |
| --- | ------- | --------------- |
| U   | Trên    | white           |
| R   | Phải    | red             |
| F   | Trước   | green           |
| D   | Dưới    | yellow          |
| L   | Trái    | orange          |
| B   | Sau     | blue            |

Tên màu là dữ liệu domain, không phải CSS hay theme sáng/tối. Chưa hỗ trợ tùy biến color scheme hoặc coi whole-cube rotation là state mới. Camera/nhập tay sau này cần chuẩn hóa hướng khối theo tâm trước khi dùng adapter.

## Tọa độ và hướng mặt

Hệ trục tay phải: +x phải, +y trên, +z trước. Mỗi mặt được nhìn **từ ngoài nhìn vào khối**, không phải mọi mặt đều nhìn cùng một hướng camera.

Trong mảng mặt, index = row × 3 + column, row/column từ 0 đến 2; hàng trên có index 0–2, hàng giữa 3–5, hàng dưới 6–8; tâm là index 4. Các vector canonical được export trong `FACE_ORIENTATIONS`.

| Mặt | Normal hướng ra | Hướng cột tăng (right) | Hướng hàng tăng (down) |
| --- | --------------- | ---------------------- | ---------------------- |
| U   | (0,1,0)         | (1,0,0)                | (0,0,1)                |
| R   | (1,0,0)         | (0,0,-1)               | (0,-1,0)               |
| F   | (0,0,1)         | (1,0,0)                | (0,-1,0)               |
| D   | (0,-1,0)        | (1,0,0)                | (0,0,-1)               |
| L   | (-1,0,0)        | (0,0,1)                | (0,-1,0)               |
| B   | (0,0,-1)        | (-1,0,0)               | (0,-1,0)               |

Vị trí trên lưới đơn vị: `normal + (column - 1) × right + (row - 1) × down`. Đây là quy ước định vị, không phải kích thước geometry hoặc renderer đã xây dựng.

Move mặt cơ bản sau này là 90° theo chiều kim đồng hồ khi nhìn trực diện mặt từ ngoài; tương ứng góc -90° quanh normal hướng ra trong hệ tay phải. Prime đảo chiều, double 180°. Task 4.2 mới parse notation và Task 4.3 mới thực thi moves; không có move engine trong Task 4.1.

## Serialization state

`serializeCubeState` tạo đúng 54 ký tự viết hoa: 9 sticker U, rồi R, F, D, L, B, trong mỗi mặt theo index 0–8. Ký tự mô tả màu theo tâm cố định, không phải vị trí hiện tại: white→U, red→R, green→F, yellow→D, orange→L, blue→B.

Ví dụ solved:

```text
UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
```

`deserializeCubeState` chỉ chấp nhận đúng 54 ký tự U/R/F/D/L/B; không trim, không lowercase normalization. Sau khi decode vẫn kiểm tra số lượng màu và tâm. Đây là định dạng project, không tự khẳng định tương thích mọi solver. Adapter phải đối chiếu thứ tự và orientation với thư viện được chọn. Nếu đổi format cần version/ADR mới trước khi lưu dữ liệu lâu dài.

Serialization state này khác với parser/serializer **thuật toán notation** ở Task 4.2.

## API

| Hàm                              | Hợp đồng                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `validateCubeStructure(unknown)` | Kết quả valid + issues; không mutate và không throw cho dữ liệu JSON thông thường        |
| `createCubeState(unknown)`       | Validate cấu trúc rồi copy/freeze; lỗi ném CubeStateValidationError với issues/path/code |
| `createSolvedCubeState()`        | Snapshot solved mới ở mỗi lần gọi                                                        |
| `cloneCubeState(state)`          | Copy/freeze mới toàn bộ, validate đầu vào                                                |
| `resetCubeState()`               | Trả snapshot solved mới; caller tự thay current state, không mutate state cũ             |
| `isCubeSolved(unknown)`          | False cho cấu trúc lỗi; true chỉ khi mọi sticker đúng màu mặt canonical                  |
| `serializeCubeState(state)`      | Validate rồi tạo chuỗi canonical 54 ký tự                                                |
| `deserializeCubeState(unknown)`  | Decode, validate và tạo snapshot bất biến mới                                            |

```ts
import {
  createSolvedCubeState,
  cloneCubeState,
  serializeCubeState,
  resetCubeState,
} from "@/features/cube/core";
let state = createSolvedCubeState();
const snapshot = cloneCubeState(state);
const encoded = serializeCubeState(snapshot);
state = resetCubeState();
```

Factory nhận DTO JSON thông thường; chưa thiết kế để xử lý object có getter/proxy độc hại hoặc payload mạng không giới hạn. Khi có backend cần validation boundary tương ứng.

## Validation và giới hạn

- Đúng root/dictionary/sáu key mặt; không nhận key thừa.
- Mỗi mặt đúng 9 sticker; lỗ trong sparse array bị từ chối như màu thiếu.
- Từng sticker thuộc sáu màu cố định, mỗi màu đúng 9 lần, tâm đúng mặt.
- Issues chỉ rõ path, phân biệt shape, face keys, length, color, center, counts và encoding.
- **Chưa kiểm tra inventory/orientation/parity của cubie.** valid ở đây không có nghĩa khối có thể giải được. Không gửi state vào solver chỉ dựa trên kết quả này; Task 9.1b phải bổ sung kiểm tra vật lý.

Test có fixture hoán đổi hai sticker ngoài tâm để xác minh serialization/cấu trúc, không dùng fixture đó làm bằng chứng physical reachability. Chưa test apply/inverse move vì chưa có implementation.

## Kiểm tra

`pnpm test` chạy Vitest Node, không cần DOM/canvas. Test bảo vệ snapshot khỏi mutation, deep clone, reset không sửa state cũ, malformed input/sparse arrays, số lượng/tâm và round-trip. Vitest không còn cho phép thiếu toàn bộ test. CI tiếp tục chạy format/lint/typecheck/test/build.
