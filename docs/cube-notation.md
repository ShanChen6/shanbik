# Notation thuật toán 3×3 — Task 4.2

Mã tại `src/features/cube/core/notation.ts`, export qua core index. TypeScript thuần, không React, DOM, renderer hoặc solver. Parser chỉ đọc chuỗi và tạo descriptor; [move engine](./cube-moves.md) riêng ở Task 4.3 mới áp dụng lên cube.

## Cú pháp được hỗ trợ

| Token | Descriptor                 | Ý nghĩa                                            |
| ----- | -------------------------- | -------------------------------------------------- |
| R     | `{ face: "R", turns: 1 }`  | 90° theo chiều kim đồng hồ khi nhìn mặt R từ ngoài |
| R'    | `{ face: "R", turns: -1 }` | Prime: ngược chiều                                 |
| R2    | `{ face: "R", turns: 2 }`  | Half turn: 180°                                    |

Áp dụng tương tự cho U/D/L/R/F/B viết hoa. Quy ước mặt và trục theo [cube-state.md](./cube-state.md). Không gộp hoặc tối giản các move lặp; `R R` giữ là hai move, không tự đổi thành `R2`.

- Các token phải được ngăn cách bằng khoảng trắng. Space/tab/newline/CRLF/NBSP/Unicode whitespace theo JavaScript `\s` được chấp nhận.
- Input rỗng hoặc chỉ có whitespace là thuật toán rỗng/no-op.
- ASCII prime `'`, dấu nháy phải `’` và ký hiệu prime `′` được nhận; output luôn dùng ASCII `'`.
- Output canonical: một space giữa token, không space đầu/cuối, mặt viết hoa.
- Không tự đổi chữ thường thành mặt viết hoa vì các hệ notation khác có thể dùng chữ thường với nghĩa khác.
- `RUR'`, `Rw`, `M`, `x`, ngoặc/commutator/repetition, dấu phẩy, `R3`, `R''`, `R2'` và fullwidth R nằm ngoài cú pháp beta này; parser báo lỗi thay vì suy đoán. Với chuỗi compact, thêm khoảng trắng giữa các move.

Zero-width space không thuộc whitespace được hỗ trợ; token có ký tự đó bị từ chối để không giấu lỗi sao chép.

## API

| API                           | Kết quả                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `tryParseAlgorithm(unknown)`  | `{ valid: true, moves }` hoặc `{ valid: false, issues }`, không throw cho input chuỗi/giá trị JSON thông thường |
| `parseAlgorithm(unknown)`     | CubeAlgorithm hoặc AlgorithmParseError với issues                                                               |
| `serializeAlgorithm(moves)`   | Chuỗi canonical; kiểm tra face/turns runtime và ném AlgorithmSerializationError nếu AST sai                     |
| `normalizeAlgorithm(unknown)` | Parse rồi serialize; input sai ném AlgorithmParseError                                                          |

`CubeMove` có face thuộc sáu mặt và turns = 1/-1/2; `CubeAlgorithm` là mảng readonly. Các descriptor và mảng parser trả về được freeze. Serializer không mutate mảng caller. Serializer không nhận sparse array hoặc tự ép kiểu turns từ chuỗi/số khác.

```ts
import { tryParseAlgorithm, normalizeAlgorithm } from "@/features/cube/core";

const result = tryParseAlgorithm("  R U’\nF2  ");
if (result.valid) {
  // result.moves dành cho engine; parser không tự xoay cube.
} else {
  // Hiển thị result.issues, giữ nguyên input để người dùng sửa.
}
const normalized = normalizeAlgorithm("  R U’\nF2  "); // "R U' F2"
```

## Lỗi và vị trí

Issue parse có code INVALID_INPUT hoặc INVALID_TOKEN, token gốc, tokenIndex, start/end và message. tokenIndex là index token 0-based, bao gồm cả token sai. start/end là offset **UTF-16 0-based, end exclusive** trong input gốc, phù hợp selectionStart/selectionEnd của textarea tương lai. Không tính offset trên chuỗi đã trim/chuẩn hóa. Message hiển thị vị trí bắt đầu +1.

Ví dụ `R 🧩 U` báo token emoji ở start=2, end=4; `input.slice(start, end)` lấy đúng token. Đây là offset UTF-16, không phải UTF-8 byte hoặc số ký tự hiển thị.

Input không phải chuỗi có token/tokenIndex=null, start=end=0; UI nên dựa code để không chọn một token giả.

Nếu có bất kỳ token sai, kết quả thất bại không có thuộc tính moves, kể cả khi một số token trước đó đúng. Lớp điều khiển tương lai chỉ apply khi valid=true. Error ném từ parse có cùng issues với API không throw; không thay đổi state hoặc trả danh sách move dở dang.

Serializer lỗi có moveIndex 0-based, hoặc null nếu input không phải array. Các API nhận DTO thông thường, không phải cơ chế xử lý proxy/getter độc hại.

## Phạm vi kiểm tra

Unit test Node kiểm tra từng mặt/prime/double, thứ tự, whitespace/prime aliases, empty input, round-trip, snapshot bất biến, invalid token/non-string, offset gốc/emoji và invalid AST/sparse arrays.

Task 4.1 state serialization URFDLB 54 ký tự vẫn độc lập với serializer thuật toán có khoảng trắng ở đây. Apply/inverse được bổ sung riêng ở Task 4.3; animation còn thuộc Task 7.x.
