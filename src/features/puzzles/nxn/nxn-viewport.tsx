"use client";
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import type {
  CameraAction,
  CameraCommands,
} from "../../cube/viewer/camera-controller";
import { supportsWebGL2 } from "../../cube/viewer/cube-viewport";
import type { NxnState } from "./model";
const Scene = dynamic(
  () => import("./nxn-scene").then((module) => module.NxnScene),
  { ssr: false, loading: () => <LoadingState label="Đang tải mô hình 3D…" /> },
);
class Boundary extends Component<
  { children: ReactNode; onFailure: () => void },
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
    return this.state.failed ? null : this.props.children;
  }
}
const CAMERA: readonly (readonly [CameraAction, string])[] = [
  ["left", "Xoay trái"],
  ["right", "Xoay phải"],
  ["up", "Xoay lên"],
  ["down", "Xoay xuống"],
  ["in", "Phóng to"],
  ["out", "Thu nhỏ"],
  ["reset", "Đặt lại góc nhìn"],
];
/** 3D view with the 3×3 camera UX; the caller always shows the 2D net too. */
export function NxnViewport({ state }: { state: NxnState }) {
  const [capability, setCapability] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");
  const [gestures, setGestures] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const camera = useRef<CameraCommands | null>(null);
  const onCameraReady = useCallback((c: CameraCommands | null) => {
    camera.current = c;
    setCameraReady(c !== null);
  }, []);
  const lost = useCallback(() => setCapability("unavailable"), []);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setCapability(supportsWebGL2() ? "ready" : "unavailable"),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  if (capability === "unavailable")
    return (
      <p role="status" className="rounded-xl border border-border p-4 text-sm">
        Mô hình 3D không khả dụng (WebGL bị tắt hoặc kết nối đồ họa bị gián
        đoạn). Sơ đồ sáu mặt bên dưới vẫn cập nhật theo từng nước.
      </p>
    );
  return (
    <div
      className="space-y-3"
      onKeyDown={(e) => {
        if (e.key === "Escape") setGestures(false);
      }}
    >
      <div className="cube-viewport overflow-hidden rounded-panel border border-border bg-surface-subtle">
        {capability === "loading" ? (
          <LoadingState label="Đang chuẩn bị mô hình 3D…" />
        ) : (
          <Boundary onFailure={lost}>
            <Scene
              state={state}
              gestures={gestures}
              onCameraReady={onCameraReady}
              onContextLost={lost}
            />
          </Boundary>
        )}
      </div>
      <div
        role="group"
        aria-label="Điều khiển góc nhìn"
        className="flex flex-wrap gap-2"
      >
        {CAMERA.map(([action, label]) => (
          <Button
            key={action}
            variant="secondary"
            disabled={!cameraReady}
            onClick={() => camera.current?.act(action)}
          >
            {label}
          </Button>
        ))}
        <Button
          variant="secondary"
          aria-pressed={gestures}
          disabled={!cameraReady}
          onClick={() => setGestures((g) => !g)}
        >
          {gestures ? "Tắt kéo và zoom" : "Bật kéo và zoom"}
        </Button>
      </div>
    </div>
  );
}
