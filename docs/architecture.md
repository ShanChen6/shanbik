# Kiến trúc khởi đầu

ShanBik là website responsive dùng Next.js App Router, React, TypeScript và Tailwind CSS; sử dụng pnpm. Phiên bản cụ thể nằm trong package.json và pnpm-lock.yaml.

## Ranh giới

- `src/app`: route, layout, metadata.
- `src/components`: UI dùng chung.
- `src/features`: cube, timer, learn, encyclopedia, competitions, account.
- `src/lib`: tiện ích chung; `src/styles`: style dùng chung sau này.
- Cube core phải chạy độc lập với React, DOM và renderer 3D.
- UI gọi adapter; không trộn mô hình puzzle với scene.

## Quyết định còn mở

Renderer 3D, solver, backend, authentication và persistence sẽ được đánh giá ở task tương ứng. Chưa cài các dịch vụ này trong Task 0.

## Kiểm tra

Vitest cấu hình Node, cho phép chưa có test trong Task 0. Các test hành vi cube sẽ bổ sung khi triển khai logic nghiệp vụ. Không coi lệnh test hiện tại là bằng chứng đúng của tính năng chưa xây dựng.

## Git

Tạo nhánh công việc từ develop, PR vào develop, kiểm thử tích hợp trước khi PR develop vào main. Xem CONTRIBUTING.md.
