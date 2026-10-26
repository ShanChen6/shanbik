import { PerspectiveCamera } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { getCameraPosition } from "./camera";

export type CameraAction =
  "left" | "right" | "up" | "down" | "in" | "out" | "reset";
export type CameraCommands = { act: (action: CameraAction) => void };

/** Orbit math only: no DOM connection, global keyboard handler or animation loop. */
export function createCameraController(
  camera: PerspectiveCamera,
  invalidate: () => void,
) {
  const controls = new OrbitControls(camera);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.autoRotate = false;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI - 0.15;
  controls.addEventListener("change", invalidate);
  let width = 0,
    height = 0,
    fitDistance = 0;

  const reset = () => {
    const position = getCameraPosition(width, height);
    if (!position) return;
    camera.position.set(...position);
    camera.up.set(0, 1, 0);
    controls.target.set(0, 0, 0);
    controls.update();
    invalidate();
  };
  const zoom = (factor: number) =>
    controls.dollyIn(Math.max(0.5, Math.min(2, factor)));
  const rotate = (horizontal: number, vertical: number) => {
    controls.rotateLeft(horizontal);
    controls.rotateUp(vertical);
  };
  return {
    resize(nextWidth: number, nextHeight: number) {
      const position = getCameraPosition(nextWidth, nextHeight);
      if (!position) return;
      width = nextWidth;
      height = nextHeight;
      const nextDistance = Math.hypot(...position);
      controls.minDistance = nextDistance * 0.75;
      controls.maxDistance = nextDistance * 2.2;
      if (!fitDistance) {
        fitDistance = nextDistance;
        reset();
      } else {
        camera.position.multiplyScalar(nextDistance / fitDistance);
        fitDistance = nextDistance;
        controls.update();
        invalidate();
      }
    },
    rotate,
    zoom,
    act(action: CameraAction) {
      const step = Math.PI / 12;
      switch (action) {
        case "left":
          rotate(step, 0);
          break;
        case "right":
          rotate(-step, 0);
          break;
        case "up":
          rotate(0, step);
          break;
        case "down":
          rotate(0, -step);
          break;
        case "in":
          zoom(0.85);
          break;
        case "out":
          zoom(1 / 0.85);
          break;
        case "reset":
          reset();
          break;
      }
    },
    dispose() {
      controls.removeEventListener("change", invalidate);
      // Never connected to DOM; there are no OrbitControls DOM listeners to dispose.
    },
  };
}

type GestureCamera = Pick<
  ReturnType<typeof createCameraController>,
  "rotate" | "zoom"
>;

/** Bind only to this canvas. Pointer capture keeps drags local, even outside its bounds. */
export function attachCameraGestures(
  canvas: HTMLCanvasElement,
  camera: GestureCamera,
) {
  const pointers = new Map<number, { x: number; y: number }>();
  const previousTouchAction = canvas.style.touchAction;
  canvas.style.touchAction = "none";
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const down = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const before = distance();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      const scale = (2 * Math.PI) / Math.max(canvas.clientHeight, 1);
      camera.rotate(
        (event.clientX - previous.x) * scale,
        (event.clientY - previous.y) * scale,
      );
    } else if (pointers.size === 2) {
      const after = distance();
      if (before > 0 && after > 0) camera.zoom(before / after);
    }
  };
  const release = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
  };
  const wheel = (event: WheelEvent) => {
    event.preventDefault();
    const unit =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? canvas.clientHeight
          : 1;
    camera.zoom(
      Math.exp(Math.max(-200, Math.min(200, event.deltaY * unit)) * 0.002),
    );
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("lostpointercapture", release);
  canvas.addEventListener("wheel", wheel, { passive: false });
  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", release);
    canvas.removeEventListener("pointercancel", release);
    canvas.removeEventListener("lostpointercapture", release);
    canvas.removeEventListener("wheel", wheel);
    for (const id of pointers.keys())
      if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    pointers.clear();
    canvas.style.touchAction = previousTouchAction;
  };
}
