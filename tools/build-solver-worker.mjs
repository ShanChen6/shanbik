import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cubingEntry = fileURLToPath(import.meta.resolve("cubing/search"));
const searchEntry = path.resolve(
  path.dirname(cubingEntry),
  "../chunks/search-worker-entry.js",
);
const outdir = path.join(root, "public/solver-worker");
await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
// Keep the worker entry URLs stable. Native import.meta.resolve/new URL fallback
// in cubing.js can find search-worker-entry.js beside the owned worker.
const result = await build({
  entryPoints: {
    "solver.worker": path.join(
      root,
      "src/features/cube/solver/solver.worker.ts",
    ),
    "scramble.worker": path.join(
      root,
      "src/features/puzzles/scramble/scramble.worker.ts",
    ),
    "search-worker-entry": searchEntry,
  },
  outdir,
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  sourcemap: "external",
  sourcesContent: true,
  legalComments: "linked",
  banner: {
    js: "/*! cubing.js 0.66.1: MPL-2.0 OR GPL-3.0-or-later. Notices/source: /licenses/cubing-NOTICE.txt */",
  },
  metafile: true,
});
const pkg = JSON.parse(
  await readFile(
    path.resolve(path.dirname(cubingEntry), "../../../../package.json"),
    "utf8",
  ),
);
await writeFile(
  path.join(outdir, "manifest.json"),
  JSON.stringify(
    {
      cubingVersion: pkg.version,
      outputs: Object.fromEntries(
        Object.entries(result.metafile.outputs).map(([name, value]) => [
          path.basename(name),
          value.bytes,
        ]),
      ),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Built cubing.js ${pkg.version} worker graph (${Object.keys(result.metafile.outputs).length} files)`,
);
