# CubeViewport 3D — Task 5.1–7.2

## Lựa chọn và phạm vi

Dùng Three.js 0.186.1 + React Three Fiber 9.8.2 với React 19.3 đang có; @types/three 0.186.0 là dev dependency. Package metadata của cả ba ghi license MIT; peer React của R3F hiện là >=19 <19.4. Không cài thêm Drei hoặc dependency mới. Task 6.1 dùng OrbitControls từ Three đã có để tính camera; chưa thêm solver hoặc camera nhận diện.

Tham khảo [Canvas/fallback](https://r3f.docs.pmnd.rs/api/canvas) và [installation/compatibility](https://r3f.docs.pmnd.rs/getting-started/installation). Build với các import hiện tại không cần thay next.config.ts. Nếu thêm add-on sau này, phải kiểm tra lại yêu cầu transpile/compatibility tương ứng.

Đây là lựa chọn cho prototype 3×3 tĩnh sau thử nghiệm build/WebGL; chưa phải kết luận hiệu năng thiết bị di động thực tế hoặc giải pháp renderer cho mọi puzzle.

## Ranh giới

| File                         | Vai trò                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `viewer/view-model.ts`       | Adapter dữ liệu thuần, đọc snapshot theo FACE_ORIENTATIONS, tạo 26 cubies và 54 sticker |
| `viewer/palette.ts`          | Ánh xạ màu domain sang màu hiển thị; độc lập theme thương hiệu                          |
| `viewer/cube-viewport.tsx`   | Client boundary, probe WebGL2 sau paint, loading/error/fallback, caption và legend      |
| `viewer/cube-scene.tsx`      | Canvas, camera, lighting và mesh; không giữ model puzzle thứ hai                        |
| `viewer/viewer-fallback.tsx` | Thông báo khả năng 3D không có/lỗi và link trợ giúp                                     |

Core không import renderer. Viewer không gọi solver hoặc tự áp dụng move; khi caller cung cấp state khác, adapter chỉ trình bày snapshot đó. Mặc định dùng snapshot solved bất biến. Trang /practice đã nối viewer; /help cập nhật mô tả khả năng hiện có.

```tsx
<CubeViewport />
// Hoặc <CubeViewport state={snapshot} /> với CubeState được validate ở boundary.
```

## Hình học và màu

- 26 cubies ở lưới -1/0/1, bỏ khối trung tâm 0,0,0.
- Body rộng 0.94, để khe phân cách; sticker phẳng bo góc ở ngoài body, tổng 54 sticker.
- Dùng chung 2 geometry (box/shape), 1 material thân và 6 material màu cho mỗi model; resource owner dispose khi model bị gỡ.
- Material sticker không tone-map để màu không đổi theo theme; ánh sáng chiếu vào thân khối. Mặt solved: trắng trên, xanh lá trước, đỏ phải theo core.
- Camera theo hướng [5,4,6], nhìn gốc tọa độ, khoảng cách tự căn theo khung; ánh sáng ambient/directional, không shadow/HDR/asset mạng.
- Legend có chữ cho cả sáu màu, canvas có nhãn và caption mô tả trạng thái xem tĩnh. Không dùng ảnh 3D để thay thế luồng học bằng văn bản.

## SSR, tải động và fallback

Next dynamic ssr=false được đặt trong Client Component. HTML server có placeholder với kích thước ổn định, không tạo canvas hoặc truy cập WebGL/window ở server. Sau paint, probe WebGL2 trên canvas tạm rồi chủ động lose context probe nếu extension hỗ trợ. Module scene chỉ render khi probe thành công.

Error boundary bao quanh scene để xử lý lỗi khởi tạo/render; Canvas cũng có fallback. Listener webglcontextlost chuyển sang thông báo thay thế và dọn listener khi scene rời cây. Người dùng vẫn mở được Trợ giúp/Học cơ bản khi 3D không dùng được. Không tự chuyển phép tính puzzle hoặc solver lên main thread làm fallback.

Canvas frameloop=demand, DPR từ 1 đến 1.5, không tự quay; Task 7.2 chỉ chạy frame trong lúc animation một move. Khung có chiều cao CSS clamp; theme chỉ đổi nền trang, không đổi màu sticker. Task 5.2 bổ sung responsive camera và reset; orbit/zoom/touch controls được bổ sung ở Task 6.1.

## Vòng đời và kiểm tra

Next có thể giữ route cũ dưới Activity ở trạng thái ẩn. Canvas ẩn còn trong DOM không tự chứng minh có leak. Kiểm tra phải phân biệt hidden route và removal thật:

1. Production: đi /practice → /learn → /practice nhiều lần; không có canvas nhìn thấy trên /learn, số canvas không tăng và buffer không tích lũy.
2. Development: mở /ui-preview, dùng “Hiện mô hình thử”/“Ẩn mô hình thử” để gỡ component thật. Fixture không có trên production (route trả 404).
3. Kiểm tra GPU buffer create/delete, canvas count, context loss và lỗi JavaScript; kiểm tra sau nhiều chu kỳ.

R3F quản lý renderer/root; model quản lý geometry/material dùng chung với dispose=null ở group để tránh disposal trùng. Model cleanup dispose tài nguyên sở hữu; listener context loss và requestAnimationFrame capability được gỡ/hủy ở cleanup.

## Bằng chứng Task 5.1

- Unit Node: adapter kiểm 26 cubies/54 sticker, 6 tâm/12 cạnh/8 góc, ánh xạ corner U/R/F và state sau R, immutable data/invalid state.
- Chromium 153 software WebGL: xem được cube thật; chụp và xem light/dark; kiểm 360×800, 768×1024, 1440×1000, 667×375 không tràn ngang.
- SSR không có canvas; Home không khởi tạo WebGL; viewer không tiếp tục draw khi đứng yên trong khoảng kiểm tra.
- Ba chu kỳ đổi route: mỗi lượt 8 buffers được tạo rồi 8 được xóa khi ẩn, live=0; khi quay lại có một canvas. Đây là tín hiệu tài nguyên đã đo, không phải heap audit toàn bộ browser.
- Mất WebGL context và WebGL bị vô hiệu hóa hiển thị fallback, link trợ giúp hoạt động; không có pageerror trong các kịch bản đã chạy.
- Build đo được một chunk chứa Three/WebGLRenderer: 918,927 bytes raw, 242,899 bytes gzip (ước lượng nén từ response). Không gọi đây là tổng tải trang hoặc số đo mạng/thiết bị thật.

Fixture development cũng đã chạy ba chu kỳ unmount/remount thật: mỗi lượt tạo 8 và xóa 8 GPU buffers, live=0 sau removal; giá trị input ở phần UI khác vẫn giữ nguyên, không có pageerror. Kết quả CI được ghi trong PR. Chưa đo FPS trên điện thoại thật, Safari/Firefox, screen reader thực tế hoặc Core Web Vitals. Không cam kết đạt mục tiêu hiệu năng toàn sản phẩm từ thử nghiệm software browser này.

## Responsive và reset — Task 5.2

Khung dùng container query theo chiều rộng figure (fallback `vw`), chiều cao clamp 17–28 rem, min-width=0 để không đẩy tràn grid. Có `touch-action: pan-y` cho cuộn dọc trang; chưa có gesture điều khiển camera.

`camera.ts` tính khoảng cách từ bounding sphere bao khối 3×3, thêm 12% khoảng trống và lấy góc hẹp hơn giữa horizontal/vertical FOV. `ResponsiveCamera` đọc kích thước thật từ R3F (ResizeObserver của Canvas), căn lại khi khung đổi kích thước hoặc nhận resetVersion; bỏ qua kích thước zero khi route ẩn. Không thêm listener resize riêng. Tại Task 5.2 camera giữ hướng trước/trên/phải; Task 6.1 cho phép orbit và giữ hướng/zoom tương đối khi resize. State và mesh không đổi khi reset. Nút “Đặt lại góc nhìn” là native button, dùng được bằng Enter/Space; disabled khi loading hoặc context đã mất.

DPR range 1–1.5 do R3F quản lý; demand rendering chỉ vẽ khi cần. Callback context loss ổn định, tránh tháo/gắn listener mỗi lần reset. Cleanup geometry/material vẫn thuộc model, renderer/root và event manager thuộc R3F; không gọi dispose renderer thủ công từ React effect vì route Activity có thể tái sử dụng root.

### Cách kiểm tra lại

1. Chạy các lệnh trong README; `camera.test.ts` chiếu tám góc khối qua PerspectiveCamera để xác nhận nằm trong frustum có khoảng trống, kiểm tra khung hẹp và hidden/invalid sizes.
2. `pnpm build && pnpm start`: mở /practice ở 320×568, 360×800, 768×1024, 1440×1000, 667×375. Trong DevTools đặt figure width=220px ngay trên desktop; khối vẫn đủ các góc và không tràn ngang. Đổi portrait/landscape, light/dark; kiểm canvas backing dimensions / CSS dimensions không vượt 1.5.
3. Dùng Tab → Enter/Space trên reset; vẫn một canvas và giữ nguyên state được truyền vào. Đi /learn rồi trở lại /practice ba lần; canvas ẩn có thể còn trong Activity nhưng số lượng/tài nguyên không tích lũy.
4. `pnpm dev`: /ui-preview → Hiện/Ẩn mô hình thử năm lần. Đo createBuffer/deleteBuffer, canvas event listeners, window resize listeners và resolution media-query listeners trước/sau. Không dùng số canvas ẩn để kết luận leak; removal thật phải về zero.
5. Dùng WEBGL_lose_context hoặc tắt WebGL để kiểm fallback; reset bị disabled khi mất context. Chờ cleanup rồi kiểm listener và pageerror.

### Bằng chứng Task 5.2

- 215 unit tests đạt, gồm 11 test camera mới; format/lint/typecheck/build được kiểm tra trong PR.
- Chromium 153, software WebGL, emulation DPR=3: năm viewport ở trên và parent=220px render đủ khối, không tràn ngang; backing DPR không vượt 1.5. Đã xem ảnh mobile 320px và parent hẹp.
- Reset bằng Enter tạo frame mới nhưng không tạo buffer/listener mới; không draw thêm trong khoảng idle đo 250ms.
- Năm lần removal thật: mỗi lần tạo/xóa 8 GPU buffers; sau chu kỳ cuối tổng 40/40, live=0. Canvas=0, viewer listeners=0, window resize và resolution listeners về baseline=0. Input không liên quan trong fixture giữ nguyên. Không có pageerror.
- Ba lần hide/show route production: live buffers về 0 khi ẩn, canvas không tích lũy; 13 listener của renderer/event manager và một resolution listener được giữ ở root ẩn, số lượng không tăng. Khi scene bị gỡ do mất context, các listener này về 0. Đây là hành vi giữ root của Activity, không gọi là full unmount.

Các số đo trên kiểm chứng vòng đời trong trình duyệt đại diện, chưa phải heap audit toàn bộ browser hoặc benchmark điện thoại thật. Safari/Firefox, touch trên thiết bị thật, frame time khi orbit/animation và Core Web Vitals còn cần đo khi có tính năng tương ứng.

## Điều khiển camera — Task 6.1

- Native buttons: Xoay trái/phải/lên/xuống (15° mỗi lần), Phóng to/Thu nhỏ, Đặt lại góc nhìn. Dùng Tab rồi Enter/Space; không bắt phím toàn trang. Reset chỉ đổi camera, không đổi snapshot puzzle.
- Nút toggle `aria-pressed` “Bật kéo và zoom” mặc định tắt. Khi bật: chuột trái kéo hoặc một ngón tay xoay; wheel/trackpad và pinch hai ngón zoom. Khi tắt, khung giữ `touch-action: pan-y`, wheel không bị chặn. Ngoài canvas luôn cuộn trang bình thường. Escape tắt gesture khi focus ở trong figure.
- Không pan target, không autoRotate, không damping/inertia/tween: mọi thao tác cập nhật trực tiếp và invalidate demand frame. Cách này cũng áp dụng khi prefers-reduced-motion=reduce.
- Khoảng cách giới hạn 0.75–2.2 lần khoảng cách fit hiện tại, polar angle 0.15–π−0.15; không đi xuyên tâm hoặc lật qua cực. Zoom gần có thể phóng một phần khối ngoài khung theo chủ ý; reset phục hồi fit toàn khối. Resize giữ hướng và tỉ lệ zoom so với khoảng cách fit mới.

### Tách math và input

`camera-controller.ts` dùng các public method của `three/addons/controls/OrbitControls.js` (rotateLeft/rotateUp/dollyIn/update). Chỉ dùng math; không gọi connect vào DOM. Adapter riêng gắn sáu listener vào đúng canvas khi người dùng bật gesture, dùng pointer capture cho drag và xử lý pointerup/cancel/lostcapture. Wheel listener passive=false chỉ tồn tại trong chế độ này. Chuẩn hóa delta pixel/line/page và chặn bước zoom quá lớn. Cleanup gỡ listener, thả capture còn lại và khôi phục touchAction cũ. Không thêm handler lên document/window và không giành phím từ input khác.

Đây cũng tránh phụ thuộc cleanup DOM của OrbitControls khi Next Activity hoặc React tháo canvas trước khi effect cleanup chạy. Instance math chỉ có subscription change→invalidate do adapter sở hữu; dispose gỡ subscription đó. Bridge onCameraReady cung cấp lệnh cho UI và được xóa khi cleanup; nút disabled trước khi scene sẵn sàng hoặc khi WebGL mất. CameraControls trong scene quản lý resize/gesture effect, không tạo state puzzle mới hoặc React render cho mỗi pointermove.

### Kiểm chứng Task 6.1

- 221 unit tests đạt, thêm sáu test cho orbit/zoom/reset, giới hạn sau 100 lệnh liên tiếp, giữ góc/zoom khi resize, hidden dimensions, cleanup subscription, drag/pinch/cancel và wheel normalization.
- Chromium 153 software WebGL: native button Enter/Space đổi camera; reset sau orbit/zoom trả modelViewMatrix về ban đầu. Chuột kéo và wheel đổi camera; Escape tắt gesture và listener count về baseline. Chụp/xem figure 360px không tràn ngang.
- CDP touch trên mobile emulation 390×844 DPR=3: một ngón orbit, pinch zoom, reset và mặc định kéo khung cuộn trang đều đạt. Khi bật gesture, kéo khung không làm trang cuộn. Đây không phải kiểm tra thiết bị touch thật hoặc trackpad phần cứng.
- Reduced-motion context: không draw thêm trong 250ms idle sau thao tác; camera không có quán tính/tự quay. Wheel khi gesture tắt cuộn trang; khi bật, wheel ngoài canvas vẫn cuộn trang.
- Ba lần unmount thật ngay giữa drag có pointer capture: mỗi chu kỳ 8 buffers tạo/xóa, tổng 24/24 và live=0. Canvas/viewport listeners về zero, window resize/DPR và document key listeners về baseline (document có bốn listener của UI sẵn từ trước). Input fixture giữ nguyên. Không có pageerror.
- Context loss hiển thị fallback và disable nút camera. Build/format/lint/typecheck được kiểm tra trong PR; không thay lockfile hoặc thêm dependency.

### Cách kiểm tra lại camera

Chạy /practice, thử tất cả native buttons bằng Tab/Enter/Space; orbit/zoom rồi reset. Bật gesture, kéo chuột trái, wheel/trackpad, kéo một ngón và pinch; thử kéo ra ngoài canvas rồi nhả/cancel. Tắt bằng toggle hoặc Escape khi focus trong figure. So sánh cuộn trang qua canvas khi tắt và ngoài canvas khi bật. Đổi viewport sau khi orbit/zoom để kiểm giữ hướng và zoom tương đối. Lặp /ui-preview Hiện/Ẩn mô hình thử trong lúc đang kéo để kiểm cleanup; fixture vẫn chỉ có ở development.

Task 7.1 đã bổ sung [move → layer mapping](./cube-move-layer.md), có kiểm chứng endpoint Three.js với core cho đủ 18 biến thể. Task 7.2 đã nối [animation một move](./cube-single-move.md), commit-once và hủy/reset/reduced motion. Task 7.3 đã bổ sung [FIFO, pause/resume và cancel queue](./cube-move-queue.md). Task 8.1 đã thêm [tạo/copy/áp dụng scramble luyện tập](./cube-scramble.md). Bước tiếp theo: **8.2 — Player controls**. Physical mobile/Safari/Firefox, trackpad thật và frame-time khi animation còn cần kiểm tra trên môi trường tương ứng.
