/**
 * How much the particles are moving, as a level from 0 to 1, for the "moving
 * sand" sound (`app/lib/sand.ts`). Pure: no DOM, no audio.
 *
 * Two things move the particles:
 *   - the scroll morph: the faster the morph progresses (shapes per second),
 *     the faster the points stream from one shape to the next;
 *   - stirring: the pointer or a finger pushing points aside (dragTrail.ts),
 *     counted only while it is over the particles, and fading as they settle.
 *
 * The level rises quickly and falls more slowly, so the sound swells with the
 * motion and trails off like settling sand instead of cutting dead.
 */

/** Morph speed (shapes per second) that counts as full motion: a brisk scroll through a chapter. */
export const MORPH_RATE_FULL = 2.4
/** Pointer speed (CSS px per second) that counts as full stirring. */
export const STIR_SPEED_FULL = 2200
/** Stirring is a bit quieter than a full morph: it moves fewer points. */
export const STIR_WEIGHT = 0.75
/** Below this pointer speed stirring makes no sound (slow hovering). */
export const STIR_SPEED_MIN = 120
/** Time constants (seconds) of the rise and the fall. */
export const LEVEL_RISE_S = 0.05
export const LEVEL_FALL_S = 0.35

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

/** Level from the scroll morph alone. A gentle curve, so slow scrolling is still faintly audible. */
export function morphMotion(morphRatePerSecond: number): number {
  return clamp01(Math.abs(morphRatePerSecond) / MORPH_RATE_FULL) ** 0.7
}

/**
 * Level from stirring alone. `presence` (0..1) is how much the pointer is over
 * the particles and how fresh the stir is.
 */
export function stirMotion(speedPxPerSecond: number, presence: number): number {
  const s = Number.isFinite(speedPxPerSecond) ? Math.max(0, speedPxPerSecond - STIR_SPEED_MIN) : 0
  return clamp01(s / (STIR_SPEED_FULL - STIR_SPEED_MIN)) ** 0.7 * clamp01(presence) * STIR_WEIGHT
}

/** Both sources together: each fills in what the other leaves (never above 1). */
export function combineMotion(a: number, b: number): number {
  return 1 - (1 - clamp01(a)) * (1 - clamp01(b))
}

/** Moves `current` toward `target` over `dt` seconds: fast rise, slower fall. */
export function followLevel(current: number, target: number, dt: number): number {
  const t = clamp01(target)
  if (!(dt > 0)) return clamp01(current)
  const tau = t > current ? LEVEL_RISE_S : LEVEL_FALL_S
  const next = current + (t - current) * (1 - Math.exp(-dt / tau))
  return next < 0.001 && t === 0 ? 0 : clamp01(next)
}

export type Box = { cx: number; cy: number; halfW: number; halfH: number }

/**
 * 1 when (x, y) is inside the box (CSS px), falling to 0 over `soft` px
 * outside it. Used to count stirring only where there are particles.
 */
export function nearBox(x: number, y: number, box: Box, soft: number): number {
  const dx = Math.max(0, Math.abs(x - box.cx) - box.halfW)
  const dy = Math.max(0, Math.abs(y - box.cy) - box.halfH)
  const d = Math.hypot(dx, dy)
  return soft > 0 ? clamp01(1 - d / soft) : d === 0 ? 1 : 0
}
