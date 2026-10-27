# Tuần 21 — Giải đấu

## Quyết định lưu nội dung

Chưa có backend/auth (ADR 0006, Task 23), nên dữ liệu giải là file TypeScript versioned trong repo (`src/features/competitions/data.ts`), validate lúc import/build bằng `parseCompetitions`. Thêm/sửa giải = commit + review + CI; không có form sửa công khai. Quản trị CRUD (Task 22.1) chỉ làm sau khi có Auth/RBAC/RLS.

**Không scrape:** mỗi bản ghi thật được nhập tay từ một trang được phép trích dẫn (trang ban tổ chức hoặc danh sách giải chính thức), ghi URL https và ngày đọc. ShanBik không có công cụ thu thập tự động, không sao chép nội dung ngoài các trường dữ kiện (tên, ngày, địa điểm, nội dung thi, lịch).

**Dữ liệu hiện tại là mẫu:** sáu giải hư cấu, tên bắt đầu "Giải mẫu", địa điểm ghi "(mẫu)", `sample: true`, `source.kind: "sample"`, không URL. UI hiện thông báo "Dữ liệu mẫu" ở danh sách và chi tiết. Chưa đăng giải thật nào.

## 21.1 — Schema và provenance

| Trường                             | Quy tắc                                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `id`                               | slug duy nhất, dùng làm URL `/competitions/[id]`                                                                                  |
| `name`, `country`, `city`, `venue` | chuỗi bắt buộc, có giới hạn độ dài                                                                                                |
| `region`                           | `viet-nam`, `asia`, `europe`, `americas`, `oceania`, `africa`                                                                     |
| `timeZone`                         | IANA hợp lệ theo `Intl` (ví dụ `Asia/Ho_Chi_Minh`); không nhận "GMT+7"                                                            |
| `startDate`, `endDate`             | ngày lịch **tại nơi tổ chức**, `YYYY-MM-DD`, có tồn tại, tối đa 14 ngày                                                           |
| `events`                           | mã nội dung WCA (`333`, `222`, `pyram`, `minx`, …), không trùng                                                                   |
| `schedule[]`                       | ngày trong khoảng thi, `HH:MM` bắt đầu < kết thúc, nội dung phải nằm trong `events`, theo thứ tự thời gian                        |
| `registration`                     | `opens`/`closes` giờ địa phương; mở < đóng ≤ đầu ngày thi đầu                                                                     |
| `cancelled`                        | trạng thái hủy do ban tổ chức công bố                                                                                             |
| `source`                           | `kind` (`organizer`/`official-listing`/`sample`), `title`, `url` (https bắt buộc với bản ghi thật, `null` với mẫu), `retrievedAt` |
| `updatedAt`                        | ngày ShanBik sửa bản ghi, không trước `retrievedAt`                                                                               |

Thời gian chỉ nhập dưới dạng **giờ địa phương + múi giờ**; mốc UTC (`startsAt`/`endsAt` của giải, lịch, đăng ký) được tính bằng `Intl` (`time.ts`), không thư viện. Giờ không tồn tại khi chuyển sang giờ mùa hè (ví dụ 02:30 ngày 14/03/2027 ở New York) bị từ chối; giờ lặp khi về giờ chuẩn lấy mốc sớm hơn. Ngày thi tính từ 00:00 địa phương, nên ngày đổi giờ có 23 hoặc 25 giờ.

Trạng thái (`statusAt`): hủy → "Đã hủy"; trước 00:00 ngày đầu → "Sắp diễn ra"; trước 00:00 sau ngày cuối → "Đang diễn ra"; sau đó "Đã kết thúc". Đăng ký: chưa mở / đang mở / đã đóng.

## 21.2 — Danh sách, chi tiết, bộ lọc

- `/competitions`: lọc **vùng**, **tháng** (theo lịch nơi tổ chức), **nội dung thi**, **trạng thái**; kết hợp AND, lưu trong URL (`region`, `month`, `event`, `status`; giá trị lạ bị bỏ qua), Xóa bộ lọc, trạng thái rỗng. Mỗi thẻ có trạng thái bằng chữ (không chỉ màu), nhãn mẫu, ngày, múi giờ + offset, nơi tổ chức, nội dung thi. Link chi tiết mang theo bộ lọc; "Về danh sách giải" khôi phục bộ lọc.
- `/competitions/[id]` (8 trang tĩnh, id lạ → 404): thông tin chung, múi giờ, đăng ký và lịch thi với **ba cột giờ**: giờ địa phương (kèm offset từng buổi, nên thấy rõ ngày đổi giờ), UTC, và giờ của người xem (múi giờ trình duyệt). Nguồn, ngày đọc nguồn, ngày cập nhật; ghi chú kiểm tra trang chính thức.
- Trạng thái tính ở trình duyệt theo phút (`useNow`); HTML tĩnh hiện "Đang xác định trạng thái…" thay vì trạng thái đóng băng lúc build. Cột "giờ của bạn" cũng chỉ hiện sau hydrate để không lệch HTML.
- Header desktop: mục **Giải đấu**; "Trang chủ" chỉ còn ở menu mobile/footer vì logo đã dẫn về trang chủ (giữ header một dòng).

## Kiểm tra

