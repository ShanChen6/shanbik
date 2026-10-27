import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";
import { FORMULAS } from "../../src/features/algorithms/catalog";
import {
  DEFAULT_PRACTICE,
  practiceKey,
  practiceSequence,
} from "../../src/features/algorithms/practice";
import {
  applyAlgorithm,
  FACE_ORDER,
  type CubeState,
} from "../../src/features/cube/core";
import { COLOR_LABELS } from "../../src/features/cube/viewer/palette";
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
const formula = FORMULAS[0],
  key = practiceKey(formula.id);
const preview = (page: Page) =>
  page.getByRole("region", { name: "Minh họa công thức", exact: true });
const progress = (page: Page) =>
  preview(page).getByLabel("Tiến độ minh họa", { exact: true });
async function open(page: Page, name = "Trigger tay phải") {
  await page
    .getByRole("button", { name: `Minh họa ${name}`, exact: true })
    .click();
  await expect(
    preview(page).getByLabel("Ghi chú của tôi", { exact: true }),
  ).toBeEnabled();
}
async function assertCube(page: Page, state: CubeState) {
  const actual = await preview(page)
    .getByRole("figure", { name: "Trạng thái hiện tại", exact: true })
    .locator("ol li")
    .evaluateAll((items) => items.map((li) => li.getAttribute("aria-label")));
  expect(actual).toEqual(
    FACE_ORDER.flatMap((face) =>
      state.faces[face].map(
        (color, i) =>
          `Hàng ${Math.floor(i / 3) + 1}, cột ${(i % 3) + 1}: ${COLOR_LABELS[color]}`,
      ),
    ),
  );
}
test("algorithm practice: native keyboard seek, step/back and committed move list match every sticker", async ({
  page,
}) => {
  await page.goto("/algorithms");
  await open(page);
  const region = preview(page),
    seq = practiceSequence(formula, DEFAULT_PRACTICE);
  await expect(
    region.getByRole("button", { name: "Phát công thức", exact: true }),
  ).toBeEnabled();
  await region
    .getByText("Xem sơ đồ trạng thái mẫu 2D", { exact: true })
    .click();
  await assertCube(page, seq.initial);
  const range = region.getByRole("slider", {
    name: "Chọn vị trí trong chuỗi",
    exact: true,
  });
  await range.focus();
  await range.press("ArrowRight");
  await expect(progress(page)).toHaveText("Đã xoay 1/4 nước.");
  await assertCube(page, applyAlgorithm(seq.initial, seq.moves.slice(0, 1)));
  await expect(
    region.getByRole("button", { name: "Đến sau nước 1: R", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  await region.getByRole("button", { name: "Nước tiếp", exact: true }).click();
  await expect(progress(page)).toHaveText("Đã xoay 2/4 nước.");
  await assertCube(page, applyAlgorithm(seq.initial, seq.moves.slice(0, 2)));
  await region.getByRole("button", { name: "Nước lùi", exact: true }).click();
  await expect(progress(page)).toHaveText("Đã xoay 1/4 nước.");
  await assertCube(page, applyAlgorithm(seq.initial, seq.moves.slice(0, 1)));
  await range.focus();
  await range.press("End");
  await expect(progress(page)).toHaveText("Đã xoay 4/4 nước.");
  await assertCube(page, applyAlgorithm(seq.initial, seq.moves));
  await expect(region.locator('[data-move-state="done"]')).toHaveCount(4);
  await expect(
    region.getByRole("checkbox", {
      name: "Tôi đã luyện xong công thức này",
      exact: true,
    }),
  ).not.toBeChecked();
  await range.press("Home");
  await assertCube(page, seq.initial);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("algorithm practice: seek interrupts animation, reverse/repeat reset atomically without autoplay", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/algorithms");
  await open(page);
  const region = preview(page);
  await region.getByLabel("Tốc độ", { exact: true }).selectOption("0.5");
  await region
    .getByRole("button", { name: "Phát công thức", exact: true })
    .click();
  await expect(region.locator('[data-move-state="active"]')).toHaveCount(1);
  await region
    .getByRole("button", { name: "Đến sau nước 4: U'", exact: true })
    .click();
  await expect(progress(page)).toHaveText("Đã xoay 4/4 nước.");
  await expect(region.locator('[data-move-state="active"]')).toHaveCount(0);
  await page.waitForTimeout(900);
  await expect(progress(page)).toHaveText("Đã xoay 4/4 nước.");
  await region
    .getByLabel("Chiều xoay", { exact: true })
    .selectOption("reverse");
  await region.getByLabel("Số lượt lặp", { exact: true }).selectOption("3");
  await expect(progress(page)).toHaveText("Đã xoay 0/12 nước.");
  const list = region.getByRole("list", {
    name: "Danh sách nước xoay",
    exact: true,
  });
  await expect(list.getByRole("listitem")).toHaveCount(12);
  await expect(list.getByRole("button").first()).toHaveAttribute(
    "aria-label",
    "Đến sau nước 1: U",
  );
  await region
    .getByText("Xem sơ đồ trạng thái mẫu 2D", { exact: true })
    .click();
  const seq = practiceSequence(formula, {
    ...DEFAULT_PRACTICE,
    direction: "reverse",
    repeat: 3,
  });
  await assertCube(page, seq.initial);
  const range = region.getByRole("slider");
  await range.focus();
  await range.press("End");
  await assertCube(page, applyAlgorithm(seq.initial, seq.moves));
  await region
    .getByRole("button", { name: "Về trạng thái mẫu", exact: true })
    .click();
  await expect(progress(page)).toHaveText("Đã xoay 0/12 nước.");
  await assertCube(page, seq.initial);
});
test("algorithm practice: settings, notes and manual completion restore per formula; clear preserves favorites", async ({
  page,
}) => {
  await page.goto("/algorithms");
  await page
    .getByRole("button", { name: "Yêu thích Trigger tay phải", exact: true })
    .click();
  await open(page);
  const region = preview(page);
  await region.getByLabel("Tốc độ", { exact: true }).selectOption("2");
  await region
    .getByLabel("Chiều xoay", { exact: true })
    .selectOption("reverse");
  await region.getByLabel("Số lượt lặp", { exact: true }).selectOption("2");
  await region
    .getByLabel("Ghi chú của tôi", { exact: true })
    .fill("Tập chậm\nGiữ tay thoải mái");
  await region
    .getByRole("checkbox", {
      name: "Tôi đã luyện xong công thức này",
      exact: true,
    })
    .check();
  await page.reload();
  await open(page);
  await expect(region.getByLabel("Tốc độ", { exact: true })).toHaveValue("2");
  await expect(region.getByLabel("Chiều xoay", { exact: true })).toHaveValue(
    "reverse",
  );
  await expect(region.getByLabel("Số lượt lặp", { exact: true })).toHaveValue(
    "2",
  );
  await expect(
    region.getByLabel("Ghi chú của tôi", { exact: true }),
  ).toHaveValue("Tập chậm\nGiữ tay thoải mái");
  await expect(region.getByRole("checkbox")).toBeChecked();
  await expect(progress(page)).toHaveText("Đã xoay 0/8 nước.");
  await region.getByLabel("Ghi chú của tôi", { exact: true }).press("Space");
  await expect(progress(page)).toHaveText("Đã xoay 0/8 nước.");
  await page
    .getByRole("button", { name: "Minh họa Trigger tay trái", exact: true })
    .click();
  await expect(
    region.getByLabel("Ghi chú của tôi", { exact: true }),
  ).toHaveValue("");
  await expect(region.getByRole("checkbox")).not.toBeChecked();
  await page
    .getByRole("button", { name: "Minh họa Trigger tay phải", exact: true })
    .click();
  await expect(region.getByRole("checkbox")).toBeChecked();
  await region
    .getByRole("button", {
      name: "Xóa dữ liệu luyện tập công thức này",
      exact: true,
    })
    .click();
  await expect(
    region.getByLabel("Ghi chú của tôi", { exact: true }),
  ).toHaveValue("");
  await expect(region.getByRole("checkbox")).not.toBeChecked();
  await expect(progress(page)).toHaveText("Đã xoay 0/4 nước.");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("shanbik:algorithm-favorites:v1"),
    ),
  ).toContain("right-trigger");
});
test("algorithm practice: corrupted local data, failed writes and missing WebGL preserve notes and 2D seek", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '{"version":99}');
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
  await open(page);
  const region = preview(page);
  await expect(
    region.getByLabel("Trạng thái lưu luyện tập", { exact: true }),
  ).toContainText("không hợp lệ");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("shanbik:algorithm-practice:")) throw Error("Quota");
      return original.call(this, key, value);
    };
  });
  await region
    .getByLabel("Ghi chú của tôi", { exact: true })
    .fill("Giữ trong phiên");
  await expect(
    region.getByLabel("Trạng thái lưu luyện tập", { exact: true }),
  ).toContainText("Không thể lưu");
  await expect(
    region.getByRole("button", { name: "Phát công thức", exact: true }),
  ).toBeDisabled();
  await region.getByRole("button", { name: "Nước tiếp", exact: true }).click();
  await expect(progress(page)).toHaveText("Đã xoay 1/4 nước.");
  await region
    .getByText("Xem sơ đồ trạng thái mẫu 2D", { exact: true })
    .click();
  const seq = practiceSequence(formula, DEFAULT_PRACTICE);
  await assertCube(page, applyAlgorithm(seq.initial, seq.moves.slice(0, 1)));
  await expect(
    region.getByLabel("Ghi chú của tôi", { exact: true }),
  ).toHaveValue("Giữ trong phiên");
  for (const width of [320, 360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("algorithm practice: blocked reads and WebGL context loss stop animation without losing in-memory edits", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key.startsWith("shanbik:algorithm-practice:")) throw Error("blocked");
      return original.call(this, key);
    };
  });
  await page.goto("/algorithms");
  await open(page);
  const region = preview(page);
  await expect(
    region.getByLabel("Trạng thái lưu luyện tập", { exact: true }),
  ).toContainText("Không thể lưu");
  await region
    .getByLabel("Ghi chú của tôi", { exact: true })
    .fill("Ghi chú vẫn dùng được");
  await region.getByLabel("Tốc độ", { exact: true }).selectOption("0.5");
  await region
    .getByRole("button", { name: "Phát công thức", exact: true })
    .click();
  await expect(region.locator('[data-move-state="active"]')).toHaveCount(1);
  await page
    .locator("canvas")
    .evaluate((canvas) =>
      (canvas as HTMLCanvasElement)
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext(),
    );
  await expect(
    region.getByText("Không hiển thị được 3D.", { exact: false }),
  ).toBeVisible();
  await expect(region.locator('[data-move-state="active"]')).toHaveCount(0);
  await expect(
    region.getByLabel("Ghi chú của tôi", { exact: true }),
  ).toHaveValue("Ghi chú vẫn dùng được");
  await expect(
    region.getByRole("button", { name: "Phát công thức", exact: true }),
  ).toBeDisabled();
});
