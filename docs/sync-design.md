# Tuần 23 — Tài khoản và đồng bộ đám mây

Trạng thái: thiết kế 23.1 chờ review; triển khai 23.2–23.4 dựa trên Supabase (ADR 0006), **chưa chạy với project Supabase thật** trong phiên phát triển (không có khóa, proxy chặn `supabase.com`). Migration/RLS đã chạy trên PostgreSQL 16 thật với lớp giả lập `auth` của Supabase; client và đồng bộ được kiểm bằng adapter giả.

## Nguyên tắc

1. **Guest-first.** Không cần tài khoản để dùng cube, timer, lịch sử, công thức, bài học, giải đấu. Không cấu hình Supabase thì site chạy y như trước, trang Tài khoản chỉ giải thích.
2. **Không ghi đè âm thầm.** Lần đồng bộ đầu trên một thiết bị cần người dùng bấm xác nhận. Mọi bản ghi bị sửa khác nhau ở cả hai phía được đưa ra làm **xung đột** để người dùng chọn; không có "last write wins" ngầm.
3. **Mỗi người chỉ thấy dữ liệu của mình.** Mọi bảng có `user_id` và RLS `user_id = auth.uid()`; trình duyệt chỉ có anon key; không có service key trong client hay Git.

## Dữ liệu (23.1)

| Dữ liệu                                              | Nơi lưu local                                   | Đồng bộ v1                     | Khóa                               |
| ---------------------------------------------------- | ----------------------------------------------- | ------------------------------ | ---------------------------------- |
| Lượt giải (solve)                                    | IndexedDB `shanbik-timer`                       | Có                             | `id` UUID tạo trên máy lúc bấm giờ |
| Công thức yêu thích                                  | localStorage `shanbik:algorithm-favorites:v1`   | Có                             | `formula_id`                       |
| Giải đã lưu + mức nhắc                               | localStorage `shanbik:competition-bookmarks:v1` | Có                             | `competition_id`                   |
| Vị trí đọc bài học, ghi chú/tùy chọn luyện công thức | localStorage                                    | Chưa (v2)                      | —                                  |
| Theme                                                | localStorage (next-themes)                      | Không — sở thích theo thiết bị | —                                  |
| Bản nháp góp ý                                       | localStorage                                    | Không                          | —                                  |

Bảng (migration `supabase/migrations/20261028000000_sync.sql`):

- `solves(user_id, id, puzzle, duration_ms, scramble, solved_at, penalty, deleted, updated_at)`, khóa `(user_id, id)`. Ràng buộc khớp `validateSolve`: `puzzle = '3x3'`, `duration_ms` 0…86.400.000, `scramble` 1…2048 ký tự, `penalty in ('none','+2','DNF')`, tối đa 10.000 lượt/người (trigger).
- `algorithm_favorites(user_id, formula_id, deleted, updated_at)`, tối đa 500.
- `competition_bookmarks(user_id, competition_id, remind, saved_at, deleted, updated_at)`, tối đa 200.
- `updated_at` do trigger server đặt; client không tự đặt thời gian sửa. `user_id` mặc định `auth.uid()` và bị kiểm lại trong policy.
- **Xóa là tombstone** (`deleted = true`) để thiết bị khác biết đã xóa; hàng thật bị xóa khi xóa tài khoản (`on delete cascade` từ `auth.users`).

## Gộp ba chiều (23.4)

Mỗi thiết bị nhớ **bản gốc lần đồng bộ trước** (base) theo từng tài khoản: localStorage `shanbik:sync-base:v1:<user_id>`, chỉ lưu dạng chuẩn hóa nhỏ của từng bản ghi. Với mỗi khóa, so sánh base `B`, máy `L`, tài khoản `R` (vắng mặt hoặc tombstone = "không có"):

| Trường hợp                                                                                   | Kết quả                                                                                                                  |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `L = R`                                                                                      | không đổi; base = `L`                                                                                                    |
| `L = B` (máy không đổi)                                                                      | lấy `R` về máy                                                                                                           |
| `R = B` (tài khoản không đổi)                                                                | đẩy `L` lên tài khoản (xóa → tombstone)                                                                                  |
| còn lại (cả hai đổi khác nhau, kể cả cùng thêm mới khác nhau hoặc một bên xóa – bên kia sửa) | **xung đột**: không áp dụng bên nào, base giữ nguyên, hiển thị để chọn "Giữ bản trên máy" hoặc "Dùng bản trên tài khoản" |

Lần đầu (chưa có base): chỉ có ở máy → đẩy lên; chỉ có ở tài khoản → kéo về; có ở cả hai và giống nhau → giữ; khác nhau → xung đột. Lượt giải có `id` duy nhất nên hai thiết bị bấm giờ độc lập không đụng nhau; xung đột thực tế là sửa penalty/xóa cùng một lượt ở hai nơi.

