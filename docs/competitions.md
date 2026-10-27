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
