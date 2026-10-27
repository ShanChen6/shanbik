import AxeBuilder from "@axe-core/playwright";
import { test as base, expect } from "@playwright/test";
const test = base.extend<{ errors: void }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
const key = "shanbik:algorithm-favorites:v1";
test("formulas: discovery, accent/notation search, intersecting mobile filters and clipboard", async ({
  page,
}) => {
  await page.goto("/learn");
  await page
    .getByRole("link", { name: "Thư viện công thức", exact: true })
    .click();
  await expect(page).toHaveTitle("Thư viện công thức 3×3 — ShanBik");
  const list = page.getByRole("list", {
    name: "Danh sách công thức",
    exact: true,
  });
  await expect(list.getByRole("listitem")).toHaveCount(6);
  await page
    .getByRole("searchbox", { name: "Tìm công thức", exact: true })
    .fill("hoan vi chu T");
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(list).toContainText("PLL — T perm");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: "Copy PLL — T perm", exact: true })
    .click();
  await expect(list).toContainText("Đã copy công thức.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "R U R' U' R' F R2 U' R' U' R U R' F'",
  );
  await page.getByRole("searchbox").fill(" R   U R′ U’ ");
  await page.getByLabel("Nhóm", { exact: true }).selectOption("beginner");
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await page.getByLabel("Độ khó", { exact: true }).selectOption("advanced");
  await expect(
    page.getByRole("heading", { name: "Không có công thức phù hợp" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(list.getByRole("listitem")).toHaveCount(6);
  for (const width of [320, 360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("formulas: favorites survive reload, personal list removal and clear preserve unrelated data", async ({
  page,
}) => {
  await page.goto("/algorithms");
  await page
    .getByRole("button", { name: "Yêu thích OLL — Sune", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Yêu thích PLL — T perm", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Bỏ yêu thích OLL — Sune", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Yêu thích của tôi (2)", exact: true })
    .click();
  const list = page.getByRole("list", {
    name: "Danh sách công thức",
    exact: true,
  });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Bỏ yêu thích OLL — Sune", exact: true })
    .click();
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await page.evaluate(() => localStorage.setItem("qa-unrelated", "keep"));
  await page
    .getByRole("button", { name: "Xóa tất cả yêu thích", exact: true })
    .click();
  await expect(list.getByRole("listitem")).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("qa-unrelated"))).toBe(
    "keep",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Yêu thích của tôi (0)", exact: true }),
  ).toBeVisible();
});
test("formulas: malformed favorites recover, blocked storage/copy and missing WebGL remain usable", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "{bad-json");
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind,
      ...args
    ) {
      if (String(kind).includes("webgl")) return null;
      return original.call(this, kind, ...args);
    } as typeof original;
  }, key);
  await page.goto("/algorithms");
  await expect(
    page.getByLabel("Trạng thái lưu yêu thích", { exact: true }),
  ).toContainText("không hợp lệ");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("shanbik:algorithm-favorites:")) throw Error("Quota");
      return original.call(this, key, value);
    };
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw Error("Denied");
        },
      },
    });
  });
  await page
    .getByRole("button", { name: "Yêu thích Trigger tay phải", exact: true })
    .click();
  await expect(
    page.getByLabel("Trạng thái lưu yêu thích", { exact: true }),
  ).toContainText("Không thể lưu");
  await page
    .getByRole("button", { name: "Copy Trigger tay phải", exact: true })
    .click();
  await expect(
    page.getByText("Không thể copy tự động.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Minh họa Trigger tay phải", exact: true })
    .click();
  const preview = page.getByRole("region", {
    name: "Minh họa công thức",
    exact: true,
  });
  await expect(preview).toContainText("Không hiển thị được 3D.");
  await expect(
    preview.getByRole("button", { name: "Phát công thức", exact: true }),
  ).toBeDisabled();
  await preview
    .getByText("Xem sơ đồ trạng thái mẫu 2D", { exact: true })
    .click();
  await expect(
    preview.getByRole("figure", {
      name: "Trạng thái mẫu trước công thức",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("formulas: denied storage reads do not prevent personal list changes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key.startsWith("shanbik:algorithm-favorites:"))
        throw Error("Blocked");
      return original.call(this, key);
    };
  });
  await page.goto("/algorithms");
  await expect(
    page.getByLabel("Trạng thái lưu yêu thích", { exact: true }),
  ).toContainText("Không thể lưu");
  await page
    .getByRole("button", { name: "Yêu thích Trigger tay trái", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Yêu thích của tôi (1)", exact: true })
    .click();
  await expect(
    page
      .getByRole("list", { name: "Danh sách công thức", exact: true })
      .getByRole("listitem"),
  ).toHaveCount(1);
});
test("formulas: preview stays paused on selection, plays/replays/resets, switches and cancels on filtering", async ({
  page,
}) => {
  await page.goto("/algorithms");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Minh họa Trigger tay phải", exact: true })
    .click();
  const preview = page.getByRole("region", {
    name: "Minh họa công thức",
    exact: true,
  });
  await expect(
    preview.getByRole("heading", { name: "Trigger tay phải", exact: true }),
  ).toBeFocused();
  await expect(
    preview.getByRole("button", { name: "Phát công thức", exact: true }),
  ).toBeEnabled();
  await expect(
    preview.getByLabel("Tiến độ minh họa", { exact: true }),
  ).toHaveText("Đã xoay 0/4 nước.");
  await preview
    .getByRole("button", { name: "Phát công thức", exact: true })
    .click();
  await expect(
    preview.getByLabel("Tiến độ minh họa", { exact: true }),
  ).toHaveText("Đã xoay 4/4 nước.");
  await preview
    .getByRole("button", { name: "Phát lại công thức", exact: true })
    .click();
  await preview
    .getByRole("button", { name: "Về trạng thái mẫu", exact: true })
    .click();
  await expect(
    preview.getByLabel("Tiến độ minh họa", { exact: true }),
  ).toHaveText("Đã xoay 0/4 nước.");
  await preview
    .getByRole("button", { name: "Phát công thức", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Minh họa PLL — T perm", exact: true })
    .click();
  await expect(
    preview.getByLabel("Tiến độ minh họa", { exact: true }),
  ).toHaveText("Đã xoay 0/14 nước.");
  await expect(
    preview.getByRole("button", { name: "Phát công thức", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Nhóm", { exact: true }).selectOption("f2l");
  await expect(preview).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByLabel("Nhóm", { exact: true }).selectOption("pll");
  await expect(preview).toHaveCount(0);
  const trigger = page.getByRole("button", {
    name: "Minh họa PLL — T perm",
    exact: true,
  });
  await trigger.click();
  await preview
    .getByRole("button", { name: "Đóng minh họa", exact: true })
    .click();
  await expect(preview).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