Thứ tự một lần đồng bộ: tải toàn bộ bản ghi của người dùng → đọc local → gộp → đẩy thay đổi lên → áp thay đổi xuống máy → cập nhật base **chỉ cho các khóa đã áp dụng thành công cả hai phía**. Lỗi mạng/quyền ở bước nào thì dừng, báo lỗi cụ thể, base không đổi cho phần chưa xong; "Thử lại" chạy lại toàn bộ và an toàn vì các bước idempotent (upsert theo khóa). Sau khi áp lượt giải xuống IndexedDB, các trang lịch sử đang mở được báo qua `BroadcastChannel("shanbik-timer")`.

Đồng bộ chạy khi người dùng bấm **Đồng bộ ngay** ở trang Tài khoản (v1 không chạy nền). Đăng xuất không xóa dữ liệu trên máy; base giữ theo `user_id`, nên đăng nhập tài khoản khác trên cùng máy không trộn base.

## Threat model

| Mối đe dọa                          | Biện pháp                                                                                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User A đọc/sửa dữ liệu B qua REST   | RLS bật trên mọi bảng, policy `using/with check (user_id = auth.uid())`; `anon` không có quyền bảng; test A/B trên Postgres                                                                               |
| Client gửi `user_id` của người khác | `with check` từ chối; `user_id` mặc định `auth.uid()`                                                                                                                                                     |
| Dữ liệu rác/quá lớn làm đầy DB      | `check` độ dài/miền giá trị; trigger giới hạn số hàng mỗi người; client cũng validate trước khi gửi                                                                                                       |
| Lộ service key                      | Không dùng service key ở client; chỉ `NEXT_PUBLIC_SUPABASE_URL` + anon key (công khai theo thiết kế của Supabase). Thao tác cần service key (ví dụ xóa tài khoản) chỉ được làm trong server route sau này |
| Ghi đè dữ liệu do đồng hồ lệch      | Gộp ba chiều theo base, không dùng thời gian máy để quyết định                                                                                                                                            |
| Dữ liệu nhạy cảm                    | Chỉ email (do Supabase Auth giữ) và dữ liệu luyện tập; không lưu tên thật, vị trí, thiết bị                                                                                                               |
| XSS đánh cắp phiên                  | Không render HTML từ dữ liệu người dùng; phiên do supabase-js giữ trong localStorage của origin — rủi ro chấp nhận cho beta, xem lại khi có cookie SSR                                                    |
| Brute force đăng nhập/spam đăng ký  | Giới hạn tốc độ và xác minh email của Supabase Auth (cấu hình ở dashboard)                                                                                                                                |

## Triển khai (Tuần 23)

- `src/features/account/supabase.ts`: `getSupabase()` trả về `null` khi thiếu `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (hoặc URL không phải https) → toàn site ở chế độ khách, không gửi request nào ra ngoài. Phiên PKCE, tự làm mới token.
- `/tai-khoan`: đăng ký (xác nhận email), đăng nhập, quên mật khẩu (thông báo giống nhau dù email có tồn tại hay không), đăng xuất chỉ phiên trên máy này (`scope: "local"`), không xóa dữ liệu local. `/tai-khoan/dat-lai-mat-khau`: trang đích của thư khôi phục, đặt mật khẩu mới; liên kết hỏng/hết hạn được giải thích.
- `src/features/sync/`: `merge.ts` (gộp ba chiều), `engine.ts` (`syncOnce`, base theo người dùng, lựa chọn xung đột chỉ có hiệu lực nếu hai bên vẫn đúng giá trị người dùng đã thấy), `adapters.ts` (IndexedDB/localStorage và Supabase REST, phân trang 1000, upsert theo lô 200), `kinds.ts` (codec hàng ↔ giá trị chuẩn; khóa không hợp lệ theo ràng buộc SQL chỉ ở lại trên máy), `describe.ts` (thông báo lỗi theo bước và loại dữ liệu).
- Lần đồng bộ đầu cho mỗi tài khoản trên một máy phải tick đồng ý. Lỗi hiển thị bước (tải/đọc/gửi/ghi) và loại dữ liệu, kèm "Thử lại".
- Kiểm chứng: RLS A/B trên Postgres 16 với schema `auth` giả lập (19 kiểm tra), unit test gộp/engine/codec, E2E với Supabase giả lập bằng `page.route` (đăng nhập sai/đúng, đồng ý, lỗi + thử lại, xung đột và chọn bản, đăng xuất giữ dữ liệu, đăng ký, quên mật khẩu). Chưa chạy với project Supabase thật.

## Cấu hình triển khai (người vận hành làm)

1. Tạo project Supabase; chạy migration trong `supabase/migrations/`.
2. Auth: bật Email provider, xác minh email, đặt Site URL và Redirect URL `https://<domain>/tai-khoan/dat-lai-mat-khau`.
3. Đặt `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` ở môi trường build. Không cần service key.
4. Kiểm tra lại A/B bằng hai tài khoản thật trước khi mở cho người dùng.
