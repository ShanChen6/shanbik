#!/usr/bin/env node
// Measures JavaScript downloaded on first load of each route (after network
// idle) against a running production server: `pnpm build && pnpm start`,
// then `node tools/measure-bundles.mjs http://127.0.0.1:3000`.
// Reports encoded (transfer) and decoded bytes; lazily loaded chunks such as
// the 3D scene, solver worker or Supabase only count if the route loads them
// without user interaction.
import { chromium } from "@playwright/test";
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const routes = process.argv.slice(3).length
  ? process.argv.slice(3)
  : [
      "/",
      "/practice",
      "/timer",
      "/timer/stats",
      "/algorithms",
      "/learn",
      "/puzzles",
      "/puzzles/4x4",
      "/competitions",
      "/search",
      "/help",
      "/tai-khoan",
    ];
const browser = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);
const rows = [];
for (const route of routes) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send("Network.enable");
  const sizes = new Map();
  client.on("Network.responseReceived", (e) => {
    if (e.type === "Script")
      sizes.set(e.requestId, { url: e.response.url, encoded: 0 });
  });
  client.on("Network.loadingFinished", (e) => {
    const entry = sizes.get(e.requestId);
    if (entry) entry.encoded = e.encodedDataLength;
  });
  await page.goto(base + route, { waitUntil: "networkidle" });
  const decoded = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((r) => r.initiatorType === "script" || r.name.endsWith(".js"))
      .reduce((sum, r) => sum + r.decodedBodySize, 0),
  );
  const encoded = [...sizes.values()].reduce((s, x) => s + x.encoded, 0);
  rows.push({
    route,
    scripts: sizes.size,
    "transfer KB": +(encoded / 1024).toFixed(1),
    "decoded KB": +(decoded / 1024).toFixed(1),
  });
  await context.close();
}
await browser.close();
console.table(rows);
