#!/usr/bin/env node
// Fails when a color literal (hex, rgb[a](), hsl[a]()) appears outside the
// theme sources. Colors belong in src/styles/tokens.css; sticker/WebGL colors
// in src/features/cube/viewer/palette.ts. Tests are exempt (fixtures).
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
const ROOT = new URL("..", import.meta.url).pathname;
const ALLOWED = new Set([
  "src/styles/tokens.css",
  "src/features/cube/viewer/palette.ts",
]);
const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g;
async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(tsx?|css)$/.test(entry.name)) yield path;
  }
}
const problems = [];
for await (const path of files(join(ROOT, "src"))) {
  const rel = relative(ROOT, path);
  if (ALLOWED.has(rel) || /\.test\.tsx?$/.test(rel)) continue;
  const lines = (await readFile(path, "utf8")).split("\n");
  lines.forEach((line, i) => {
    // `tokens-ok`: the line builds a color from token values (e.g. canvas).
    if (line.includes("tokens-ok")) return;
    // License headers cite "Prompt #021"; numbered references are not colors.
    const code = line.replace(/Prompt #\d+|uxui-prompt\/#\d+/g, "");
    for (const match of code.matchAll(COLOR))
      problems.push(
        `${rel}:${i + 1}: ${match[0]} — dùng token trong src/styles/tokens.css`,
      );
  });
}
if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} màu viết cứng ngoài nguồn token.`);
  process.exit(1);
}
console.log(
  "Tokens OK: không có màu viết cứng ngoài src/styles/tokens.css và palette.ts.",
);
