/**
 * Pointer trail for the "stir the particles" effect. Pure TypeScript: no DOM,
 * no three.js, time is always passed in.
 *
 * The scene keeps a short ring buffer of recent pointer samples (position,
 * smoothed velocity, birth time). Every frame it writes them to uniform arrays
 * and the vertex shader moves each point **away** from the samples (a
 * Gaussian falloff; overlapping samples are averaged, not added, so the
 * channel keeps one width) with a slight swirl, so the pointer parts the particles
 * like a hand through water instead of smearing them along its path. Each
 * sample's push follows a damped spring over its age: full when the pointer
 * is there, then the channel closes with a small elastic overshoot and
 * settles. No per-particle state is needed.
 */

/** Samples kept (and uniform array length in the shader). */
export const TRAIL_LENGTH = 12
/** A sample stops counting this long after its last update (ms): the spring has settled by then. */
export const TRAIL_LIFE_MS = 1000
/** The newest sample follows the pointer; a new one is started after this long (ms). */
export const TRAIL_SAMPLE_MS = 64
/** Radius of the falloff, CSS px (a Gaussian with sigma = radius / 2). */
export const TRAIL_RADIUS_PX = 100
/** Push away from the path per unit of pointer speed (seconds): 800 px/s parts the points by ~44 px. */
export const PUSH_PER_SPEED = 0.055
/** Largest speed-driven push of one sample, CSS px. */
export const PUSH_MAX_PX = 60
/** Small bubble around the pointer itself, so even slow hovering makes room. */
export const HOVER_PUSH_PX = 20
/** Sideways curl around the path (fraction of the push): opposite on each side, like a wake. */
export const SWIRL = 0.35
/** Spring the channel closes with: frequency (Hz) and damping ratio (under 1 = a small overshoot). */
export const SPRING_HZ = 1.6
export const SPRING_DAMPING = 0.45
/** The total displacement of a point never exceeds this fraction of the shape's half-size (enforced in the shader). */
export const MAX_DISPLACEMENT = 0.26
/** Touch moves stir the points more gently than a mouse. */
export const TOUCH_GAIN = 0.55
/** Time constant (ms) of the velocity smoothing. */
export const VELOCITY_SMOOTH_MS = 50

export type Trail = {
  readonly length: number
  /** Sample positions in CSS px (viewport coordinates). */
  x: Float64Array
  y: Float64Array
  /** Sample velocity in CSS px per second. */
  vx: Float64Array
  vy: Float64Array
  /** Time of the sample's last update (ms). */
  born: Float64Array
  /** Strength multiplier (1 for a mouse, `TOUCH_GAIN` for a finger). */
  gain: Float64Array
  /** Index of the newest sample. */
  head: number
  /** How many slots are in use (0..length). */
  count: number
  /** When the newest sample was started (ms). */
  headStart: number
  /** The pointer's previous position and time, plus its smoothed velocity. `tracking` is false until the first event. */
  tracking: boolean
  lastX: number
  lastY: number
  lastT: number
  velX: number
  velY: number
}

export function createTrail(length: number = TRAIL_LENGTH): Trail {
  return {
    length,
    x: new Float64Array(length),
    y: new Float64Array(length),
    vx: new Float64Array(length),
    vy: new Float64Array(length),
    born: new Float64Array(length),
    gain: new Float64Array(length),
    head: -1,
    count: 0,
    headStart: 0,
    tracking: false,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    velX: 0,
    velY: 0,
  }
}

/** Forgets everything: window blur, tab hidden, reduced motion switched on. */
export function clearTrail(trail: Trail): void {
  trail.head = -1
  trail.count = 0
  trail.headStart = 0
  trail.gain.fill(0)
  releasePointer(trail)
}

/**
 * The pointer left the window or the finger lifted. Existing samples keep
 * fading out; the next move starts from rest instead of "jumping" from the
 * old position (which would read as a huge velocity).
 */
export function releasePointer(trail: Trail): void {
  trail.tracking = false
  trail.velX = 0
  trail.velY = 0
}

/**
 * Adds a pointer position (CSS px) at `now` (ms). Events closer together than
 * `TRAIL_SAMPLE_MS` update the newest sample in place, so the head always
 * follows the pointer while older samples stay behind as the wake.
 * The first position after a release has no velocity: it only makes the small hover bubble.
 */
