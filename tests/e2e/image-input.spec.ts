import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";
import { facePNG, flippedEdge, SOLVED, U_TURN } from "../helpers/cube-images";
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
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
async function openImages(page: Page) {
  await page.goto("/practice");
  await button(page, "Nhập Rubik từ ảnh").click();
}
async function upload(page: Page, serialization = U_TURN, transparent = false) {
  for (const face of "URFDLB") {
    const input = page.getByLabel(new RegExp(`^Ảnh mặt ${face} — tâm`));
    await input.setInputFiles({
      name: `${face}.png`,
      mimeType: "image/png",
      buffer: facePNG(serialization, face, transparent && face === "U"),
    });
    await expect(input).toBeEnabled();
  }
  await button(page, "Nhận màu từ sáu ảnh").click();
  await expect(
    page.getByRole("group", { name: "Kiểm tra màu nhận từ ảnh", exact: true }),
  ).toBeVisible();
}
async function transfer(page: Page) {
  await page
    .getByRole("checkbox", {
      name: "Tôi đã kiểm tra đúng tâm, hướng sáu mặt và các màu nhận được.",
      exact: true,
    })
    .check();
  await button(page, "Chuyển màu sang bản nhập").click();
}

test("images: six fixtures → review → manual draft → real solver → solved", async ({
  page,
}) => {
  let worker = 0;
  page.on("request", (request) => {
    if (request.url().includes("/solver-worker/")) worker++;
  });
  await openImages(page);
  await expect(button(page, "Nhận màu từ sáu ảnh")).toBeDisabled();
  await upload(page);
  await expect(button(page, "Chuyển màu sang bản nhập")).toBeDisabled();
  const mapping: Record<string, string> = {
    U: "white",
    R: "red",
    F: "green",
    D: "yellow",
    L: "orange",
    B: "blue",
  };
  for (let f = 0; f < 6; f++)
    for (let i = 0; i < 9; i++)
      await expect(
        page.getByLabel(`Màu ảnh ${"URFDLB"[f]} ô ${i + 1}`, { exact: true }),
      ).toHaveValue(mapping[U_TURN[f * 9 + i]]);
  expect(worker).toBe(0);
  await transfer(page);
  await expect(
    page.getByText("Đã nhập 54/54 ô", { exact: false }),
  ).toBeVisible();
  expect(worker).toBe(0);
  await button(page, "Giải bản nhập").click();
  await expect(button(page, "Nạp lời giải vào player")).toBeVisible({
    timeout: 70000,
  });
  await button(page, "Nạp lời giải vào player").click();
  await button(page, "Phát chuỗi").click();
  await expect(
    page.getByLabel("Trạng thái mô hình", { exact: true }),
  ).toContainText("Mô hình đã solved.");
  await button(page, "Bắt đầu lại buổi tập").click();
  await page.getByText("Nhập từ ảnh — 3×3", { exact: true }).click();
  await expect(button(page, "Nhận màu từ sáu ảnh")).toBeDisabled();
});

test("images: uncertain transparency stays blank and can be corrected before transfer", async ({
  page,
}) => {
  await openImages(page);
  await upload(page, SOLVED, true);
  await expect(page.getByLabel("Màu ảnh U ô 1", { exact: true })).toHaveValue(
    "",
  );
  await page.getByLabel("Màu ảnh U ô 1", { exact: true }).selectOption("white");
  await expect(
    page.getByText("Còn 0 ô chưa chắc chắn/chưa chọn màu.", { exact: false }),
  ).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await transfer(page);
  await button(page, "Giải bản nhập").click();
  await expect(
    page.getByText("Khối đã solved. Không cần chạy solver", { exact: false }),
  ).toBeVisible();
});

test("images: physical impossibility is rejected after recognition without starting solver", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/solver-worker/")) requests++;
  });
  await openImages(page);
  await upload(page, flippedEdge());
  await transfer(page);
  await button(page, "Giải bản nhập").click();
  await expect(
    page.getByText("Đủ số màu, nhưng trạng thái không khả thi.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(requests).toBe(0);
});

