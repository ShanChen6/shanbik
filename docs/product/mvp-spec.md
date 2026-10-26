# ShanBik — Đặc tả MVP

Trạng thái: bản đặc tả Task 1.1, chờ review sản phẩm. Đây là yêu cầu dự kiến; các tính năng bên dưới chưa được triển khai trong Task 1.1.

## 1. Mục tiêu

Giúp người dùng thao tác với khối 3×3 trên trình duyệt, nhập trạng thái khối thật bằng tay, nhận và phát lời giải để đối chiếu. Website responsive ưu tiên guest: không cần tài khoản để thực hiện luồng cốt lõi.

## 2. Nhóm người dùng

| Nhóm                  | Nhu cầu                                       | Luồng ưu tiên                                   |
| --------------------- | --------------------------------------------- | ----------------------------------------------- |
| Người mới             | Hiểu ký hiệu, xoay khối, xem từng bước giải   | Hướng dẫn nhanh → nhập trạng thái → giải → step |
| Cuber luyện tốc độ    | Có scramble và thao tác nhanh, tiến tới timer | Scramble → copy/thực hành; timer ở bản mở rộng  |
| Người khám phá puzzle | Hiểu phạm vi từng loại khối                   | 3×3 trước; bách khoa và puzzle khác sau MVP     |

Ưu tiên phát hành đầu là người mới sử dụng 3×3. Hai nhóm còn lại là định hướng phát triển, không làm tăng phạm vi beta tuần 10.

## 3. Ranh giới phát hành

Roadmap dùng từ MVP cho cả nền tảng 3×3 và công cụ học/luyện tập. Đặc tả này tách mốc để tránh mâu thuẫn lịch:

| Mốc                   | Phạm vi                                                                                     | Thời điểm roadmap |
| --------------------- | ------------------------------------------------------------------------------------------- | ----------------- |
| MVP 3×3 Beta          | Viewer, move, scramble, nhập tay, solver thử nghiệm, phát lời giải, hướng dẫn notation ngắn | Cuối tuần 10      |
| Learning & Timer Beta | Bài học đầy đủ, công thức, bách khoa, timer, lịch sử và thống kê                            | Tuần 11–17        |

Timer và thư viện công thức vẫn thuộc hướng sản phẩm đã thống nhất, nhưng không là điều kiện chặn beta 3×3 tuần 10.

## 4. Phạm vi MVP 3×3 Beta

| ID     | Năng lực         | Tiêu chí nghiệm thu sản phẩm                                                                                    |
| ------ | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| MVP-01 | Viewer 3×3       | Hiển thị màu mặt nhất quán; xoay camera/reset; báo rõ khi WebGL không khả dụng                                  |
| MVP-02 | Move và notation | Nhận U/D/L/R/F/B, prime, double turn; báo token lỗi; state và renderer khớp                                     |
| MVP-03 | Scramble         | Tạo, hiển thị, copy và phát scramble; không yêu cầu ngẫu nhiên chuẩn thi đấu trước khi thư viện được xác minh   |
| MVP-04 | Nhập tay         | Lưới sáu mặt, chọn/sửa màu, hướng dẫn thứ tự/hướng mặt; tâm cố định theo quy ước được xác lập khi làm cube core |
| MVP-05 | Validation       | Kiểm tra đầu vào hoàn chỉnh, số lượng màu và tính khả thi của khối; đủ 9 sticker/màu chưa đủ để kết luận hợp lệ |
| MVP-06 | Solver 3×3       | Giải trạng thái hợp lệ ngoài main thread; lời giải khi áp dụng phải về solved; báo lỗi có thể xử lý             |
| MVP-07 | Solution player  | Play/pause/step/rewind/reset; đánh dấu move hiện tại và tổng số bước; không làm mất trạng thái gốc              |
| MVP-08 | Hướng dẫn nhanh  | Giải thích mặt, notation, nhập tay và cách dùng player bằng tiếng Việt                                          |

Solver tự động cung cấp chuỗi move hợp lệ; không cam kết lời giải tối ưu, CFOP hoặc giải thích sư phạm từng bước. Phát từng move là năng lực khác với giảng giải phương pháp giải.

## 5. Ngoài beta 3×3

