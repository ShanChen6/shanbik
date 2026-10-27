# Isolated 3×3 solver spike

Task 9.2 only. This directory is not a pnpm workspace or an application dependency. It pins cubejs 1.3.2, esbuild 0.25.12 and Playwright 1.56.1 in its own npm lockfile. Root app dependencies/lockfile are unchanged.

## Reproduce (Node 24)

From repository root:

```sh
pnpm install --frozen-lockfile
npm ci --prefix tools/solver-spike --ignore-scripts --no-audit --no-fund
node tools/solver-spike/node_modules/playwright/cli.js install chromium --only-shell
npm --prefix tools/solver-spike run bench
```

Linux hosts without Chromium dependencies may need Playwright `install --with-deps chromium --only-shell` (requires OS package privileges). No elevated install is required by the script itself. The manually triggered **Solver spike benchmark** GitHub workflow is another execution environment.

The harness builds separate minified browser host and dedicated Worker bundles, serves a loopback HTTP endpoint with no-store caching, and launches two fresh Chromium processes: normal JIT and `--jitless`. Each profile has fresh workers for cold samples and reuses the final initialized worker for warm samples. The second profile uses a 360px viewport but is **not a physical mobile benchmark**. Allow several minutes: jitless initialization is intentionally expensive.

Outputs (ignored): `output/host.js`, `output/worker.js`, `output/report.json`. `SOLVER_REPORT_PATH` chooses another existing output directory; `SOLVER_REPORT_LOG=1` exports base64 chunks for restricted remote environments. Committed measurements live in `docs/benchmarks/solver-3x3.json`; rerunning does not overwrite those historical measurements automatically.

`host.mjs` generates 40 deterministic fixtures: solved, all 18 single moves, twelve seeded 25-move and eight seeded 40-move inputs, and superflip. Six invalid inputs are rejected before worker creation. Every solution is parsed and applied using ShanBik core, and must reach solved. The main document runs a 20ms heartbeat. CDP collects idle worker JS heap snapshots and checks eventual worker-target cleanup after cancel. A 1ms injected deadline exercises timeout/retry, not the selected product timeout. Empty/wrong solutions are rejected by the core verification gate.

Cold numbers include worker startup/import/init; `initMs` covers only table initialization. Warm `solveMs` is worker CPU wall time; round-trip also includes messaging/core verification. Heap readings are not peak memory or process RSS. Cancellation response and eventual target disappearance are measured separately. Percentiles use nearest rank; the raw samples and small n are part of the result.

The host/worker here are a measurement prototype. Production request schema, repeated worker-side validation, lifecycle/queue ownership, user-facing loading/errors and Next integration belong to task 9.3. Do not import the spike into application routes. Keep the upstream MIT copyright/license when distributing cubejs in the future application worker.
