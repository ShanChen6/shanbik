# Tokens và layout — Task 3.1

## Tham khảo

Tham khảo cấu trúc CSS và theme của [Shanverse](https://github.com/ShanChen6/shanverse): `src/styles/{color,theme,typography,base,responsive}.css`, `src/providers/ThemeProvider.tsx`, `src/components/layout/theme-toggle.tsx`.

Áp dụng cách chia lớp và token ngữ nghĩa; không mang palette navy/gold, i18n, Notion, hiệu ứng 3D hoặc toàn bộ bảng màu mặc định Tailwind sang. Màu nền tảng lấy mẫu xấp xỉ từ pixel đục của logo raster được cung cấp: teal #0A4B58 và cam #F35A31; không coi đây là mã vector gốc chính xác. Cam dùng làm màu trang trí, accent chữ light dùng tông đậm #A53617 để tăng tương phản. Màu sticker puzzle phải có bộ token riêng khi xây cube, không đổi theo UI theme.

## Cấu trúc

- `src/app/globals.css`: điểm import Tailwind và CSS tùy chỉnh.
- `src/styles/color.css`: màu nền tảng cam–teal.
- `src/styles/theme.css`: token light/dark và ánh xạ `@theme inline`.
- `src/styles/typography.css`: sans/heading/mono, body và fluid display/heading.
- `src/styles/responsive.css`: spacing, radius, breakpoints, container và control dimensions.
- `src/styles/base.css`: reset tối thiểu, focus-visible, skip link, reduced motion.

## Hợp đồng token

| Nhóm        | Token / utility                                     | Quy tắc                                                                                        |
| ----------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Nền         | background, surface, surface-subtle                 | Xám trung tính cả hai theme; không dùng teal/cam thương hiệu làm nền. Không hardcode trong JSX |
| Chữ         | foreground, muted                                   | Foreground cho nội dung chính, muted cho mô tả                                                 |
| Hành động   | primary, primary-foreground, primary-hover          | Luôn dùng cặp foreground tương ứng                                                             |
| Điểm nhấn   | accent, accent-soft                                 | Badge; gradient chỉ cho đường trang trí                                                        |
| Trạng thái  | success, warning, danger, info                      | Không chỉ dùng màu để truyền ý nghĩa                                                           |
| Focus       | ring                                                | Outline 3px, offset 4px; không xóa focus để trang trí                                          |
| Khoảng cách | --spacing: 0.25rem                                  | Dùng scale Tailwind hiện có                                                                    |
| Breakpoints | sm 40rem, md 48rem, lg 64rem, xl 80rem              | Mobile-first; grid 3 cột từ md                                                                 |
| Layout      | site-container, content-width, section-space        | Max 72rem, nội dung 44rem, gutter fluid                                                        |
| Chữ         | text-display, text-heading, text-body, text-body-lg | Font hệ thống hỗ trợ tiếng Việt, không tải font mạng                                           |
| Controls    | --control-min / touch-control                       | Tối thiểu 44px theo font root mặc định                                                         |
| Chuyển động | --motion-fast                                       | 150ms; reduced-motion tắt transition/animation                                                 |

`next-themes` quản lý class `dark`, mặc định theo hệ thống; người dùng bấm công tắc ngày/đêm (`theme-switch.tsx`, prompt UX #021, MIT) để chọn Sáng hoặc Tối, lưu `shanbik-theme`; chưa chọn thì theo hệ thống. Công tắc chỉ dùng giá trị sau hydrate; vì provider tắt transition lúc đổi class, công tắc chạy hiệu ứng 0,9 s rồi mới áp theme (giảm chuyển động: áp ngay). Style nằm trong `theme-switch.css` cạnh component, mọi selector có tiền tố `.u021` (cấu hình Turbopack xử lý mọi `*.css` như CSS thường nên không dùng CSS module); vòng focus dùng token `--ring`. `suppressHydrationWarning` chỉ đặt trên html do thư viện cập nhật class theme trước hydrate; không dùng để che lỗi cây nội dung.

## Layout

Header và footer dùng ảnh logo được cung cấp, chữ teal trên light và chữ trắng trên dark; không recolor ảnh. Bốn biến thể từ ảnh được cung cấp lưu ở public/brand dưới dạng WebP trong suốt, resize để giảm dung lượng, không recolor. icon.png/favicon.ico là biến thể resize từ biểu tượng khối. Link logo có accessible name, ảnh trang trí alt rỗng. Từ Task 3.3, màn hình dưới 64rem mở điều hướng và chọn theme trong sheet; desktop hiển thị navigation cùng hàng. Link chuyển đến các route có thật và đánh dấu trang hiện tại. Footer, skip link và main focus target dùng chung trong root layout. UI primitives được bổ sung ở Task 3.2. Khung route Task 3.3 được mô tả trong [routes.md](./routes.md); chưa có logic nghiệp vụ cube.

## Kiểm tra

Chạy format/lint/typecheck/test/build và kiểm tra browser các theme, reload, system preference, keyboard focus, reduced motion, 360px/tablet/desktop, landscape và tương đương zoom 200%. Không coi Vitest 0 case là bằng chứng UI đúng. Ghi kết quả thực tế vào PR; không thêm bài test chỉ phản chiếu CSS tokens.
