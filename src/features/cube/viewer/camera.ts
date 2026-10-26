/** A sphere enclosing the entire 3×3, including stickers, with breathing room. */
const RADIUS = Math.sqrt(3) * 1.5;
const MARGIN = 1.12;
export const CAMERA_FOV = 40;
export const VIEWER_DPR: [number, number] = [1, 1.5];

/** Fit both axes; a narrow parent must not crop the cube. No browser/Three dependency. */
export function getCameraPosition(
  width: number,
  height: number,
): [number, number, number] | null {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return null; // Activity/hidden containers can report zero size.
  const verticalHalfFov = (CAMERA_FOV * Math.PI) / 360;
  const horizontalHalfFov = Math.atan(
    Math.tan(verticalHalfFov) * (width / height),
  );
  const distance =
    (RADIUS * MARGIN) / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov));
  const directionLength = Math.hypot(5, 4, 6);
  return [5, 4, 6].map((axis) => (axis * distance) / directionLength) as [
    number,
    number,
    number,
  ];
}
