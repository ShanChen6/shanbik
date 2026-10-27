# 12.2 — Giao diện bài học

## Mở bài mẫu

Trang `/learn` có CTA **Bắt đầu bài U và U′** và danh sách bài đã xuất bản. Bách khoa `/puzzles/3x3` cũng liên kết bài tại mục Bài học liên quan.

Bài đầu: `/learn/lessons/lam-quen-u-va-u-prime`. Sample chuyển từ draft sang published sau schema 12.1; contentVersion giữ 1 vì nội dung bước/trạng thái không đổi.

- Mục tiêu, điều kiện khởi đầu và hướng giữ khối được ghi trước phần bước.
- Ba bước: quan sát → U → U′. Observe không hiển thị thuật toán giả.
- Mỗi bước có hướng dẫn, mục tiêu liên quan, thuật toán khi có moves và sơ đồ sáu mặt trước/sau từ snapshot đã validate.
- Sơ đồ là HTML/CSS 2D đọc theo hàng, màu cùng chữ viết tắt/nhãn đầy đủ cho assistive technology. Hoạt động không cần canvas, WebGL, solver hoặc camera.
- Desktop có danh sách bước; mobile dùng select gọn để phần hướng dẫn không bị đẩy xuống khi bài có nhiều bước. Bước trước/tiếp bị vô hiệu đúng biên, Về đầu bài đưa về bước đầu. Bước cuối không tự đánh dấu đã đạt kỹ năng.

## URL và khả năng tiếp cận

`?step=turn-u#lesson-step` dùng step ID ổn định. Vị trí trên URL phục vụ điều hướng/chia sẻ; chưa có completion tracking hoặc localStorage tiến độ. Reload/Back/Forward giữ bước theo URL. Param sai hoặc không thuộc bài về bước đầu và có thông báo; không đọc thuật toán, URL đích hay state từ query.

Thay bước focus heading hiện tại rồi đưa vùng nội dung vào khung nhìn, không bắt global keyboard shortcuts. Links/select/native disabled buttons hoạt động bằng bàn phím; sidebar dùng aria-current=step. Màu có mã viết tắt, nhãn vị trí và tên màu; nội dung không dựa vào màu riêng lẻ.

Server page có metadata/title/description riêng, `generateStaticParams` từ published catalog và `ensureStatic='navigation'` để cold unknown slug trả HTTP 404. UI client đọc query trong Suspense; mục tiêu và giới thiệu ở server. Public route chỉ dùng `getPublishedLesson`, không dùng lookup gồm draft. Schema vẫn kiểm trước/sau bằng core khi catalog được import.

## Publication và bách khoa

`publication.ts` là manifest nhẹ id/slug/puzzle/title/href để bách khoa không phải import core/validator/nội dung bước vào explorer client. Unit test yêu cầu manifest khớp catalog đã validate và published. Bách khoa chỉ cho relatedLessons trỏ đúng manifest và yêu cầu capability lessons phù hợp với số bài có thật.

Hiện chỉ 3×3 có một bài đọc từng bước. Capability note ghi rõ sơ đồ 2D và chưa có lesson player/progress. Không làm available lessons cho puzzle khác. Khi thêm bài: soạn/validate source, publish đúng nội dung, cập nhật manifest và test cùng route; không tạo liên kết nháp.

## Kiểm chứng

852 unit tests: giữ các cổng schema/transition/prerequisite và cập nhật publication; thêm test đồng bộ manifest, lookup, step ID/link, param sai và boundary index. 6/6 Playwright riêng cho lesson đã đạt local trên Chromium desktop/mobile:

1. Trang học → bài mẫu → observe/U/U′ → previous/start; kiểm focus, boundary và màu mặt R sau U.
2. Deep link/select/reload/history, fallback invalid step và cold 404 slug lạ.
3. Không WebGL, không solver asset/canvas; 320/360/768/1280px không overflow; axe WCAG 2/2.1 A/AA ở dark mode; mở bài qua bách khoa.

Ma trận beta bổ sung route lesson trong light/dark; toàn bộ 48 E2E hiện có chạy trong Quality checks. Đây là kiểm tra Chromium và mobile viewport, chưa xác nhận screen reader/thiết bị thật hoặc đa trình duyệt.

Task 12.3 sẽ nối viewer minh họa và lưu vị trí học cục bộ với contentVersion. Task 12.2 không tự giải khối, không tác động practice player đang chơi và không ghi completion giả.
