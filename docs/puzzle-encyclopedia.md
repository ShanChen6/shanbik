# Tuần 11 — Bách khoa puzzle (11.1–11.3)

> Cập nhật 12.2: 3×3 đã có một bài đọc từng bước với sơ đồ 2D. Capability lessons và relatedLessons được nối với manifest bài đã xuất bản; các puzzle khác vẫn chưa có bài học. Xem [lesson UI](./lesson-ui.md).

## Phạm vi

Triển khai cả ba task tuần 11: schema/dữ liệu, danh sách search/filter và trang chi tiết. Tám entry: 3×3, 2×2, 4×4, 5×5, Pyraminx, Megaminx, Skewb, Square-1. Đây là bách khoa nội dung, không mở thêm viewer/solver/image adapter cho các puzzle khác.

Mở **Bách khoa** trong header/footer hoặc `/puzzles`. Chọn tên puzzle để đọc `/puzzles/[slug]`. Các mục khác 3×3 không dẫn đến player 3×3 như một cách thay thế.

## 11.1 — Schema và nguồn dữ liệu

`src/features/encyclopedia/schema.ts` xác định name, slug, aliases, shape, layers, difficulty, summary, paragraphs, notation/source, related reading/lessons và các capability độc lập: viewer, scramble, solver, imageInput, player, lessons.

`parseCatalog(unknown)` chạy khi import/build, kiểm kiểu/enum, slug duy nhất, layer nguyên hợp lệ và hình dạng tương ứng, nội dung bắt buộc, HTTPS nguồn notation, liên kết nội bộ có thật và đủ các capability. Dữ liệu được clone/freeze sâu. Typo, nội dung thiếu và claim chưa có implementation làm build/test thất bại. Hiện chỉ 3×3 được phép đánh dấu available; lessons của mọi entry đều unavailable vì task 12 chưa triển khai. Khi nối một puzzle/lesson mới, cập nhật cả binding guard và tests cùng implementation, không chỉ đổi trạng thái trong data.

`layers` là N của một mặt lưới NxN, không phải số tầng cơ học chung cho mọi puzzle. Pyraminx/Megaminx/Square-1 và Skewb có `null`; Skewb có hình lập phương nhưng không được gán nhầm là khối 2×2/3×3. Difficulty là phân loại biên tập để tham khảo học, có thông báo trên UI; không phải tiêu chuẩn WCA hoặc thứ hạng toán học.

Nguồn ký hiệu: [WCA Article 12](https://www.worldcubeassociation.org/regulations/#article-12-notation), các mục 12a/12c/12d/12e/12h, kiểm tra ngày 27/10/2026 (bản trang ghi April 1, 2026). Các ví dụ là token minh họa, không phải lời giải hay scramble chính thức. Grammar parser 3×3 của ShanBik vẫn giữ nguyên; không parse ví dụ Pyraminx/Megaminx/Square-1 bằng core 3×3. Mô tả giới thiệu và mức độ là nội dung biên tập ngắn, không sao chép giáo trình bên ngoài.

## 11.2 — Search/filter và URL

`filters.ts` là logic thuần: tìm theo tên/alias/mô tả ngắn, không phân biệt chữ hoa và dấu tiếng Việt; chuẩn hóa ×/x và khoảng trắng quanh x. Bộ lọc hình dạng, độ khó, N kết hợp AND. `layers=other` là nhóm không áp dụng lưới NxN. Query text giới hạn 80 ký tự; enum/layer sai bỏ qua, param lặp dùng giá trị đầu. Thứ tự serialize cố định q/shape/difficulty/layers; không đọc returnTo hoặc URL điều hướng tùy ý.

Ví dụ:

- `/puzzles?q=3+x+3`
- `/puzzles?shape=cube&difficulty=intermediate`
- `/puzzles?layers=other`

Desktop dùng sidebar; mobile dùng Radix sheet có title/description/focus trap và Escape. Người dùng áp dụng rõ ràng; đóng/cancel bỏ lựa chọn chưa áp dụng. Resize lên desktop đóng sheet. Submit search/filter, reset và link nội bộ dùng Next navigation; không reload document. Back/Forward/reload/deep link khôi phục bộ lọc từ URL. Link chi tiết mang theo query đã được chuẩn hóa, để **Về danh sách puzzle** giữ bộ lọc; mở chi tiết trực tiếp trở về danh sách không lọc. Zero result có giải thích và đường xóa filter; không tạo card giả.

`/puzzles` là trang giới thiệu server cùng client explorer trong Suspense theo hướng dẫn Next hiện cài. Fallback thông báo đang đọc query thực tế. Không thêm API, database, dependency hoặc skeleton dữ liệu giả. Bách khoa không import scene/solver/decoder; truy cập trang không tạo search Worker.

## 11.3 — Chi tiết, capability và metadata

Tám slug được `generateStaticParams` đưa vào build. Params là Promise theo Next hiện cài. `generateMetadata` tạo title, description và OG title/description riêng từ data. `ensureStatic = "navigation"` giữ toàn bộ server output tĩnh và chờ kết quả với slug chưa prerender, tránh trả shell HTTP 200 trước khi biết slug không tồn tại. Slug lạ gọi `notFound`, không redirect sang 3×3 hoặc render empty article. Chưa đặt origin/canonical tuyệt đối giả khi chưa có domain phát hành.

Mỗi bài có đặc điểm, shape/layer/difficulty, ghi chú notation và link nguồn WCA, bảng trạng thái sáu capability, bài học liên quan và đọc thêm. Chưa có bài học từng bước thì hiển thị rõ, không tạo href lesson chưa tồn tại. 3×3 có link `/learn` và quick start như kiến thức nhập môn, không đánh đồng với khóa học giải. Chỉ 3×3 có action **Luyện tập 3×3**. Biểu tượng SVG chỉ minh họa hình dạng; không phải viewer hoặc trạng thái puzzle hợp lệ có thể xoay.

## Kiểm chứng

800 unit tests (36 mới): đủ tám entry, schema lỗi/missing/prototype enums/duplicate slug, immutable data, capability implementation guard, link safety, search có dấu/×/alias, AND filters, null layers, query clamp và round-trip.

Playwright bổ sung tám ca (bốn ca × desktop/mobile): search/filter/URL/reload/history và document giữ nguyên; cancel/focus/resize sheet; empty/invalid/deep-link values; metadata/HTTP 200 cho tám chi tiết, capability đúng và 404 slug lạ; bách khoa không yêu cầu solver assets. Axe scan sheet, và ma trận beta mở rộng thêm list/chi tiết 3×3 trong light/dark, 320–1440px. Toàn bộ suite gồm 42 E2E chạy production build trong CI.

Tính năng ảnh trước task 11 vẫn nằm trong suite hồi quy, không bỏ cổng validation/solver/player đã có. Giai đoạn tiếp theo là **12.1 — Schema lesson**, không tự tạo giáo trình hoặc claim hỗ trợ solver cho mọi puzzle trong tuần 11.
