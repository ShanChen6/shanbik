import Cube from "cubejs";
// Benchmark-only worker. Production lifecycle/protocol is task 9.3.
self.onmessage = ({ data }) => {
  const { id, type, serialization } = data;
  self.postMessage({ id, type: "phase", phase: type });
  try {
    const start = performance.now();
    if (type === "init") {
      Cube.initSolver();
      self.postMessage({
        id,
        type: "ready",
        initMs: performance.now() - start,
      });
    } else if (type === "solve") {
      const solution = Cube.fromString(serialization).solve(22);
      self.postMessage({
        id,
        type: "result",
        solution,
        solveMs: performance.now() - start,
      });
    } else throw Error("UNSUPPORTED_REQUEST");
  } catch (error) {
    self.postMessage({ id, type: "error", message: String(error) });
  }
};
