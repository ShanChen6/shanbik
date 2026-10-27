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
    reducedMotion: "reduce",
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const requests = [];
  page.on("request", (request) => {
    if (request.url().includes("/solver-worker/")) requests.push(request.url());
  });
  await page.goto("http://127.0.0.1:3179/practice");
  const panel = page.getByRole("region", {
    name: "Nhập màu sáu mặt",
    exact: true,
  });
  const solver = page.getByRole("region", { name: "Giải khối 3×3" });
  const run = () =>
    solver.getByRole("button", { name: /^(Giải bản nhập|Thử giải lại)$/ });
  const cell = (face, index) =>
    panel
      .getByRole("group", { name: `Lưới mặt ${face}`, exact: true })
      .locator("button")
      .nth(index);
  const paint = async (face, index, color) => {
    await panel
      .getByLabel(`Màu tô mặt ${face}`, { exact: true })
      .selectOption(color);
    await cell(face, index).click();
  };
  await run().click();
  await solver.getByRole("alert").waitFor();
  assert.equal(requests.length, 0);
  await panel.getByRole("button", { name: "Điền mẫu solved" }).tap();
  await run().click();
  await solver.getByText(/Khối đã solved. Không cần chạy solver/).waitFor();
  assert.equal(requests.length, 0);
  const fixtures = JSON.parse(
    readFileSync("src/features/cube/core/__fixtures__/moves.json", "utf8"),
  );
  const state = fixtures.cases.find(
    (item) => item.name === "solved: R",
  ).expectedState;
  const faces = ["U", "R", "F", "D", "L", "B"],
    colors = {
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
        await paint(faces[block], index, colors[state[block * 9 + index]]);
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (button) => button.textContent === "Phát thuật toán" && !button.disabled,
    ),
  );
  const canvas = page.locator("canvas");
  await page.waitForTimeout(200);
  const initial = await canvas.screenshot();
  await run().tap();
  await solver.getByText(/Đang khởi tạo solver/).waitFor();
  await solver.getByRole("button", { name: "Hủy tìm lời giải" }).click();
  await solver.getByText(/Đã hủy tìm lời giải/).waitFor();
  assert.equal((await cell("U", 0).getAttribute("aria-label")) !== null, true);
  await run().waitFor();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (button) => button.textContent === "Thử giải lại" && !button.disabled,
    ),
  );
  await run().click();
  await solver.getByText(/Đã kiểm chứng lời giải/).waitFor({ timeout: 70000 });
  assert.equal(
    (await solver.getByLabel("Lời giải đã kiểm chứng").textContent()) !== null,
    true,
  );
  assert.deepEqual(await canvas.screenshot(), initial);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  const screenshot = (await solver.screenshot()).toString("base64");
  for (let i = 0; i < screenshot.length; i += 8000)
    console.log(
      `SOLVER_IMAGE_${String(i / 8000).padStart(3, "0")}=${screenshot.slice(i, i + 8000)}`,
    );
  await paint("U", 0, colors[state[0]]);
  assert.equal(await solver.getByLabel("Lời giải đã kiểm chứng").count(), 0);
  // Route hide releases the ready Worker; next solve is cold and can be invalidated by editing.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole("link", { name: "Trợ giúp", exact: true })
    .first()
    .click();
  await page.waitForURL("**/help");
  const cdp = await browser.newBrowserCDPSession();
  const noTargets = async () => {
    let count = 0;
    for (let i = 0; i < 60; i++) {
      const { targetInfos } = await cdp.send("Target.getTargets");
      count = targetInfos.filter(
        (target) =>
          target.type === "worker" && target.url.includes("/solver-worker/"),
      ).length;
      if (!count) return true;
      await page.waitForTimeout(100);
    }
    return count === 0;
  };
  assert.equal(await noTargets(), true);
  await page.goto("http://127.0.0.1:3179/practice");
  // Next hard navigation clears the draft; re-enter then invalidate a cold request.
  await panel.getByRole("button", { name: "Điền mẫu solved" }).click();
  for (let block = 0; block < 6; block++)
    for (let index = 0; index < 9; index++)
      if (index !== 4 && state[block * 9 + index] !== faces[block])
        await paint(faces[block], index, colors[state[block * 9 + index]]);
  await run().click();
  await solver.getByText(/Đang khởi tạo solver/).waitFor();
  await paint("U", 0, colors[state[0]]);
  assert.equal(await solver.getByLabel("Lời giải đã kiểm chứng").count(), 0);
  assert.equal(await noTargets(), true);
  await page.goto("http://127.0.0.1:3179/worker-solver-check");
  await page.waitForFunction(() => !!window.runSolverCorpus);
  const corpus = await page.evaluate(() => window.runSolverCorpus());
  assert(corpus.count >= 70);
  assert.equal(await noTargets(), true);
  await cdp.detach();
  const timing = corpus.samples
    .map((item) => item.elapsedMs)
    .sort((a, b) => a - b);
  console.log(
    "CUBING_CORPUS=" +
      JSON.stringify({
        count: corpus.count,
        first: corpus.samples[0],
        p50Ms: timing[Math.ceil(timing.length * 0.5) - 1],
        p95Ms: timing[Math.ceil(timing.length * 0.95) - 1],
        maxMs: timing.at(-1),
        samples: corpus.samples,
      }),
  );
  // Inject a silent Worker and advance the browser clock through the real init deadline.
  const silent = await browser.newPage();
  await silent.clock.install();
  await silent.addInitScript(() => {
    window.Worker = class {
      onmessage = null;
      onerror = null;
      onmessageerror = null;
      postMessage() {}
      terminate() {}
    };
  });
  await silent.goto("http://127.0.0.1:3179/practice");
  const sp = silent.getByRole("region", {
    name: "Nhập màu sáu mặt",
    exact: true,
  });
  await sp.getByRole("button", { name: "Điền mẫu solved" }).click();
  for (let block = 0; block < 6; block++)
    for (let index = 0; index < 9; index++)
      if (index !== 4 && state[block * 9 + index] !== faces[block]) {
        await sp
          .getByLabel(`Màu tô mặt ${faces[block]}`, { exact: true })
          .selectOption(colors[state[block * 9 + index]]);
        await sp
          .getByRole("group", { name: `Lưới mặt ${faces[block]}`, exact: true })
          .locator("button")
          .nth(index)
          .click();
      }
  await silent
    .getByRole("button", { name: "Giải bản nhập", exact: true })
    .click();
  await silent.clock.fastForward(60001);
  await silent
    .getByRole("alert")
    .filter({ hasText: /Khởi tạo quá 60 giây/ })
    .waitFor();
  await silent.clock.fastForward(2000);
  assert.equal(
    await silent.getByRole("button", { name: "Thử giải lại" }).isEnabled(),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      invalidAndSolvedNoWorker: true,
      realCubingWorker: true,
      cancelRetry: true,
      snapshotPixelsUnchanged: true,
      mobile360NoOverflow: true,
      editClearsResult: true,
      routeCleanupIncludingNestedWorker: true,
      editCancelsCold: true,
      corpusVerified: corpus.count,
      browserInitTimeoutRetry: true,
      pageErrors: errors,
    }),
  );
} finally {
  await browser.close();
}
