"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  Color,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  ShapeGeometry,
} from "three";
import { FACE_ORDER, FACE_ORIENTATIONS } from "../../cube/core/constants";
import { CAMERA_FOV, VIEWER_DPR } from "../../cube/viewer/camera";
import type { CameraCommands } from "../../cube/viewer/camera-controller";
import {
  CameraControls,
  ContextLifecycle,
  stickerShape,
} from "../../cube/viewer/cube-scene";
import { STICKER_COLORS } from "../../cube/viewer/palette";
import { STICKER_ROTATIONS } from "../../cube/viewer/sticker-orientation";
import type { NxnState } from "./model";
/** Same 3-unit outer size as the 3×3 so camera fitting is shared. */
const SIDE = 3;
/**
 * All N×N×6 stickers are one InstancedMesh and the body is one box, so the
 * cost is two draw calls for any N; colours update in place on each move.
 */
function NxnModel({ state }: { state: NxnState }) {
  const n = state.size,
    count = 6 * n * n,
    mesh = useRef<InstancedMesh>(null),
    invalidate = useThree((s) => s.invalidate);
  const resources = useMemo(
    () => ({
      body: new BoxGeometry(SIDE * 0.995, SIDE * 0.995, SIDE * 0.995),
      sticker: new ShapeGeometry(stickerShape()),
      plastic: new MeshStandardMaterial({
        color: "#34464d",
        roughness: 0.75,
        metalness: 0.02,
      }),
      paint: new MeshBasicMaterial({ toneMapped: false }),
    }),
    [],
  );
  useEffect(
    () => () => {
      resources.body.dispose();
      resources.sticker.dispose();
      resources.plastic.dispose();
      resources.paint.dispose();
    },
    [resources],
  );
  // Transforms depend only on N.
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const cell = SIDE / n,
      o = new Object3D();
    let i = 0;
    for (const face of FACE_ORDER) {
      const { normal, right, down } = FACE_ORIENTATIONS[face];
      for (let k = 0; k < n * n; k++) {
        const u = (2 * (k % n) - (n - 1)) / 2,
          v = (2 * Math.floor(k / n) - (n - 1)) / 2;
        o.position.set(
          ...([0, 1, 2].map(
            (a) =>
              normal[a] * (SIDE / 2 + 0.006) +
              (right[a] * u + down[a] * v) * cell,
          ) as [number, number, number]),
        );
        o.rotation.set(...STICKER_ROTATIONS[face]);
        // The shared sticker shape is 0.8 wide for a unit cubie.
        o.scale.setScalar(cell * 1.05);
        o.updateMatrix();
        m.setMatrixAt(i++, o.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [n, invalidate]);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const c = new Color();
    let i = 0;
    for (const face of FACE_ORDER)
      for (const color of state.faces[face])
        m.setColorAt(i++, c.set(STICKER_COLORS[color]));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    invalidate();
  }, [state, invalidate]);
  return (
    <group name="nxn-model">
      <mesh geometry={resources.body} material={resources.plastic} />
      <instancedMesh
        ref={mesh}
        args={[resources.sticker, resources.paint, count]}
        frustumCulled={false}
      />
    </group>
  );
}
/** Publishes the last frame's draw calls/triangles on the canvas for QA and benchmarks. */
function RenderStats() {
  const frames = useRef(0);
  useFrame(({ gl }) => {
    // Counters accumulate until reset here, so they hold the previous frame.
    gl.info.autoReset = false;
    const el = gl.domElement;
    if (frames.current++) {
      el.dataset.drawCalls = String(gl.info.render.calls);
      el.dataset.triangles = String(gl.info.render.triangles);
      el.dataset.frames = String(frames.current - 1);
    }
    gl.info.reset();
  });
  return null;
}
export function NxnScene({
  state,
  gestures,
  onCameraReady,
  onContextLost,
}: {
  state: NxnState;
  gestures: boolean;
  onCameraReady: (controller: CameraCommands | null) => void;
  onContextLost: () => void;
}) {
  const label = `Mô hình khối ${state.size}×${state.size}`;
  return (
    <Canvas
      camera={{ position: [5, 4, 6], fov: CAMERA_FOV, near: 0.1, far: 100 }}
      dpr={VIEWER_DPR}
      frameloop="demand"
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 0, 0);
        gl.domElement.setAttribute("role", "img");
        gl.domElement.setAttribute("aria-label", label);
        gl.domElement.tabIndex = -1;
      }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[5, 6, 7]} intensity={2} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />
      <NxnModel state={state} />
      <RenderStats />
      <CameraControls gestures={gestures} onReady={onCameraReady} />
      <ContextLifecycle onLost={onContextLost} />
    </Canvas>
  );
}
