const { chromium } = require("/tmp/shanbik-qa/node_modules/playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromium.executablePath(),
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
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3174/practice");
  const panel = page.getByRole("region", {
    name: "Nhập thuật toán",
    exact: true,
  });
  const input = page.getByRole("textbox", { name: "Thuật toán 3×3" });
  const play = page.getByRole("button", {
    name: "Phát thuật toán",
    exact: true,
  });
  await play.waitFor();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent === "Phát thuật toán" && !b.disabled,
    ),
  );
  await page.waitForTimeout(400);
  const canvas = page.locator("canvas");
  const initial = await canvas.screenshot();
  await input.fill("R\nBAD U");
  await play.click();
  await panel.getByRole("alert").waitFor();
  assert.equal(await input.inputValue(), "R\nBAD U");
  assert.deepEqual(await canvas.screenshot(), initial);
  await page
    .getByRole("button", { name: "Chọn vị trí lỗi 1", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  assert.deepEqual(
    await input.evaluate((e) => [e.selectionStart, e.selectionEnd]),
    [2, 5],
  );
  await input.fill("R U R' U'");
  await play.click();
  const player = page.getByRole("region", { name: "Player chuỗi" });
  await player.getByText(/Đã thực hiện 4\/4/).waitFor();
  await input.fill("invalid");
  await play.click();
  await panel.getByRole("alert").waitFor();
  await player.getByText(/Đã thực hiện 4\/4/).waitFor();
  await panel.getByRole("button", { name: "R U R' U'", exact: true }).click();
  assert.equal(await input.inputValue(), "R U R' U'");
  await player.getByText(/Đã thực hiện 4\/4/).waitFor();
  await input.fill(Array(256).fill("R").join(" "));
  await play.click();
  await player.getByText(/Đã thực hiện 256\/256/).waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await input.fill("R".repeat(3000));
  await play.click();
  await panel.getByRole("alert").waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await input.screenshot({ path: "/tmp/shanbik-qa/input-mobile.png" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await input.fill("R U F L D B");
  await play.click();
  await page.waitForTimeout(70);
  await input.fill("L2 D2");
  await play.click();
  await player.getByText(/Đã thực hiện 2\/2.*Đang dừng/).waitFor();
  assert.equal(await player.getByRole("listitem").count(), 2);
  await player.getByRole("button", { name: "Về đầu chuỗi" }).click();
  await player.getByText(/Đã thực hiện 0\/2/).waitFor();
  await panel.getByRole("button", { name: "Xóa lịch sử", exact: true }).click();
  assert.equal(await panel.getByRole("listitem").count(), 0);
  await player.getByText(/Đã thực hiện 0\/2/).waitFor();
  await page.reload();
  await page.getByRole("textbox", { name: "Thuật toán 3×3" }).waitFor();
  assert.equal(
    await page.getByRole("textbox", { name: "Thuật toán 3×3" }).inputValue(),
    "",
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      invalidKeepsInputAndPixels: true,
      keyboardErrorSelection: true,
      historyOnlyFills: true,
      long256: true,
      longInvalidNoOverflow: true,
      replaceDuringAnimation: true,
      resetSnapshot: true,
      clearIndependent: true,
      reloadClears: true,
      pageErrors: errors,
    }),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
