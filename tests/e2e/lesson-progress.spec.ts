import { test as base, expect } from "@playwright/test";
import { LESSONS } from "../../src/features/learn/lessons/catalog";
import { progressKey } from "../../src/features/learn/lessons/progress";
const lesson = LESSONS[0],
  key = progressKey(lesson),
  route = `/learn/lessons/${lesson.slug}`;
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
test("lesson progress: restore without URL, explicit link priority, invalid link preservation and clear", async ({
  page,
}) => {
  await page.goto(`${route}?step=turn-u`);
  await expect(
    page.getByLabel("Vị trí học đã lưu", { exact: true }),
  ).toContainText("Đã lưu");
  await page.goto(route);
  await expect(
    page.getByRole("combobox", { name: "Chọn bước học", exact: true }),
  ).toHaveValue("turn-u");
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Chọn bước học", exact: true }),
  ).toHaveValue("turn-u");
  await page.goto(`${route}?step=undo-u`);
  await expect(
    page.getByLabel("Vị trí học đã lưu", { exact: true }),
  ).toContainText("Đã lưu");
  await page.goto(`${route}?step=missing`);
  await expect(
    page.getByRole("combobox", { name: "Chọn bước học", exact: true }),
  ).toHaveValue("observe-u");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).stepId,
      key,
    ),
  ).toBe("undo-u");
  await page.goto(route);
  await expect(
    page.getByRole("combobox", { name: "Chọn bước học", exact: true }),
  ).toHaveValue("undo-u");
  await page.evaluate(() => localStorage.setItem("qa-unrelated", "keep"));
  await page
    .getByRole("button", { name: "Xóa vị trí đã lưu", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Chọn bước học", exact: true }),
  ).toHaveValue("observe-u");
  await expect(
    page.getByLabel("Vị trí học đã lưu", { exact: true }),
  ).toContainText("Đã xóa");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("qa-unrelated"))).toBe(
    "keep",
  );
  await page.goto(route);
  await expect(
    page.getByRole("combobox", { name: "Chọn bước học", exact: true }),
  ).toHaveValue("observe-u");
});
test("lesson progress: malformed/versioned storage and blocked writes keep the reader usable", async ({
  page,
}) => {
  await page.addInitScript(
    (key) =>
      localStorage.setItem(
        key,
        '{"schemaVersion":1,"lessonId":"intro-u-turn","contentVersion":999,"stepId":"undo-u"}',
      ),
    key,
  );
  await page.goto(route);
  await expect(
    page.getByLabel("Vị trí học đã lưu", { exact: true }),
  ).toContainText("không hợp lệ");
  await expect(
    page.getByRole("combobox", { name: "Chọn bước học", exact: true }),
  ).toHaveValue("observe-u");
  // Simulate quota failure after the existing storage read.
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("shanbik:lesson-progress:"))
        throw Error("Quota blocked");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("link", { name: "Bước tiếp", exact: true }).click();
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveText("U");
  await expect(
    page.getByLabel("Vị trí học đã lưu", { exact: true }),
  ).toContainText("Không truy cập");
});
test("lesson viewer: play/replay/reset, change active step and handle context loss", async ({
  page,
}) => {
  await page.goto(`${route}?step=turn-u`);
  const viewer = page.getByRole("region", {
    name: "Minh họa bước học",
    exact: true,
  });
  await expect(
    viewer.getByRole("button", { name: "Phát minh họa", exact: true }),
  ).toBeEnabled();
  await viewer
    .getByRole("button", { name: "Phát minh họa", exact: true })
    .click();
  await expect(
    page.getByLabel("Trạng thái minh họa", { exact: true }),
  ).toContainText("Đã xoay 1/1");
  await expect(
    page.getByLabel("Trạng thái minh họa", { exact: true }),
  ).toContainText("Đã tới trạng thái sau");
  await viewer
    .getByRole("button", { name: "Phát lại minh họa", exact: true })
    .click();
  await page.getByRole("link", { name: "Bước tiếp", exact: true }).click();
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveText("U'");
  await expect(
    viewer.getByRole("button", { name: "Phát minh họa", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByLabel("Trạng thái minh họa", { exact: true }),
  ).toContainText("Đã xoay 0/1");
  await viewer.getByRole("button", { name: "Nước tiếp", exact: true }).click();
  await expect(
    page.getByLabel("Trạng thái minh họa", { exact: true }),
  ).toContainText("Đã xoay 1/1");
  await viewer
    .getByRole("button", { name: "Về trước bước", exact: true })
    .click();
  await expect(
    page.getByLabel("Trạng thái minh họa", { exact: true }),
  ).toContainText("Đã xoay 0/1");
  await viewer
    .locator("canvas")
    .evaluate((canvas) =>
      (canvas as HTMLCanvasElement)
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext(),
    );
  await expect(
    viewer.getByText("Không thể hiển thị mô hình 3D", { exact: true }),
  ).toBeVisible();
  await expect(
    viewer.getByRole("button", { name: "Phát minh họa", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("figure", { name: "Trạng thái sau", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).stepId,
      key,
    ),
  ).toBe("undo-u");
});
test("lesson viewer: unavailable storage and WebGL still allow reading and step navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key.startsWith("shanbik:lesson-progress:"))
        throw Error("Storage denied");
      return get.call(this, key);
    };
    const context = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      return type === "webgl" || type === "webgl2"
        ? null
        : context.call(this, type, ...args);
    } as typeof context;
  });
  await page.goto(route);
  await expect(
    page.getByLabel("Vị trí học đã lưu", { exact: true }),
  ).toContainText("Không truy cập");
  await page.getByRole("link", { name: "Bước tiếp", exact: true }).click();
  await expect(
    page.getByLabel("Thuật toán bước hiện tại", { exact: true }),
  ).toHaveText("U");
  await expect(
    page
      .getByRole("region", { name: "Minh họa bước học", exact: true })
      .getByText("Không thể hiển thị mô hình 3D", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("figure", { name: "Trạng thái trước", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
