import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import {
  createCameraController,
  attachCameraGestures,
} from "./camera-controller";

function setup() {
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(5, 4, 6);
  let frames = 0;
  const controller = createCameraController(camera, () => frames++);
  controller.resize(600, 400);
  return { camera, controller, frames: () => frames };
}

describe("camera controls", () => {
  it("orbits and zooms, then resets to the original view", () => {
    const { camera, controller } = setup();
    const original = camera.position.clone();
    const originalRotation = camera.quaternion.clone();
    controller.act("left");
    controller.act("up");
    expect(camera.position.distanceTo(original)).toBeGreaterThan(0.1);
    controller.act("in");
    expect(camera.position.length()).toBeLessThan(original.length());
    controller.act("reset");
    expect(camera.position.distanceTo(original)).toBeLessThan(1e-10);
    expect(camera.quaternion.angleTo(originalRotation)).toBeLessThan(1e-7);
  });
  it("bounds repeated zoom and polar rotation without crossing the cube", () => {
    const { camera, controller } = setup();
    const distance = camera.position.length();
    for (let i = 0; i < 100; i++) {
      controller.act("in");
      controller.act("up");
    }
    expect(camera.position.length()).toBeCloseTo(distance * 0.75);
    expect(Math.acos(camera.position.y / camera.position.length())).toBeCloseTo(
      0.15,
    );
    for (let i = 0; i < 100; i++) {
      controller.act("out");
      controller.act("down");
    }
    expect(camera.position.length()).toBeCloseTo(distance * 2.2);
    expect(Math.acos(camera.position.y / camera.position.length())).toBeCloseTo(
      Math.PI - 0.15,
    );
  });
  it("preserves orbit direction and relative zoom when the parent resizes", () => {
    const { camera, controller } = setup();
    controller.act("right");
    controller.act("in");
    const direction = camera.position.clone().normalize();
    controller.resize(220, 400);
    expect(camera.position.clone().normalize().dot(direction)).toBeCloseTo(1);
    const zoomed = camera.position.length();
    controller.act("reset");
    expect(zoomed / camera.position.length()).toBeCloseTo(0.85);
    expect(
      camera.position
        .clone()
        .normalize()
        .distanceTo(new Vector3(5, 4, 6).normalize()),
    ).toBeLessThan(1e-10);
  });
  it("ignores hidden dimensions and removes its change subscription", () => {
    const { camera, controller, frames } = setup();
    const before = camera.position.clone();
    controller.resize(0, 0);
    expect(camera.position).toEqual(before);
    controller.dispose();
    const count = frames();
    controller.act("left");
    expect(frames()).toBe(count);
  });
});

class GestureSurface extends EventTarget {
  clientHeight = 400;
  style = { touchAction: "pan-y" };
  captures = new Set<number>();
  setPointerCapture(id: number) {
    this.captures.add(id);
  }
  hasPointerCapture(id: number) {
    return this.captures.has(id);
  }
  releasePointerCapture(id: number) {
    this.captures.delete(id);
  }
  pointer(type: string, pointerId: number, x: number, y: number) {
    this.dispatchEvent(
      Object.assign(new Event(type), {
        pointerId,
        clientX: x,
        clientY: y,
        pointerType: "touch",
        button: 0,
      }),
    );
  }
}

describe("local camera gestures", () => {
  it("supports drag and pinch; cancellation and disposal release captures", () => {
    const { camera, controller } = setup();
    const surface = new GestureSurface();
    const cleanup = attachCameraGestures(
      surface as unknown as HTMLCanvasElement,
      controller,
    );
    const initial = camera.position.clone();
    surface.pointer("pointerdown", 1, 100, 100);
    surface.pointer("pointermove", 1, 140, 120);
    expect(camera.position.distanceTo(initial)).toBeGreaterThan(0.1);
    const distance = camera.position.length();
    surface.pointer("pointerdown", 2, 200, 120);
    surface.pointer("pointermove", 2, 220, 120);
    expect(camera.position.length()).toBeLessThan(distance);
    surface.pointer("pointercancel", 2, 220, 120);
    expect(surface.captures.has(2)).toBe(false);
    cleanup();
    expect(surface.captures.size).toBe(0);
    expect(surface.style.touchAction).toBe("pan-y");
    const after = camera.position.clone();
    surface.pointer("pointerdown", 3, 100, 100);
    surface.pointer("pointermove", 3, 200, 100);
    expect(camera.position).toEqual(after);
  });
  it("consumes wheel only while attached and normalizes wheel delta modes", () => {
    const { camera, controller } = setup();
    const surface = new GestureSurface();
    const cleanup = attachCameraGestures(
      surface as unknown as HTMLCanvasElement,
      controller,
    );
    const initial = camera.position.length();
    const event = Object.assign(new Event("wheel", { cancelable: true }), {
      deltaMode: 1,
      deltaY: -3,
    });
    surface.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(camera.position.length()).toBeLessThan(initial);
    cleanup();
    const idle = Object.assign(new Event("wheel", { cancelable: true }), {
      deltaMode: 0,
      deltaY: 80,
    });
    surface.dispatchEvent(idle);
    expect(idle.defaultPrevented).toBe(false);
  });
});
