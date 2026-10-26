# ADR 0002 — Cube core và nguồn trạng thái duy nhất

- Ngày: 26/10/2026.
- Trạng thái: **Đề xuất — chờ review PR**.
- Phạm vi: Task 2.3; chỉ tài liệu, chưa triển khai năng lực mới.

## Bối cảnh

Core cần được test trong Node; renderer, solver và UI phải dùng cùng trạng thái. Chưa có core để xác minh representation tối ưu.

## Quyết định / hướng đề xuất

Dùng TypeScript thuần cho core; không import React, DOM, WebGL, Three.js hoặc SDK persistence. Core cung cấp trạng thái solved/reset/clone, parse/serialize, apply move/sequence, inverse và validation qua API typed.

Application/controller sở hữu trạng thái chuẩn và move queue. Renderer chỉ trình bày/animate state; transforms tạm trong scene không là model thứ hai. Khi animation hoàn thành, commit logic đúng một lần; reset/cancel không nhận callback stale. Quy tắc commit/cancel chi tiết sẽ được test ở Task 7.2–7.3.

Task 4.1 chốt một tài liệu quy ước mặt/trục, hướng quay, tâm màu và thứ tự serialization. Chưa chọn facelet/cubie representation trong ADR này. Adapter renderer/solver phải chuyển đổi theo cùng quy ước. State đủ 9 sticker mỗi màu chưa đủ hợp lệ; kiểm tra inventory/orientation/parity trước solver.

Tổ chức theo domain src/features/cube; thêm core/, adapters/, components/ khi có code thật. Chia sẻ helper qua src/lib khi có ít nhất nhu cầu dùng chung rõ ràng.

## Phương án khác

Gắn state vào mesh: khó test, dễ drift hình học. Dùng model của solver làm domain API trực tiếp: phụ thuộc thư viện khi chưa benchmark. Global store ngay từ đầu: chưa có nhu cầu; React/local controller đủ cho bước đầu.

## Hệ quả

Adapter thêm một lớp chuyển đổi nhưng giữ khả năng thay renderer/solver. Chưa chọn Zustand; chỉ đánh giá khi chia sẻ state gây khó khăn thực tế. Không thiết kế solver NxN từ model 3×3.

## Kiểm chứng và điều kiện xem xét lại

Task 4.x test move 4 lần, prime/double, inverse/round-trip và fixture chuẩn. Task 7.x đối chiếu scene/core sau queue/reset. Task 9.1b có fixture trạng thái bất khả thi.

## Nguồn trong repository

- [Kiến trúc hiện trạng](../architecture/current-state.md) (snapshot Task 2.1; CI đã bổ sung ở Task 2.2).
- [Đặc tả MVP](../product/mvp-spec.md).
- [Backlog](../product/implementation-backlog.md).
- [Cấu hình package](../../package.json), [Next](../../next.config.ts), [Vitest](../../vitest.config.mts), [CI](../../.github/workflows/ci.yml).
