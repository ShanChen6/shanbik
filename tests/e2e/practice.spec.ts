import { test as base, expect, type Page } from "@playwright/test";

// Each scenario fails on unhandled browser errors; no application test-only routes.
const test = base.extend<{ browserErrors: void }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const player = (page: Page) =>
  page.getByRole("region", { name: "Player chuỗi", exact: true });
const model = (page: Page) =>
  page.getByLabel("Trạng thái mô hình", { exact: true });
async function enterMixedInput(page: Page) {
  await button(page, "Thêm vào hàng đợi").click();
  await expect(model(page)).toContainText("Mô hình chưa solved.");
  await button(page, "Lấy màu từ mô hình").click();
  await expect(
    page.getByText("Đã nhập 54/54 ô", { exact: false }),
  ).toBeVisible();
}

test("quick start links to practice and explains the three reset actions", async ({
  page,
}) => {
  await page.goto("/help#quick-start");
  const guide = page.getByRole("region", {
    name: "Bắt đầu nhanh",
    exact: true,
  });
  await expect(
    guide.getByRole("heading", { name: "Bắt đầu nhanh", exact: true }),
  ).toBeVisible();
  await expect(guide).toContainText("Về đầu chuỗi");
  await expect(guide).toContainText("Đặt lại khối");
  await expect(guide).toContainText("Bắt đầu lại buổi tập");
  await guide
    .getByRole("link", { name: "Mở trang luyện tập", exact: true })
    .click();
  await expect(page).toHaveURL(/\/practice$/);
  await expect(button(page, "Lấy màu từ mô hình")).toBeEnabled();
});

test("real scramble → capture → cubing solver → player → solved → reset", async ({
  page,
}) => {
  await page.goto("/practice");
  await button(page, "Tạo scramble mới").click();
  await button(page, "Áp dụng scramble").click();
  await expect(player(page)).toContainText("Đã thực hiện 25/25 bước.", {
    timeout: 30_000,
  });
  await button(page, "Lấy màu từ mô hình").click();
  await button(page, "Giải bản nhập").click();
  await expect(button(page, "Nạp lời giải vào player")).toBeVisible({
    timeout: 70_000,
  });
  await button(page, "Nạp lời giải vào player").click();
  await expect(player(page)).toContainText("Đã thực hiện 0/");
  await player(page)
    .getByRole("button", { name: "Bước tiếp", exact: true })
    .click();
  await expect(player(page)).toContainText("Đã thực hiện 1/");
  await expect(
    player(page).getByRole("button", { name: "Bước lùi", exact: true }),
  ).toBeEnabled();
  await player(page)
    .getByRole("button", { name: "Bước lùi", exact: true })
    .click();
  await expect(player(page)).toContainText("Đã thực hiện 0/");
  await player(page)
    .getByRole("button", { name: "Phát chuỗi", exact: true })
    .click();
  await expect(model(page)).toContainText("Mô hình đã solved.", {
    timeout: 30_000,
  });
  await button(page, "Về đầu chuỗi").click();
  await expect(model(page)).toContainText("Mô hình chưa solved.");
  await button(page, "Bắt đầu lại buổi tập").click();
  await expect(model(page)).toHaveText("Mô hình đã solved.");
  await expect(player(page)).toHaveCount(0);
  await expect(
    page.getByText("Đã nhập 6/54 ô", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Chuỗi scramble", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("invalid input preserves colors; solved input never requests solver assets", async ({
  page,
}) => {
  let workerRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/solver-worker/")) workerRequests++;
  });
  await page.goto("/practice");
  await button(page, "Giải bản nhập").click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Khối chưa hợp lệ" }),
  ).toBeVisible();
  await expect(
    page.getByText("Đã nhập 6/54 ô", { exact: false }),
  ).toBeVisible();
  await button(page, "Điền mẫu solved").click();
  await button(page, "Giải bản nhập").click();
  await expect(
    page.getByText("Khối đã solved. Không cần chạy solver", { exact: false }),
  ).toBeVisible();
  await expect(button(page, "Nạp lời giải vào player")).toHaveCount(0);
  expect(workerRequests).toBe(0);
});

test("cancel initialization, preserve input, then retry with a real Worker", async ({
  page,
}) => {
  await page.route("**/solver-worker/solver.worker.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "self.onmessage = () => {};",
    }),
  );
  await page.goto("/practice");
  await enterMixedInput(page);
  await button(page, "Giải bản nhập").click();
  await expect(
    page.getByText("Đang khởi tạo solver…", { exact: false }),
  ).toBeVisible();
  await button(page, "Hủy tìm lời giải").click();
  await expect(button(page, "Thử giải lại")).toBeDisabled();
  await expect(
    page.getByText("Đã nhập 54/54 ô", { exact: false }),
  ).toBeVisible();
  await page.unroute("**/solver-worker/solver.worker.js");
  await expect(button(page, "Thử giải lại")).toBeEnabled();
  await button(page, "Thử giải lại").click();
  await expect(button(page, "Nạp lời giải vào player")).toBeVisible({
    timeout: 70_000,
  });
});

test("blocked Worker reports a recoverable error without losing the draft", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.Worker = class {
      constructor() {
        throw Error("Blocked for E2E");
      }
    } as unknown as typeof Worker;
  });
  await page.goto("/practice");
  await enterMixedInput(page);
  await button(page, "Giải bản nhập").click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Không khởi chạy được" }),
  ).toBeVisible();
  await expect(
    page.getByText("Đã nhập 54/54 ô", { exact: false }),
  ).toBeVisible();
  await expect(button(page, "Thử giải lại")).toBeEnabled();
  await expect(model(page)).toContainText("Mô hình chưa solved.");
});

test("without WebGL manual input and solved validation remain usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      return type === "webgl" || type === "webgl2"
        ? null
        : original.call(this, type, ...args);
    } as typeof original;
  });
  await page.goto("/practice");
  await expect(button(page, "Lấy màu từ mô hình")).toBeDisabled();
  await button(page, "Điền mẫu solved").click();
  await button(page, "Giải bản nhập").click();
  await expect(
    page.getByText("Khối đã solved. Không cần chạy solver", { exact: false }),
  ).toBeVisible();
  await button(page, "Bắt đầu lại buổi tập").click();
  await expect(
    page.getByText("Đã nhập 6/54 ô", { exact: false }),
  ).toBeVisible();
});
