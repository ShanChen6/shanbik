# Architecture Decision Records

Task 2.3 chuyển định hướng kiến trúc thành quyết định có bối cảnh, phương án khác, hệ quả và cổng kiểm chứng. Các file là đề xuất chờ review PR; nền tảng/CI hiện hữu được ghi nhận theo source. Merge tài liệu thể hiện chấp nhận hướng thiết kế, không có nghĩa thư viện đang “cần thử nghiệm” đã được chọn hoặc code đã được triển khai.

## Danh mục

| ADR                                  | Nội dung                                | Trạng thái                                                         |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------------ |
| [0001](./0001-web-platform.md)       | Nền tảng web và ranh giới client/server | Ghi nhận nền tảng đã triển khai; chính sách boundary chờ review PR |
| [0002](./0002-cube-core-boundary.md) | Cube core và nguồn trạng thái duy nhất  | Đề xuất — chờ review PR                                            |
| [0003](./0003-renderer-strategy.md)  | Chiến lược renderer 3D                  | Cần thử nghiệm — chưa chốt thư viện                                |
| [0004](./0004-solver-worker.md)      | Solver adapter và Web Worker            | Boundary đề xuất; lựa chọn solver cần spike 9.2                    |
| [0005](./0005-testing-ci.md)         | Kiến trúc kiểm thử và CI                | Ghi nhận CI đã triển khai; mở rộng test theo domain chờ review     |
| [0006](./0006-storage-backend.md)    | Guest-first, persistence và backend     | Guest-first theo đặc tả; storage/backend chưa chốt                 |

## Quy tắc cập nhật

- Ghi “Đề xuất”, “Chấp nhận”, “Cần thử nghiệm” hoặc “Được thay thế” theo nội dung; không dùng một nhãn accepted để che phần chưa có bằng chứng.
- Khi quyết định được review/merge, cập nhật trạng thái cùng bằng chứng PR/commit trong lượt chỉnh tiếp theo nếu cần; không tự tuyên bố đã duyệt trước review.
- Quyết định thư viện sau spike cần ghi version, license, phép đo, phương án và lý do chọn.
- Nếu thay đổi quyết định đã chấp nhận, thêm ADR mới và liên kết supersedes thay vì xóa lịch sử.
- Đây là yêu cầu thiết kế; triển khai và test thuộc task tương ứng trong backlog.

## Các quyết định còn mở

Renderer ở Task 5.1, representation cube ở 4.1, solver ở 9.2, local persistence ở 15–16 và backend/auth ở 23.x. Phần auth tối thiểu phải có trước admin 22.1. Không cài dependency hoặc thay code ứng dụng trong Task 2.3.

## Bổ sung từ triển khai

- [0007 — Facelet state](./0007-facelet-state.md): representation và invariant Task 4.1.
