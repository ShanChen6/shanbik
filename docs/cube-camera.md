# Quét Rubik bằng camera — Tuần 24

Camera trực tiếp là **một nguồn ảnh nữa** cho [Nhập từ ảnh — 3×3](./cube-image-input.md). Mỗi lần chụp tạo một ảnh như ảnh tải lên, rồi đi qua cùng các bước: chỉnh bốn góc, nhận màu, sửa màu và xác nhận. Màu không bao giờ tự đi thẳng vào solver.

## Cách dùng

1. `/practice` → **Nhập Rubik từ ảnh** → phần **Chụp bằng camera** → **Bật camera**.
2. Trình duyệt hỏi quyền. App ưu tiên camera sau (`facingMode: environment`) và không xin micro. Nếu máy có nhiều camera, chọn trong **Camera**.
3. Đặt một mặt vừa khung vuông 3×3 trên hình, nhìn thẳng, đủ sáng. **Mặt sẽ chụp** tự chọn mặt chưa có theo thứ tự U/R/F/D/L/B; muốn chụp lại thì chọn mặt đó. Hướng của mặt ghi ngay dưới khung.
4. **Chụp mặt X**: khung hình được chép vào canvas (cạnh dài tối đa 1024px). Bốn góc mặc định là khung vuông trên màn hình, có thể chỉnh như ảnh tải lên.
5. Chụp đủ sáu mặt thì camera tự tắt. Bấm **Nhận màu từ sáu ảnh**, kiểm tra, sửa, xác nhận rồi chuyển sang bản nhập.

## Vòng đời stream (24.1)

`createCameraSession` (`src/features/puzzle-image/camera.ts`) chỉ giữ một stream tại một thời điểm:

- Đổi camera: dừng track cũ rồi mới mở camera mới (`deviceId: exact`).
- Stream trả về **sau khi** đã bấm tắt, đổi camera hoặc rời trang thì bị dừng ngay, không bao giờ treo đèn camera.
- Component dừng stream khi: unmount/rời route (kể cả khi Next ẩn route), tab bị ẩn (`visibilitychange`), đóng phần "Nhập từ ảnh", chụp đủ sáu mặt, hoặc track tự `ended` (rút camera, hệ điều hành thu quyền). Mỗi trường hợp có thông báo nói rõ camera đã tắt.
- Không ghi hình, không lưu frame ngoài sáu ảnh đã chụp trong phiên, không tải lên.

## Lỗi và phương án dự phòng

| Tình huống                                               | Thông báo / xử lý                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Không có `navigator.mediaDevices` (HTTP, trình duyệt cũ) | Báo cần HTTPS/trình duyệt hỗ trợ; vẫn chọn ảnh hoặc nhập tay được       |
| `NotAllowedError`/`SecurityError` (từ chối quyền)        | Hướng dẫn mở quyền trong cài đặt trang; vẫn chọn ảnh hoặc nhập tay được |
| `NotFoundError`/`OverconstrainedError`                   | Không có camera phù hợp; chọn camera khác hoặc dùng ảnh                 |
| `NotReadableError`/`AbortError`                          | Camera đang bị ứng dụng khác dùng                                       |
| Frame chưa sẵn sàng (< 90px)                             | "Camera chưa sẵn sàng", chụp lại                                        |

## Màu 9 ô (24.2)

Dùng lại pipeline Canvas/ImageData hiện có: median 25 điểm mỗi ô, CIELAB, tâm sáu mặt làm mẫu màu. **Chưa dùng OpenCV.js**: pipeline hiện tại chạy ngay trên canvas, không thêm khoảng 8 MB tải xuống. Chỉ cân nhắc OpenCV sau khi có benchmark với ảnh thật cho thấy cần (ví dụ tự tìm khối trong cảnh).

`assessFrame` kiểm tra nhanh độ sáng trong khung (lưới 24×24) và **chỉ cảnh báo**: quá tối, quá sáng, lóa (trên 8% điểm gần trắng tuyệt đối). Không cảnh báo "ít tương phản", vì một mặt đã giải chỉ có một màu là hợp lệ. Ô không chắc chắn vẫn để trống như với ảnh tải lên, và người dùng phải tick xác nhận trước khi chuyển.

## Kiểm chứng (24.3)

- Unit: ánh xạ lỗi quyền, ràng buộc camera, đổi camera dừng stream cũ, stream đến muộn sau khi tắt bị dừng, liệt kê thiết bị, khung dẫn hướng, đánh giá ánh sáng, giới hạn kích thước khung.
- E2E (Chromium desktop và mobile viewport): `getUserMedia` giả trả về stream từ canvas do test vẽ.
  - Chụp sáu mặt cho ra màu đúng từng ô và chuyển 54/54 ô.
  - Camera tự tắt khi chụp xong; axe không có vi phạm khi camera đang bật.
  - Từ chối quyền hoặc không có `mediaDevices` đều có thông báo, phần chọn ảnh vẫn dùng được.
  - Đổi camera; ánh sáng yếu được cảnh báo.
  - Ẩn tab, đóng panel và rời route đều dừng track (`readyState === "ended"`).
- Chưa kiểm trên điện thoại thật và ánh sáng thật; giới hạn độ chính xác như phần ảnh tĩnh vẫn áp dụng.
