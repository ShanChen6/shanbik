"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FACE_COLORS, FACE_ORDER } from "../core/constants";
import type { CubeFace } from "../core/types";
import { FACE_GUIDES } from "../face-input/draft";
import { COLOR_LABELS } from "../viewer/palette";
import {
  CAMERA_MESSAGES,
  CameraError,
  FRAME_ISSUES,
  assessFrame,
  captureFrame,
  createCameraSession,
  guideQuad,
  type CameraDevice,
  type CameraProblem,
} from "../../puzzle-image/camera";
import type { ImageSource } from "../../puzzle-image/types";

type Phase =
  | { kind: "off"; note?: string }
  | { kind: "starting" }
  | { kind: "live" }
  | { kind: "error"; problem: CameraProblem };
/**
 * Live camera source for the six-face image input. Each capture becomes an
 * ordinary image source (crop = on-screen guide) and goes through the same
 * crop/review/confirm steps as uploaded photos. The stream stops on unmount,
 * when the tab is hidden, when the panel closes and when all faces are taken.
 */
export function CameraCapture({
  captured,
  disabled,
  onCapture,
}: {
  captured: ReadonlySet<CubeFace>;
  disabled: boolean;
  onCapture: (
    face: CubeFace,
    source: ImageSource,
    /** Lighting problems found in the frame, as user-facing text. */
    warnings: string[],
  ) => void;
}) {
  const id = useId();
  const [phase, setPhase] = useState<Phase>({ kind: "off" });
  const [devices, setDevices] = useState<readonly CameraDevice[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [chosen, setChosen] = useState<CubeFace | null>(null);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const session = useRef<ReturnType<typeof createCameraSession> | null>(null);
  const face =
    chosen ?? FACE_ORDER.find((key) => !captured.has(key)) ?? FACE_ORDER[0];
  const stop = (note?: string) => {
    session.current?.stop();
    if (video.current) video.current.srcObject = null;
    setSize({ width: 0, height: 0 });
    setPhase({ kind: "off", note });
  };
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  });
  useEffect(() => {
    const details = root.current?.closest("details");
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && session.current?.active)
        stopRef.current("Camera đã tắt khi bạn rời tab. Bật lại để chụp tiếp.");
    };
    const onToggle = () => {
      if (details && !details.open && session.current?.active)
        stopRef.current("Camera đã tắt khi đóng phần nhập từ ảnh.");
    };
    document.addEventListener("visibilitychange", onVisibility);
    details?.addEventListener("toggle", onToggle);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      details?.removeEventListener("toggle", onToggle);
      session.current?.stop();
    };
  }, []);
  const start = async (id = deviceId) => {
    // Fresh session each start: stopping the old one cancels a pending start.
    session.current?.stop();
    session.current = createCameraSession(navigator.mediaDevices);
    setError("");
    setPhase({ kind: "starting" });
    try {
      const stream = await session.current.start(id || undefined);
      for (const track of stream.getVideoTracks())
        track.addEventListener("ended", () => {
          if (session.current?.active === stream)
            stopRef.current(
              "Camera bị ngắt kết nối. Bật lại hoặc chọn camera khác.",
            );
        });
      const element = video.current;
      if (!element) return stop();
      element.srcObject = stream;
      await element.play().catch(() => undefined);
      setPhase({ kind: "live" });
      const list = await session.current.devices();
      setDevices(list);
      const current = stream.getVideoTracks()[0]?.getSettings().deviceId;
      if (current) setDeviceId(current);
    } catch (reason) {
      if (reason instanceof CameraError && reason.problem === "cancelled")
        return;
      session.current?.stop();
      setPhase({
        kind: "error",
        problem:
          reason instanceof CameraError && reason.problem !== "cancelled"
            ? reason.problem
            : "failed",
      });
    }
  };
  const capture = () => {
    const element = video.current;
    if (!element || phase.kind !== "live") return;
    try {
      const source = captureFrame({
        width: element.videoWidth,
        height: element.videoHeight,
        draw: (context, width, height) =>
          context.drawImage(element, 0, 0, width, height),
      });
      const issues = assessFrame(source.image, source.crop);
      setError("");
      onCapture(
        face,
        source,
        issues.map((issue) => FRAME_ISSUES[issue]),
      );
      setChosen(null);
      const left = FACE_ORDER.filter(
        (key) => key !== face && !captured.has(key),
      );
      if (!left.length) stop("Đã chụp đủ sáu mặt, camera đã tắt.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chưa chụp được.");
    }
  };
  const live = phase.kind === "live",
    guide = size.width ? guideQuad(size.width, size.height) : null;
  return (
    <div
      ref={root}
      className="min-w-0 space-y-3 rounded-sm border border-border p-3"
    >
      <p className="font-semibold">Chụp bằng camera</p>
      <p className="text-sm text-muted">
        Dùng camera sau nếu có. Đặt một mặt vừa khung vuông, nhìn thẳng, đủ
        sáng. Hình chỉ xử lý trong trình duyệt, không ghi hình hay tải lên. Sau
        khi chụp vẫn chỉnh góc, xem lại và sửa màu như ảnh có sẵn.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        {!live ? (
          <Button
            onClick={() => void start()}
            loading={phase.kind === "starting"}
            disabled={disabled}
          >
            Bật camera
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => stop("Đã tắt camera.")}>
            Tắt camera
          </Button>
        )}
        {devices.length > 1 && (
          <div className="flex flex-col gap-1 text-sm">
            <label htmlFor={`${id}-camera`}>Camera</label>
            <select
              id={`${id}-camera`}
              className="ui-input"
              value={deviceId}
              disabled={phase.kind === "starting"}
              onChange={(event) => {
                setDeviceId(event.target.value);
                void start(event.target.value);
              }}
            >
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {phase.kind === "error" && (
        <p role="alert" className="text-sm text-danger">
          {CAMERA_MESSAGES[phase.problem]}
        </p>
      )}
      {phase.kind === "off" && phase.note && (
        <p role="status" className="text-sm text-muted">
          {phase.note}
        </p>
      )}
      <div
        className="relative w-full overflow-hidden rounded-sm bg-black"
        hidden={!live}
        style={
          size.width
            ? { aspectRatio: `${size.width}/${size.height}` }
            : undefined
        }
      >
        <video
          ref={video}
          muted
          playsInline
          aria-label="Hình camera trực tiếp"
          className="block h-full w-full"
          onLoadedMetadata={(event) =>
            setSize({
              width: event.currentTarget.videoWidth,
              height: event.currentTarget.videoHeight,
            })
          }
          onResize={(event) =>
            setSize({
              width: event.currentTarget.videoWidth,
              height: event.currentTarget.videoHeight,
            })
          }
        />
        {guide && (
          <svg
            aria-hidden="true"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {[0, 1, 2, 3].map((i) => {
              const [a, b] = [guide[0], guide[2]],
                t = i / 3;
              return (
                <g
                  key={i}
                  className="stroke-diagram-paper"
                  strokeWidth={i % 3 ? 0.003 : 0.006}
                >
                  <line
                    x1={a.x + (b.x - a.x) * t}
                    y1={a.y}
                    x2={a.x + (b.x - a.x) * t}
                    y2={b.y}
                  />
                  <line
                    x1={a.x}
                    y1={a.y + (b.y - a.y) * t}
                    x2={b.x}
                    y2={a.y + (b.y - a.y) * t}
                  />
                </g>
              );
            })}
          </svg>
        )}
      </div>
      {live && (
        <div className="space-y-2">
          <div className="flex flex-col gap-1 text-sm">
            <label htmlFor={`${id}-face`}>Mặt sẽ chụp</label>
            <select
              id={`${id}-face`}
              className="ui-input"
              value={face}
              onChange={(event) => setChosen(event.target.value as CubeFace)}
            >
              {FACE_ORDER.map((key) => (
                <option key={key} value={key}>
                  {key} — tâm {COLOR_LABELS[FACE_COLORS[key]]}
                  {captured.has(key) ? " (đã có, chụp lại sẽ thay)" : ""}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm">
            Mặt {face}: cạnh trên {FACE_GUIDES[face].top}, trái{" "}
            {FACE_GUIDES[face].left}, phải {FACE_GUIDES[face].right}, dưới{" "}
            {FACE_GUIDES[face].bottom}.
          </p>
          <Button onClick={capture} disabled={disabled || !size.width}>
            Chụp mặt {face}
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
