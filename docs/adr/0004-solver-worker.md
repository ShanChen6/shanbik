# ADR 0004 — Solver adapter và Web Worker

- Ngày: 26/10/2026.
- Trạng thái: **Boundary đề xuất; lựa chọn solver cần spike 9.2**.
- Phạm vi: Task 2.3; chỉ tài liệu, chưa triển khai năng lực mới.

## Bối cảnh

Solver là phép tính nặng, riêng với renderer/scramble. Beta chỉ giải 3×3 nhập tay, camera là tính năng sau beta. Chưa có thư viện solver được cài.

## Quyết định / hướng đề xuất

Giải trong dedicated Web Worker qua adapter typed. Request mang ID và snapshot đã validate; response phân biệt success, invalid-state, initialization/error/timeout phù hợp khả năng thư viện. Không để code UI biết API nội bộ solver.

Chỉ nhận kết quả của request hiện hành. Sửa input/reset/unmount phải hủy hoặc bỏ kết quả cũ. Nếu thư viện không hủy nội bộ được thì đánh giá terminate/recreate Worker; retry không dùng instance hỏng. Không fallback tính toán nặng trên main thread.

Kiểm chứng solution áp dụng lên snapshot bằng core và đưa về solved trước hiển thị thành công. State solved không sinh move giả. Không quảng bá optimal solution/CFOP hoặc giải mọi NxN.

Chưa chốt cubejs hoặc ứng viên cubing.js. WASM/OpenCV không được thêm mặc định; camera không phải điều kiện để dùng solver.

## Phương án khác

Main-thread solver: có nguy cơ khóa UI. API solver trên server: tăng mạng/vận hành, chưa cần cho guest beta. WASM ngay từ đầu: chưa có số đo lợi ích hoặc yêu cầu tương thích.

## Hệ quả

Worker tăng công protocol/cleanup; cần benchmark cold init, warm solve, memory, bundle và cơ chế cancel. Timeout và số fixture là quyết định chờ đo, không đặt thành kết quả đã đạt.

## Kiểm chứng và điều kiện xem xét lại

Task 9.2 ghi ứng viên/version/license/thiết bị/fixture/cold-warm measurements, rồi chốt solver và timeout. Task 9.3 test init failure, timeout, retry, stale ID và unmount; Task 9.4 test solution về solved. Không tích hợp app trước spike được review.

## Nguồn trong repository

- [Kiến trúc hiện trạng](../architecture/current-state.md) (snapshot Task 2.1; CI đã bổ sung ở Task 2.2).
- [Đặc tả MVP](../product/mvp-spec.md).
- [Backlog](../product/implementation-backlog.md).
- [Cấu hình package](../../package.json), [Next](../../next.config.ts), [Vitest](../../vitest.config.mts), [CI](../../.github/workflows/ci.yml).