- Camera/nhận diện màu; solver luôn có luồng nhập tay độc lập.
- Đăng nhập, cloud sync, quản trị và giải đấu.
- 2×2, NxN, Pyraminx, Megaminx và solver cho các puzzle này.
- Timer, penalty, session, thống kê và bài học/công thức đầy đủ: theo mốc tuần 11–17.
- Smart cube/Bluetooth, thi đấu thời gian thực, thanh toán và native app.
- Cam kết offline đầy đủ hoặc chuẩn scramble thi đấu khi chưa xác minh.

## 6. User stories

| ID    | Với vai trò / mong muốn                             | Điều kiện hoàn thành                                                                   |
| ----- | --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| US-01 | Người mới muốn đọc ký hiệu trước khi thao tác       | Có hướng dẫn U/D/L/R/F/B, prime, double và quy ước hướng nhìn                          |
| US-02 | Người dùng muốn phát một thuật toán                 | Input hợp lệ chạy đúng; input sai không thay đổi cube                                  |
| US-03 | Người dùng muốn tạo và copy scramble                | Có phản hồi copy thành công/thất bại, không báo thành công khi clipboard bị chặn       |
| US-04 | Người dùng có cube thật muốn nhập sáu mặt           | Có thể sửa sticker trước khi giải; không cần camera hoặc đăng nhập                     |
| US-05 | Người dùng muốn biết trạng thái nhập sai            | Lỗi thiếu màu/sai cấu trúc/bất khả thi được phân biệt khi có thể; input vẫn giữ để sửa |
| US-06 | Người dùng muốn nhận lời giải                       | Có loading/error/success; không khóa UI; đã solved không sinh thao tác giả             |
| US-07 | Người mới muốn xem từng move                        | Step tiến/lùi, pause và reset giữ state/list/viewer đồng bộ                            |
| US-08 | Người dùng điện thoại muốn thao tác không cần hover | Nút dễ chạm, không tràn ngang; có lựa chọn thay cho gesture                            |

## 7. User flows

### A. Mô phỏng và scramble

1. Mở màn luyện tập với cube solved và góc nhìn mặc định.
2. Tạo scramble → hiển thị chuỗi trước khi áp dụng.
3. Copy hoặc phát chuỗi; player chỉ cho phép thao tác hợp lệ theo trạng thái queue.
4. Pause/step/rewind hoặc reset về trạng thái đầu chuỗi.
5. Reset toàn bộ về solved phải là thao tác riêng có nhãn rõ, không nhầm với reset player.

### B. Nhập cube thật → giải

1. Mở nhập tay → xem hướng dẫn thứ tự mặt và hướng giữ khối.
2. Nhập sáu mặt → sửa các ô màu.
3. Validate: thiếu/sai → giữ input, chỉ lỗi, quay lại chỉnh sửa.
4. State bất khả thi → không gọi solver tiếp; hướng dẫn kiểm tra nhập màu/hướng mặt.
5. State hợp lệ → gửi snapshot vào Worker, hiển thị đang giải.
6. Đã solved → thông báo đã hoàn thành; không hiển thị lời giải giả.
7. Solver lỗi/timeout → thông báo và thử lại; giữ snapshot/input.
8. Có lời giải → kiểm tra solution đưa snapshot về solved trước khi hiển thị thành công.
9. Phát từng move hoặc toàn bộ; reset player trở về snapshot ban đầu.

Nếu người dùng sửa input trong lúc giải, kết quả cũ phải bị hủy hoặc bỏ qua theo request ID. Nếu đổi trạng thái cube, không phát lời giải của trạng thái trước.

### C. Lỗi khả năng trình duyệt

- WebGL không hoạt động: thông báo rõ, không để canvas trắng; vẫn truy cập hướng dẫn/nhập tay nếu không phụ thuộc viewer.
- Clipboard bị từ chối: cho chọn/sao chép chuỗi bằng tay.
- Worker/solver không khởi tạo được: cho thử lại và giữ input; không chạy giải nặng trên main thread làm fallback âm thầm.
- Rời màn hình: dừng animation và giải phóng tài nguyên; không nhận kết quả Worker cũ vào màn mới.

## 8. UX, accessibility và dữ liệu

