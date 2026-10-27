"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { createSolvedCubeState } from "../core/state";
import { CUBE_COLORS } from "../core/constants";
import type { CubeState } from "../core/types";
import { COLOR_LABELS, STICKER_COLORS } from "./palette";
import { ViewerFallback } from "./viewer-fallback";

import type { MoveAnimation } from "./single-move";
import type { CameraAction, CameraCommands } from "./camera-controller";

const SOLVED = createSolvedCubeState();
const Scene = dynamic(
  () => import("./cube-scene").then((module) => module.CubeScene),
  { ssr: false, loading: () => <LoadingState label="Đang tải mô hình 3D…" /> },
);

class SceneBoundary extends Component<
  { children: React.ReactNode; onFailure: () => void; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
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

export function CubeViewport({
  state = SOLVED,
  animation,
  onMoveComplete,
  onMoveCancel,
  onReadyChange,
  moveControls,
  fallback,
  fallbackText,
}: {
  state?: CubeState;
  animation?: MoveAnimation | null;
  onMoveComplete?: (id: number) => void;
  onMoveCancel?: (id?: number) => void;
  onReadyChange?: (ready: boolean) => void;
  moveControls?: ReactNode;
  fallback?: ReactNode;
  fallbackText?: string;
}) {
  const captionId = useId();
  const [gestures, setGestures] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const camera = useRef<CameraCommands | null>(null);
  const handleCameraReady = useCallback(
    (controller: CameraCommands | null) => {
      camera.current = controller;
      setCameraReady(controller !== null);
      onReadyChange?.(controller !== null);
    },
    [onReadyChange],
  );
  const [capability, setCapability] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");
  const handleContextLost = useCallback(() => {
    setCapability("unavailable");
    onReadyChange?.(false);
    onMoveCancel?.();
  }, [onMoveCancel, onReadyChange]);
  useEffect(() => {
    // Probe only in the browser after paint; dispose the temporary probe context.
    const frame = requestAnimationFrame(() =>
      setCapability(supportsWebGL2() ? "ready" : "unavailable"),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(
    () => () => {
      onMoveCancel?.();
    },
    [onMoveCancel],
  );
  return (
    <figure
      className="cube-viewer"
      aria-describedby={captionId}
      onKeyDown={(event) => {
        if (event.key === "Escape") setGestures(false);
      }}
    >
      <div className="cube-viewport overflow-hidden rounded-panel border border-border bg-surface-subtle">
        {capability === "loading" ? (
          <LoadingState label="Đang chuẩn bị mô hình 3D…" />
        ) : capability === "unavailable" ? (
          (fallback ?? <ViewerFallback />)
        ) : (
          <SceneBoundary
            onFailure={handleContextLost}
            fallback={fallback ?? <ViewerFallback />}
          >
            <Scene
              state={state}
              fallbackText={fallbackText}
              animation={animation}
              onMoveComplete={onMoveComplete}
              gestures={gestures}
              onCameraReady={handleCameraReady}
              onContextLost={handleContextLost}
            />
          </SceneBoundary>
        )}
      </div>
      {moveControls}
      <div
        role="group"
        aria-label="Điều khiển góc nhìn"
        className="mt-4 flex flex-wrap gap-2"
      >
        {(
          [
            ["left", "Xoay trái"],
            ["right", "Xoay phải"],
            ["up", "Xoay lên"],
            ["down", "Xoay xuống"],
            ["in", "Phóng to"],
            ["out", "Thu nhỏ"],
            ["reset", "Đặt lại góc nhìn"],
          ] as const
        ).map(([action, label]: readonly [CameraAction, string]) => (
          <Button
            key={action}
            variant="secondary"
            disabled={!cameraReady || capability !== "ready"}
            onClick={() => camera.current?.act(action)}
          >
            {label}
          </Button>
        ))}
        <Button
          variant="secondary"
          aria-pressed={gestures}
          disabled={!cameraReady || capability !== "ready"}
          onClick={() => setGestures((current) => !current)}
        >
          {gestures ? "Tắt kéo và zoom" : "Bật kéo và zoom"}
        </Button>
      </div>
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
      <figcaption id={captionId} className="mt-4 text-sm text-muted">
        Dùng các nút để đổi góc nhìn, phóng to hoặc thu nhỏ. Bật kéo và zoom để
        kéo bằng chuột/một ngón tay, lăn bánh xe/trackpad hoặc chụm hai ngón tay
        ngay trong khung. Tắt chế độ này để cuộn trang qua khung như bình
        thường. Đặt lại góc nhìn để trở về mặt trước, trên và phải; màu khối
        không đổi. Escape tắt kéo và zoom khi focus ở trong viewer.
      </figcaption>
    </figure>
  );
}
