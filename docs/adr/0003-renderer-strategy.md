# ADR 0003 — Chiến lược renderer 3D

- Ngày: 26/10/2026.
- Trạng thái: **Chọn Three.js + R3F cho prototype 3×3; Task 5.1–5.2 đã kiểm chứng static/responsive/lifecycle trong Chromium. Benchmark thiết bị thật còn mở**.
- Phạm vi: Task 2.3 ghi hướng đề xuất; Task 5.1 triển khai viewer tĩnh, Task 5.2 bổ sung responsive/lifecycle.

## Bối cảnh

MVP cần cube 3×3 tương tác nhưng mobile/WebGL có giới hạn. Ở Task 2.3 repo chưa cài renderer; Task 5.1 bổ sung Three.js/R3F. Roadmap nêu Three.js + React Three Fiber/Drei làm ứng viên.

## Quyết định / hướng đề xuất

Giữ renderer sau adapter CubeViewport, nhận state/moves theo core. Chọn Three.js 0.186.1 + React Three Fiber 9.8.2 cho viewer tĩnh; React 19.3 thỏa peer hiện tại. Package metadata ghi MIT. Chưa thêm Drei vì chưa cần controls trong Task 5.1. Cân nhắc TwistyPlayer khi phù hợp viewer minh họa, không mặc định dùng hai renderer cho cùng luồng.

Scene nạp theo nhu cầu trong client boundary, không đưa WebGL vào server hoặc trang nội dung không cần scene. Có thông báo WebGL không khả dụng và controls thay gesture; không hứa fallback 2D đầy đủ khi chưa triển khai. Reduced motion thay đổi cách trình bày, không đổi kết quả state.

Giới hạn pixel ratio, đo draw calls/frame time trên thiết bị đại diện, dọn listener/canvas/geometry/material khi unmount. Không thêm bóng đổ hoặc hiệu ứng đắt trước khi đo.

## Phương án khác

Three.js trực tiếp: kiểm soát vòng đời tốt nhưng nhiều mã tích hợp React. R3F: phù hợp React nhưng phải kiểm tra version/cleanup. TwistyPlayer: tiềm năng giảm công mô phỏng, cần kiểm chứng API/state/notation/license trước chọn.

## Hệ quả

Đã kiểm tra license metadata, build và Chromium software WebGL, SSR client boundary, fallback/mất context và tài nguyên qua route hide/show. Chunk Three đo khoảng 243 KB gzip; không tải/khởi tạo scene trên server. Benchmark điện thoại thật và camera controls còn mở. Không cam kết FPS theo máy phát triển.

## Kiểm chứng và điều kiện xem xét lại

Tại Task 5.1 kiểm tra license, versions tương thích, bundle, solved scene, WebGL failure và remount. Task 5.2 đã kiểm viewport/DPR emulation và listener/GPU cleanup. Task 6.1 tiếp tục đo camera/touch; cần thêm benchmark thiết bị thật. Ghi kết quả rồi cập nhật ADR thành quyết định được chọn; nếu không đạt, thử ứng viên khác trước khi xây animation sâu.

## Nguồn trong repository

- [Kiến trúc hiện trạng](../architecture/current-state.md) (snapshot Task 2.1; CI đã bổ sung ở Task 2.2).
- [Đặc tả MVP](../product/mvp-spec.md).
- [Backlog](../product/implementation-backlog.md).
- [Cấu hình package](../../package.json), [Next](../../next.config.ts), [Vitest](../../vitest.config.mts), [CI](../../.github/workflows/ci.yml).

## Bằng chứng triển khai Task 5.1

Xem [CubeViewport](../cube-viewer.md) cho API, số đo, kiểm tra và giới hạn. Dùng adapter view-model thuần để trình bày state; không thêm nguồn state puzzle vào scene. Fixture lifecycle chỉ mở trong development. Task 5.2 đã thêm camera fit/reset và kiểm cleanup qua 5 chu kỳ removal thật; xem cùng tài liệu cho số đo và các giới hạn. Task 6.1 tiếp tục đánh giá trước khi mở rộng animation.
