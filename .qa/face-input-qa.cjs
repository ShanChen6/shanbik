const { chromium } = require("/tmp/shanbik-qa/node_modules/playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 360, height: 800 },
    reducedMotion: "reduce",
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3175/practice");
  const panel = page.getByRole("region", {
    name: "Nhập màu sáu mặt",
    exact: true,
  });
  await panel.getByText(/Đã nhập 6\/54/).waitFor();
  assert.equal(await panel.locator("button:disabled").count(), 6);
  assert.equal(
    await panel.getByRole("group", { name: /^Lưới mặt/ }).count(),
    6,
  );
  await panel
    .getByRole("button", { name: "Kiểm tra màu đã nhập", exact: true })
    .click();
  await panel
    .getByRole("alert")
    .getByText(/Còn thiếu 48 ô/)
    .waitFor();
  await panel.getByRole("button", { name: "Đến ô chưa nhập đầu tiên" }).focus();
  await page.keyboard.press("Enter");
  assert.match(
    await page.evaluate(() =>
      document.activeElement.getAttribute("aria-label"),
    ),
    /Mặt U, hàng 1, cột 1: chưa nhập/,
  );
  // Native keyboard color select + Space painting.
  const uColor = panel.getByLabel("Màu tô mặt U", { exact: true });
  await uColor.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  assert.equal(await uColor.inputValue(), "red");
  const u0 = () =>
    panel.getByRole("button", { name: /^Mặt U, hàng 1, cột 1:/ });
  await u0().focus();
  await page.keyboard.press("Space");
  await panel.getByText(/Đã nhập 7\/54/).waitFor();
  assert.match(await u0().getAttribute("aria-label"), /Đỏ/);
  await panel
    .getByRole("button", { name: "Kiểm tra màu đã nhập", exact: true })
    .click();
  assert.match(await u0().getAttribute("aria-label"), /Đỏ/);
  // Touch changes another face, editing U does not lose F.
  await panel.getByLabel("Màu tô mặt F", { exact: true }).selectOption("green");
  const f0 = () =>
    panel.getByRole("button", { name: /^Mặt F, hàng 1, cột 1:/ });
  await f0().tap();
  await uColor.selectOption("white");
  await u0().tap();
  assert.match(await f0().getAttribute("aria-label"), /Xanh lá/);
  await uColor.selectOption("empty");
  await u0().tap();
  assert.match(await u0().getAttribute("aria-label"), /chưa nhập/);
  assert.match(await f0().getAttribute("aria-label"), /Xanh lá/);
  // Sample and count failures never change the cube model.
  await page
    .getByRole("button", { name: "Phát thuật toán", exact: true })
    .waitFor();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent === "Phát thuật toán" && !b.disabled,
    ),
  );
  const canvas = page.locator("canvas");
  await page.waitForTimeout(300);
  const initial = await canvas.screenshot();
  await panel
    .getByRole("button", { name: "Điền mẫu solved", exact: true })
    .tap();
  await panel.getByText(/Đã nhập 54\/54/).waitFor();
  await panel
    .getByRole("button", { name: "Kiểm tra màu đã nhập", exact: true })
    .click();
  await panel.getByText(/Đã nhập đủ 54 ô, mỗi màu có 9 ô/).waitFor();
  await uColor.selectOption("red");
  await u0().tap();
  await panel
    .getByRole("button", { name: "Kiểm tra màu đã nhập", exact: true })
    .click();
  await panel
    .getByRole("alert")
    .getByText(/Đỏ: 10\/9 — thừa 1/)
    .waitFor();
  await panel
    .getByRole("alert")
    .getByText(/Trắng: 8\/9 — thiếu 1/)
    .waitFor();
  assert.match(await f0().getAttribute("aria-label"), /Xanh lá/);
  await uColor.selectOption("white");
  await u0().tap();
  await panel
    .getByRole("button", { name: "Kiểm tra màu đã nhập", exact: true })
    .click();
  await panel.getByText(/Đã nhập đủ 54 ô, mỗi màu có 9 ô/).waitFor();
  assert.deepEqual(await canvas.screenshot(), initial);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  const sizes = await panel
    .getByRole("group", { name: /^Lưới mặt/ })
    .locator("button")
    .evaluateAll((buttons) =>
      buttons.map((b) => ({
        w: b.getBoundingClientRect().width,
        h: b.getBoundingClientRect().height,
      })),
    );
  assert(sizes.every((s) => s.w >= 44 && s.h >= 44));
  // Export a compact face screenshot for visual review.
  const screenshot = (
    await panel
      .getByRole("group", { name: "Lưới mặt U", exact: true })
      .screenshot()
  ).toString("base64");
  for (let i = 0; i < screenshot.length; i += 8000)
    console.log(
      `FACE_IMAGE_${String(i / 8000).padStart(3, "0")}=${screenshot.slice(i, i + 8000)}`,
    );
  await panel
    .getByRole("button", { name: "Xóa màu đã nhập", exact: true })
    .tap();
  await panel.getByText(/Đã nhập 6\/54/).waitFor();
  await page.reload();
  await panel.getByText(/Đã nhập 6\/54/).waitFor();
  const fallback = await browser.newPage({
    viewport: { width: 360, height: 800 },
  });
  fallback.on("pageerror", (e) => errors.push(e.message));
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes("webgl") ? null : original.call(this, type, ...args);
    };
  });
  await fallback.goto("http://127.0.0.1:3175/practice");
  const fallbackPanel = fallback.getByRole("region", {
    name: "Nhập màu sáu mặt",
    exact: true,
  });
  await fallbackPanel.getByRole("button", { name: "Điền mẫu solved" }).click();
  await fallbackPanel
    .getByRole("button", { name: "Kiểm tra màu đã nhập" })
    .click();
  await fallbackPanel.getByText(/Đã nhập đủ 54 ô/).waitFor();
  assert.equal(
    await fallback
      .getByRole("button", { name: "Phát thuật toán", exact: true })
      .isDisabled(),
    true,
  );
  assert.equal(
    await fallback.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      sixFaces: true,
      fixedCenters: true,
      missing48: true,
      keyboardSelectPaintFocus: true,
      touchPaintErase: true,
      correctionsPreserveOthers: true,
      excessAndShortage: true,
      structuralOnlyMessage: true,
      cubePixelsUnchanged: true,
      mobile360NoOverflow: true,
      targets44px: true,
      resetAndReload: true,
      withoutWebGL: true,
      pageErrors: errors,
    }),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
