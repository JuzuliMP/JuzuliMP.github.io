export type Point = { x: number; y: number }
export type Size = { width: number; height: number }

/** Size of the cursor-following cover preview in px (the mockup's hovered thumbnail). */
export const PREVIEW_SIZE: Size = { width: 380, height: 230 }

type PlaceOptions = {
  /** Gap between the pointer and the preview. Default 28px horizontally, 0 vertically (centred on the pointer). */
  offset?: Point
  /** Minimum distance kept from every viewport edge. Default 16px. */
  margin?: number
}

function clamp(value: number, min: number, max: number): number {
  // If the viewport is smaller than the preview, `max < min`: pin to the margin.
  return Math.max(min, Math.min(value, Math.max(min, max)))
}

/**
 * Top-left corner for the preview so it sits to the right of the pointer and
 * is vertically centred on it, flips to the left side when there is no room on
 * the right, and never leaves the viewport.
 */
export function placePreview(
  pointer: Point,
  size: Size,
  viewport: Size,
  { offset = { x: 28, y: 0 }, margin = 16 }: PlaceOptions = {},
): Point {
  let x = pointer.x + offset.x
  if (x + size.width > viewport.width - margin) x = pointer.x - offset.x - size.width
  const y = pointer.y + offset.y - size.height / 2
  return {
    x: clamp(x, margin, viewport.width - size.width - margin),
    y: clamp(y, margin, viewport.height - size.height - margin),
  }
}

/**
 * Frame-rate independent exponential easing: moves `current` toward `target`
 * by a share that depends on the elapsed time `dt` (seconds) and `rate`
 * (higher is snappier; ~12 settles in about a quarter of a second).
 */
export function easeToward(current: number, target: number, dt: number, rate = 12): number {
  const share = 1 - Math.exp(-rate * Math.max(0, dt))
  return current + (target - current) * share
}

export function easePoint(current: Point, target: Point, dt: number, rate = 12): Point {
  return { x: easeToward(current.x, target.x, dt, rate), y: easeToward(current.y, target.y, dt, rate) }
}

/** True once the eased position is within half a pixel of the target (the loop can idle). */
export function isSettled(current: Point, target: Point, tolerance = 0.5): boolean {
  return Math.abs(current.x - target.x) < tolerance && Math.abs(current.y - target.y) < tolerance
}
