# Prompt khởi động ShanBik trong Codex

Dán prompt này vào Codex sau khi đã tạo repository trống, clone về máy và mở đúng thư mục repo.

```text
Tôi bắt đầu dự án ShanBik từ repository mới, chưa có ứng dụng. Hãy đọc `docs/roadmap/ROADMAP.md` và tài liệu hướng dẫn trong `docs/roadmap/` trước khi làm việc.

Trong lượt này, chỉ thực hiện Task 0 — khởi tạo nền tảng repo. Không triển khai các task roadmap khác.

## Bước đầu
1. Kiểm tra thư mục hiện tại, trạng thái Git, file đã tồn tại, phiên bản Node.js và package manager khả dụng.
2. Nếu repository có file khởi tạo hoặc cấu hình, hãy đọc và giữ lại phần phù hợp; không ghi đè mù quáng.
3. Nếu repo trống, khởi tạo ứng dụng Next.js App Router với TypeScript, Tailwind CSS và pnpm. Dùng các phiên bản ổn định, tương thích tại thời điểm triển khai và ghi phiên bản vào package manifest/lockfile.
4. Nếu pnpm hoặc công cụ cần thiết chưa có, báo rõ lệnh cài đặt cần chạy; không đổi sang npm/yarn âm thầm.

## Phạm vi Task 0
- Khởi tạo web app Next.js App Router, React, TypeScript, Tailwind CSS.
- Thiết lập lint, format, typecheck, test và build bằng công cụ tương thích với phiên bản Next.js đang dùng.
- Tạo cấu trúc thư mục ban đầu, không tạo code nghiệp vụ:
  - `src/app`
  - `src/components`
  - `src/features/cube`
  - `src/features/timer`
  - `src/features/learn`
  - `src/features/encyclopedia`
  - `src/features/competitions`
  - `src/features/account`
  - `src/lib`
  - `src/styles`
  - `docs/roadmap`
- Tạo trang chủ khung bằng tiếng Việt, tên “ShanBik”, mô tả đây là website học, mô phỏng và luyện tập Rubik, hiển thị trạng thái “Đang xây dựng”.
- Tạo `.env.example` chỉ khi cần; không tạo secret thật.
- Viết README hướng dẫn môi trường, cài đặt, dev, lint, typecheck, test, build và cấu trúc thư mục.
- Tạo `docs/architecture.md`, ghi: đây là website responsive; cube core tách khỏi UI và renderer; solver/backend/persistence chưa được quyết định; các domain dự kiến là cube, timer, learn, encyclopedia, competitions, account.
- Không cài Three.js/R3F, solver, Supabase/Firebase, thư viện nghiệp vụ hay backend trong Task 0.
- Không tạo monorepo.

## Tiêu chí hoàn thành
Chạy thật các lệnh lint, typecheck, test và build đã cấu hình. Nếu chưa thể chạy lệnh nào, nêu chính xác nguyên nhân và cách khắc phục. Không được báo pass nếu chưa chạy.

Kết thúc lượt bằng báo cáo:
1. Các file và cấu hình đã tạo.
2. Các lệnh chạy ứng dụng và kiểm tra.
3. Kết quả từng lệnh.
4. Các quyết định vẫn để mở.
5. Task tiếp theo là Task 1.1 trong roadmap.

Sau Task 0, dừng để tôi review. Không tự chuyển sang Task 1.
```

## Prompt dùng cho từng task tiếp theo

```text
Đọc `docs/roadmap/ROADMAP.md` và trạng thái repository hiện tại. Chỉ triển khai Task [ID — TÊN TASK] trong roadmap.

Trước khi sửa code:
- Kiểm tra các phần liên quan và xác nhận điều kiện tiên quyết của task.
- Nếu repo khác với giả định trong roadmap, ưu tiên sự thật trong repo và nêu khác biệt.
- Nếu thiếu quyết định kỹ thuật quan trọng, thực hiện đúng phạm vi spike/ADR của task; không tự mở rộng scope.

Trong khi triển khai:
- Chỉ làm mục tiêu của task này.
- Giữ thay đổi nhỏ, theo convention hiện có.
- Cập nhật tài liệu liên quan nếu hành vi hoặc quyết định thay đổi.
- Không thêm secret, không giả vờ đã chạy lệnh hoặc kiểm thử.

Trước khi kết thúc:
- Chạy kiểm tra phù hợp: lint, typecheck, unit test, build và/hoặc E2E theo tiêu chí task.
- Báo file đã sửa, cách kiểm tra, kết quả thật, giới hạn còn lại và task kế tiếp.
- Dừng tại đây để tôi review; không tự triển khai task tiếp theo.
```
