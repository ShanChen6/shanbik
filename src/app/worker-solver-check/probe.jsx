"use client";
import { useEffect } from "react";
import { createSolverController } from "@/features/cube/solver/controller";
import { deserializeCubeState } from "@/features/cube/core/serialization";
import report from "../../../../docs/benchmarks/solver-3x3.json";
import oracle from "@/features/cube/core/__fixtures__/moves.json";
export default function Probe() {
  useEffect(() => {
    window.runSolverCorpus = async () => {
      const controller = createSolverController({
        createWorker: () =>
          new Worker("/solver-worker/solver.worker.js", { type: "module" }),
      });
      const inputs = [
        ...new Set([
          ...oracle.cases.map((item) => item.expectedState),
          ...report.profiles[0].samples.map((item) => item.serialization),
        ]),
      ];
      const samples = [];
      try {
        for (const serialization of inputs) {
          let initMs = 0,
            searchStart = 0;
          const start = performance.now();
          const result = await new Promise((resolve, reject) => {
            const off = controller.subscribe(() => {
              const snapshot = controller.getSnapshot();
              if (snapshot.status === "solving" && !searchStart) {
                searchStart = performance.now();
                initMs = searchStart - start;
              }
              if (
                snapshot.status === "success" ||
                snapshot.status === "already-solved"
              ) {
                off();
                resolve(snapshot.result);
              }
              if (snapshot.status === "error") {
                off();
                reject(Error(snapshot.error));
              }
            });
            controller.solve(deserializeCubeState(serialization));
          });
          samples.push({
            serialization,
            notation: result.notation,
            moves: result.moves.length,
            initMs,
            elapsedMs: performance.now() - start,
          });
        }
        return { count: samples.length, samples };
      } finally {
        controller.release();
      }
    };
    return () => {
      delete window.runSolverCorpus;
    };
  }, []);
  return <p>Temporary production Worker corpus probe</p>;
}
