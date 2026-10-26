# Khung trang MVP — Task 3.3

| Route     | Nội dung hiện có                                              | Phần chưa triển khai                           |
| --------- | ------------------------------------------------------------- | ---------------------------------------------- |
| /         | Giới thiệu ShanBik, trạng thái dự án, link khám phá           | Không phải dashboard có dữ liệu                |
| /practice | Khung khu vực mô phỏng 3×3 và các khả năng sắp có             | Chưa core, viewer, scramble, solver hoặc timer |
| /learn    | Giới thiệu ngắn về khối/ký hiệu và cách học                   | Chưa giáo trình hoặc player bài học            |
| /help     | FAQ về phạm vi hiện tại, tài khoản, camera, theme và bàn phím | Chưa form liên hệ/backend                      |

Page là Server Component và có metadata riêng. Chỉ navigation cần pathname, mobile sheet và theme là client. Dùng Next Link cho chuyển route, không reload bằng window.location. Trang hiện tại được đánh dấu aria-current=page và underline trong header/menu. Bảng route dùng chung ở src/config/navigation.ts.

Header desktop từ 64rem có navigation và chọn theme. Mobile có Menu mở sheet Radix từ Task 3.2; link đóng sheet, Escape/focus trap theo primitive, resize sang desktop đóng menu. Footer dùng cùng danh sách route; Về đầu trang trỏ #main-content trên trang đang mở, không đưa người dùng về Home ngoài ý muốn.

Các trang dùng nội dung tĩnh và token dùng chung; không thêm skeleton giả hoặc request dữ liệu. Không thêm dependency, API hoặc logic puzzle trong task này. Trang demo /ui-preview vẫn chỉ mở ở development.

## Kiểm tra nghiệm thu

- Mở trực tiếp/reload bốn route: HTTP 200, có một main/h1 và metadata phù hợp.
- Chuyển route bằng navigation desktop/mobile/footer; active route đúng, không reload document.
- Mobile sheet dùng keyboard, Escape trả focus trigger; link đóng sheet; resize lên desktop không để overlay chặn màn hình.
- Theme không bị reset khi chuyển trang; không hydration mismatch/pageerror.
- Kiểm tra 360px/tablet/desktop/landscape/không gian layout thu hẹp, cả light/dark, không tràn ngang.
- Các link nội bộ/anchor có đích thật; nội dung không quảng bá công cụ chưa hoạt động như tính năng đã có.
- Format/lint/typecheck/build và CI; Vitest chưa có unit case nghiệp vụ.

Bước tiếp theo: Task 4.1 — mô hình trạng thái 3×3 độc lập với renderer.
