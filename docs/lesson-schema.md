# 12.1 — Schema lesson

> Cập nhật 12.3: đã có viewer minh họa và lưu bước đọc local. Xem [viewer và tiến độ](./lesson-viewer-progress.md).

> Cập nhật 12.2: sample đã chuyển published và có [giao diện đọc từng bước](./lesson-ui.md). Phần phạm vi dưới đây ghi lại mốc schema 12.1.

## Phạm vi

Thêm schema/validator và một bài mẫu **Làm quen với U và U′**. Chưa thêm route bài học, UI từng bước, viewer bài học, lưu tiến độ hoặc đánh dấu capability lessons là đã có. Hai phần đó thuộc task 12.2 và 12.3.

Các file tại `src/features/learn/lessons/`:

- `schema.ts`: DTO authoring, compiled immutable types, validation lỗi có code/path, kiểm chứng core và prerequisite graph.
- `sample.ts`: dữ liệu mẫu có trạng thái trước/sau viết tường minh.
- `catalog.ts`: import và validate sample, lookup theo slug, danh sách published (hiện rỗng).
- `schema.test.ts`: ca đúng/sai và kiểm chứng fixture/schema/capability.

## Authoring và runtime

`LessonSource`/`LessonStepSource` là DTO có thể soạn bằng TypeScript hoặc đọc từ JSON rồi đưa vào `parseLesson(unknown)`. Trạng thái source là chuỗi 54 ký tự URFDLB, từng mặt 9 ô theo core. `Lesson`/`LessonStep` là dữ liệu đã kiểm chứng, gồm `CubeState`/`CubeAlgorithm` frozen và notation chuẩn hóa. Không đưa source thô vào player.

| Trường                   | Quy ước                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| schemaVersion            | Hiện chỉ nhận `1`; thay representation cần version/migration rõ ràng                                |
| contentVersion           | Số nguyên dương; tăng khi thay ID/thứ tự bước/thuật toán/trạng thái có ảnh hưởng tiến độ sau này    |
| id, slug                 | ID ổn định, chữ thường/số/gạch nối; duy nhất trong catalog                                          |
| puzzleId                 | Chỉ `3x3`; không giả định notation/model của puzzle khác tương thích                                |
| status                   | `draft` hoặc `published`; sample là draft, không tạo tính năng UI khi chỉ có data                   |
| orientation              | `white-up-green-front`: tâm trắng U trên, xanh lá F trước                                           |
| title, summary           | Văn bản thuần; không HTML/MDX/executable content                                                    |
| prerequisiteIds          | Tham chiếu ID bài trong cùng catalog; không tự tham chiếu/thiếu/vòng lặp                            |
| objectives               | 1–16 mục tiêu có ID riêng và mô tả; mọi mục tiêu phải được ít nhất một bước tham chiếu              |
| initialState, finalState | Fixture đầu/kết bài, phải khả thi vật lý; kết bài không bắt buộc solved vì có thể là bài trung gian |
| steps                    | 1–32 bước, ID riêng trong bài; title, kind, instructions, objectiveIds, algorithm, before, after    |

Bước `observe` có algorithm rỗng, không tạo nước đi giả và phải giữ nguyên trạng thái. Bước `moves` có 1–256 nước, theo grammar core hiện có: U/R/F/D/L/B với prime hoặc 2; không wide move, rotation, macro hoặc nhóm lặp. Mỗi bài tối đa 2048 nước; text tối đa 2000 ký tự/trường, algorithm tối đa 2048 ký tự/bước. Schema từ chối trường lạ để tránh typo bị bỏ qua.

## Kiểm chứng bắt buộc

1. Kiểm schema/version/ID/kiểu/giới hạn và mục tiêu.
2. Deserialize mọi fixture rồi kiểm cấu trúc cùng tính khả thi cubie/flip/twist/parity bằng core.
3. `before` bước đầu phải bằng `initialState`; bước sau bằng `after` bước trước.
4. Parse toàn bộ algorithm, không nhận một phần hợp lệ trước token lỗi. Chuẩn hóa prime/whitespace sau khi parse.
5. Áp dụng moves lên `before` và yêu cầu kết quả chính xác bằng fixture `after` do tác giả cung cấp.
6. `after` cuối phải bằng `finalState`; mọi objective có bước tham chiếu.
7. Catalog kiểm unique id/slug, tồn tại/chu trình prerequisite. Bài published không được phụ thuộc bài draft.

Không tự sinh fixture `after` từ algorithm trong validator vì sẽ biến phép kiểm chứng thành tự khẳng định. Bài mẫu dùng serialization solved và U-turn tường minh, cùng quy ước đã đối chiếu fixture core. Sample gồm quan sát → U → U′, trở về solved; đây là bài tập đọc ký hiệu và đảo một nước, với trạng thái khởi đầu cố định.

`LessonValidationError.issue` là object frozen `{ path, code, message }`, chỉ lỗi đầu tiên; không trả lesson hợp lệ một phần. Path riêng cho parse một bài (`lesson.steps[1].after`) và import catalog (`lessons[0].steps[1].after`) giúp tác giả tìm chỗ sửa. Tham chiếu prerequisite chỉ được giải quyết đầy đủ bằng `parseLessonCatalog`, không thể xác nhận sự tồn tại chỉ từ `parseLesson` riêng lẻ.

Compiled data được tạo mới/freeze sâu, không giữ tham chiếu mutable của source. Không có timer, Worker, DOM, React hoặc Three trong module schema. Phụ thuộc domain chỉ là core 3×3; không gọi solver, không nhận output solver làm nội dung bài học. Kiểm chứng transition không đánh giá chất lượng lời giải thích hay việc người học đã nắm được mục tiêu; review nội dung vẫn cần thiết.

## Tích hợp giai đoạn tiếp theo

Task 12.2 có thể hiển thị từng bước từ catalog đã validate; chỉ route/data published mới nên xuất hiện trong liên kết bài học. Khi UI có thật, cập nhật guard/binding và relatedLessons trong bách khoa cùng tests, không chỉ đổi status của sample.

Task 12.3 nối snapshot của từng bước với viewer/player, cùng khóa lưu tiến độ dựa trên ID + contentVersion. Chưa lưu localStorage, tự chuyển bước hoặc dùng trạng thái mô hình đang chơi làm baseline trong 12.1.

Mẫu hiện được Vitest import qua catalog và kiểm tra trong Quality checks. Production build typecheck schema nhưng không import/publish bài mẫu lên UI ở task này. Không thêm dependency hoặc thay các route hiện có.

## Kiểm tra

`pnpm test`: bài mẫu, freeze/copy, normalization, observe/moves, partial lesson chưa solved, cap queue/total budget, trạng thái bất khả thi/sai transition/đứt chuỗi, ID/objective lỗi, grammar lỗi, catalog duplicate/missing/cycle/draft prerequisite và capability chưa công bố.

`pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build`; toàn bộ 42 E2E hiện có vẫn chạy trong CI để giữ regression gate. Không thêm browser test cho schema thuần; UI bài học sẽ có E2E ở task 12.2.
