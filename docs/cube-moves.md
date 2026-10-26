# Move engine 3×3 — Task 4.3

Mã TypeScript thuần tại `src/features/cube/core/moves.ts`, export qua core index. Không thêm React, Three.js, solver, Worker hoặc package runtime. UI luyện tập vẫn là khung, chưa nối renderer.

## Phép biến đổi

Engine dùng thứ tự mặt, normal/right/down từ [quy ước state](./cube-state.md). Mỗi sticker được định danh bởi vị trí trên lưới và normal hướng ra; hai sticker cùng vị trí cubie nhưng normal khác nhau là hai vị trí riêng biệt.

Cho move mặt X, chỉ xoay các sticker có `dot(position, normalX) = 1`. Quarter turn theo chiều kim đồng hồ khi nhìn mặt từ ngoài là -90° quanh normal hướng ra. Với vector v và normal đơn vị n:

`rotateClockwise(v, n) = n × dot(n, v) - cross(n, v)`

Ký hiệu × thứ nhất là nhân scalar; cross là tích có hướng. Cả vị trí và normal được xoay, rồi ánh xạ về sticker đích. Phép tính chỉ dùng số nguyên, không sin/cos hoặc góc float. Các permutation target→source được tính một lần cho sáu mặt và kiểm tra bijection đầy đủ 54 vị trí.

- Quarter: một lần permutation.
- Double: hai lần.
- Prime: ba lần clockwise, tương đương một lần ngược chiều.
- Tâm mặt giữ nguyên; màu và số lượng sticker được bảo toàn.

Không thay đổi các quy ước đã chốt để khớp một renderer riêng. Adapter/scene tương lai phải dùng cùng convention.

## API

| API                                 | Hành vi                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| `applyMove(state, move)`            | Áp dụng một descriptor hợp lệ                            |
| `applyAlgorithm(state, moves)`      | Validate state và toàn bộ AST trước khi áp dụng sequence |
| `applyAlgorithmText(state, source)` | Parse toàn bộ notation bằng Task 4.2, rồi áp dụng        |
| `invertMove(move)`                  | Giữ face, đổi 1↔-1, giữ 2                                |
| `invertAlgorithm(moves)`            | Đảo thứ tự và nghịch đảo từng move                       |

Apply luôn trả snapshot mới, gồm cả sequence rỗng. Input state, từng mảng mặt và descriptors của caller không bị mutate. Kết quả apply tuân invariant copy/freeze của state factory; inverse trả descriptors/mảng mới, bất biến.

```ts
import {
  createSolvedCubeState,
  parseAlgorithm,
  applyAlgorithm,
  invertAlgorithm,
  isCubeSolved,
} from "@/features/cube/core";
const initial = createSolvedCubeState();
const algorithm = parseAlgorithm("R U2 F' L D B2");
const mixed = applyAlgorithm(initial, algorithm);
const restored = applyAlgorithm(mixed, invertAlgorithm(algorithm));
// isCubeSolved(restored) === true; initial vẫn nguyên vẹn.
```

Notation sai ném AlgorithmParseError trước khi text wrapper áp dụng bất kỳ prefix nào. AST sai dùng chung validation của serializer, ném AlgorithmSerializationError với index lỗi. State sai cấu trúc ném CubeStateValidationError. Apply/inverse không trả kết quả dở dang khi lỗi.

## Fixture độc lập

`src/features/cube/core/__fixtures__/moves.json` chứa 54 golden cases được tạo bằng **cubejs@1.3.2** ([source](https://github.com/ldez/cubejs)). Chỉ dùng API move/asString, không khởi tạo solver:

- 18 move cơ bản/prime/double từ solved.
- 18 move từ một trạng thái đã trộn, giúp phát hiện sai orientation của sticker cùng mặt mà state solved đồng màu có thể che khuất.
- 6 thuật toán nhiều mặt.
- 12 sequence xác định (seed 0x53424b), có cả initial state mixed.

Mỗi fixture có initial algorithm, initial state, algorithm và expected state. Test đọc JSON tĩnh, không gọi engine để tự tạo expected. Oracle dùng representation cubie của thư viện, trong khi engine ShanBik tạo permutation từ tọa độ sticker.

Có thể tái tạo fixture ngoài dependencies ứng dụng:

```bash
npm install --prefix /tmp/shanbik-move-oracle cubejs@1.3.2 --ignore-scripts --no-audit --no-fund
node scripts/generate-move-fixtures.mjs /tmp/shanbik-move-oracle/node_modules/cubejs
pnpm exec prettier --write src/features/cube/core/__fixtures__/moves.json
pnpm test
```

Generator yêu cầu đúng phiên bản và đường dẫn package tuyệt đối. Không chạy generator trong CI: CI dùng fixture đã commit. Việc đối chiếu move subset với cubejs không quyết định thư viện solver cho Task 9.2. Sequence seed chỉ tạo dữ liệu test, không phải tính năng scramble hay cam kết chuẩn thi đấu.

## Kiểm tra và giới hạn

Ngoài golden cases, unit test Node kiểm tra bốn lần quarter, prime/inverse, hai lần double, sequence + inverse từ solved và mixed, double inverse, move không giao hoán, opposite faces giao hoán, immutable snapshot, empty sequence và input sai.

State ban đầu chỉ được kiểm tra cấu trúc/counts/tâm như Task 4.1. Engine chưa xác minh inventory/orientation/parity; không thể dùng apply để tuyên bố một state nhập tay có thể giải được. Task 9.1b phải chặn đầu vào vật lý sai trước solver. Engine cũng chưa hỗ trợ wide/slice/whole-cube rotations, animation, cancel hoặc queue UI.

Bước tiếp theo: Task 5.1 — CubeViewport 3D tĩnh; đồng bộ animation sẽ đến ở Task 7.x.
