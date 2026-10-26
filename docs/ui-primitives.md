# UI primitives — Task 3.2

## Cấu trúc và lựa chọn

Các component tại `src/components/ui/` dùng token từ Task 3.1 và CSS ở `src/styles/ui.css`. Button/Input giữ semantics HTML native. Dialog, Tabs và Toast bọc Radix để tái sử dụng focus management, keyboard navigation, ARIA và vòng đời modal; phiên bản khóa trong pnpm-lock.yaml. Không thêm shadcn, icon library hoặc framework UI thứ hai.

## API

| Component    | Cách dùng                                                                       | Hành vi                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Button       | `variant="primary/secondary/ghost/danger"`, `loading`, props button native, ref | Mặc định type=button; loading vô hiệu hóa, aria-busy, giữ text label; icon-only phải truyền aria-label                        |
| Input        | `label` bắt buộc, `hint`, `error`, props input native, ref                      | useId khi không có id; liên kết label/hint/error và aria-invalid; giữ aria-describedby do caller cung cấp                     |
| Dialog       | Dialog + DialogTrigger asChild + DialogContent                                  | Content yêu cầu title/description; Escape, focus trap, trả focus trigger, đóng bằng overlay hoặc nút                          |
| Sheet        | DialogContent variant=sheet                                                     | Bottom sheet mobile, panel phải từ 48rem; cuộn bên trong, safe-area padding                                                   |
| Tabs         | Tabs + TabsList + TabsTrigger + TabsContent                                     | Dùng value/defaultValue, arrow/Home/End theo Radix; disabled tab không nhận chọn; gán aria-label cho list                     |
| Toast        | ToastProvider ở root; useToast() trong client component                         | title/description/variant info-success-error; tối đa 3 thông báo; 6 giây, pause khi tương tác theo Radix, nút đóng và phím F8 |
| LoadingState | label tùy chọn                                                                  | role=status, spinner trang trí; reduced motion không xoay nhưng vẫn có text                                                   |
| EmptyState   | title tùy chọn, description                                                     | Không dùng role alert cho dữ liệu rỗng bình thường                                                                            |
| ErrorState   | description, onRetry tùy chọn, retrying                                         | role=alert; nút thử lại chỉ hiện khi có handler, trạng thái retrying khóa nút                                                 |

Các API có event handler phải gọi từ Client Component. Khi dùng `asChild` của Radix, child cần nhận props/ref; Button đáp ứng điều này. Không dùng Button để giả lập link điều hướng; dùng Next Link với style phù hợp.

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Mở</Button>
  </DialogTrigger>
  <DialogContent title="Tên hộp thoại" description="Mô tả mục đích">
    <Input label="Tên" required />
    <DialogClose asChild>
      <Button variant="secondary">Hoàn tất</Button>
    </DialogClose>
  </DialogContent>
</Dialog>
```

Vùng Radix chỉ mount khi có thông báo; app children nằm ngoài vùng này để không remount ứng dụng và để trạng thái pause của viewport không tồn tại qua một hàng đợi đã trống.

Toast là phản hồi bổ trợ; lỗi cần người dùng sửa vẫn phải hiển thị inline hoặc ErrorState, không chỉ nằm trong thông báo tự đóng. Không đưa thông tin nhạy cảm vào toast. Không mở nhiều modal lồng nhau khi chưa kiểm tra luồng focus tương ứng.

## Accessibility và responsive

- Controls có minimum target 44px; focus-visible kế thừa base styles.
- Input có token control-border riêng để tăng độ rõ đường viền so với border trang trí.
- Dialog giới hạn chiều cao theo dvh, scroll bên trong; toast giới hạn chiều rộng màn hình và có safe area.
- Tabs có underline khi active để không chỉ dựa vào màu.
- Trạng thái lỗi có text, loading có label; disabled dùng native disabled.
- Theme sáng/tối dùng cùng token; không hardcode palette trong JSX.

## Demo và kiểm tra

Chạy `pnpm dev`, mở `/ui-preview`. Trang demo không nằm trong navigation sản phẩm, có robots noindex; ngoài NODE_ENV=development trả notFound. Nó là fixture tương tác cho kiểm tra, không phải một chức năng Rubik.

Checklist:

1. Button disabled/loading không thực hiện thao tác; button thường không submit ngầm nếu không đặt type=submit.
2. Label focus đúng input; form trống có aria-invalid và mô tả lỗi liên kết; nhập lại vẫn giữ nội dung.
3. Dialog có accessible name/description; Tab/Shift+Tab không thoát; Escape và nút đóng trả focus trigger.
4. Sheet ở mobile dùng toàn chiều ngang; desktop mở bên phải; nội dung dài cuộn trong panel.
5. Tabs dùng Arrow/Home/End, bỏ qua disabled; panel khớp tab.
6. Toast xuất hiện, đóng được, F8 focus vùng thông báo; hết thời gian tự đóng nếu không có tương tác.
7. Kiểm tra 360px/tablet/desktop, light/dark, reduced motion, không tràn ngang.
8. Production `/ui-preview` trả 404. Format/lint/typecheck/build đạt; Vitest hiện chưa có unit test case nghiệp vụ, không coi 0 case là test UI.

Việc test trình duyệt dùng fixture này có thể thực hiện bằng Playwright từ môi trường kiểm tra; chưa cài thêm Playwright vào dependencies của repo. Bộ E2E đầy đủ vẫn thuộc Task 10.2.
