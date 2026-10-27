# Validation tính khả thi 3×3 — Task 9.1b

## Hợp đồng

`core/feasibility.ts` xuất `validateCubeFeasibility(input: unknown)`. Đây là kiểm tra khối 3×3 tâm cố định theo quy ước URFDLB của core, không phải solver, không chỉnh sửa input hoặc mô hình đang phát.

1. Chạy `validateCubeStructure` trước: shape, sáu mặt/9 ô, màu được hỗ trợ, tâm cố định, số lượng màu.
2. Đọc 12 cạnh và 8 góc qua bảng facelet zero-based, row-major URFDLB. Mỗi slot trong bảng được unit test có các facelet cùng tọa độ hình học; tổng bảng phủ đúng 48 ô ngoài tâm.
3. Nhận diện cạnh theo hai thứ tự; góc chỉ theo ba phép quay vòng của bộ màu chuẩn. Thứ tự phản chiếu của góc bị từ chối, dù đúng ba màu và đúng số lượng toàn khối.
4. Kiểm kê mỗi cạnh/góc xuất hiện đúng một lần. Báo bộ màu không tồn tại, lặp và thiếu. Khi inventory sai, không suy diễn lỗi hướng hoặc parity từ tọa độ không hoàn chỉnh.
5. Khi inventory là song ánh, kiểm tra tổng eo chẵn, tổng co chia hết cho 3, parity ep bằng parity cp. Chỉ sau tất cả kiểm tra mới trả snapshot được xác nhận khả thi.

Quy ước tọa độ: `cp/co` theo URF,UFL,ULB,UBR,DFR,DLF,DBL,DRB; `ep/eo` theo UR,UF,UL,UB,DR,DF,DL,DB,FR,FL,BL,BR. Permutation là “piece tại slot”; orientation là độ lệch vòng từ bộ màu chuẩn. Các điều kiện trên cùng inventory đúng và thứ tự góc không phản chiếu kiểm tra khả năng đạt được bằng các nước xoay hợp lệ với tâm cố định.

### Kết quả

- Thất bại: `{valid:false, stage:"structure"|"cubies", issues}`; không trả `state`, serialization hoặc tọa độ một phần cho consumer dùng nhầm.
- Thành công: `{valid:true, state, serialization, cubies:{cp,co,ep,eo}}`; snapshot/các mảng frozen, serialization chuẩn qua core. Không đồng nghĩa đã tính lời giải.
- Codes vật lý: INVALID_EDGE, INVALID_CORNER, EDGE_INVENTORY, CORNER_INVENTORY, EDGE_FLIP, CORNER_TWIST, PARITY. Lỗi cấu trúc giữ code của validator hiện có.
- `stickers` là vị trí liên quan để người dùng kiểm tra, không khẳng định đó là duy nhất ô nhập sai. Parity không gán ô tùy tiện. Không tự lật/xoắn/hoán đổi để “sửa”.

`createCubeState` và `inspectFaceDraft` vẫn chỉ kiểm tra cấu trúc/số màu; consumer cần xác nhận khả thi phải gọi API mới. Không đổi hợp đồng cũ hoặc thêm dependency solver.

## UI

Nút **Kiểm tra khối** trong Nhập màu sáu mặt chạy kiểm tra vật lý khi đủ điều kiện cấu trúc. Input lỗi giữ nguyên màu, báo nguyên nhân bằng tiếng Việt; các vị trí liên quan được đánh dấu và có nút đưa focus tới ô đầu. Khi sửa một ô, kết quả cũ được gỡ để không giữ nhãn hợp lệ cho dữ liệu mới. Thành công phân biệt solved/chưa solved, nói rõ chưa gửi giải và không đổi player. Input vẫn hoạt động khi WebGL không khả dụng.

## Nguồn quy ước và kiểm chứng

- [Kociemba: Cubie level](https://kociemba.org/math/cubielevel.htm): quy ước vị trí/hướng và bảng F/R.
- [Kociemba: Coordinate level](https://kociemba.org/math/coordlevel.htm): ràng buộc tổng hướng cạnh/góc và permutation.
- [cubejs source](https://github.com/ldez/cubejs/blob/master/src/cube.coffee): đối chiếu quy ước facelet URFDLB. Không import solver hoặc sao chép implementation vào app.
- Bộ fixture độc lập cubejs 1.3.2 đã có trong core được tái dùng để xác minh trạng thái hợp lệ; bảng tọa độ F được kiểm tra với nguồn Kociemba.

Unit: solved, fixture cubejs, 2.000 prefix move sinh bằng seed cố định, phủ hình học 48 facelet, lật riêng từng cạnh, xoắn từng góc cả hai chiều, phản chiếu từng góc, cubie lặp/thiếu, bộ màu không tồn tại, một hoán vị cạnh/góc lẻ, odd parity khớp hợp lệ, cặp flip/twist cân bằng, cycle chẵn, shape/count/center sai, immutable result và draft integration/correction/serialization. Chạy lệnh chuẩn README; UI browser kiểm tra fixture lỗi/correction, không giữ success cũ, focus, mobile và không WebGL.

Tiếp theo: **9.2 — Solver spike và benchmark**. PR này phụ thuộc Task 9.1a (PR #25); không tự merge PR phụ thuộc.
