# ADR 0003 — Chiến lược renderer 3D

- Ngày: 26/10/2026.
- Trạng thái: **Cần thử nghiệm — chưa chốt thư viện**.
- Phạm vi: Task 2.3; chỉ tài liệu, chưa triển khai năng lực mới.

## Bối cảnh

MVP cần cube 3×3 tương tác nhưng mobile/WebGL có giới hạn. Repo chưa cài renderer. Roadmap nêu Three.js + React Three Fiber/Drei làm ứng viên.

## Quyết định / hướng đề xuất

Giữ renderer sau adapter CubeViewport, nhận state/moves theo core. Ưu tiên thử Three.js + React Three Fiber, chỉ thêm Drei controls cần dùng; chưa coi là dependency đã chốt. Cân nhắc TwistyPlayer khi phù hợp viewer minh họa, không mặc định dùng hai renderer cho cùng luồng.

Scene nạp theo nhu cầu trong client boundary, không đưa WebGL vào server hoặc trang nội dung không cần scene. Có thông báo WebGL không khả dụng và controls thay gesture; không hứa fallback 2D đầy đủ khi chưa triển khai. Reduced motion thay đổi cách trình bày, không đổi kết quả state.

Giới hạn pixel ratio, đo draw calls/frame time trên thiết bị đại diện, dọn listener/canvas/geometry/material khi unmount. Không thêm bóng đổ hoặc hiệu ứng đắt trước khi đo.

## Phương án khác

Three.js trực tiếp: kiểm soát vòng đời tốt nhưng nhiều mã tích hợp React. R3F: phù hợp React nhưng phải kiểm tra version/cleanup. TwistyPlayer: tiềm năng giảm công mô phỏng, cần kiểm chứng API/state/notation/license trước chọn.

## Hệ quả

Chưa có benchmark hoặc kết luận license trong repo. Tải động, SSR boundary và error fallback cần kiểm thử thực tế. Không cam kết FPS theo máy phát triển.

## Kiểm chứng và điều kiện xem xét lại

Tại Task 5.1 kiểm tra license, versions tương thích, bundle, solved scene, WebGL failure và remount. Task 5.2/6.1 đo mobile/touch. Ghi kết quả rồi cập nhật ADR thành quyết định được chọn; nếu không đạt, thử ứng viên khác trước khi xây animation sâu.

## Nguồn trong repository

- [Kiến trúc hiện trạng](../architecture/current-state.md) (snapshot Task 2.1; CI đã bổ sung ở Task 2.2).
- [Đặc tả MVP](../product/mvp-spec.md).
- [Backlog](../product/implementation-backlog.md).
- [Cấu hình package](../../package.json), [Next](../../next.config.ts), [Vitest](../../vitest.config.mts), [CI](../../.github/workflows/ci.yml).
