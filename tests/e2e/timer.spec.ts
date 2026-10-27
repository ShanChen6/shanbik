import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";
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
const key = "shanbik:timer-solves:v1";
const pad = (page: Page) =>
  page.getByRole("button", { name: "Vùng bấm timer", exact: true });
const phase = (page: Page) =>
  page.getByLabel("Trạng thái timer", { exact: true });
const count = (page: Page) => page.getByLabel("Số lượt giải", { exact: true });
async function ready(page: Page) {
  await page.goto("/timer");
  await expect(pad(page)).toBeEnabled();
}
async function result(page: Page) {
  return JSON.parse(
    (await page.evaluate((key) => localStorage.getItem(key), key))!,
  );
}
test("timer: discovery, focused Space hold/release, duplicate stop protection and reload", async ({
  page,
}) => {
  await page.goto("/practice");
  await page
    .getByRole("link", { name: "Bấm giờ với khối thật", exact: true })
    .click();
  await expect(page).toHaveTitle("Timer 3×3 — ShanBik");
  await expect(pad(page)).toBeEnabled();
  const scramble = await page
    .getByLabel("Scramble timer", { exact: true })
    .textContent();
  const inspection = page.getByRole("checkbox", {
    name: "Quan sát 15 giây",
    exact: true,
  });
  await inspection.focus();
  await page.keyboard.press("Space");
  await expect(inspection).toBeChecked();
  await expect(phase(page)).toHaveText("Sẵn sàng");
  await inspection.uncheck();
  await pad(page).focus();
  await page.keyboard.down("Space");
  await expect(phase(page)).toContainText("Đã sẵn sàng thả");
  await page.keyboard.up("Space");
  await expect(phase(page)).toHaveText("Đang tính giờ");
  await expect(
    page.getByRole("button", { name: "Scramble mới", exact: true }),
  ).toBeDisabled();
  await page.waitForTimeout(130);
  await page.keyboard.down("Space");
  await expect(phase(page)).toHaveText("Đã dừng");
  await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  await expect(count(page)).toContainText("1 lượt");
  const data = await result(page);
  expect(data.solves).toHaveLength(1);
  expect(data.solves[0]).toMatchObject({
    puzzle: "3x3",
    scramble: scramble!.trim(),
  });
  expect(data.solves[0].durationMs).toBeGreaterThan(0);
  expect(data.solves[0].timestamp).toBeGreaterThan(0);
  expect(data.solves[0].id).toBeTruthy();
  await page.reload();
  await expect(count(page)).toContainText("1 lượt");
  await expect(
    page.getByRole("region", { name: "Lượt gần nhất", exact: true }),
  ).toContainText(scramble!.trim());
  await expect(phase(page)).toHaveText("Sẵn sàng");
  await expect(
    page.getByLabel("Thời gian hiện tại", { exact: true }),
  ).toHaveText("0.00");
});
test("timer: real touch holds, pointer cancellation and stop save one result", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("shanbik-theme", "dark"));
  await ready(page);
  const cdp = await page.context().newCDPSession(page);
  const down = async () => {
    await pad(page).scrollIntoViewIfNeeded();
    const box = (await pad(page).boundingBox())!;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 0 },
      ],
    });
  };
  await down();
  await expect(phase(page)).toContainText("Đã sẵn sàng thả");
  expect(
    (await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze())
      .violations,
  ).toEqual([]);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expect(phase(page)).toHaveText("Sẵn sàng");
  await expect(count(page)).toContainText("0 lượt");
  await down();
  await expect(phase(page)).toContainText("Đã sẵn sàng thả");
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(phase(page)).toHaveText("Đang tính giờ");
  await down();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(phase(page)).toHaveText("Đã dừng");
  await expect(count(page)).toContainText("1 lượt");
  expect((await result(page)).solves).toHaveLength(1);
  await cdp.detach();
});
test("timer: inspection over 15 seconds is advisory, excluded from solve, and cancel never saves", async ({
  page,
}) => {
  await ready(page);
  await page.clock.install();
  await page
    .getByRole("checkbox", { name: "Quan sát 15 giây", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Bắt đầu quan sát", exact: true })
    .click();
  await expect(phase(page)).toHaveText("Đang quan sát");
  await page.clock.fastForward(16000);
  await expect(
    page.getByText("Đã qua 15 giây quan sát.", { exact: false }),
  ).toBeVisible();
  await expect(count(page)).toContainText("0 lượt");
  await page
    .getByRole("button", { name: "Bắt đầu tính giờ", exact: true })
    .click();
  await expect(phase(page)).toHaveText("Đang tính giờ");
  await page.getByRole("button", { name: "Dừng và lưu", exact: true }).click();
  await expect(count(page)).toContainText("1 lượt");
  expect((await result(page)).solves[0].durationMs).toBeLessThan(5000);
  await page
    .getByRole("button", { name: "Bắt đầu quan sát", exact: true })
    .click();
  await page.getByRole("button", { name: "Hủy lượt", exact: true }).click();
  await expect(phase(page)).toHaveText("Sẵn sàng");
  await expect(count(page)).toContainText("1 lượt");
});
test("timer: malformed storage, quota failure, retry and reload preserve a unique result", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "{bad");
    localStorage.setItem("qa-timer-unrelated", "keep");
  }, key);
  await ready(page);
  await expect(
    page.getByLabel("Trạng thái lưu timer", { exact: true }),
  ).toContainText("không hợp lệ");
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    "{bad",
  );
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (
        key === "shanbik:timer-solves:v1" &&
        !(window as unknown as { allowTimerSave?: boolean }).allowTimerSave
      )
        throw Error("quota");
      return original.call(this, key, value);
    };
  });
  await page
    .getByRole("button", { name: "Bắt đầu tính giờ", exact: true })
    .click();
  await page.getByRole("button", { name: "Dừng và lưu", exact: true }).click();
  await expect(count(page)).toContainText("1 lượt");
  await expect(
    page.getByLabel("Trạng thái lưu timer", { exact: true }),
  ).toContainText("Không thể lưu");
  await expect(
    page.getByRole("region", { name: "Kết quả vừa dừng", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { allowTimerSave: boolean }).allowTimerSave = true;
  });
  await page.getByRole("button", { name: "Thử lưu lại", exact: true }).click();
  expect((await result(page)).solves).toHaveLength(1);
  expect(
    await page.evaluate(() => localStorage.getItem("qa-timer-unrelated")),
  ).toBe("keep");
  // Remove the fixture initializer before reload by using a fresh page in the same context.
  const reopened = await page.context().newPage();
  await reopened.goto("/timer");
  await expect(count(reopened)).toContainText("1 lượt");
  await reopened.close();
});
test("timer: denied storage reads and missing WebGL keep timing usable and responsive", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key === "shanbik:timer-solves:v1") throw Error("blocked");
      return original.call(this, key);
    };
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind,
      ...args
    ) {
      if (String(kind).includes("webgl")) return null;
      return getContext.call(this, kind, ...args);
    } as typeof getContext;
  });
  await ready(page);
  await page
    .getByRole("button", { name: "Bắt đầu tính giờ", exact: true })
    .click();
  await page.getByRole("button", { name: "Dừng và lưu", exact: true }).click();
  await expect(count(page)).toContainText("1 lượt");
  await expect(
    page.getByLabel("Trạng thái lưu timer", { exact: true }),
  ).toContainText("Không thể lưu");
  await expect(page.locator("canvas")).toHaveCount(0);
  for (const width of [320, 360, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("timer: blur clears a held key, navigation cancels unsaved attempts, Enter buttons work", async ({
  page,
}) => {
  await ready(page);
  await pad(page).focus();
  await page.keyboard.down("Space");
  await expect(phase(page)).toContainText("Đã sẵn sàng thả");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.keyboard.up("Space");
  await expect(phase(page)).toHaveText("Sẵn sàng");
  await page
    .getByRole("button", { name: "Bắt đầu tính giờ", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(phase(page)).toHaveText("Đang tính giờ");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Trợ giúp", exact: true })
    .click();
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Timer", exact: true })
    .click();
  await expect(phase(page)).toHaveText("Sẵn sàng");
  await expect(count(page)).toContainText("0 lượt");
  await page
    .getByRole("button", { name: "Bắt đầu tính giờ", exact: true })
    .click();
  await page.getByRole("button", { name: "Dừng và lưu", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(count(page)).toContainText("1 lượt");
});
