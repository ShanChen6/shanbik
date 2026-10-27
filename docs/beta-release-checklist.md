# Beta release và rollback — Task 10.3

Không merge/deploy từ checklist này. Người phụ trách phát hành duyệt bản build cụ thể sau khi PR task vào `develop`.

## Trước khi phát hành

- [ ] Ghi commit SHA của `develop`, PR phát hành `develop` → `main`, người duyệt và URL CI. Tất cả Quality checks phải xanh, gồm unit, build và production E2E.
- [ ] Xem [báo cáo beta](./reports/beta-readiness-2026-10-27.md), các lỗi ưu tiên và phạm vi trình duyệt đã kiểm tra. Không đổi nhãn thành hỗ trợ mọi trình duyệt.
- [ ] Chạy thử trên thiết bị mục tiêu thật: Android Chrome, iOS Safari; kiểm Firefox desktop và bàn phím/screen reader. Ghi phiên bản, kết quả và lỗi. Nếu chưa đạt, chỉ mời nhóm thử nghiệm giới hạn và công bố phạm vi Chromium đã kiểm chứng.
- [ ] Kiểm tra bằng URL preview Vercel của đúng commit: mở/reload `/`, `/learn`, `/help#quick-start`, `/practice`; light/dark, 320px và landscape; luồng scramble → lấy màu → solve → load/play → reset.
- [ ] Xác nhận framework Next.js, root repo, Node theo `.nvmrc`, pnpm theo `packageManager`; install frozen lockfile, build `pnpm build`, không cấu hình static export. Đọc `public/solver-worker/manifest.json` để đối chiếu cubing version trong output.
- [ ] Kiểm outer Worker/chunk/search-worker-entry cùng origin tải 200 và content type JS. Giữ license/notice/source maps của cubing.js trong output. Thử cancel/retry; không có solver asset tải trước khi giải input chưa solved.
- [ ] Không đưa `.env`, private key hoặc credentials vào source/artifact. Hiện MVP không cần secret, tài khoản hay database; không thêm biến môi trường giả để vượt build.
- [ ] Xác nhận required **Quality checks** trong GitHub ruleset/branch protection do chủ repo quản lý; `main` chỉ nhận PR từ `develop`. Workflow không tự bật bảo vệ nhánh.
- [ ] Ghi URL deployment hiện ổn định, commit và deployment mới dự kiến trước khi chuyển production. Hiển thị đúng giới hạn: 3×3, manual color input, không camera scan/timer/account/giáo trình CFOP.

## Sau khi phát hành

- [ ] Ghi thời điểm, commit, URL deployment và người thực hiện. Mở URL production trong session mới; xác nhận route/assets/Worker không 404.
- [ ] Smoke test thao tác bằng chuột/touch và bàn phím, solved/invalid, cancel/retry, play/rewind/reset. Kiểm console, network và fallback không WebGL.
- [ ] Ghi nhận phản hồi với browser/OS, bước tái hiện, loại khối và screenshot. Không yêu cầu mật khẩu/token/dữ liệu cá nhân.
- [ ] Thu thập số đo trên thiết bị thật trước khi cam kết hiệu năng; số đo local/CI không phải Core Web Vitals người dùng thật.

## Khi cần rollback

P0 (mất dữ liệu ngoài phạm vi đã mô tả, lộ dữ liệu, ứng dụng không mở) hoặc P1 (không thể giải/phát, kết quả sai, treo không hủy được, lỗi route/Worker trên phạm vi hỗ trợ) là lý do dừng rollout. Giữ lại commit/deployment ID, console/network error và trace tái hiện.

1. Dừng mời thêm người dùng; xác nhận lỗi nằm trong build mới và chọn deployment trước đã smoke-test.
2. Người có quyền hosting chuyển production về deployment ổn định trước đó trong Vercel. Không force-push/reset lịch sử `main` và không xóa deployment đang dùng làm chứng cứ.
3. Smoke-test lại route, Worker asset, luồng giải và reset trên URL production; ghi deployment thực tế đang phục vụ.
4. Mở nhánh sửa hoặc revert commit qua PR → `develop`, kiểm CI và phát hành lại theo PR `develop` → `main`. Nếu revert merge, người duyệt xác định đúng parent trước khi tạo thay đổi.
5. Ghi nguyên nhân, phạm vi ảnh hưởng và bài test hồi quy. MVP chưa có database nên không có migration rollback; draft/lịch sử là dữ liệu trong phiên và có thể mất khi reload/chuyển deployment.

Task này chỉ chuẩn bị và kiểm chứng repo; không tạo deployment, merge PR hoặc thay quyền GitHub/Vercel.
