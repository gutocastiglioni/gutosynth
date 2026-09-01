/**
 * Mathematical & Interpolation Helpers for Audio & Gesture Mapping
 */

/**
 * Linear interpolation between a and b
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Exponential mapping for human auditory frequency perception
 */
export function mapExponential(valueNormalized: number, minOut: number, maxOut: number): number {
  const norm = Math.max(0.001, Math.min(1, valueNormalized));
  return minOut * Math.pow(maxOut / minOut, norm);
}

/**
 * Clamps a number between min and max bounds
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Formats seconds into MM:SS.MS format for timeline displays
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}
