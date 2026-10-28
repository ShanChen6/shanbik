# Tuần 17 — Thống kê

## Phạm vi 17.1–17.2

- 17.1: hàm thuần trong `src/features/timer/stats.ts` — best, worst, mean, Ao5, Ao12, trung bình phiên, Ao5/Ao12 cuộn và tốt nhất, áp dụng +2/DNF.
- 17.2: route `/timer/stats` — ô số liệu, biểu đồ xu hướng, bộ lọc puzzle/phiên, bảng dữ liệu thay thế biểu đồ.

Dữ liệu đọc từ lịch sử IndexedDB của Tuần 16 qua cùng store (`createBrowserSolveHistory`), nên penalty/xóa ở Lịch sử hoặc tab khác cập nhật thống kê ngay. Không lưu thêm dữ liệu.

## Quy tắc tính (17.1)

Kết quả một lượt dùng `resultMs`: +2 cộng 2000 ms, DNF không có thời gian. Hàm nhận solve theo thứ tự thời gian (`chronological`: timestamp tăng dần, cùng timestamp thì theo ID như danh sách lịch sử). Mỗi giá trị là `number` (ms), `"DNF"` hoặc `null` (chưa đủ lượt).

| Chỉ số            | Quy tắc                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Tốt nhất          | Kết quả nhỏ nhất trong các lượt hoàn thành; toàn DNF → DNF                                  |
| Kém nhất          | Có DNF → DNF, ngược lại lớn nhất                                                            |
| Trung bình        | Trung bình các lượt hoàn thành, bỏ DNF (`successMean`)                                      |
| `meanOf`          | Trung bình tất cả, có DNF → DNF (kiểu mo3); có sẵn cho tuần sau                             |
| Ao5 / Ao12        | 5/12 lượt gần nhất, bỏ 1 tốt nhất + 1 kém nhất (DNF là kém nhất); số DNF > số lượt bỏ → DNF |
| Trung bình phiên  | `averageOf` toàn bộ lượt đang lọc, bỏ `ceil(5%)` mỗi đầu (1 với ≤ 20 lượt); cần ≥ 3 lượt    |
| Ao5/Ao12 tốt nhất | Nhỏ nhất trong các Ao cuộn; số luôn tốt hơn DNF                                             |

Trung bình được làm tròn đến centisecond gần nhất (WCA 9f1), còn lượt đơn hiển thị cắt xuống centisecond như Timer. Thời gian đo gốc không đổi khi có penalty.

**Phiên** là các lượt trong cùng một ngày theo giờ máy người dùng (`sessionKey` → `YYYY-MM-DD`). App chưa có phiên đặt tên/tạo tay; khi có, chỉ cần thay `sessionKey`/`sessions`. Puzzle hiện chỉ có 3×3; bộ lọc puzzle hiển thị trạng thái đó thay vì giả lập lựa chọn chưa hỗ trợ.

## Dashboard (17.2)

- Hàng lọc ở trên: Puzzle, Phiên (Tất cả + từng ngày, mới nhất trước, kèm số lượt). Phiên bị xóa hết ở tab khác thì về Tất cả.
- 8 ô số liệu (2 cột mobile, 4 cột từ 768px); Số lượt kèm số DNF và +2.
- Biểu đồ SVG đo theo bề rộng container (ResizeObserver), không dùng thư viện chart. Một trục Y (giây), trục X là số thứ tự lượt. Chấm = từng lượt (`--chart-1`), đường 2px = Ao5 (`--chart-2`), đứt đoạn khi Ao5 chưa đủ hoặc là DNF; DNF là dấu × trong dải riêng phía trên vùng vẽ. Tick 1-2-5 luôn bao trọn dữ liệu. Có chú giải cho cả ba ký hiệu. Hover/chạm hiện crosshair và tooltip (lượt, kết quả, Ao5); focus biểu đồ rồi dùng ←/→/Home/End để xem từng lượt bằng bàn phím. Hiển thị tối đa 200 lượt gần nhất; bảng luôn có đủ.
- Bảng dữ liệu (`details`) có #, Kết quả, Ao5, Ao12 và thời điểm (ẩn cột thời điểm dưới 640px), cuộn trong khung, header dính.
- Màu chart là token riêng trong `src/styles/tokens.css` (`--color-chart-*`), chọn bước riêng cho light (`#2a78d6`, `#eb6834`) và dark (`#3987e5`, `#d95926`) và đã qua kiểm tra lightness/chroma/CVD/tương phản trên `--color-surface` mỗi mode. Chữ dùng token chữ, không dùng màu series.

Liên kết: Timer → Thống kê, Lịch sử → Thống kê, Thống kê → Lịch sử solve.

## Kiểm tra

Đã kiểm tra khi review Task 17 (test thống kê riêng chạy cục bộ, chưa đưa vào repo): bộ dữ liệu chuẩn Ao5 (thứ tự bất kỳ, 1/2 DNF, +2, DNF có thời gian nhanh), Ao12 (0/1/2 DNF), trim 5% cho 3–100 lượt, làm tròn centisecond, best/worst/mean với +2/DNF và dữ liệu rỗng, Ao cuộn/hiện tại/tốt nhất, thứ tự thời gian, một phiên tham chiếu 12 lượt và nhóm phiên theo ngày. E2E desktop/mobile: số liệu đúng sau khi đánh +2/DNF ở Lịch sử, lọc phiên, bảng thay thế, tooltip bằng bàn phím, trạng thái rỗng, axe light/dark và không tràn ngang 320–1280px.

Trong repo: `tests/e2e/beta.spec.ts` thêm `/timer/history` và `/timer/stats` vào audit route/theme.

Tiếp theo **Tuần 18 — 2x2 và 4x4**.
