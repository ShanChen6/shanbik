# Tokens và layout — Task 3.1

## Tham khảo

Tham khảo cấu trúc CSS và theme của [Shanverse](https://github.com/ShanChen6/shanverse): `src/styles/{color,theme,typography,base,responsive}.css`, `src/providers/ThemeProvider.tsx`, `src/components/layout/theme-toggle.tsx`.

Áp dụng cách chia lớp và token ngữ nghĩa; không mang palette navy/gold, i18n, Notion, hiệu ứng 3D hoặc toàn bộ bảng màu mặc định Tailwind sang. Màu nền tảng lấy mẫu xấp xỉ từ pixel đục của logo raster được cung cấp: teal #0A4B58 và cam #F35A31; không coi đây là mã vector gốc chính xác. Cam dùng làm màu trang trí, accent chữ light dùng tông đậm #A53617 để tăng tương phản. Màu sticker puzzle phải có bộ token riêng khi xây cube, không đổi theo UI theme.

## Cấu trúc

- `src/app/globals.css`: điểm import Tailwind và CSS tùy chỉnh.
- `src/styles/tokens.css`: **nguồn token duy nhất**, viết theo biến theme Tailwind v4 (xem mục dưới).
- `src/styles/typography.css`: ghi chú; utility chữ do Tailwind sinh từ `--text-*`.
- `src/styles/responsive.css`: `site-container`, `section-space` (giá trị fluid, không có namespace Tailwind).
- `src/styles/base.css`: reset tối thiểu, focus-visible, skip link, reduced motion.

## Token theo Tailwind v4

`tokens.css` dùng `@theme static` với namespace chuẩn của Tailwind v4, nên mỗi biến vừa là CSS variable vừa sinh utility:

| Namespace                                                           | Biến (ví dụ)                                                                                                               | Utility                                                                              |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `--color-*`                                                         | `--color-background`, `--color-surface`, `--color-primary`, `--color-chart-1`, `--color-diagram-ink`, `--color-brand-teal` | `bg-surface`, `text-muted`, `border-border`, `fill-diagram-paper`, `stroke-chart-1`… |
| `--font-*`                                                          | `--font-sans`, `--font-heading`, `--font-mono`                                                                             | `font-sans`, `font-heading`                                                          |
| `--text-*` (+ `--line-height`, `--letter-spacing`, `--font-weight`) | `--text-display`, `--text-heading`, `--text-body`, `--text-body-lg`                                                        | `text-display`, `text-heading`, `text-body`, `text-body-lg`                          |
| `--leading-*`                                                       | `--leading-body`                                                                                                           | `leading-body`                                                                       |
| `--radius-*`                                                        | `--radius-small`, `--radius-control`, `--radius-panel`, `--radius-pill`                                                    | `rounded-control`, `rounded-panel`…                                                  |
| `--shadow-*`                                                        | `--shadow-panel`                                                                                                           | `shadow-panel`                                                                       |
| `--container-*`                                                     | `--container-layout` (72rem), `--container-content` (44rem)                                                                | `max-w-content`, `max-w-layout`                                                      |
| `--spacing`, `--spacing-*`                                          | `--spacing: 0.25rem`, `--spacing-control: 2.75rem`                                                                         | `p-4`, `min-h-control`…                                                              |
| `--breakpoint-*`                                                    | sm 40rem, md 48rem, lg 64rem, xl 80rem                                                                                     | `sm:` `md:` `lg:` `xl:`                                                              |
| `--default-transition-duration`                                     | 150ms                                                                                                                      | `transition`                                                                         |

- **Dark mode:** `.dark` ghi đè chính các biến `--color-*` (và `--shadow-panel`), nên utility tự đổi theo theme; không còn cặp `:root` + `@theme inline`.
- **`static`:** giữ mọi biến trong CSS đầu ra, nên JS và inline style dùng được `var(--color-…)` (ví dụ màu chữ trên sticker).
- **`:root` thường:** chỉ những giá trị không có namespace Tailwind: gutter/khoảng section fluid, z-index (`--layer-*`), `--brand-gradient`, bảng màu minh hoạ `--illus-*` (hero).
- **Màu sticker:** WebGL dùng chung, nên nằm ở `src/features/cube/viewer/palette.ts` (cùng `PLASTIC_COLOR` và `stickerTextColor`).
- **Bảo vệ:** `pnpm lint` chạy `tools/check-tokens.mjs`; màu hex/rgb/hsl viết ở bất kỳ đâu khác ngoài `tokens.css` và `palette.ts` đều làm lint thất bại. Dòng tạo màu từ token (canvas) đánh dấu `tokens-ok`.
- **Đổi thương hiệu:** sửa khối brand trong `tokens.css`, rồi chạy bộ axe ở cả theme sáng và tối để kiểm tương phản.

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
| Layout      | site-container, max-w-content, section-space        | Max 72rem, nội dung 44rem, gutter fluid                                                        |
| Chữ         | text-display, text-heading, text-body, text-body-lg | Font hệ thống hỗ trợ tiếng Việt, không tải font mạng                                           |
| Controls    | --spacing-control / touch-control                   | Tối thiểu 44px theo font root mặc định                                                         |
| Chuyển động | --default-transition-duration                       | 150ms; reduced-motion tắt transition/animation                                                 |

`next-themes` quản lý class `dark`, mặc định theo hệ thống, lưu lựa chọn ở `shanbik-theme`.

Nút mặt trời/mặt trăng ở header (`theme-switch.tsx`, prompt UX #219, MIT) chuyển theme:

- **Sang tối:** trang tối lan theo vòng tròn từ chính nút ra phủ toàn trang (clip-path `.7s cubic-bezier(.65,0,.35,1)`), đồng thời icon xoay từ mặt trời sang mặt trăng (`.6s cubic-bezier(.3,1.4,.5,1)`).
- **Sang sáng:** vòng tối co lại về nút.
- **Cách làm:** dùng View Transitions API trên trang thật. Pseudo-element `::view-transition-*` chỉ áp dụng khi `<html>` có class `u219-vt` trong một lần chuyển.
- **Dự phòng:** trình duyệt không hỗ trợ View Transitions, hoặc người dùng bật giảm chuyển động, thì đổi theme ngay.
- **Accessibility:** giữ `role="switch"`, `aria-checked`, `aria-label="Giao diện tối"` và vùng bấm 44px.
- **Style:** nằm trong `theme-switch.css`, tiền tố `.u219`, dùng token `--color-*`.

`suppressHydrationWarning` chỉ đặt trên html do thư viện cập nhật class theme trước hydrate; không dùng để che lỗi cây nội dung.

## Layout

Header và footer dùng ảnh logo được cung cấp, chữ teal trên light và chữ trắng trên dark; không recolor ảnh. Bốn biến thể từ ảnh được cung cấp lưu ở public/brand dưới dạng WebP trong suốt, resize để giảm dung lượng, không recolor. icon.png/favicon.ico là biến thể resize từ biểu tượng khối. Link logo có accessible name, ảnh trang trí alt rỗng. Từ Task 3.3, màn hình dưới 64rem mở điều hướng và chọn theme trong sheet; desktop hiển thị navigation cùng hàng. Link chuyển đến các route có thật và đánh dấu trang hiện tại. Footer, skip link và main focus target dùng chung trong root layout. UI primitives được bổ sung ở Task 3.2. Khung route Task 3.3 được mô tả trong [routes.md](./routes.md); chưa có logic nghiệp vụ cube.

## Kiểm tra

Chạy format/lint/typecheck/test/build và kiểm tra browser các theme, reload, system preference, keyboard focus, reduced motion, 360px/tablet/desktop, landscape và tương đương zoom 200%. Không coi Vitest 0 case là bằng chứng UI đúng. Ghi kết quả thực tế vào PR; không thêm bài test chỉ phản chiếu CSS tokens.