- Kiểm tra mobile 360 px, tablet, desktop; landscape và zoom 200% không làm mất thao tác cốt lõi.
- Touch target mục tiêu tối thiểu 44×44 CSS px; focus nhìn rõ; controls có nhãn và dùng bằng bàn phím.
- Không dùng màu làm tín hiệu duy nhất cho lỗi/trạng thái. Sticker có nhãn mặt/vị trí/màu cho công nghệ hỗ trợ khi triển khai nhập tay.
- Tôn trọng reduced motion; viewer có controls thay cho gesture.
- UI beta bằng tiếng Việt; i18n chưa nằm trong task/mốc này.
- State hiện tại thuộc phiên sử dụng; không cam kết khôi phục sau reload trong beta 3×3. Chuyển trang/reset làm mất input phải có nhãn/cảnh báo phù hợp.
- Chưa cần thu dữ liệu cá nhân hoặc tạo tài khoản. Camera không thuộc MVP; không gửi ảnh/video.

## 9. Định nghĩa thành công và cách đo

Các giá trị dưới đây là mục tiêu nghiệm thu đề xuất, chưa phải kết quả đo thực tế.

| Tiêu chí              | Mục tiêu                                                                   | Cách kiểm tra                                                   |
| --------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Độ đúng solver/player | 100% solution trong bộ fixture hợp lệ đưa về solved                        | Áp dụng solution bằng core độc lập, đối chiếu renderer          |
| Validation            | Tất cả fixture bất khả thi/thiếu màu bị từ chối                            | Fixture âm có parity/orientation lỗi khi representation đã chốt |
| Luồng chính           | Không còn lỗi P0/P1 chưa xử lý ở luồng B                                   | Regression trên browser/thiết bị đại diện                       |
| Usability             | Ít nhất 4/5 người thử hoàn tất nhập → giải → step với hướng dẫn có sẵn     | Phiên thử có ghi thời gian, vướng mắc và số lần cần hỗ trợ      |
| Responsive            | Hoàn tất luồng chính ở 360 px và desktop, không tràn ngang                 | Kiểm tra thủ công + E2E phù hợp                                 |
| Nội dung              | LCP mục tiêu <2,5 giây trên trang hướng dẫn ở mạng/thiết bị đo được ghi rõ | Lighthouse hoặc công cụ tương đương; không suy ra từ máy dev    |
| Độ phản hồi solver    | Không chặn UI; loading có phản hồi và lỗi có đường thử lại                 | Benchmark Worker trên điện thoại tầm trung ở Task 9.2           |

Ngưỡng timeout, số fixture và thời lượng animation phải chốt sau benchmark, trước nghiệm thu solver/player. Không cam kết FPS hoặc thời gian giải khi chưa có đo thực tế.

## 10. Giả định, quyết định mở và rủi ro

- Renderer, solver và storage chưa chốt; Task 1.1 không lựa chọn thư viện.
- Quy ước mặt, màu tâm, thứ tự serialization phải có một nguồn sự thật ở cube core; adapter solver và renderer cùng tuân theo.
- Scramble là chuỗi có kiểm chứng; tiêu chuẩn random-state/thi đấu cần được xác minh riêng trước khi quảng bá.
- Solver phải phát hiện cả trạng thái sai cấu trúc lẫn bất khả thi; không chỉ đếm màu.
- Nội dung “hướng dẫn nhanh” ở beta không bao gồm toàn bộ giáo trình tuần 12.
- Camera chịu ánh sáng/phản chiếu; tính năng sau MVP luôn có bước sửa tay.
- Trạng thái render, scramble, solve phải tách riêng khi mở rộng puzzle.

## 11. Checklist review Task 1.1

- [x] Có mục tiêu, ba nhóm người dùng và ưu tiên phát hành.
- [x] Có phạm vi beta 3×3 và ranh giới với Learning & Timer Beta.
- [x] Có user stories cùng điều kiện hoàn thành.
- [x] Có luồng chuẩn, validation và lỗi tài nguyên trình duyệt.
- [x] Có tiêu chí đo, cách đo và các ngưỡng còn mở.
- [x] Camera được phân biệt rõ với solver nhập tay.
- [x] Chưa triển khai UI hay logic ứng dụng.

Bước tiếp theo: Task 1.2 chuyển đặc tả thành backlog có phụ thuộc và acceptance criteria chi tiết; chưa thực hiện trong tài liệu này.
