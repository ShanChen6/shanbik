import type { ColorGuess, RGB, Sample } from "./types";
export function toLab(rgb: RGB): RGB {
  const [r, g, b] = rgb.map((value) => {
    const n = value / 255;
    return n > 0.04045 ? ((n + 0.055) / 1.055) ** 2.4 : n / 12.92;
  });
  const xyz = [
    (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047,
    r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883,
  ];
  const [x, y, z] = xyz.map((value) =>
    value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116,
  );
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
export function distance(a: RGB, b: RGB) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
export function distinguishable(palette: Readonly<Record<string, RGB>>) {
  const values = Object.values(palette).map(toLab);
  return (
    values.length >= 2 &&
    values.every((value, index) =>
      values.slice(index + 1).every((other) => distance(value, other) >= 12),
    )
  );
}
export function classify(
  sample: Sample,
  palette: Readonly<Record<string, RGB>>,
): ColorGuess {
  const lab = toLab(sample.rgb);
  const ranked = Object.entries(palette)
    .map(([color, rgb]) => ({ color, distance: distance(lab, toLab(rgb)) }))
    .sort((a, b) => a.distance - b.distance);
  if (ranked.length < 2) throw Error("INVALID_PALETTE");
  const first = ranked[0];
  const reason = sample.transparent
    ? "transparent"
    : Math.max(...sample.rgb) < 25
      ? "dark"
      : sample.spread > 45
        ? "uneven"
        : first.distance > 35 || ranked[1].distance - first.distance < 7
          ? "uncertain"
          : null;
  return Object.freeze({
    color: reason ? null : first.color,
    candidate: first.color,
    distance: first.distance,
    reason,
  });
}
