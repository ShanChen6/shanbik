"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  BoxGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
} from "three";
import type { CubeFace, CubeState } from "../core/types";
import { CUBE_COLORS } from "../core/constants";
import { buildCubeViewModel } from "./view-model";
import { STICKER_COLORS } from "./palette";
import { ViewerFallback } from "./viewer-fallback";
import { CAMERA_FOV, getCameraPosition, VIEWER_DPR } from "./camera";

const ROTATIONS: Record<CubeFace, [number, number, number]> = {
  U: [-Math.PI / 2, 0, 0],
  R: [0, Math.PI / 2, 0],
  F: [0, 0, 0],
  D: [Math.PI / 2, 0, 0],
  L: [0, -Math.PI / 2, 0],
  B: [0, Math.PI, 0],
};

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
              rotation={ROTATIONS[sticker.face]}
              geometry={resources.sticker}
              material={resources.colors[sticker.color]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function ResponsiveCamera({ resetVersion }: { resetVersion: number }) {
  const camera = useThree((store) => store.camera);
  const width = useThree((store) => store.size.width);
  const height = useThree((store) => store.size.height);
  const invalidate = useThree((store) => store.invalidate);
  useEffect(() => {
    const position = getCameraPosition(width, height);
    if (!position) return;
    camera.position.set(...position);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    invalidate();
  }, [camera, width, height, resetVersion, invalidate]);
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
  resetVersion,
}: {
  state: CubeState;
  onContextLost: () => void;
  resetVersion: number;
}) {
  return (
    <Canvas
      role="img"
      aria-label="Mô hình khối Rubik 3×3 tĩnh"
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
      <ResponsiveCamera resetVersion={resetVersion} />
      <ContextLifecycle onLost={onContextLost} />
    </Canvas>
  );
}
