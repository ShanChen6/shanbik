# ShanBik — Kiến trúc hiện trạng (Task 2.1)

## Phạm vi và bằng chứng

Kiểm kê source/config trên `develop` tại commit `bc35587a44651bc96cc5ed4389bbc9dbc7992f6f` ngày 26/10/2026. Báo cáo là snapshot tại commit này; không khẳng định trạng thái production hay cấu hình GitHub ngoài repository.

Task này chỉ thêm tài liệu, không cài package, sửa source/schema hoặc lựa chọn solver/backend. Kết quả chạy kiểm tra ở Task 0 là lịch sử; không được coi là lần chạy lại trong Task 2.1.

## 1. Tóm tắt

- Đã có ứng dụng Next.js App Router một package, TypeScript, React và Tailwind CSS.
- Trang `/` hiển thị tên ShanBik và trạng thái “Đang xây dựng”, chưa có tính năng Rubik.
- Các domain đã có thư mục giữ chỗ; chưa có core, renderer, Worker, storage hoặc dịch vụ ngoài.
- Lệnh chất lượng local có trong package.json; chưa có CI workflow, test case hoặc Playwright.
- Roadmap, đặc tả MVP và backlog đã nằm trong repository.

## 2. Stack và phiên bản

Phiên bản resolved đọc từ phần importer gốc trong [pnpm-lock.yaml](../../pnpm-lock.yaml); khai báo từ [package.json](../../package.json).

| Thành phần                | Khai báo / phiên bản resolved | Bằng chứng                        |
| ------------------------- | ----------------------------- | --------------------------------- |
| Next.js                   | 16.4.3                        | package.json, pnpm-lock.yaml      |
| React / React DOM         | 19.3.0                        | package.json, pnpm-lock.yaml      |
| TypeScript                | ^5 / 5.9.3                    | package.json, pnpm-lock.yaml      |
| Tailwind CSS              | ^4 / 4.3.3                    | package.json, pnpm-lock.yaml      |
| Tailwind Turbopack loader | ^4 / 4.3.3                    | package.json, next.config.ts      |
| ESLint                    | ^9 / 9.39.5                   | package.json, pnpm-lock.yaml      |
| eslint-config-next        | 16.4.3                        | package.json                      |
| Prettier                  | ^3.9.10 / 3.9.10              | package.json, pnpm-lock.yaml      |
| Vitest                    | ^5.0.5 / 5.0.5                | package.json, pnpm-lock.yaml      |
| Node.js                   | >=24 <25; .nvmrc: 24          | package.json, .nvmrc              |
| pnpm                      | 11.25.0                       | packageManager trong package.json |

Đây là phiên bản trong repo, không phải khuyến nghị nâng cấp hoặc kết luận tất cả package là bản mới nhất. Có lockfile và README hướng dẫn install frozen lockfile. `pnpm-workspace.yaml` chỉ chứa cấu hình `allowBuilds` cho sharp/unrs-resolver; không có khai báo workspace packages, nên không có bằng chứng repo đang là monorepo.

## 3. Cấu trúc và trạng thái implementation

| Đường dẫn                                | Hiện trạng                                                            |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `src/app/layout.tsx`                     | Root layout, lang=vi, metadata title/description, import CSS toàn cục |
| `src/app/page.tsx`                       | Trang chủ tĩnh; semantic main/section/h1 và Tailwind utilities        |
| `src/app/globals.css`                    | Import Tailwind, palette nền light, font hệ thống, box sizing         |
| `src/components/`                        | Chỉ .gitkeep; chưa có UI primitives                                   |
| `src/features/cube/`                     | Chỉ .gitkeep; chưa có cube core hoặc renderer                         |
| `src/features/timer/`                    | Timer (Tuần 15), lịch sử IndexedDB/penalty/undo (Tuần 16)             |
| `src/features/learn/`                    | Chỉ .gitkeep; chưa có lesson engine                                   |
| `src/features/encyclopedia/`             | Chỉ .gitkeep; chưa có schema nội dung                                 |
| `src/features/competitions/`             | Chỉ .gitkeep; chưa có giải đấu                                        |
| `src/features/account/`                  | Chỉ .gitkeep; chưa có auth/sync                                       |
| `src/lib/`, `src/styles/`                | Chỉ .gitkeep; chưa có helper/style chung tại đây                      |
| `docs/architecture.md`                   | Nguyên tắc kiến trúc ban đầu và các quyết định còn mở                 |
| `docs/product/mvp-spec.md`               | Phạm vi MVP, personas, stories, flows và mục tiêu đo                  |
| `docs/product/implementation-backlog.md` | Task/dependency/acceptance, validation trước solver                   |
| `docs/roadmap/`                          | Roadmap và prompt, không phải bằng chứng feature đã được code         |

