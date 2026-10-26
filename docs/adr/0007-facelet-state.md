# ADR 0007 — Facelet snapshot cho cube 3×3

- Ngày: 26/10/2026.
- Trạng thái: triển khai đề xuất trong PR Task 4.1, chờ review.
- Bổ sung chi tiết representation cho [ADR 0002](./0002-cube-core-boundary.md), không thay boundary core/UI.

## Bối cảnh

Task 4.1 cần state độc lập với renderer/solver, nhập màu sau này và format snapshot xác định. Chưa chọn solver nên không lấy kiểu dữ liệu của thư viện ngoài làm model chuẩn.

## Quyết định

Dùng sáu mảng mặt readonly 9 màu (facelet), factory copy và deep-freeze. Các hằng số face order, tâm màu và basis vector ở một module constants. Serialization canonical URFDLB dài 54 ký tự; chi tiết ở [cube-state.md](../cube-state.md).

Validation hiện tại chỉ kiểm tra cấu trúc/counts/tâm. Physical validity là gate riêng ở Task 9.1b. Input chưa nhập đủ sẽ được giữ ở form draft tương lai, không ép thành CubeState hợp lệ hoặc dùng màu giả.

## Phương án khác

- Cubie permutation/orientation: phù hợp thuật toán nhưng thêm chuyển đổi từ UI nhập màu; vẫn có thể dùng bên trong solver adapter.
- Flat 54-array: serialization dễ nhưng truy cập mặt/type chiều dài ít rõ hơn; canonical string vẫn là flat khi trao đổi.
- Mesh transforms làm model: phụ thuộc WebGL và dễ drift, trái boundary đã đặt.

## Hệ quả

Dễ tạo fixture và test trong Node, mutation không vô tình làm lệch renderer. Mỗi snapshot copy 54 giá trị; chưa có nhu cầu tối ưu in-place. Clone qua Worker/JSON cần factory ở phía nhận để khôi phục invariant runtime. Representation không hứa giải mọi puzzle hoặc tương thích solver bên ngoài ngay lập tức.

## Kiểm chứng / xem xét lại

Test solved/reset/clone/round-trip, dữ liệu lỗi và basis vectors. Move engine, adapter và physical validation phải có test riêng khi triển khai. Nếu solver hoặc benchmark cho thấy cần representation khác, giữ interface/adapter hoặc mở ADR mới trước khi đổi format dữ liệu.
