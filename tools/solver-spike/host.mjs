import {
  applyAlgorithm,
  createSolvedCubeState,
  deserializeCubeState,
  FACE_ORDER,
  isCubeSolved,
  parseAlgorithm,
  serializeCubeState,
  validateCubeFeasibility,
} from "../../src/features/cube/core/index.ts";
let worker = null,
  ready = false,
  nextId = 0,
  generation = 0,
  pending = null,
  workerStarts = 0,
  ignoredMessages = 0;
let cancelOnPhase = null;
const fixtureList = [{ name: "solved", state: createSolvedCubeState() }];
const moves = FACE_ORDER.flatMap((face) =>
  [1, -1, 2].map((turns) => ({ face, turns })),
);
for (const move of moves)
  fixtureList.push({
    name: `single-${move.face}-${move.turns}`,
    state: applyAlgorithm(createSolvedCubeState(), [move]),
  });
let seed = 0x53424b;
for (const [length, count] of [
  [25, 12],
  [40, 8],
])
  for (let sample = 0; sample < count; sample++) {
    const algorithm = [];
    for (let index = 0; index < length; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      algorithm.push(moves[seed % 18]);
    }
    fixtureList.push({
      name: `seed-${length}-${sample}`,
      state: applyAlgorithm(createSolvedCubeState(), algorithm),
    });
  }
fixtureList.push({
  name: "superflip",
  state: applyAlgorithm(
    createSolvedCubeState(),
    parseAlgorithm("U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2"),
  ),
});
const invalid = [];
for (const [name, changes] of [
  [
    "edge-flip",
    [
      ["U", 7, "green"],
      ["F", 1, "white"],
    ],
  ],
  [
    "corner-twist",
    [
      ["U", 8, "red"],
      ["R", 0, "green"],
      ["F", 2, "white"],
    ],
  ],
  [
    "parity",
    [
      ["R", 1, "green"],
      ["F", 1, "red"],
    ],
  ],
  [
    "duplicate-edge",
    [
      ["F", 1, "blue"],
      ["B", 7, "green"],
    ],
  ],
  [
    "mirrored-corner",
    [
      ["R", 0, "green"],
      ["F", 2, "red"],
    ],
  ],
  ["missing", [["U", 0, null]]],
]) {
  const state = JSON.parse(JSON.stringify(createSolvedCubeState()));
  for (const [face, index, color] of changes) state.faces[face][index] = color;
  invalid.push({ name, state });
}
function cancel(reason = "CANCELLED") {
  generation++;
  ready = false;
  worker?.terminate();
  worker = null;
  if (pending) {
    clearTimeout(pending.timer);
    const reject = pending.reject;
    pending = null;
    reject(Error(reason));
  }
}
function rpc(data, timeoutMs) {
  if (pending) throw Error("BUSY");
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending = {
      id,
      resolve,
      reject,
      timer: setTimeout(() => cancel("TIMEOUT"), timeoutMs),
    };
    worker.postMessage({ ...data, id });
  });
}
async function boot(timeoutMs = 120000) {
  if (ready) return null;
  if (worker) cancel();
  const epoch = ++generation;
  worker = new Worker("/worker.js");
  workerStarts++;
  worker.onmessage = ({ data }) => {
    if (epoch !== generation || !pending || pending.id !== data.id) {
      ignoredMessages++;
      return;
    }
    if (data.type === "phase") {
      if (cancelOnPhase === data.phase) {
        cancelOnPhase = null;
        cancel();
      }
      return;
    }
    const request = pending;
    pending = null;
    clearTimeout(request.timer);
    if (data.type === "error") {
      request.reject(Error(data.message));
      return;
    }
    request.resolve(data);
  };
  worker.onerror = () => {
    if (epoch === generation) cancel("WORKER_ERROR");
  };
  const start = performance.now();
  const result = await rpc({ type: "init" }, timeoutMs);
  ready = true;
  return { ...result, coldMs: performance.now() - start };
}
function verify(state, solution) {
  if (typeof solution !== "string") throw Error("INVALID_RESULT_TYPE");
  const algorithm = parseAlgorithm(solution);
  if (!isCubeSolved(applyAlgorithm(state, algorithm)))
    throw Error("UNVERIFIED_SOLUTION");
  return algorithm.length;
}
async function solve(state, timeoutMs = 120000) {
  const checked = validateCubeFeasibility(state);
  if (!checked.valid) return { status: "invalid" };
  if (isCubeSolved(checked.state))
    return { status: "already-solved", solution: "", moves: 0 };
  const start = performance.now();
  await boot();
  const result = await rpc(
    { type: "solve", serialization: checked.serialization },
    timeoutMs,
  );
  return {
    status: "solution",
    ...result,
    moves: verify(checked.state, result.solution),
    roundTripMs: performance.now() - start,
  };
}
window.spike = {
  boot,
  solve,
  cancel,
  verify,
  invalid,
  fixtures: fixtureList.map((item) => ({
    ...item,
    serialization: serializeCubeState(item.state),
  })),
  setCancelPhase: (phase) => {
    cancelOnPhase = phase;
  },
  stats: () => ({ workerStarts, ignoredMessages, generation }),
  roundTrip: (serialization) =>
    serializeCubeState(deserializeCubeState(serialization)),
};