Không có route ứng dụng cho luyện tập, học hoặc API trong danh sách file tracked ở snapshot này. Thư mục domain không đồng nghĩa module đã được triển khai.

## 4. Luồng chạy hiện tại và ranh giới dự kiến

**Hiện tại:** App Router nhận request `/`, root layout cung cấp HTML tiếng Việt/metadata/CSS, HomePage trả nội dung tĩnh. Hai component không có `use client`, event handler, fetch hoặc storage. Chưa có luồng dữ liệu nghiệp vụ.

**Hướng thiết kế đã ghi trong docs/architecture.md:**

| Lớp                     | Trách nhiệm dự kiến                                       | Đã triển khai?         |
| ----------------------- | --------------------------------------------------------- | ---------------------- |
| UI / App Router         | Route, layout, form, phản hồi thao tác                    | Chỉ trang chủ scaffold |
| Cube core               | State, notation, moves, validation thuần TypeScript       | Chưa                   |
| Renderer adapter        | Đọc state và hiển thị/animate; không giữ model cạnh tranh | Chưa                   |
| Solver adapter / Worker | Snapshot, request ID, giải ngoài main thread              | Chưa                   |
| Persistence             | Local solve/progress rồi mới cloud sync                   | Chưa                   |
| Dịch vụ ngoài           | Auth/database/competition source                          | Chưa                   |

Ranh giới cốt lõi: UI gọi domain qua API/adapter; cube core không import React, DOM hoặc Three.js. Renderer và solver tuân cùng serialization/quy ước mặt. Đây là định hướng cần ADR, chưa có code để xác minh tính tuân thủ.

## 5. Cấu hình framework và code

- [next.config.ts](../../next.config.ts): bật `cacheComponents` và `partialPrefetching`; cấu hình loader `@tailwindcss/turbopack` cho CSS. Chưa có dữ liệu động để đánh giá cache thực tế; không suy luận rằng đã có ISR chiến lược.
- [tsconfig.json](../../tsconfig.json): strict, noEmit, bundler resolution, alias `@/*` → `src/*`, include generated Next types; allowJs/skipLibCheck cũng đang bật.
- [AGENTS.md](../../AGENTS.md): yêu cầu đọc guide của Next được cài ở `node_modules/next/dist/docs/` trước khi sửa code, vì convention có thể thay đổi.
- Chưa có state library, form library, schema validator hoặc component library trong dependencies trực tiếp.
- Chưa có design tokens đầy đủ/dark theme; màu hiện hardcode trong CSS và utility của trang chủ. Không xem đây là hệ thống thương hiệu đã được duyệt.

## 6. Scripts và chất lượng

| Script       | Lệnh thực tế                 | Ý nghĩa / giới hạn                            |
| ------------ | ---------------------------- | --------------------------------------------- |
| dev          | next dev                     | Chạy phát triển                               |
| build        | next build                   | Tạo production build                          |
| start        | next start                   | Chạy build đã tạo                             |
| lint         | eslint                       | Flat config Next core-web-vitals + TypeScript |
| typecheck    | next typegen && tsc --noEmit | Sinh route types trước khi kiểm tra TS        |
| test         | vitest run                   | Node environment, passWithNoTests=true        |
| format       | prettier --write .           | Có sửa file, chỉ chạy khi muốn format         |
| format:check | prettier --check .           | Kiểm định dạng                                |

Bằng chứng: [package.json](../../package.json), [eslint.config.mjs](../../eslint.config.mjs), [vitest.config.mts](../../vitest.config.mts), [.prettierrc.json](../../.prettierrc.json), [.prettierignore](../../.prettierignore).

- Không có file test/spec tracked, fixtures hoặc Playwright config.
- Vitest được phép thoát thành công khi không có test. Điều này phù hợp scaffold nhưng không chứng minh core/solver đúng; cần test thật ở Task 4 trở đi.
- Prettier bỏ qua `docs/roadmap/`, lockfile, coverage, node_modules và .next; product/architecture docs vẫn thuộc kiểm tra định dạng.
- Không có Husky/lint-staged hoặc hook config trong repo.
- Không có `.github/workflows/`: chưa có CI được định nghĩa bằng source. Không kết luận về external CI từ kiểm kê này.

