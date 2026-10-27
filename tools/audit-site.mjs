// Task 20.3: crawl a running build for broken internal links and anchors.
// Usage: pnpm build && pnpm start, then
//   node tools/audit-site.mjs [baseURL] [--json report.json]
// Reads server-rendered HTML only: anchors created after hydration are
// reported as "client" (checked by E2E), not as broken.
const base = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
const jsonOut = process.argv.includes("--json")
  ? process.argv[process.argv.indexOf("--json") + 1]
  : null;
const seeds = ["/", "/search", "/help", "/learn", "/puzzles", "/algorithms"];
// Client-rendered lists (catalog, search) hide links from server HTML, so also
// seed every prerendered route of the current build.
try {
  const { readFile } = await import("node:fs/promises");
  const manifest = JSON.parse(
    await readFile(
      new URL("../.next/prerender-manifest.json", import.meta.url),
      "utf8",
    ),
  );
  for (const route of Object.keys(manifest.routes))
    if (!/^\/(_|ui-preview|icon|favicon)/.test(route)) seeds.push(route);
} catch {
  console.log("No .next/prerender-manifest.json; crawling from links only.");
}
const pages = new Map(); // path -> { status, ids:Set, links:[{href, from}] }
const queue = [...seeds];
const external = new Map(); // href -> Set(from)
const attr = (html, name) =>
  [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "g"))].map((m) =>
    m[1].replace(/&amp;/g, "&"),
  );
while (queue.length) {
  const path = queue.shift();
  if (pages.has(path)) continue;
  const res = await fetch(new URL(path, base), { redirect: "manual" });
  const html = res.headers.get("content-type")?.includes("text/html")
    ? await res.text()
    : "";
  const page = {
    status: res.status,
    ids: new Set(attr(html, "id")),
    links: [],
  };
  pages.set(path, page);
  for (const href of attr(html, "href")) {
    if (/^(mailto:|tel:|javascript:)/.test(href)) continue;
    const url = new URL(href, new URL(path, base));
    if (url.origin !== base.origin) {
      if (!external.has(url.href)) external.set(url.href, new Set());
      external.get(url.href).add(path);
      continue;
    }
    // Static assets (CSS/fonts/icons) are not pages.
    if (
      /^\/(_next|brand|licenses|solver-worker)\//.test(url.pathname) ||
      /\.\w+$/.test(url.pathname)
    )
      continue;
    page.links.push({
      path: url.pathname + url.search,
      hash: url.hash.slice(1),
      from: path,
    });
    if (!pages.has(url.pathname + url.search))
      queue.push(url.pathname + url.search);
  }
}
const broken = [],
  anchors = [];
for (const page of pages.values())
  for (const link of page.links) {
    const target = pages.get(link.path);
    if (!target || target.status >= 400)
      broken.push({ ...link, status: target?.status ?? "missing" });
    else if (link.hash && !target.ids.has(decodeURIComponent(link.hash)))
      anchors.push(link);
  }
const report = {
  base: base.href,
  pages: [...pages].map(([path, p]) => ({
    path,
    status: p.status,
    links: p.links.length,
  })),
  broken,
  clientAnchors: anchors,
  external: [...external].map(([href, from]) => ({ href, from: [...from] })),
};
console.log(`Pages crawled: ${pages.size}`);
for (const p of report.pages)
  if (p.status !== 200) console.log(`  ${p.status} ${p.path}`);
console.log(`Broken internal links: ${broken.length}`);
for (const b of broken) console.log(`  ${b.status} ${b.path} (from ${b.from})`);
console.log(`Anchors not in server HTML: ${anchors.length}`);
for (const a of anchors) console.log(`  ${a.path}#${a.hash} (from ${a.from})`);
console.log(`External links: ${external.size}`);
for (const e of report.external) console.log(`  ${e.href}`);
if (jsonOut) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(jsonOut, JSON.stringify(report, null, 2) + "\n");
}
process.exitCode = broken.length ? 1 : 0;
