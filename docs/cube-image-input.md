# Nhập ảnh 3×3 trước task 11

Theo lựa chọn của người dùng, ưu tiên tính năng này sau beta 10.3, trước 11.1. Camera trực tiếp (Tuần 24) dùng chung pipeline này: [cube-camera.md](./cube-camera.md). Bản này nhận sáu ảnh tĩnh để tạo bản nhập màu 3×3; không tự tìm khối trong cảnh, không suy ra sáu mặt từ một ảnh chụp ba mặt.

## Cách dùng

1. Trong `/practice`, nhấn **Nhập Rubik từ ảnh** ở đầu buổi tập để mở và đi đến **Nhập từ ảnh — 3×3** dưới hướng dẫn nhập màu.
2. Chọn ảnh U/R/F/D/L/B tương ứng tâm trắng/đỏ/xanh lá/vàng/cam/xanh dương. Ảnh cần thấy đủ một mặt, cùng điều kiện ánh sáng, tránh bóng đậm, lóa hoặc sticker che khuất. Giữ hướng theo mặt kề ghi trên UI; mặt B không phản chiếu.
3. Chọn mặt để chỉnh; đặt bốn góc bao quanh mép ngoài mặt theo thứ tự trên trái → trên phải → dưới phải → dưới trái. Chạm ảnh đặt góc đang chọn hoặc nhập X/Y %. Lưới đánh số 1–9 cho phép kiểm tra lấy mẫu. **Xoay thứ tự ô 90°** đổi cách đọc ô, không xoay file gốc.
4. Nhấn **Nhận màu từ sáu ảnh**. Tâm sáu mặt là mẫu hiệu chuẩn, không dùng bộ màu website để đoán. Nếu các tâm quá giống nhau hoặc không rõ, cần chọn/chỉnh ảnh khác. Mỗi ô lấy median của 25 điểm nhỏ bên trong ô, ánh xạ phối cảnh từ bốn góc; so khoảng cách CIELAB với mẫu tâm.
5. Xem sáu lưới kết quả. Ô tối, trong suốt, không đồng đều hoặc không đủ phân biệt được để trống; chọn màu sửa ngay trong preview. Các tâm cố định theo quy ước. Nhận dạng không chứng minh trạng thái có thể giải và có thể gán nhầm khi sai tâm/hướng hoặc khác ánh sáng.
6. Xác nhận đã kiểm tra tâm, hướng và màu rồi **Chuyển màu sang bản nhập**. Đây là thao tác thay bản nhập thủ công và vô hiệu lời giải cũ. Ô chưa rõ vẫn trống để sửa; ảnh chưa được dùng trực tiếp làm input solver. Mô hình/player giữ nguyên.
7. Dùng **Kiểm tra khối** hoặc **Giải bản nhập**: validation số ô/màu, cubie, flip/twist/parity hiện có vẫn là cổng bắt buộc. Sau khi có lời giải đã kiểm chứng mới nạp/phát bằng player.

**Bỏ ảnh mặt** hoặc **Xóa toàn bộ ảnh** chỉ bỏ ảnh và kết quả ảnh. Bản nhập thủ công đã chuyển không bị xóa. **Bắt đầu lại buổi tập** xóa cả ảnh và bản nhập. Rời trang/hide Activity hủy decode, xóa buffer/preview ảnh; bản nhập đã chuyển tuân theo lifecycle phiên hiện có. Tải lại không khôi phục ảnh.

## Giới hạn tệp, tài nguyên và riêng tư

Chỉ nhận JPEG, PNG, WebP có MIME và chữ ký tệp phù hợp, từ 1 byte đến 8 MiB; sau decode kiểm kích thước ít nhất 90×90 và tối đa 24 MP. SVG/GIF/HEIC cần chuyển định dạng. Decoder trình duyệt xử lý hướng EXIF; ảnh được rasterize và lưu cạnh dài tối đa 1024px để lấy mẫu. Giới hạn kích thước decoded được kiểm sau bước browser decode, không phải cam kết giới hạn peak memory của decoder bên trong trình duyệt.

Decode một tệp tại một thời điểm; file inputs bị khóa khi bận. Mỗi lần đọc có generation và AbortController. Xóa/reset/rời trang hủy đọc và bỏ kết quả cũ; callback muộn không khôi phục ảnh. Object URL được revoke cả khi thành công/lỗi/hủy. Tối đa sáu buffer raster và preview trong phiên; không lưu file gốc/EXIF hoặc tên file vào app state. Không có upload endpoint, cloud vision, token hoặc dependency nhận dạng mới. Ảnh chỉ được đọc trong browser; screenshot/trace do người debug tự lưu có thể chứa ảnh, không chia sẻ ảnh cá nhân trong report lỗi công khai.