test("images: invalid file, invalid crop and replacement clear stale recognition", async ({
  page,
}) => {
  await openImages(page);
  const file = page.getByLabel(/^Ảnh mặt U — tâm/);
  await file.setInputFiles({
    name: "bad.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Chỉ nhận JPEG" }),
  ).toBeVisible();
  await file.setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("broken"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Không đọc được ảnh" }),
  ).toBeVisible();
  await upload(page);
  await page
    .getByRole("group", { name: "Chọn mặt để chỉnh ảnh", exact: true })
    .getByRole("button", { name: "U", exact: true })
    .click();
  await page.getByLabel("X góc Trên trái (%)", { exact: true }).fill("99");
  await expect(button(page, "Nhận màu từ sáu ảnh")).toBeDisabled();
  await expect(button(page, "Chuyển màu sang bản nhập")).toHaveCount(0);
  await file.setInputFiles({
    name: "U.png",
    mimeType: "image/png",
    buffer: facePNG(SOLVED, "U"),
  });
  await expect(file).toBeEnabled();
  await button(page, "Nhận màu từ sáu ảnh").click();
  await expect(button(page, "Chuyển màu sang bản nhập")).toBeDisabled();
  await button(page, "Xóa toàn bộ ảnh").click();
  await expect(button(page, "Nhận màu từ sáu ảnh")).toBeDisabled();
  await expect(
    page.getByText("Đã nhập 6/54 ô", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("images: perspective crop and quarter-turn order match an independent fixture", async ({
  page,
}) => {
  const mixed = "LFFFUDLRRUBRLRFDBDBUBRFBFLBDURRDULDRDRUDLDFBLUUBLBFFLU";
  await openImages(page);
  await upload(page, mixed);
  const input = page.getByLabel(/^Ảnh mặt F — tâm/);
  await input.setInputFiles({
    name: "perspective.png",
    mimeType: "image/png",
    buffer: facePNG(mixed, "F", false, true),
  });
  await expect(input).toBeEnabled();
  const points = [
    [20, 10],
    [80, 10],
    [95, 90],
    [5, 90],
  ];
  const names = ["Trên trái", "Trên phải", "Dưới phải", "Dưới trái"];
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("combobox", { name: "Góc đang chọn", exact: true })
      .selectOption(String(i));
    await page
      .getByLabel(`X góc ${names[i]} (%)`, { exact: true })
      .fill(String(points[i][0]));
    await page
      .getByLabel(`Y góc ${names[i]} (%)`, { exact: true })
      .fill(String(points[i][1]));
  }
  await button(page, "Nhận màu từ sáu ảnh").click();
  const colors: Record<string, string> = {
    U: "white",
    R: "red",
    F: "green",
    D: "yellow",
    L: "orange",
    B: "blue",
  };
  const letters = mixed.slice(18, 27);
  for (let i = 0; i < 9; i++)
    await expect(
      page.getByLabel(`Màu ảnh F ô ${i + 1}`, { exact: true }),
    ).toHaveValue(colors[letters[i]]);
  await button(page, "Xoay thứ tự ô 90°").click();
  await expect(button(page, "Chuyển màu sang bản nhập")).toHaveCount(0);
  await button(page, "Nhận màu từ sáu ảnh").click();
  for (const [index, old] of [6, 3, 0, 7, 4, 1, 8, 5, 2].entries())
    await expect(
      page.getByLabel(`Màu ảnh F ô ${index + 1}`, { exact: true }),
    ).toHaveValue(colors[letters[old]]);
});

test("images: clearing a pending decode prevents late image resurrection", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function (
      this: HTMLImageElement,
    ) {
      await new Promise<void>((resolve) => {
        (window as typeof window & { resumeImage?: () => void }).resumeImage =
          resolve;
      });
      return original.call(this);
    };
  });
  await openImages(page);
  const input = page.getByLabel(/^Ảnh mặt U — tâm/);
  await input.setInputFiles({
    name: "U.png",
    mimeType: "image/png",
    buffer: facePNG(SOLVED, "U"),
  });
  await expect(
    page.getByText("Đang đọc ảnh mặt U…", { exact: true }),
  ).toBeVisible();
  await button(page, "Xóa toàn bộ ảnh").click();
  await page.evaluate(() =>
    (window as typeof window & { resumeImage?: () => void }).resumeImage?.(),
  );
  await expect(input).toBeEnabled();
  await expect(
    page.getByRole("img", { name: "Ảnh và lưới mặt U", exact: true }),
  ).toHaveCount(0);
  await expect(button(page, "Nhận màu từ sáu ảnh")).toBeDisabled();
});