export function pushPointer(trail: Trail, x: number, y: number, now: number, gain = 1): void {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(now)) return
  if (trail.tracking) {
    const dt = Math.max(1, now - trail.lastT)
    const alpha = 1 - Math.exp(-dt / VELOCITY_SMOOTH_MS)
    trail.velX += (((x - trail.lastX) / dt) * 1000 - trail.velX) * alpha
    trail.velY += (((y - trail.lastY) / dt) * 1000 - trail.velY) * alpha
  } else {
    trail.velX = 0
    trail.velY = 0
  }
  trail.tracking = true
  trail.lastX = x
  trail.lastY = y
  trail.lastT = now

  if (trail.count === 0 || now - trail.headStart >= TRAIL_SAMPLE_MS) {
    trail.head = (trail.head + 1) % trail.length
    trail.count = Math.min(trail.length, trail.count + 1)
    trail.headStart = now
  }
  const i = trail.head
  trail.x[i] = x
  trail.y[i] = y
  trail.vx[i] = trail.velX
  trail.vy[i] = trail.velY
  trail.born[i] = now
  trail.gain[i] = gain
}

/**
 * How much of a sample's push is left at `ageMs`: a damped spring released
 * from 1 with no velocity. It is 1 when the pointer is there, swings slightly
 * below 0 (the parted points overshoot back past their place, about 20%), and
 * settles; it is exactly 0 from `TRAIL_LIFE_MS` on.
 */
export function springEnvelope(ageMs: number): number {
  if (!(ageMs > 0)) return 1
  if (ageMs >= TRAIL_LIFE_MS) return 0
  const t = ageMs / 1000
  const w0 = 2 * Math.PI * SPRING_HZ
  const z = SPRING_DAMPING
  const wd = w0 * Math.sqrt(1 - z * z)
  return Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t))
}

/** Push of one sample in CSS px, before its envelope: faster pointer, wider parting; the newest sample adds the hover bubble. */
export function pushAmplitudePx(speedPxPerS: number, isHead: boolean): number {
  const speed = Number.isFinite(speedPxPerS) ? Math.max(0, speedPxPerS) : 0
  return Math.min(PUSH_MAX_PX, speed * PUSH_PER_SPEED) + (isHead ? HOVER_PUSH_PX : 0)
}

/** True when nothing is left to draw: no samples, or the newest one has faded out. Uniform uploads can be skipped. */
export function isTrailIdle(trail: Trail, now: number): boolean {
  if (trail.count === 0) return true
  return now - trail.born[trail.head]! >= TRAIL_LIFE_MS
}

export type TrailUniforms = {
  /** Per sample: world x, world y (pointer position), then the unit direction the pointer was moving (world, y up; 0,0 at rest). */
  data: Float32Array
  /** Per sample: push in world units with the spring envelope and gain applied. Negative during the overshoot; 0 for unused slots. */
  strength: Float32Array
}

export function createTrailUniforms(length: number = TRAIL_LENGTH): TrailUniforms {
  return { data: new Float32Array(length * 4), strength: new Float32Array(length) }
}

export type TrailSpace = {
  /** Canvas size in CSS px. */
  width: number
  height: number
  /** World units per CSS px at the plane the pointer is mapped onto. */
  worldPerPx: number
}

/**
 * Fills the uniform arrays for time `now`. Screen y points down, world y up.
 * Returns the number of samples that still move points (0 means idle).
 */
export function writeTrailUniforms(trail: Trail, now: number, space: TrailSpace, out: TrailUniforms): number {
  const { width, height, worldPerPx } = space
  let active = 0
  for (let i = 0; i < trail.length; i++) {
    const o = i * 4
    // Slots that are unused (or were cleared) have gain 0, so they come out as 0 as well.
    const env = trail.gain[i]! > 0 ? springEnvelope(now - trail.born[i]!) : 0
    if (env === 0) {
      out.strength[i] = 0
      out.data[o] = out.data[o + 1] = out.data[o + 2] = out.data[o + 3] = 0
      continue
    }
    active++
    const vx = trail.vx[i]!
    const vy = trail.vy[i]!
    const speed = Math.hypot(vx, vy)
    out.strength[i] = pushAmplitudePx(speed, i === trail.head) * env * trail.gain[i]! * worldPerPx
    out.data[o] = (trail.x[i]! - width / 2) * worldPerPx
    out.data[o + 1] = -(trail.y[i]! - height / 2) * worldPerPx
    out.data[o + 2] = speed > 1 ? vx / speed : 0
    out.data[o + 3] = speed > 1 ? -vy / speed : 0
  }
  return active
}
