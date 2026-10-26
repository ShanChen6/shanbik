import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const oraclePath = process.argv[2];
if (!oraclePath || !isAbsolute(oraclePath))
  throw new Error(
    "Pass an absolute path to a separately installed cubejs@1.3.2 package directory.",
  );
const loadOracle = createRequire(import.meta.url);
const Cube = loadOracle(oraclePath);
const { version } = loadOracle(join(oraclePath, "package.json"));
if (version !== "1.3.2")
  throw new Error(`Expected cubejs 1.3.2, got ${version}.`);
const prefix = "R U2 F' L2 D B R2 U F2 D' L B2";
const cases = [];
function add(name, initialAlgorithm, algorithm) {
  const cube = new Cube().move(initialAlgorithm);
  const initialState = cube.asString();
  const expectedState = cube.move(algorithm).asString();
  cases.push({
    name,
    initialAlgorithm,
    initialState,
    algorithm,
    expectedState,
  });
}
for (const face of ["U", "R", "F", "D", "L", "B"]) {
  for (const suffix of ["", "'", "2"]) {
    add(`solved: ${face}${suffix}`, "", `${face}${suffix}`);
    add(`mixed: ${face}${suffix}`, prefix, `${face}${suffix}`);
  }
}
const composites = [
  "R U R' U'",
  "F R U R' U' F'",
  "R2 L2 U2 D2 F2 B2",
  "U F R2 B' D2 L'",
  "R U2 R' U' R U' R'",
  "R L U D F B R' L' U' D' F' B'",
];
composites.forEach((algorithm, i) =>
  add(`composite ${i + 1}`, i % 2 ? prefix : "", algorithm),
);
let seed = 0x53424b;
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
function sequence(length) {
  const faces = ["U", "R", "F", "D", "L", "B"];
  const suffixes = ["", "'", "2"];
  const moves = [];
  let last;
  while (moves.length < length) {
    const face = faces[(next() >>> 16) % faces.length];
    if (face === last) continue;
    moves.push(face + suffixes[(next() >>> 16) % suffixes.length]);
    last = face;
  }
  return moves.join(" ");
}
for (let i = 0; i < 12; i++)
  add(
    `deterministic sequence ${i + 1}`,
    i % 2 ? sequence(24) : "",
    sequence(40),
  );
const output = fileURLToPath(
  new URL("../src/features/cube/core/__fixtures__/moves.json", import.meta.url),
);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(
  output,
  JSON.stringify(
    {
      oracle: {
        package: "cubejs",
        version,
        source: "https://github.com/ldez/cubejs",
        method: "new Cube().move(initial).move(algorithm).asString()",
        seed: "0x53424b",
        solverInitialized: false,
      },
      cases,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Wrote ${cases.length} move fixtures; cubejs was not added to application dependencies.`,
);
