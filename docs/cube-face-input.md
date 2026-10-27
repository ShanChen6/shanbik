# Nhập màu sáu mặt — Task 9.1a

Trên `/practice`, phần **Nhập màu sáu mặt** hoạt động độc lập với WebGL. Bắt đầu với 6 tâm cố định, 48 ô chưa nhập. Chọn màu tô trong một mặt rồi nhấn ô để điền/sửa; màu tô dùng chung. Chọn **Xóa ô** để bỏ một ô. Từng ô có nhãn mặt, hàng, cột và tên màu; ký hiệu chữ giúp phân biệt ngoài màu sắc. Các nút ô có kích thước tối thiểu 44px, sử dụng Tab/Enter/Space và select native.

## Quy ước hướng mặt

Giữ U trắng trên, F xanh lá trước, R đỏ phải, L cam trái, B xanh dương sau, D vàng dưới. Mỗi lưới nhìn từ ngoài vào, theo hàng từ trái sang phải/trên xuống dưới. Xoay cả khối để nhìn mặt cần nhập; không xoay riêng tầng. Đặt mặt kề tương ứng phía trên lưới, không phản chiếu mặt B.

| Mặt nhìn | Cạnh trên | Trái | Phải | Dưới |
| -------- | --------- | ---- | ---- | ---- |
| U        | B         | L    | R    | F    |
| R        | U         | F    | B    | D    |
| F        | U         | L    | R    | D    |
| D        | F         | L    | R    | B    |
| L        | U         | B    | F    | D    |
| B        | U         | R    | L    | D    |

Hướng này được kiểm tra trực tiếp với normal/right/down trong `FACE_ORIENTATIONS` của core; index `row * 3 + column` cùng serialization URFDLB.

## Dữ liệu và phạm vi

- `face-input/draft.ts`: draft immutable `Record<CubeFace, readonly (CubeColor|null)[]>`, fixed centers, sửa một ô, đếm màu/vị trí trống và tạo snapshot core khi đủ điều kiện cấu trúc.
- `face-input/face-input-panel.tsx`: lưới sáu mặt, chọn màu, sửa/xóa, mẫu solved, bộ đếm và báo lỗi. Giữ draft khi kiểm tra lỗi, không tự sửa màu để ép đủ số lượng. Có nút focus ô trống đầu tiên.
- `viewer/practice-cube.tsx`: hiển thị panel ngoài viewport để fallback WebGL không chặn nhập tay.
- **Kiểm tra khối** yêu cầu đủ 54 ô, tâm đúng và đúng 9 ô/màu. Đếm gồm cả tâm. Sau kiểm tra số lượng, Task 9.1b kiểm tra khả thi trước khi xác nhận thành công.
- **Điền mẫu solved** thay draft bằng mẫu đủ màu. **Xóa màu đã nhập** chỉ giữ 6 tâm. Các thao tác này không đổi state mô hình, queue, thuật toán hoặc lịch sử phát.
- Không đưa draft vào player/solver. Task 9.1b đã nối snapshot sau kiểm tra cấu trúc vào kiểm tra cubie inventory/orientation/parity. Đảo một edge vẫn đủ số màu nhưng không khả thi; unit fixture ghi rõ ranh giới này.
- State chỉ giữ trong component; reload/unmount thực sự xóa draft, Next có thể giữ component khi chuyển trang. Không cloud/localStorage/camera/dependency mới.

## Kiểm tra

22 test mới: blank centers/48 missing, khóa sáu tâm với mọi màu và eraser, sửa/xóa không mất ô khác, index sai, màu thừa/thiếu và sửa sau lỗi, round-trip scrambled state qua core serialization, tâm sai và edge flip chưa kiểm tra khả thi, hướng mặt khớp core cho cả sáu mặt. Tổng 432 tests.

Chạy `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm format:check`. Chromium 141 software WebGL trên GitHub Actions run 40440931115 đã đạt: sáu mặt/54 ô, sáu tâm disabled, fixture thiếu 48 ô, focus ô đầu bằng bàn phím, chọn màu native và Space tô ô, touch tô/sửa/xóa, giữ ô khác khi sửa và khi báo lỗi, thừa đỏ 10/9 + thiếu trắng 8/9, sửa về đủ số lượng, mẫu solved/xóa/reload. Ảnh canvas trước/sau nhập giống từng pixel. Viewport 360×800 không tràn ngang, mọi ô tối thiểu 44×44px; ảnh lưới U đã được xem. Khi WebGL bị chặn, vẫn nhập và kiểm tra màu được, nút phát thuật toán bị disabled. Không có pageerror.

Chưa kiểm tra Safari/Firefox hoặc thiết bị mobile vật lý; software WebGL/emulation không thay thế benchmark FPS/heap.

Đã nối [Task 9.1b — Validation tính khả thi](./cube-feasibility.md). Tiếp theo: **9.2 — Solver spike và benchmark**.