Không cần WebGL cho upload/crop/nhận màu/nhập tay/giải. Player 3D vẫn cần WebGL. Tải ảnh tĩnh không yêu cầu quyền camera; chụp trực tiếp xin quyền riêng khi bấm Bật camera.

## Kiến trúc mở rộng

| Thành phần                       | Trách nhiệm                                                              | Tái sử dụng                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `features/puzzle-image/types.ts` | Pixel buffer, điểm, crop, cell polygon/sample points, face/profile       | Không biết URFDLB, CubeState hoặc solver                                        |
| `geometry.ts`                    | Kiểm quad lồi, projective mapping, grid NxN, xoay thứ tự 90°             | Grid 2/3/4/5/17 có test; profile dị hình cần sample points/biến đổi hướng riêng |
| `sampling.ts`, `color.ts`        | Median pixel patch, CIELAB, palette tham chiếu, kết quả chưa chắc chắn   | Không tự gắn color ID vào face puzzle                                           |
| `decode.ts`                      | Giới hạn, kiểm format, decode, raster resize, cleanup                    | Dùng lại cho mọi profile ảnh; camera sau này có thể cung cấp frame pixel        |
| `cube/image-input/profile.ts`    | Profile 3×3 với sáu mặt và chín cell mỗi mặt                             | Chỉ profile này được mở trên UI                                                 |
| `cube/image-input/adapter.ts`    | Sáu tâm → palette, fixed centers, recognized cells → immutable FaceDraft | Riêng 3×3, nối validation/core hiện có                                          |
| `image-input-panel.tsx`          | Upload/crop/review/xác nhận                                              | UI đang tối ưu cho sáu mặt vuông; không quảng bá nhận dạng puzzle khác          |

2×2/4×4/5×5 có thể dùng decoder, grid, sampling và classifier; cần adapter, cách hiệu chuẩn (không phải mọi NxN có tâm cố định), representation/validation và capability solver riêng. Pyraminx/Megaminx/Skewb cần profile chia ô và quy tắc hướng khác; Square-1 cần xử lý hình dạng theo trạng thái. Không cam kết chỉ đổi `N` là hỗ trợ mọi puzzle, cũng không phải viết lại toàn bộ pipeline.

cubing.js tiếp tục làm solver 3×3, không được dùng như image recognizer. Task 11.1 sẽ mô tả capability thật của từng puzzle; khả năng render/scramble/solve/image-input không được gộp thành một boolean.

## Kiểm chứng và mức tin cậy

Unit kiểm grid nhiều N, homography độc lập ở hình thang, quad sai, hướng/rotation, CIELAB, unknown colors, immutable draft, transparency, calibration không phân biệt, trạng thái đủ màu nhưng bất khả thi, chữ ký/size tệp và object-URL cleanup/hủy.

Playwright dùng PNG deterministic được encode từ pixel bằng Node zlib/CRC, không dùng code nhận dạng để tạo ảnh. Kiểm sáu ảnh → review → manual input → cubing solver thật → solved; sửa ô trong suốt; physical impossibility chặn Worker; file hỏng/không hỗ trợ; crop sai; thay/xóa ảnh bỏ kết quả cũ; fixture nghiêng/giảm sáng từ phép chiếu độc lập; xoay thứ tự; callback decode muộn. Chạy desktop và mobile viewport, gồm axe trên review mở. Toàn suite hiện có tiếp tục là gate CI.

Đây là cơ sở nhận ảnh có người kiểm tra lại. Chưa có corpus ảnh Rubik thật với nhiều thiết bị/ánh sáng, ảnh EXIF từ điện thoại hoặc thống kê precision/recall; không gán kết quả synthetic thành độ chính xác ảnh thực. Cần thu ảnh thực có phép sử dụng và ghi lỗi trước khi bỏ bước duyệt tay hoặc quảng bá tự nhận dạng hoàn toàn.

Kết quả local: 764 unit tests và 12/12 E2E riêng cho ảnh đạt trên Chromium desktop/mobile viewport; đã xem ảnh crop/review ở 360px. Toàn bộ 34 E2E (gồm bộ beta/luyện tập hiện có) tiếp tục chạy trong Quality checks của PR.
