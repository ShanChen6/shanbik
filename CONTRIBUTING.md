# Quy trình nhánh và kiểm tra

## Nhánh

- `main`: phiên bản ổn định; chỉ nhận thay đổi đã được kiểm tra trên `develop`.
- `develop`: nhánh tích hợp chung; các tính năng đã hoàn thành task được đưa vào đây để kiểm tra.
- `feature/<ten-task>`: nhánh cho một task hoặc thay đổi nhỏ.
- `fix/<ten-loi>`: nhánh sửa lỗi.

## Luồng thay đổi

1. Tạo nhánh công việc từ `develop`.
2. Thực hiện một task nhỏ, chạy kiểm tra phù hợp và mở Pull Request từ nhánh công việc vào `develop`.
3. Review diff, xác nhận tiêu chí nghiệm thu, CI và các kiểm tra thủ công liên quan trước khi merge vào `develop`.
4. Kiểm thử tích hợp trên `develop`. Không đưa thay đổi chưa đạt kiểm tra sang `main`.
5. Khi đủ điều kiện phát hành, mở Pull Request từ `develop` vào `main`; chỉ merge sau khi CI và review phát hành đạt.

Không merge trực tiếp từ nhánh feature/fix vào `main`. Không force-push lên `main` hoặc `develop`.

## Checklist Pull Request vào develop

- [ ] PR có phạm vi nhỏ và mô tả task/issue liên quan.
- [ ] Tiêu chí nghiệm thu của task đã được kiểm tra.
- [ ] Lint, typecheck, unit test và build đạt (nêu rõ lệnh/kết quả).
- [ ] E2E hoặc kiểm tra thủ công đã chạy khi task có thay đổi luồng UI.
- [ ] Không có secret hoặc dữ liệu nhạy cảm trong diff.
- [ ] UI đã kiểm tra ở viewport phù hợp, nếu có thay đổi giao diện.

## Checklist phát hành develop → main

- [ ] Các thay đổi đã được tích hợp và kiểm thử trên `develop`.
- [ ] CI xanh trên commit dự kiến phát hành.
- [ ] Không còn lỗi P0/P1 chưa có phương án xử lý.
- [ ] Migration, cấu hình môi trường và rollback đã được xem xét.
- [ ] PR nguồn là `develop`; không nhận nhánh feature/fix trực tiếp.

## Bảo vệ nhánh trên GitHub

Để GitHub bắt buộc tuân theo quy trình này, chủ repo cần bật Branch protection rules hoặc Rulesets cho `develop` và `main`:

- Require a pull request before merging.
- Require status checks to pass trước khi merge (sau khi đã có CI checks).
- Chặn force push và xóa nhánh.
- Với `main`, yêu cầu PR có base là `main` và source là `develop`; kiểm tra điều này trong review phát hành.

Kết nối GitHub hiện tại cho phép tạo nhánh và file nhưng không cung cấp thao tác ghi Branch protection/Rulesets. Vì vậy các quy tắc bảo vệ bắt buộc cần được bật trong Settings của repository.
