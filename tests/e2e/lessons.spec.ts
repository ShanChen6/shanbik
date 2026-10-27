import AxeBuilder from "@axe-core/playwright";
import { test as base, expect } from "@playwright/test";
const test = base.extend<{ errors: void }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
const route = "/learn/lessons/lam-quen-u-va-u-prime";
test("lesson: discover, read observe/U/prime, go back and revisit the start", async ({
  page,
}) => {
  await page.goto("/learn");
  await page.getByRole("link", { name: "Mở bài U và U′", exact: true }).click();
  await expect(page).toHaveTitle("Làm quen với U và U′ — Học Rubik ShanBik");
  await expect(
    page.getByRole("button", { name: "Bước trước", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Chỉ quan sát, không có nước xoay trong bước này.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Bước tiếp", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Thực hiện U", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveText("U");
  const rightAfter = page.getByRole("list", {
    name: "Mặt R — Trạng thái sau",
    exact: true,
  });
  await expect(rightAfter.getByRole("listitem").first()).toHaveAttribute(
    "aria-label",
    "Hàng 1, cột 1: Xanh dương",
  );
  await page.getByRole("link", { name: "Bước tiếp", exact: true }).click();
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveText("U'");
  await expect(
    page.getByRole("button", { name: "Bước tiếp", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Bước trước", exact: true }).click();
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveText("U");
  await page.getByRole("link", { name: "Về đầu bài", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Bước trước", exact: true }),
  ).toBeDisabled();
});
test("lesson: stable URL step, reload/history, invalid steps and cold unknown slug", async ({
  page,
}) => {
  await page.goto(`${route}?step=turn-u`);
  await expect(
    page.getByRole("combobox", { name: "Chọn bước học", exact: true }),
  ).toHaveValue("turn-u");
  await page
    .getByRole("combobox", { name: "Chọn bước học", exact: true })
    .selectOption("undo-u");
  await expect(page).toHaveURL(/step=undo-u/);
  await page.reload();
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveText("U'");
  await page.goBack();
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveText("U");
  await page.goForward();
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveText("U'");
  await page.goto(`${route}?step=constructor`);
  await expect(
    page.getByText("Liên kết bước chưa hợp lệ.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Chọn bước học", exact: true }),
  ).toHaveValue("observe-u");
  const response = await page.goto(
    `/learn/lessons/missing-${test.info().project.name}`,
  );
  expect(response?.status()).toBe(404);
});
test("lesson: reading without WebGL, responsive states and accessible dark mode", async ({
  page,
}) => {
  let worker = 0;
  page.on("request", (request) => {
    if (request.url().includes("/solver-worker/")) worker++;
  });
  await page.addInitScript(() => {
    localStorage.setItem("shanbik-theme", "dark");
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
  await page.goto(`${route}?step=turn-u`);
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveText("U");
  for (const width of [320, 360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(worker).toBe(0);
  await page.goto("/puzzles/3x3");
  await page
    .getByRole("region", { name: "Bài học liên quan", exact: true })
    .getByRole("link", { name: "Làm quen với U và U′", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(route));
});
