import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";
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
const list = (page: Page) =>
  page.getByRole("list", { name: "Danh sách puzzle", exact: true });
async function filterForm(page: Page) {
  const search = await page
    .getByRole("searchbox", { name: "Tìm theo tên hoặc mô tả", exact: true })
    .boundingBox();
  const submit = await page
    .getByRole("button", { name: "Tìm puzzle", exact: true })
    .boundingBox();
  expect(
    search &&
      submit &&
      (search.y + search.height <= submit.y + 1 ||
        search.x + search.width <= submit.x + 1),
  ).toBe(true);
  const trigger = page.getByRole("button", { name: "Lọc puzzle", exact: true });
  if (await trigger.isVisible()) {
    await trigger.click();
    return page.getByRole("dialog", { name: "Bộ lọc puzzle", exact: true });
  }
  return page.getByRole("complementary", {
    name: "Bộ lọc danh sách",
    exact: true,
  });
}

test("catalog: search normalizes dimensions and accents; filter URLs survive reload and Back", async ({
  page,
}) => {
  await page.goto("/puzzles");
  await expect(list(page).getByRole("listitem")).toHaveCount(8);
  await page.evaluate(() => {
    (window as typeof window & { catalogMarker?: string }).catalogMarker =
      "kept";
  });
  await page
    .getByRole("searchbox", { name: "Tìm theo tên hoặc mô tả", exact: true })
    .fill("3 x 3");
  await page.getByRole("button", { name: "Tìm puzzle", exact: true }).click();
  await expect(list(page).getByRole("listitem")).toHaveCount(1);
  await expect(
    list(page).getByRole("link", { name: "Rubik 3×3", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/q=3\+x\+3/);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { catalogMarker?: string }).catalogMarker,
    ),
  ).toBe("kept");
  await list(page)
    .getByRole("link", { name: "Rubik 3×3", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rubik 3×3");
  await page
    .getByRole("link", { name: "Về danh sách puzzle", exact: true })
    .click();
  await expect(list(page).getByRole("listitem")).toHaveCount(1);
  await page.reload();
  await expect(list(page).getByRole("listitem")).toHaveCount(1);
  await page.getByRole("link", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(list(page).getByRole("listitem")).toHaveCount(8);
  const form = await filterForm(page);
  await form.getByLabel("Hình dạng", { exact: true }).selectOption("cube");
  await form
    .getByLabel("Độ khó tham khảo", { exact: true })
    .selectOption("intermediate");
  await form
    .getByRole("button", { name: "Áp dụng bộ lọc", exact: true })
    .click();
  await expect(list(page).getByRole("listitem")).toHaveCount(2);
  await expect(page).toHaveURL(/shape=cube&difficulty=intermediate/);
  await page.goBack();
  await expect(list(page).getByRole("listitem")).toHaveCount(8);
  await page.goForward();
  await expect(list(page).getByRole("listitem")).toHaveCount(2);
});

test("catalog: mobile sheet discards unapplied filters, restores focus and closes on desktop resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/puzzles");
  const trigger = page.getByRole("button", { name: "Lọc puzzle", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Bộ lọc puzzle",
    exact: true,
  });
  await dialog
    .getByLabel("Hình dạng", { exact: true })
    .selectOption("tetrahedron");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(list(page).getByRole("listitem")).toHaveCount(8);
  await trigger.click();
  await expect(dialog.getByLabel("Hình dạng", { exact: true })).toHaveValue("");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await dialog
    .getByLabel("Hình dạng", { exact: true })
    .selectOption("tetrahedron");
  await dialog
    .getByRole("button", { name: "Áp dụng bộ lọc", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(list(page).getByRole("listitem")).toHaveCount(1);
  await trigger.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("complementary", { name: "Bộ lọc danh sách", exact: true }),
  ).toBeVisible();
});

test("catalog: layer and empty-result filters are honest; invalid URL values are safe", async ({
  page,
}) => {
  await page.goto("/puzzles?layers=other");
  await expect(list(page).getByRole("listitem")).toHaveCount(4);
  await page.goto("/puzzles?shape=tetrahedron&layers=4");
  await expect(
    page.getByRole("region", { name: "Không tìm thấy puzzle", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Xem tất cả puzzle", exact: true })
    .click();
  await expect(list(page).getByRole("listitem")).toHaveCount(8);
  await page.goto("/puzzles?shape=constructor&difficulty=invalid&layers=999");
  await expect(list(page).getByRole("listitem")).toHaveCount(8);
  await page
    .getByRole("searchbox", { name: "Tìm theo tên hoặc mô tả", exact: true })
    .fill("ĐỔI HÌNH");
  await page.getByRole("button", { name: "Tìm puzzle", exact: true }).click();
  await expect(
    list(page).getByRole("link", { name: "Square-1", exact: true }),
  ).toBeVisible();
  await expect(list(page).getByRole("listitem")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("catalog: all detail routes have metadata and capabilities; unknown puzzle is 404", async ({
  page,
}) => {
  let solverRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/solver-worker/")) solverRequests++;
  });
  for (const [slug, name] of [
    ["3x3", "Rubik 3×3"],
    ["2x2", "Rubik 2×2"],
    ["4x4", "Rubik 4×4"],
    ["5x5", "Rubik 5×5"],
    ["pyraminx", "Pyraminx"],
    ["megaminx", "Megaminx"],
    ["skewb", "Skewb"],
    ["square-1", "Square-1"],
  ]) {
    const response = await page.goto(`/puzzles/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(`${name} — Bách khoa ShanBik`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    const caps = page.getByRole("region", {
      name: "Tính năng trên ShanBik",
      exact: true,
    });
    // Matches the capability registry (Tasks 18–19).
    const shipped: Record<string, number> = {
      "3x3": 6,
      "2x2": 2,
      "4x4": 2,
      pyraminx: 2,
      megaminx: 1,
    };
    await expect(caps.getByText("Đã có", { exact: true })).toHaveCount(
      shipped[slug] ?? 0,
    );
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "Luyện tập 3×3", exact: true }),
    ).toHaveCount(slug === "3x3" ? 1 : 0);
    const lessons = page.getByRole("region", {
      name: "Bài học liên quan",
      exact: true,
    });
    if (slug === "3x3")
      await expect(
        lessons.getByRole("link", {
          name: "Làm quen với U và U′",
          exact: true,
        }),
      ).toBeVisible();
    else await expect(lessons).toContainText("Chưa có bài học giải từng bước");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(solverRequests).toBe(0);
  const missing = await page.goto(
    `/puzzles/no-such-puzzle-${test.info().project.name}`,
  );
  expect(missing?.status()).toBe(404);
});
