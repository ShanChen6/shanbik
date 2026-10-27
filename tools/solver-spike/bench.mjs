import { build } from "esbuild";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gzipSync, brotliCompressSync } from "node:zlib";
import { cpus, platform, release, totalmem } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, "output");
await mkdir(output, { recursive: true });
const bundleStats = {};
for (const name of ["worker", "host"]) {
  const result = await build({
    entryPoints: [path.join(root, `${name}.mjs`)],
    bundle: true,
    minify: true,
    format: "iife",
    platform: "browser",
    target: "es2022",
    outfile: path.join(output, `${name}.js`),
    metafile: true,
    legalComments: "external",
  });
  const bytes = await readFile(path.join(output, `${name}.js`));
  bundleStats[name] = {
    rawBytes: bytes.length,
    gzipBytes: gzipSync(bytes).length,
    brotliBytes: brotliCompressSync(bytes).length,
    inputs: Object.keys(result.metafile.inputs).filter((item) =>
      item.includes("node_modules"),
    ),
  };
}
const server = createServer(async (req, res) => {
  try {
    const name =
      req.url === "/"
        ? null
        : req.url === "/worker.js"
          ? "worker.js"
          : req.url === "/host.js"
            ? "host.js"
            : undefined;
    if (name === undefined) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Type",
      name ? "application/javascript" : "text/html",
    );
    res.end(
      name
        ? await readFile(path.join(output, name))
        : '<!doctype html><html lang="en"><title>Isolated solver benchmark</title><script src="/host.js"></script><body>Solver spike</body></html>',
    );
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const summarize = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n: sorted.length,
    min: sorted[0],
    p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    max: sorted.at(-1),
  };
};
async function workerHeap(browser) {
  const cdp = await browser.newBrowserCDPSession();
  let sessionId;
  try {
    const { targetInfos } = await cdp.send("Target.getTargets");
    const target = targetInfos.find(
      (item) => item.type === "worker" && item.url === `${url}/worker.js`,
    );
    if (!target) return { supported: false, reason: "no worker target" };
    ({ sessionId } = await cdp.send("Target.attachToTarget", {
      targetId: target.targetId,
      flatten: false,
    }));
    const response = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error("CDP heap timeout")), 5000);
      cdp.on("Target.receivedMessageFromTarget", (message) => {
        if (message.sessionId !== sessionId) return;
        const data = JSON.parse(message.message);
        if (data.id === 1) {
          clearTimeout(timer);
          if (data.error) reject(Error(data.error.message));
          else resolve(data.result);
        }
      });
    });
    await cdp.send("Target.sendMessageToTarget", {
      sessionId,
      message: JSON.stringify({ id: 1, method: "Runtime.getHeapUsage" }),
    });
    return { supported: true, ...(await response) };
  } catch (error) {
    return { supported: false, reason: String(error) };
  } finally {
    if (sessionId)
      await cdp.send("Target.detachFromTarget", { sessionId }).catch(() => {});
    await cdp.detach();
  }
}
const report = {
  schema: 1,
  measuredAt: new Date().toISOString(),
  candidate: "cubejs@1.3.2",
  environment: {
    node: process.version,
    platform: platform(),
    osRelease: release(),
    cpu: cpus()[0]?.model,
    logicalCpus: cpus().length,
    totalRamBytes: totalmem(),
  },
  bundle: bundleStats,
  profiles: [],
};
try {
  for (const profile of [
    {
      name: "desktop-jit",
      args: [],
      coldRuns: 3,
      rounds: 3,
      viewport: { width: 1280, height: 900 },
    },
    {
      name: "constrained-jitless",
      args: ["--js-flags=--jitless"],
      coldRuns: 2,
      rounds: 1,
      viewport: { width: 360, height: 800 },
    },
  ]) {
    console.log(`Running ${profile.name}`);
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", ...profile.args],
    });
    try {
      const page = await browser.newPage({ viewport: profile.viewport });
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.goto(url);
      await page.waitForFunction(() => !!window.spike);
      const browserInfo = await page.evaluate(() => ({
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
      }));
      const fixtures = await page.evaluate(() => window.spike.fixtures);
      const gate = await page.evaluate(async () => {
        const before = window.spike.stats().workerStarts;
        const rejected = [];
        for (const item of window.spike.invalid)
          rejected.push({
            name: item.name,
            status: (await window.spike.solve(item.state)).status,
          });
        const solved = await window.spike.solve(window.spike.fixtures[0].state);
        return {
          before,
          after: window.spike.stats().workerStarts,
          rejected,
          solved,
        };
      });
      assert.equal(gate.before, gate.after);
      assert(gate.rejected.every((item) => item.status === "invalid"));
      assert.equal(gate.solved.status, "already-solved");
      assert.equal(gate.solved.moves, 0);
      await page.evaluate(() => {
        window.beats = [];
        let last = performance.now();
        window.beatTimer = setInterval(() => {
          const now = performance.now();
          window.beats.push(now - last);
          last = now;
        }, 20);
      });
      const cold = [];
      const mainCdp = await page.context().newCDPSession(page);
      const mainBefore = await mainCdp.send("Runtime.getHeapUsage");
      for (let run = 0; run < profile.coldRuns; run++) {
        await page.evaluate(() => window.spike.cancel());
        cold.push(await page.evaluate(() => window.spike.boot()));
      }
      const heapAfterInit = await workerHeap(browser);
      const mainAfterInit = await mainCdp.send("Runtime.getHeapUsage");
      const samples = [];
      for (let round = 0; round < profile.rounds; round++)
        for (const fixture of fixtures.slice(1)) {
          const result = await page.evaluate(
            (state) => window.spike.solve(state),
            fixture.state,
          );
          assert.equal(result.status, "solution");
          assert(result.moves <= 22);
          samples.push({
            round,
            name: fixture.name,
            serialization: fixture.serialization,
            solution: result.solution,
            moves: result.moves,
            solveMs: result.solveMs,
            roundTripMs: result.roundTripMs,
            verified: true,
          });
        }
      const heapAfterWarm = await workerHeap(browser);
      const wrongResultRejected = await page.evaluate((state) => {
        try {
          window.spike.verify(state, "");
          return false;
        } catch {
          return true;
        }
      }, fixtures[1].state);
      assert(wrongResultRejected);
      const cancellation = [];
      for (const phase of ["init", "solve"]) {
        await page.evaluate(() => window.spike.cancel());
        if (phase === "solve") await page.evaluate(() => window.spike.boot());
        const result = await page.evaluate(
          async ({ phase, state }) => {
            window.spike.setCancelPhase(phase);
            const start = performance.now();
            try {
              if (phase === "init") await window.spike.boot();
              else await window.spike.solve(state);
              return { cancelled: false };
            } catch (error) {
              return {
                cancelled: error.message === "CANCELLED",
                elapsedMs: performance.now() - start,
              };
            }
          },
          { phase, state: fixtures.at(-1).state },
        );
        assert.equal(result.cancelled, true);
        const cleanupStart = performance.now();
        const targets = await browser.newBrowserCDPSession();
        for (let attempt = 0; attempt < 50; attempt++) {
          const list = await targets.send("Target.getTargets");
          result.remainingWorkerTargets = list.targetInfos.filter(
            (item) => item.type === "worker" && item.url === `${url}/worker.js`,
          ).length;
          if (result.remainingWorkerTargets === 0) break;
          await page.waitForTimeout(100);
        }
        result.cleanupMs = performance.now() - cleanupStart;
        await targets.detach();
        assert.equal(result.remainingWorkerTargets, 0);
        cancellation.push({ phase, ...result });
      }
      const timeout = await page.evaluate(async () => {
        const start = performance.now();
        try {
          await window.spike.boot(1);
          return { timedOut: false };
        } catch (error) {
          return {
            timedOut: error.message === "TIMEOUT",
            elapsedMs: performance.now() - start,
          };
        }
      });
      assert(timeout.timedOut);
      const retry = await page.evaluate(
        (state) => window.spike.solve(state),
        fixtures[1].state,
      );
      assert.equal(retry.status, "solution");
      const beats = await page.evaluate(() => {
        clearInterval(window.beatTimer);
        return window.beats;
      });
      const roundTrips = await page.evaluate(() =>
        window.spike.fixtures.every(
          (item) =>
            window.spike.roundTrip(item.serialization) === item.serialization,
        ),
      );
      assert(roundTrips);
      assert.deepEqual(pageErrors, []);
      await page.evaluate(() => window.spike.cancel());
      const item = {
        name: profile.name,
        description:
          profile.name === "desktop-jit"
            ? "Headless Chromium on the recorded host, JIT enabled"
            : "Same host with V8 --jitless; constrained-engine proxy, NOT a physical phone or CPU-throttle calibration",
        browser: browser.version(),
        browserInfo,
        viewport: profile.viewport,
        fixtureCount: fixtures.length,
        cold,
        summary: {
          coldMs: summarize(cold.map((item) => item.coldMs)),
          initMs: summarize(cold.map((item) => item.initMs)),
          warmSolveMs: summarize(samples.map((item) => item.solveMs)),
          warmRoundTripMs: summarize(samples.map((item) => item.roundTripMs)),
          heartbeatIntervalMs: summarize(beats),
        },
        memory: {
          scope:
            "CDP worker JS heap snapshots while idle, not peak/process RSS",
          workerAfterInit: heapAfterInit,
          workerAfterWarm: heapAfterWarm,
          mainBefore,
          mainAfterInit,
        },
        gate,
        cancellation,
        timeout,
        retryVerified: true,
        wrongResultRejected,
        serializationRoundTrips: roundTrips,
        samples,
        pageErrors,
      };
      report.profiles.push(item);
      console.log(
        JSON.stringify({
          profile: item.name,
          summary: item.summary,
          memory: item.memory,
          cancellation,
          timeout,
        }),
      );
      await mainCdp.detach();
    } finally {
      await browser.close();
    }
  }
  const reportPath =
    process.env.SOLVER_REPORT_PATH || path.join(output, "report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  if (process.env.SOLVER_REPORT_LOG === "1") {
    const encoded = Buffer.from(JSON.stringify(report)).toString("base64");
    for (let i = 0; i < encoded.length; i += 8000)
      console.log(
        `SOLVER_REPORT_${String(i / 8000).padStart(3, "0")}=${encoded.slice(i, i + 8000)}`,
      );
  }
  console.log(`Report: ${reportPath}`);
} finally {
  await new Promise((resolve) => server.close(resolve));
}
