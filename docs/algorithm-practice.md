# Tuần 14 — Thực hành thuật toán

## Truy cập và phạm vi

Mở `/algorithms`, chọn **Minh họa** trên công thức để thực hành. Đây là phần mở rộng preview của tuần 13, không thay đổi khối practice/solver hay bài học.

- 14.1: danh sách nước đồng bộ viewer, đánh dấu nước đang chạy hoặc cuối cùng đã hoàn tất, play/pause/step/seek. Thanh vị trí và nút từng nước đều chọn trạng thái **sau** nước đó. Vị trí 0 là mẫu ban đầu.
- 14.2: tốc độ 0.5×/1×/1.5×/2×, đảo thuật toán, số lượt 1–10 trong giới hạn 256 nước, ghi chú 2000 ký tự và checkbox hoàn thành do người dùng tự chọn.

Dùng Tab/Enter trên nút, phím mũi tên và Home/End trên range. Không bắt phím toàn trang; gõ ghi chú không phát/dừng khối. Touch dùng control native và nút đủ lớn. Danh sách cuộn trong khung riêng để giữ nước hiện tại nhìn thấy, không kéo trang theo từng nước.

## Đồng bộ và hủy animation

Move queue là nguồn duy nhất của cube, cursor và active move. `seekPlayback(n)` dựng đúng prefix từ baseline, dừng phát và bỏ nước đang xoay, không commit nửa nước. Callback có ID cũ bị bỏ qua. Play tiếp từ cursor; step backward hoàn tác đúng nước trước, reset về baseline hiện tại. UI không giữ cursor riêng hoặc đếm nước bằng timer.

Tạm dừng để nước hiện tại hoàn tất. Nhãn đang xoay chỉ tới nước active, kể cả khi hoàn tác; sau khi dừng/seek, đánh dấu nước cuối của prefix đã commit. Sơ đồ 2D hiện tại chỉ thể hiện các nước đã xong, không thể hiện góc xoay giữa animation.

Thời lượng mặc định 360 ms/nước. Tốc độ đổi duration cho nước tiếp theo; nước đang chạy giữ duration đã chốt theo ID để tránh nhảy góc. Viewer/lesson/practice khác giữ mặc định nếu không truyền tùy chọn. Reduced motion commit ngay với thứ tự và endpoint không đổi.

## Đảo và lặp

Một lượt xuôi bắt đầu từ inverse của công thức áp lên solved, nên kết thúc solved. Chiều đảo bắt đầu solved và áp chuỗi đảo (đảo thứ tự + đảo từng move), về mẫu của chiều xuôi. Mỗi lượt lặp **nối tiếp trên khối hiện tại**, không reset giữa lượt; nhiều lượt không nhất thiết kết thúc solved.

Chuỗi lặp hữu hạn, tối đa min(10, floor(256 / số nước công thức)). Không dùng vòng lặp vô hạn hay effect tự play, vì reduced motion phải kết thúc hữu hạn. Đổi chiều/số lượt tạo player mới từ đúng baseline và dừng; đổi công thức/đóng/lọc/unmount hủy player cũ. Mở lại luôn paused tại 0, không autoplay hay khôi phục góc giữa nước.

## Ghi chú và hoàn thành local

Key `shanbik:algorithm-practice:${formula.id}:v1`, record `{version:1,notation,settings:{speed,direction,repeat,note,completed}}`. Tách khỏi favorites và lesson progress. Ghi khi người dùng sửa, sau bước đọc storage; không ghi mặc định đè dữ liệu trước hydration. Checkbox không tự bật khi phát hết hoặc seek tới cuối.

Validator kiểm tra schema, notation hiện tại, kiểu/range, độ dài ghi chú và giới hạn chuỗi. JSON lỗi/version khác/notation đã đổi/quá lớn bị bỏ qua và thông báo, không tự ghi đè trước thao tác người dùng. Đọc/ghi/xóa bị chặn hoặc hết quota vẫn giữ thay đổi trong bộ nhớ và báo không lưu được. Store đóng/mở an toàn với StrictMode, từ chối update sau close.

Xóa dữ liệu chỉ remove key công thức hiện tại, đưa tùy chọn và player về mặc định, ghi chú rỗng và completion false. Không xóa favorites, theme hoặc lesson. Dữ liệu cùng origin/trình duyệt, không đồng bộ tài khoản/tab đang mở; lần ghi cuối thắng, reload đọc lại. Không lưu cursor, trạng thái khối hoặc animation.

## Fallback

Không có WebGL/mất context: dừng animation, giữ ghi chú và tùy chọn. Seek và step vẫn dùng được để xem trạng thái 2D; chỉ phát animation liên tục cần 3D sẵn sàng. Tải lại để thử khởi tạo 3D lại.

## Kiểm tra

Unit: seek prefix xuôi/đảo/lặp, atomic reject, callback cũ, step sau seek, reduced motion, endpoint/baseline, thang tốc độ, dữ liệu sai/notation khác/storage lỗi, cách ly key và không tự completion.

E2E desktop/mobile: đối chiếu đủ 54 sticker của sơ đồ hiện tại với core sau seek/step/back, bàn phím range, seek cắt nước đang chạy, đảo/lặp không autoplay, restore note/completion/options, clear không xóa favorites, fallback storage/WebGL và mất context. Chạy lại toàn bộ suite để bảo vệ viewer, lessons, solver, nhập ảnh và các luồng cũ.

Task tiếp theo: **15.1 — Timer state machine**. Feature branch → PR develop để review; không tự merge vào main.
