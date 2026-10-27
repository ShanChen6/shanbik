import { chromium } from "/tmp/shanbik-qa/node_modules/playwright/index.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
try {
  const page = await browser.newPage({
    viewport: { width: 360, height: 800 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:3177/practice");
  const panel = page.getByRole("region", {
    name: "Nhập màu sáu mặt",
    exact: true,
  });
  const check = panel.getByRole("button", {
    name: "Kiểm tra khối",
    exact: true,
  });
  const sample = panel.getByRole("button", {
    name: "Điền mẫu solved",
    exact: true,
  });
  const cell = (face, index) =>
    panel
      .getByRole("group", { name: `Lưới mặt ${face}`, exact: true })
      .locator("button")
      .nth(index);
  const paint = async (face, index, color, touch = false) => {
    await panel
      .getByLabel(`Màu tô mặt ${face}`, { exact: true })
      .selectOption(color);
    if (touch) await cell(face, index).tap();
    else await cell(face, index).click();
  };
  const success = async (solved = true) => {
    await check.click();
    await panel.getByText(/Trạng thái khả thi với khối 3×3/).waitFor();
    await panel
      .getByText(solved ? /Khối đã solved\./ : /Khối chưa solved\./)
      .waitFor();
    assert.equal(await panel.getByRole("alert").count(), 0);
  };
  const invalid = async (code) => {
    await check.click();
    await panel.getByRole("alert").locator(`[data-code="${code}"]`).waitFor();
    assert.equal(
      await panel.getByText(/Trạng thái khả thi với khối 3×3/).count(),
      0,
    );
  };
  await check.click();
  await panel
    .getByRole("alert")
    .getByText(/Còn thiếu 48 ô/)
    .waitFor();
  await sample.click();
  await success();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (button) => button.textContent === "Phát thuật toán" && !button.disabled,
    ),
  );
  const canvas = page.locator("canvas");
  await page.waitForTimeout(300);
  const initial = await canvas.screenshot();
  await paint("U", 7, "green", true);
  await paint("F", 1, "white");
  await invalid("EDGE_FLIP");
  assert.match(await cell("U", 7).getAttribute("aria-label"), /Xanh lá/);
  assert.match(await cell("F", 1).getAttribute("aria-label"), /Trắng/);
  await panel
    .getByRole("button", { name: "Đến ô liên quan lỗi 1", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  assert.match(
    await page.evaluate(() =>
      document.activeElement.getAttribute("aria-label"),
    ),
    /Mặt U, hàng 3, cột 2/,
  );
  const screenshot = (await panel.getByRole("alert").screenshot()).toString(
    "base64",
  );
  for (let i = 0; i < screenshot.length; i += 8000)
    console.log(
      `FEAS_IMAGE_${String(i / 8000).padStart(3, "0")}=${screenshot.slice(i, i + 8000)}`,
    );
  await paint("U", 7, "white");
  assert.equal(await panel.getByRole("alert").count(), 0);
  await paint("F", 1, "green");
  await success();
  await paint("U", 8, "red");
  await paint("R", 0, "green");
  await paint("F", 2, "white");
  await invalid("CORNER_TWIST");
  await sample.click();
  await paint("R", 0, "green");
  await paint("F", 2, "red");
  await invalid("INVALID_CORNER");
  await sample.click();
  await paint("F", 1, "blue");
  await paint("B", 7, "green");
  await invalid("EDGE_INVENTORY");
  await sample.click();
  await paint("R", 1, "green");
  await paint("F", 1, "red");
  await invalid("PARITY");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  // A pre-existing independent cubejs fixture is painted through the real form.
  const fixtures = JSON.parse(
    readFileSync("src/features/cube/core/__fixtures__/moves.json", "utf8"),
  );
  const notation = fixtures.cases.find(
    (item) => item.name === "mixed: U",
  ).expectedState;
  const faces = ["U", "R", "F", "D", "L", "B"];
  const colors = {
    U: "white",
    R: "red",
    F: "green",
    D: "yellow",
    L: "orange",
    B: "blue",
  };
  for (let block = 0; block < 6; block++)
    for (let index = 0; index < 9; index++)
      if (index !== 4)
        await paint(faces[block], index, colors[notation[block * 9 + index]]);
  await success(false);
  assert.deepEqual(await canvas.screenshot(), initial);
  await paint("U", 0, notation[0] === "U" ? "red" : "white");
  assert.equal(
    await panel.getByText(/Trạng thái khả thi với khối 3×3/).count(),
    0,
  );
  await check.click();
  await panel.getByRole("alert").waitFor();
  await page.setViewportSize({ width: 1280, height: 900 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  const fallback = await browser.newPage({
    viewport: { width: 360, height: 800 },
  });
  fallback.on("pageerror", (error) => errors.push(error.message));
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes("webgl") ? null : original.call(this, type, ...args);
    };
  });
  await fallback.goto("http://127.0.0.1:3177/practice");
  const fp = fallback.getByRole("region", {
    name: "Nhập màu sáu mặt",
    exact: true,
  });
  await fp.getByRole("button", { name: "Điền mẫu solved" }).click();
  await fp.getByRole("button", { name: "Kiểm tra khối" }).click();
  await fp.getByText(/Trạng thái khả thi với khối 3×3/).waitFor();
  assert.equal(
    await fallback
      .getByRole("button", { name: "Phát thuật toán", exact: true })
      .isDisabled(),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      missingBeforePhysical: true,
      solved: true,
      singleEdgeFlip: true,
      cornerTwist: true,
      mirroredCorner: true,
      duplicateEdges: true,
      parity: true,
      keyboardFocus: true,
      touch: true,
      correctionPreservesInput: true,
      staleSuccessCleared: true,
      independentScramble: true,
      cubePixelsUnchanged: true,
      mobileAndDesktopNoOverflow: true,
      withoutWebGL: true,
      pageErrors: errors,
    }),
  );
} finally {
  await browser.close();
}
