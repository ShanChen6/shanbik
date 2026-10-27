# Tuần 20 — Search tổng hợp và luồng học → luyện tập

## 20.1 — Search tổng hợp

Route `/search`, vào từ biểu tượng kính lúp ở header desktop, mục **Tìm kiếm** trong menu mobile và footer.

- `search/build-index.ts` (dùng ở server component) dựng chỉ mục từ bách khoa (8 puzzle), bài học **đã xuất bản** và thư viện công thức. Trang chỉ gửi xuống client mảng mục nhỏ đã chuẩn hóa (tiêu đề, mô tả, href, chuỗi tìm), không gửi catalog, schema bài học hay validator.
- `search/match.ts` thuần: bỏ dấu tiếng Việt và đ, không phân biệt hoa/thường, `3 x 3`/`3×3` → `3x3`, `′`/`’` → `'`. Mọi từ phải xuất hiện (AND). Tiêu đề bắt đầu bằng truy vấn xếp trước, rồi tiêu đề chứa đủ từ, rồi phần thân. Giới hạn 80 ký tự.
- Kết quả chia nhóm Puzzle / Bài học / Công thức với số lượng; puzzle → `/puzzles/[slug]`, bài học → trang bài, công thức → `/algorithms?f=<id>` (thư viện mở sẵn công thức đó, lọc theo tên và mở minh họa).
- URL: `?q=` cập nhật bằng `history.replaceState` khi gõ (không thêm mục lịch sử, không tải lại server); reload/chia sẻ giữ từ khóa.
- Bàn phím: ↓ từ ô tìm vào kết quả đầu; ↑/↓ chuyển giữa mọi kết quả qua các nhóm; Home/End; ↑ ở kết quả đầu hoặc Esc quay lại ô tìm; Enter trong ô tìm focus kết quả đầu. Trạng thái số kết quả là `role=status` gắn với ô tìm.
- Trạng thái rỗng: chưa nhập → gợi ý từ khóa (nút) và đường vào ba mục; không có kết quả → giải thích, cùng gợi ý và đường vào ba mục.

Header desktop không thêm mục chữ: tám mục làm thanh điều hướng xuống hai dòng từ 1024 tới 1440 px, nên dùng nút kính lúp 44×44 có nhãn "Tìm kiếm".

## 20.2 — Luồng học → luyện tập

Registry thêm capability `timer` (chỉ 3×3: solve và scramble của timer vẫn là 3×3). `puzzles/learning-path.tsx` dựng **Lộ trình** cho một puzzle chỉ từ registry và nội dung đã xuất bản:

| Bước                           | Điều kiện                                                                                                     | Đích                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Tìm hiểu                       | luôn có                                                                                                       | `/puzzles/[slug]`                     |
| Học từng bước                  | có bài đã xuất bản cho puzzle                                                                                 | bài học (hoặc `/learn` nếu nhiều bài) |
| Công thức                      | thư viện có công thức của puzzle                                                                              | `/algorithms`                         |
| Luyện trên mô hình / Thực hành | render `cube-3x3` → `/practice`; render NxN/Pyraminx hoặc scramble Worker → `/puzzles/[slug]#workbench-title` |                                       |
| Bấm giờ                        | capability `timer`                                                                                            | `/timer` (lịch sử, thống kê)          |

Khối hiển thị ở bài học, thư viện công thức, `/practice`, `/timer` và trang bách khoa; bước hiện tại có `aria-current="step"`. 3×3 có đủ năm bước; 2×2/4×4/Pyraminx/Megaminx chỉ có Tìm hiểu → Thực hành; 5×5/Skewb/Square-1 chỉ có một bước nên không hiện khối.

Tiêu đề khu vực **Thực hành** (`#workbench-title`) được render ở server; chỉ công cụ bên trong tải lười, nên liên kết có anchor từ trang khác cuộn đúng chỗ.

## Kiểm tra

Đã kiểm tra khi review (test riêng chạy cục bộ, chưa đưa vào repo): chỉ mục đủ 8 puzzle/bài đã xuất bản/công thức với route thật; tìm không dấu, `3 x 3`, `×`, ký hiệu prime ở mọi dạng; AND, xếp hạng, rỗng, giới hạn độ dài; lộ trình đúng capability từng puzzle. E2E desktop/mobile: lối vào header/menu, gợi ý, không kết quả, URL qua reload, axe, không tràn ngang; bàn phím ↓/↑/Home/End/Esc/Enter và mở công thức qua `?f=`; đi liên tục bài học → công thức → luyện tập → timer → bách khoa, 2×2 không có Bấm giờ/Công thức, 5×5/Skewb/Square-1 không có lộ trình. Kết quả audit: [báo cáo 20.3](./reports/content-audit-2026-10-27.md).
