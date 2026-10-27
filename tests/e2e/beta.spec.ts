import AxeBuilder from "@axe-core/playwright";
import { test as base, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const test = base.extend<{ browserErrors: void }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

for (const theme of ["light", "dark"]) {
  test(`beta: routes, responsive and automated accessibility (${theme})`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.addInitScript(
      (value) => localStorage.setItem("shanbik-theme", value),
      theme,
    );
    const results = [];
    for (const route of [
      "/",
      "/learn",
      "/algorithms",
      "/timer",
      "/help",
      "/practice",
      "/puzzles",
      "/puzzles/3x3",
      "/learn/lessons/lam-quen-u-va-u-prime",
    ]) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveClass(
        theme === "dark" ? /dark/ : /light/,
      );
      if (route === "/practice")
        await expect(
          page.getByRole("button", { name: "Lấy màu từ mô hình", exact: true }),
        ).toBeEnabled();
      if (route === "/puzzles")
        await expect(
          page.getByRole("list", { name: "Danh sách puzzle", exact: true }),
        ).toBeVisible();
      if (route === "/puzzles/3x3")
        await expect(
          page.getByRole("region", {
            name: "Tính năng trên ShanBik",
            exact: true,
          }),
        ).toBeVisible();
      if (route.startsWith("/learn/lessons/"))
        await expect(
          page.getByRole("region", { name: "Bài học từng bước", exact: true }),
        ).toBeVisible();
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      for (const width of [320, 360, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${route} at ${width}px`,
        ).toBe(true);
      }
      for (const width of [320, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        results.push({
          route,
          theme,
          width,
          violations: audit.violations,
          incomplete: audit.incomplete.map((item) => ({
            id: item.id,
            impact: item.impact,
            nodes: item.nodes.map((node) => node.target),
          })),
        });
      }
    }
    await writeFile(
      info.outputPath(`beta-accessibility-${theme}.json`),
      JSON.stringify(results, null, 2),
    );
    expect(results.flatMap((result) => result.violations)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("beta: keyboard menu focus and Escape return", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/practice");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Điều hướng", exact: true });
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 10; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true);
  }
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(menu).toBeFocused();
});

test("beta: WebGL context loss disables playback and preserves manual input", async ({
  page,
}) => {
  await page.goto("/practice");
  const capture = page.getByRole("button", {
    name: "Lấy màu từ mô hình",
    exact: true,
  });
  await expect(capture).toBeEnabled();
  await page
    .getByRole("button", { name: "Điền mẫu solved", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Thuật toán 3×3", exact: true })
    .fill("R U F L B D R U F");
  await page
    .getByRole("button", { name: "Phát thuật toán", exact: true })
    .click();
  await page.locator("canvas").evaluate((canvas) => {
    const context = (canvas as HTMLCanvasElement).getContext("webgl2");
    const lose = context?.getExtension("WEBGL_lose_context");
    if (!lose) throw Error("Context-loss extension unavailable");
    lose.loseContext();
  });
  await expect(
    page.getByText("Không thể hiển thị mô hình 3D", { exact: true }),
  ).toBeVisible();
  await expect(capture).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Phát chuỗi", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Đã nhập 54/54 ô", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Giải bản nhập", exact: true })
    .click();
  await expect(
    page.getByText("Khối đã solved. Không cần chạy solver", { exact: false }),
  ).toBeVisible();
});

test("beta: lazy solver and cold-page performance sample", async ({
  page,
  browserName,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const solverRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/solver-worker/"))
      solverRequests.push(request.url());
  });
  await page.goto("/practice");
  await expect(
    page.getByRole("button", { name: "Lấy màu từ mô hình", exact: true }),
  ).toBeEnabled();
  const sample = await page.evaluate(() => {
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    const scripts = resources.filter((item) =>
      new URL(item.name).pathname.endsWith(".js"),
    );
    return {
      domContentLoadedMs: navigation.domContentLoadedEventEnd,
      loadMs: navigation.loadEventEnd,
      sampledAtMs: performance.now(),
      firstContentfulPaintMs:
        performance.getEntriesByName("first-contentful-paint")[0]?.startTime ??
        null,
      scriptDecodedBytes: scripts.reduce(
        (total, item) => total + item.decodedBodySize,
        0,
      ),
      scripts: scripts.map((item) => ({
        path: new URL(item.name).pathname,
        decodedBodyBytes: item.decodedBodySize,
      })),
    };
  });
  await writeFile(
    info.outputPath("beta-performance.json"),
    JSON.stringify(
      {
        browserName,
        browserVersion: browser.version(),
        project: info.project.name,
        scope:
          "Unthrottled cold browser context, local production server; software WebGL; not field CWV or mobile hardware",
        ...sample,
        solverRequestsBeforeSolve: solverRequests,
      },
      null,
      2,
    ),
  );
  expect(solverRequests).toEqual([]);
  // Size budget is deterministic for this build; timing remains reported, not a flaky CI threshold.
  expect(sample.scriptDecodedBytes).toBeGreaterThan(0);
  expect(sample.scriptDecodedBytes).toBeLessThan(3 * 1024 * 1024);
  expect(errors).toEqual([]);
});