## 7. Môi trường, persistence và secrets

- README mô tả localhost:3000; chưa có cấu hình staging/production, hosting hoặc workflow deploy tracked.
- Chưa có `.env.example`, biến môi trường ứng dụng, truy cập `process.env`, SDK backend hoặc credential trong source app đã đọc. Task 0 chưa cần env.
- [.gitignore](../../.gitignore) loại trừ `.env*` với ngoại lệ file example, private key/credential patterns, build, dependencies, logs và local DB.
- Gitignore không thay thế secret scanning hoặc thu hồi secret đã lộ; Task 2.1 không phải kiểm tra lịch sử secret đầy đủ.
- Chưa có API route, database schema/migration, ORM, auth, IndexedDB/localStorage hoặc camera code.

## 8. Quy trình Git và trạng thái tài liệu

[CONTRIBUTING.md](../../CONTRIBUTING.md) quy định branch task từ develop → PR develop → kiểm thử tích hợp → PR develop vào main. Bảo vệ nhánh/Rulesets thuộc GitHub settings; không thể xác minh chỉ từ file quy trình. Báo cáo này không khẳng định chúng đã bật.

README vẫn ghi “Task tiếp theo 1.1” và mvp-spec ghi “chờ review” dù PR 1.1 đã merge; backlog cũng là snapshot planned. Đây là độ trễ tài liệu, không phải tính năng thiếu. Task 2.1 ghi nhận, không sửa trạng thái các tài liệu khác trong lượt audit này. Các cập nhật sau nên dẫn commit/PR để tránh trạng thái kế hoạch bị hiểu là hiện trạng.

## 9. Khoảng trống và hành động tiếp theo

| Mục                                 | Tác động                                                | Task xử lý                                 |
| ----------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| CI chưa có                          | Kiểm tra local chưa thành gate tự động trên PR          | 2.2                                        |
| Các quyết định mới ở mô tả chung    | Chưa có ADR truy vết lựa chọn/hệ quả                    | 2.3                                        |
| Vitest không có test case           | Không có bằng chứng đúng cho puzzle logic               | 4.1–4.3 và 9.x                             |
| Chưa UI primitives/tokens           | Chưa có giao diện thống nhất cho input/player           | 3.1–3.3                                    |
| Chưa core, renderer, Worker         | Chưa có luồng luyện tập hoạt động                       | 4–10                                       |
| Chưa đo hiệu năng/thiết bị mục tiêu | Chưa thể cam kết solver/FPS/timeout                     | 9.2, 10.3                                  |
| README/status có độ trễ             | Người mới có thể chọn sai bước tiếp theo                | Cập nhật docs trong task tiếp theo phù hợp |
| Chưa xác minh branch protection     | Có quy trình tài liệu nhưng chưa chứng minh enforcement | Chủ repo kiểm tra GitHub settings          |

## 10. Danh sách ADR cần lập

1. Next App Router/client boundary và ảnh hưởng cacheComponents/partialPrefetching.
2. Quy ước cube state/serialization và boundary UI/core/renderer.
3. Renderer 3D, tải động, WebGL fallback và cleanup.
4. Worker protocol/solver adapter; lựa chọn solver cuối cùng chờ spike 9.2.
5. Kiến trúc kiểm thử Node/browser/fixtures và CI gates.
6. Persistence guest/local → cloud; backend/auth tiếp tục mở đến khi có nhu cầu và khảo sát.

Đề xuất cấu trúc tương lai trong mỗi domain: `core/`, `adapters/`, `components/` khi có code tương ứng. Không tạo lớp hoặc thư mục chỉ để đủ sơ đồ. Registry capability render/scramble/solve cần thiết khi mở rộng puzzle, không giả định solver 3×3 dùng được cho mọi loại.

## 11. Kiểm tra thực hiện trong Task 2.1

- Liệt kê file tracked, đọc manifest/lockfile, config, toàn bộ source app và tài liệu kiến trúc/quy trình.
- Đối chiếu stack resolved với importer gốc trong lockfile.
- Kiểm tra liên kết tương đối nội bộ trong báo cáo và định dạng Markdown.
- Không chạy lại lint/typecheck/test/build ứng dụng vì chỉ thêm tài liệu; không báo các lệnh đó là pass của task này.

**Kết luận:** repo đủ scaffold để tiếp tục **Task 2.2 — CI và chất lượng code**; chưa đủ để sử dụng sản phẩm Rubik. Lựa chọn renderer/solver/backend cần ADR hoặc spike tương ứng.
