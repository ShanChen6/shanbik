"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useId, useState } from "react";
import { LoadingState } from "@/components/ui/states";
import { createSolvedCubeState } from "../core/state";
import { CUBE_COLORS } from "../core/constants";
import type { CubeState } from "../core/types";
import { COLOR_LABELS, STICKER_COLORS } from "./palette";
import { ViewerFallback } from "./viewer-fallback";

const SOLVED = createSolvedCubeState();
const Scene = dynamic(
  () => import("./cube-scene").then((module) => module.CubeScene),
  { ssr: false, loading: () => <LoadingState label="Đang tải mô hình 3D…" /> },
);

class SceneBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <ViewerFallback /> : this.props.children;
  }
}

function supportsWebGL2() {
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function CubeViewport({ state = SOLVED }: { state?: CubeState }) {
  const captionId = useId();
  const [capability, setCapability] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");
  useEffect(() => {
    // Probe only in the browser after paint; dispose the temporary probe context.
    const frame = requestAnimationFrame(() =>
      setCapability(supportsWebGL2() ? "ready" : "unavailable"),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <figure aria-describedby={captionId}>
      <div className="cube-viewport overflow-hidden rounded-panel border border-border bg-surface-subtle">
        {capability === "loading" ? (
          <LoadingState label="Đang chuẩn bị mô hình 3D…" />
        ) : capability === "unavailable" ? (
          <ViewerFallback />
        ) : (
          <SceneBoundary>
            <Scene
              state={state}
              onContextLost={() => setCapability("unavailable")}
            />
          </SceneBoundary>
        )}
      </div>
      <figcaption id={captionId} className="mt-4 text-sm text-muted">
        Góc nhìn mặc định: mặt trước, trên và phải. Mô hình đang ở chế độ xem
        tĩnh; điều khiển xoay sẽ được bổ sung sau.
      </figcaption>
      <ul
        aria-label="Màu các mặt Rubik"
        className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm"
      >
        {CUBE_COLORS.map((color) => (
          <li key={color} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 rounded-sm border border-control-border"
              style={{ backgroundColor: STICKER_COLORS[color] }}
            />
            {COLOR_LABELS[color]}
          </li>
        ))}
      </ul>
    </figure>
  );
}
