/** Geometry for the magnetic pull. Pure; the DOM side lives in `useMagnetic`. */

export type Rect = { left: number; top: number; width: number; height: number }
export type Point = { x: number; y: number }

/** Distance (px) from the point to the rectangle's edge; 0 when inside. */
export function distanceToRect(rect: Rect, p: Point): number {
  const dx = Math.max(rect.left - p.x, 0, p.x - (rect.left + rect.width))
  const dy = Math.max(rect.top - p.y, 0, p.y - (rect.top + rect.height))
  return Math.hypot(dx, dy)
}

/**
 * Where the element should sit for a pointer position: a fraction (`strength`)
 * of the way from the element's centre to the pointer, once the pointer is
 * within `radius` px of the element; otherwise back at rest. `rect` must be
 * the element's un-shifted box.
 */
export function magneticTarget(
  rect: Rect,
  pointer: Point,
  radius = 80,
  strength = 0.35,
  maxShift = 14,
): Point {
  if (distanceToRect(rect, pointer) > radius) return { x: 0, y: 0 }
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const clamp = (n: number) => Math.max(-maxShift, Math.min(maxShift, n))
  return { x: clamp((pointer.x - cx) * strength), y: clamp((pointer.y - cy) * strength) }
}