Đã kiểm tra khi review (test riêng chạy cục bộ, chưa đưa vào repo): quy đổi giờ cho Tokyo, Hồ Chí Minh, Berlin mùa hè/đông và giờ lặp, New York trước/sau đổi giờ và giờ không tồn tại, Sydney, Kathmandu (+05:45); nhãn offset âm/lẻ; dữ liệu mẫu hợp lệ, sắp xếp, đóng băng, độ dài ngày đổi giờ; 15 ca dữ liệu sai bị từ chối (id trùng, múi giờ, ngày, nội dung, lịch, giờ không tồn tại, đăng ký, nguồn mẫu/thật, ngày cập nhật); ranh giới trạng thái/đăng ký theo ngày địa phương; bộ lọc AND và giá trị lạ. E2E desktop/mobile: lọc qua URL và reload, quay lại giữ bộ lọc, trạng thái rỗng, chi tiết với giờ địa phương/UTC/giờ người xem dưới múi giờ trình duyệt khác, 404, nhãn mẫu, axe và không tràn ngang.

# Tuần 22 — Quản trị, góp ý, lưu và nhắc lịch

Quyết định: không thêm backend ở tuần này — [ADR 0008](./adr/0008-competition-admin.md).

## 22.1 — Quản trị và quyền

Chưa có Admin CRUD: dữ liệu chỉ đổi qua Pull Request vào repo (quyền push/merge của GitHub), lịch sử git/PR là audit log, `parseCompetitions` chặn dữ liệu sai ở CI. Id `gop-y` được dành cho route góp ý. CRUD có RLS và audit append-only làm sau Auth (Task 23).

## 22.2 — Form đề xuất/báo lỗi

`/competitions/gop-y` (link "Đề xuất giải mới" ở danh sách, "Báo lỗi thông tin giải này" ở chi tiết với `?id=`):

- Hai loại: **đề xuất giải mới** (tên, thành phố, ngày bắt đầu/kết thúc giờ địa phương, trang chính thức https bắt buộc) và **báo lỗi** (chọn giải, mô tả ≥ 10 ký tự, nguồn https tùy chọn). Chi tiết ≤ 2000 ký tự, liên hệ ≤ 120 ký tự.
- Lỗi hiện dưới từng ô (`aria-invalid`, `aria-describedby`) và trong bảng tóm tắt nhận focus, có link tới ô lỗi. Dữ liệu không mất khi lỗi: bản nháp tự lưu trên máy (`shanbik:competition-suggestion-draft:v1`), khôi phục khi mở lại; "Xóa bản nháp" để làm lại.
- Hợp lệ → hiện nội dung và link **Mở GitHub để gửi** (issue điền sẵn, repo công khai, nội dung ≤ 6000 ký tự) cùng **Sao chép nội dung**. Form không ghi vào dữ liệu giải; cảnh báo issue là công khai.

## 22.3 — Lưu giải và nhắc lịch

- **Lưu giải** trên thẻ và trang chi tiết; localStorage `shanbik:competition-bookmarks:v1` `{version:1, items:[{id, savedAt, remind}]}`, tối đa 200, validate khi đọc; dữ liệu lỗi được báo và chỉ thay khi người dùng lưu lại; bị chặn lưu trữ thì giữ trong trang và báo. Đồng bộ giữa tab qua sự kiện `storage`. Bộ lọc **Chỉ giải đã lưu** (`saved=1` trên URL).
- **Nhắc lịch** bằng tệp `.ics` (RFC 5545) tải về và mở bằng ứng dụng lịch của máy — lời nhắc do lịch trên thiết bị gửi, kể cả khi đóng ShanBik. Mức báo trước: không / 1 giờ / 1 ngày / 1 tuần (lưu theo giải đã lưu). Nội dung tệp:
  - Ngày thi: sự kiện **cả ngày** theo lịch nơi tổ chức (`DTSTART;VALUE=DATE`, `DTEND` loại trừ), có lời nhắc.
  - Mở/đóng đăng ký và từng buổi thi: **mốc UTC** (`…Z`), nên ứng dụng lịch hiển thị đúng giờ người dùng, kể cả ngày đổi giờ mùa hè; mở đăng ký có lời nhắc.
  - `STATUS:CANCELLED` cho giải hủy; mô tả ghi múi giờ, nội dung thi, nhãn dữ liệu mẫu hoặc nguồn; CRLF, gấp dòng 75 octet UTF-8, escape `\\ ; , \n`.

## Kiểm tra tuần 22

Đã kiểm tra khi review (test riêng chạy cục bộ, chưa đưa vào repo): bookmark (khởi tạo không ghi, lưu/bỏ/nhắc qua reload, sáu dạng dữ liệu lỗi không bị ghi đè lúc mở, lưu trữ bị chặn, giới hạn 200, đồng bộ tab); tệp lịch (CRLF, gấp dòng, escape, ngày cả ngày với kết thúc loại trừ, UTC đăng ký/buổi thi Tokyo, Berlin qua ngày đổi giờ, giải hủy, không nhắc); form (validate hai loại, ngày không tồn tại, https, độ dài, issue điền sẵn, cắt nội dung dài, nháp hỏng bị bỏ qua). E2E desktop/mobile: lưu giải và lọc qua reload, tải `.ics`, form lỗi giữ dữ liệu qua reload, báo lỗi từ chi tiết, link GitHub điền sẵn, axe.
