import { chromium } from "../tools/solver-spike/node_modules/playwright/index.mjs";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:3178/solver-spike-check");
  await page.getByRole("button", { name: "Run probe" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: /^verified$/ })
    .waitFor({ timeout: 60000 });
  await page.getByRole("button", { name: "Run probe" }).click();
  await page.waitForTimeout(50);
  await page.getByRole("button", { name: "Cancel probe" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: /^cancelled$/ })
    .waitFor();
  await page.getByRole("button", { name: "Run probe" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: /^verified$/ })
    .waitFor({ timeout: 60000 });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      nextProductionWorkerVerified: true,
      cancelRetry: true,
      errors,
    }),
  );
} finally {
  await browser.close();
}
