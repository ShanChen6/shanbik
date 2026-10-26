"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  PerspectiveCamera,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
} from "three";
import type { CubeState } from "../core/types";
import { CUBE_COLORS } from "../core/constants";
import { buildCubeViewModel } from "./view-model";
import { STICKER_COLORS } from "./palette";
import { STICKER_ROTATIONS } from "./sticker-orientation";
import { ViewerFallback } from "./viewer-fallback";
import { CAMERA_FOV, VIEWER_DPR } from "./camera";

import {
  attachCameraGestures,
  createCameraController,
  type CameraCommands,
} from "./camera-controller";

function stickerShape() {
  const shape = new Shape();
  const h = 0.4,
    r = 0.07;
  shape.moveTo(-h + r, -h);
  shape.lineTo(h - r, -h);
  shape.quadraticCurveTo(h, -h, h, -h + r);
  shape.lineTo(h, h - r);
  shape.quadraticCurveTo(h, h, h - r, h);
  shape.lineTo(-h + r, h);
  shape.quadraticCurveTo(-h, h, -h, h - r);
  shape.lineTo(-h, -h + r);
  shape.quadraticCurveTo(-h, -h, -h + r, -h);
  return shape;
}

function CubeModel({ state }: { state: CubeState }) {
  const cubies = useMemo(() => buildCubeViewModel(state), [state]);
  const resources = useMemo(
    () => ({
      body: new BoxGeometry(0.94, 0.94, 0.94),
      sticker: new ShapeGeometry(stickerShape()),
      plastic: new MeshStandardMaterial({
        color: "#34464d",
        roughness: 0.75,
        metalness: 0.02,
      }),
      colors: Object.fromEntries(
        CUBE_COLORS.map((color) => [
          color,
          new MeshBasicMaterial({
            color: STICKER_COLORS[color],
            toneMapped: false,
          }),
        ]),
      ) as Record<keyof typeof STICKER_COLORS, MeshBasicMaterial>,
    }),
    [],
  );
  useEffect(
    () => () => {
      resources.body.dispose();
      resources.sticker.dispose();
      resources.plastic.dispose();
      for (const material of Object.values(resources.colors))
        material.dispose();
    },
    [resources],
  );
  return (
    <group name="cube-model" dispose={null}>
      {cubies.map((cubie) => (
        <group
          key={cubie.id}
          name={`cubie:${cubie.id}`}
          position={[...cubie.position]}
        >
          <mesh geometry={resources.body} material={resources.plastic} />
          {cubie.stickers.map((sticker) => (
            <mesh
              key={sticker.face}
              name={`sticker:${sticker.face}:${sticker.index}`}
              position={[
                sticker.normal[0] * 0.476,
                sticker.normal[1] * 0.476,
                sticker.normal[2] * 0.476,
              ]}
              rotation={[...STICKER_ROTATIONS[sticker.face]]}
              geometry={resources.sticker}
              material={resources.colors[sticker.color]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function CameraControls({
  gestures,
  onReady,
}: {
  gestures: boolean;
  onReady: (controller: CameraCommands | null) => void;
}) {
  const camera = useThree((store) => store.camera);
  const canvas = useThree((store) => store.gl.domElement);
  const width = useThree((store) => store.size.width);
  const height = useThree((store) => store.size.height);
  const invalidate = useThree((store) => store.invalidate);
  const controller = useRef<ReturnType<typeof createCameraController> | null>(
    null,
  );
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const instance = createCameraController(camera, invalidate);
    controller.current = instance;
    onReady(instance);
    return () => {
      onReady(null);
      controller.current = null;
      instance.dispose();
    };
  }, [camera, invalidate, onReady]);
  useEffect(() => {
    controller.current?.resize(width, height);
  }, [camera, width, height]);
  useEffect(() => {
    if (!gestures || !controller.current) return;
    return attachCameraGestures(canvas, controller.current);
  }, [canvas, camera, gestures]);
  return null;
}

function ContextLifecycle({ onLost }: { onLost: () => void }) {
  const gl = useThree((store) => store.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onLost();
    };
    canvas.addEventListener("webglcontextlost", handleLost);
    return () => canvas.removeEventListener("webglcontextlost", handleLost);
  }, [gl, onLost]);
  return null;
}

export function CubeScene({
  state,
  onContextLost,
  gestures,
  onCameraReady,
}: {
  state: CubeState;
  onContextLost: () => void;
  gestures: boolean;
  onCameraReady: (controller: CameraCommands | null) => void;
}) {
  return (
    <Canvas
      role="img"
      aria-label="Mô hình khối Rubik 3×3"
      camera={{ position: [5, 4, 6], fov: CAMERA_FOV, near: 0.1, far: 100 }}
      dpr={VIEWER_DPR}
      frameloop="demand"
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      fallback={<ViewerFallback />}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[5, 6, 7]} intensity={2} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />
      <CubeModel state={state} />
      <CameraControls gestures={gestures} onReady={onCameraReady} />
      <ContextLifecycle onLost={onContextLost} />
    </Canvas>
  );
}
