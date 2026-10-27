# 10.2 — Hướng dẫn và E2E

## Hướng dẫn người dùng

Mở `/help#quick-start` hoặc chọn **Hướng dẫn bắt đầu nhanh** trên `/practice`. Hướng dẫn đi qua tạo/apply scramble, lấy màu hoặc nhập tay, giải bản nhập và phát lời giải. Phân biệt ba thao tác reset, giải thích loading/hủy/lỗi/solved và trường hợp không có WebGL. Không cần tài khoản hoặc biến môi trường.

## Chạy cục bộ

Dùng Node/pnpm theo `.nvmrc` và `packageManager`:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps --only-shell chromium
pnpm build
pnpm test:e2e
```

Trên máy đã có thư viện hệ thống cho Chromium có thể bỏ `--with-deps`. Playwright được pin ở `@playwright/test@1.56.1` để CLI, browser revision và lockfile khớp nhau. Cài lại browser sau khi nâng dependency. `pnpm test:e2e:ui` mở chế độ UI để debug.

Bộ test tự khởi động production server trên `127.0.0.1:3210` rồi dừng sau khi chạy. Phải build trước; không dùng lại server đang mở hoặc dev server để tránh kiểm nhầm source/build. Nếu cổng bận, dừng server cũ trước khi chạy. Không cần tài khoản, secret hay deployment. `pnpm test` vẫn chỉ chạy Vitest trong `src/**/*.test.ts`; E2E ở `tests/e2e/*.spec.ts` chạy riêng.

## Phạm vi

Hai project Chromium: desktop 1280×900 với animation thường và mobile viewport 360×800 với touch/reduced motion. Mỗi project chạy sáu ca:

1. Hướng dẫn nhanh → link luyện tập; nội dung giải thích ba loại reset.
2. Scramble 25 nước → lấy màu → solver cubing.js thật → nạp → tiến/lùi → phát về solved → về đầu chuỗi → reset phiên; kiểm tra tràn ngang.
3. Input trống báo lỗi và giữ bản nhập; input solved không tải Worker assets hoặc tạo nước giả.
4. Worker init không trả lời (chỉ mock outer Worker entry trong ca này) → hủy → cooldown → retry với Worker thật và có lời giải.
5. Worker constructor bị chặn → lỗi có thể thử lại, giữ bản nhập và mô hình.
6. Không WebGL → nhập mẫu/giải solved/reset vẫn dùng được; lấy màu mô hình bị khóa.

Mọi ca kiểm tra `pageerror`; dùng role/label và auto-wait theo trạng thái, không chờ số giây cố định. Full flow tạo scramble thật bằng Web Crypto, không mock solver. Lời giải phải qua verification của core trước khi player báo solved. Một worker test chạy tuần tự để tránh nhiều search Worker tranh tài nguyên CI. Không retry tự động để che flake; timeout dài cho cold initialization có giới hạn và chuỗi animation.

Đây là Chromium desktop với software WebGL và mobile viewport giả lập. Không thay cho thiết bị di động thật, Safari/Firefox, visual regression hay kiểm toán accessibility/hiệu năng ở task 10.3. Ca không WebGL hiện kiểm tra already-solved; không khẳng định đã E2E search một khối chưa solved trong chế độ fallback.

## CI và debug

Job **Quality checks** cài Chromium sau production build và chạy `pnpm test:e2e`. E2E thất bại làm job thất bại. Report HTML, screenshot và trace khi lỗi được upload thành artifact `playwright-failure-report`, giữ 7 ngày. Các thư mục generated `playwright-report/` và `test-results/` được bỏ qua bởi Git, ESLint và Prettier.

```bash
pnpm exec playwright show-report
pnpm exec playwright test --project=chromium-mobile
pnpm exec playwright test -g "cancel initialization"
pnpm exec playwright show-trace test-results/path-from-failed-test/trace.zip
```

Sửa lỗi theo report rồi chạy lại ca liên quan và toàn bộ suite trước khi PR vào `develop`. Không thêm credentials hoặc dữ liệu tài khoản vào test/trace. CI không merge hoặc deploy.
