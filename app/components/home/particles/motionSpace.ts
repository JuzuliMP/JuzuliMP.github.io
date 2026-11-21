/**
 * Where the particle motion is, for placing the sand sound around the
 * listener (`app/lib/sandSpace.ts`). Pure: no DOM, no audio.
 *
 * Two things move the particles (see `motionLevel.ts`), and each has a place:
 *   - the scroll morph: the cloud travels from one shape's spot on screen to
 *     the next (on desktop the shapes alternate sides, so the sound slides
 *     centre to right, then right to left, and back when scrolling up). It
 *     spreads out mid-morph, so the sound gets wider and further away;
 *   - stirring: the pointer's position, a little ahead in the direction it is
 *     moving, as a narrow, close sound.
 *
 * When both happen at once their places are blended by how much each moves.
 */
import type { SoundPlace } from '../../../lib/sandSpace'

/** A shape's box on screen, CSS px in viewport coordinates (y down). */
export type ShapeBox = { cx: number; cy: number; halfW: number; halfH: number }

/** How far mid-morph scatter pushes the sound away (0..1 at full scatter). */
export const SCATTER_DISTANCE = 0.4
/** How much mid-morph scatter widens the sound. */
export const SCATTER_WIDTH = 0.35
/** Stirring is heard this far ahead of the pointer (seconds of its motion). */
export const STIR_LEAD_S = 0.12
/** Stirring is a narrow, close sound. */
export const STIR_WIDTH = 0.2

/** The middle, at a medium width and close: where the sound sits before anything moves. */
export const CENTRE_PLACE: SoundPlace = { pan: 0, height: 0, width: 0.5, distance: 0 }

const clamp = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : 0)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Points sampled to average the cloud (the shader gives each point its own delay). */
const CLOUD_SAMPLES = 16

/**
 * How far the cloud as a whole has travelled (0..1) and how scattered it is
 * (0..1) at morph progress `t`. Mirrors the vertex shader in `scene.ts`: each
 * point starts up to 35% later than the first, eases in and bursts outward
 * in the middle of its own trip.
 */
export function cloudProgress(t: number): { k: number; scatter: number } {
  const tt = clamp(t, 0, 1)
  let k = 0
  let scatter = 0
  for (let i = 0; i < CLOUD_SAMPLES; i++) {
    const r = (i + 0.5) / CLOUD_SAMPLES
    let p = clamp((tt - r * 0.35) / 0.65, 0, 1)
    p = p * p * (3 - 2 * p)
    k += p
    scatter += Math.sin(p * Math.PI)
  }
  return { k: k / CLOUD_SAMPLES, scatter: scatter / CLOUD_SAMPLES }
}

/** Place of the morphing cloud, `t` of the way from shape box `from` to `to`, in a `width` x `height` viewport. */
export function morphPlace(from: ShapeBox, to: ShapeBox, t: number, width: number, height: number): SoundPlace {
  const { k, scatter } = cloudProgress(t)
  const halfVW = Math.max(1, width / 2)
  const halfVH = Math.max(1, height / 2)
  const x = lerp(from.cx, to.cx, k) - halfVW
  const y = lerp(from.cy, to.cy, k) - halfVH
  const spread = lerp(from.halfW, to.halfW, k) / halfVW
  return {
    pan: clamp(x / halfVW, -1, 1),
    height: clamp(-y / halfVH, -1, 1),
    width: clamp(spread + scatter * SCATTER_WIDTH, 0, 1),
    distance: clamp(scatter * SCATTER_DISTANCE, 0, 1),
  }
}

/** Place of stirring: the pointer at (x, y) moving at (vx, vy) px/s, heard a little ahead of itself. */
export function stirPlace(x: number, y: number, vx: number, vy: number, width: number, height: number): SoundPlace {
  const halfVW = Math.max(1, width / 2)
  const halfVH = Math.max(1, height / 2)
  const ax = x + clamp(vx, -1e5, 1e5) * STIR_LEAD_S
  const ay = y + clamp(vy, -1e5, 1e5) * STIR_LEAD_S
  return {
    pan: clamp((ax - halfVW) / halfVW, -1, 1),
    height: clamp(-(ay - halfVH) / halfVH, -1, 1),
    width: STIR_WIDTH,
    distance: 0,
  }
}

/** Blends two places by weight (how much each source is moving). With no weight at all, `a` wins. */
export function blendPlaces(a: SoundPlace, wa: number, b: SoundPlace, wb: number): SoundPlace {
  const ka = Math.max(0, Number.isFinite(wa) ? wa : 0)
  const kb = Math.max(0, Number.isFinite(wb) ? wb : 0)
  if (ka + kb <= 0) return a
  const f = kb / (ka + kb)
  return {
    pan: lerp(a.pan, b.pan, f),
    height: lerp(a.height, b.height, f),
    width: lerp(a.width, b.width, f),
    distance: lerp(a.distance, b.distance, f),
  }
}

/** The sound recedes as the particles fade out at the end of the page. */
export function recede(place: SoundPlace, fade: number): SoundPlace {
  const f = clamp(fade, 0, 1)
  return { ...place, distance: 1 - (1 - place.distance) * f }
}

/** True when two places differ enough to be worth sending to the audio side. */
export function placeChanged(a: SoundPlace, b: SoundPlace, tolerance = 0.01): boolean {
  return (
    Math.abs(a.pan - b.pan) > tolerance ||
    Math.abs(a.height - b.height) > tolerance ||
    Math.abs(a.width - b.width) > tolerance ||
    Math.abs(a.distance - b.distance) > tolerance
  )
}
