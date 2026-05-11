/** t must be in [0, 1]. All functions return a value in [0, 1]. */

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeInOutSine = (t: number): number =>
  -(Math.cos(Math.PI * t) - 1) / 2;

export const easeInOutQuart = (t: number): number =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

export const easeOutCubic = (t: number): number =>
  1 - Math.pow(1 - t, 3);

export const easeInCubic = (t: number): number =>
  t * t * t;

/** Clamp t to [0, 1] before applying easing. */
export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/** Map a value from one range to another, clamped. */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = clamp01((value - inMin) / (inMax - inMin));
  return outMin + t * (outMax - outMin);
}
