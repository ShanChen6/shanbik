"use client";
import { useEffect, useRef, useState } from "react";
import {
  applyAlgorithm,
  createSolvedCubeState,
  isCubeSolved,
  parseAlgorithm,
  serializeCubeState,
} from "@/features/cube/core";
export default function Probe() {
  const current = useRef(null);
  const [status, setStatus] = useState("idle");
  useEffect(() => () => current.current?.terminate(), []);
  const start = () => {
    current.current?.terminate();
    const worker = new Worker(
      new URL("../../../tools/solver-spike/worker.mjs", import.meta.url),
      { type: "module" },
    );
    current.current = worker;
    setStatus("loading");
    const state = applyAlgorithm(createSolvedCubeState(), parseAlgorithm("R"));
    worker.onmessage = ({ data }) => {
      if (current.current !== worker) return;
      if (data.type === "ready")
        worker.postMessage({
          id: 2,
          type: "solve",
          serialization: serializeCubeState(state),
        });
      if (data.type === "result") {
        try {
          setStatus(
            isCubeSolved(applyAlgorithm(state, parseAlgorithm(data.solution)))
              ? "verified"
              : "bad-result",
          );
        } catch {
          setStatus("bad-result");
        }
      }
      if (data.type === "error") setStatus("error");
    };
    worker.onerror = () => {
      if (current.current === worker) setStatus("error");
    };
    worker.postMessage({ id: 1, type: "init" });
  };
  return (
    <main>
      <h1>Temporary Next Worker probe</h1>
      <button onClick={start}>Run probe</button>
      <button
        onClick={() => {
          current.current?.terminate();
          current.current = null;
          setStatus("cancelled");
        }}
      >
        Cancel probe
      </button>
      <p role="status">{status}</p>
    </main>
  );
}
